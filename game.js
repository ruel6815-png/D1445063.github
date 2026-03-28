const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

let board = [];
let currentPlayer = BLACK;
let gameMode = 'pvp'; // 'pvp' or 'pva'
let isGameOver = false;

// DOM Elements
const boardEl = document.getElementById('board');
const turnText = document.getElementById('turn-text');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const blackStatEl = document.getElementById('black-stat');
const whiteStatEl = document.getElementById('white-stat');
const restartBtn = document.getElementById('restart-btn');
const modeRadios = document.querySelectorAll('input[name="game-mode"]');
const modal = document.getElementById('game-over-modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const winnerText = document.getElementById('winner-text');
const finalBlack = document.getElementById('final-black');
const finalWhite = document.getElementById('final-white');

// Directions for checking valid moves (dx, dy)
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

function initGame() {
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // Initial 4 pieces
    const mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = WHITE;
    board[mid][mid] = WHITE;
    board[mid - 1][mid] = BLACK;
    board[mid][mid - 1] = BLACK;

    currentPlayer = BLACK;
    isGameOver = false;
    modal.classList.add('hidden');
    
    // Update game mode
    const selectedMode = document.querySelector('input[name="game-mode"]:checked').value;
    gameMode = selectedMode;

    renderBoard();
    updateUI();
}

function renderBoard() {
    boardEl.innerHTML = '';
    const validMoves = getValidMoves(currentPlayer);

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;

            // Highlight valid moves
            if (!isGameOver && gameMode === 'pva' && currentPlayer === WHITE) {
                // Don't show valid moves for AI
            } else if (!isGameOver) {
                if (validMoves.some(m => m.r === r && m.c === c)) {
                    cell.classList.add('valid-move');
                }
            }

            // Cell click event
            cell.addEventListener('click', () => handleCellClick(r, c));

            // Create piece if not empty
            if (board[r][c] !== EMPTY) {
                const discContainer = document.createElement('div');
                discContainer.className = 'disc-container';
                
                const disc = document.createElement('div');
                disc.className = `disc ${board[r][c] === BLACK ? 'is-black' : 'is-white'}`;
                disc.id = `disc-${r}-${c}`;

                const blackFace = document.createElement('div');
                blackFace.className = 'disc-face black';
                const whiteFace = document.createElement('div');
                whiteFace.className = 'disc-face white';

                disc.appendChild(blackFace);
                disc.appendChild(whiteFace);
                discContainer.appendChild(disc);
                cell.appendChild(discContainer);
            }

            boardEl.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (isGameOver) return;
    if (gameMode === 'pva' && currentPlayer === WHITE) return; // Prevent clicking during AI turn

    const validMoves = getValidMoves(currentPlayer);
    const move = validMoves.find(m => m.r === r && m.c === c);

    if (move) {
        makeMove(r, c, move.flips);
    }
}

function getValidMoves(player) {
    const validMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== EMPTY) continue;

            const flips = getFlips(r, c, player);
            if (flips.length > 0) {
                validMoves.push({ r, c, flips });
            }
        }
    }
    return validMoves;
}

function getFlips(r, c, player) {
    const opponent = player === BLACK ? WHITE : BLACK;
    let totalFlips = [];

    for (let [dr, dc] of DIRECTIONS) {
        let nr = r + dr;
        let nc = c + dc;
        let flipsLine = [];

        while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === opponent) {
            flipsLine.push({ r: nr, c: nc });
            nr += dr;
            nc += dc;
        }

        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
            totalFlips.push(...flipsLine);
        }
    }
    return totalFlips;
}

function makeMove(r, c, flips) {
    // Drop the piece
    board[r][c] = currentPlayer;
    
    // Flip opponent pieces
    for (let f of flips) {
        board[f.r][f.c] = currentPlayer;
    }
    
    // To preserve animations, we update DOM nodes individually
    updateDOMAfterMove(r, c, flips);

    const opponent = currentPlayer === BLACK ? WHITE : BLACK;
    const opponentHasMoves = getValidMoves(opponent).length > 0;
    const currentHasMoves = getValidMoves(currentPlayer).length > 0;

    // After animation wait a moment before state update to clear flow
    setTimeout(() => {
        if (!opponentHasMoves && !currentHasMoves) {
            endGame();
        } else if (opponentHasMoves) {
            currentPlayer = opponent;
            updateUI();
            
            if (gameMode === 'pva' && currentPlayer === WHITE) {
                setTimeout(makeAIMove, 800); // AI delay for UX
            }
        } else {
            // Opponent passes
            alert(`目前盤面${opponent === BLACK ? '黑' : '白'}子皆無合法步可走，故略過回合，由${currentPlayer === BLACK ? '黑' : '白'}子繼續下棋！`);
            updateUI();
        }
    }, 600); // Wait for the rotateY CSS flip transition (0.6s)
}

function updateDOMAfterMove(newR, newC, flips) {
    const newCell = boardEl.querySelector(`[data-r="${newR}"][data-c="${newC}"]`);
    
    const discContainer = document.createElement('div');
    discContainer.className = 'disc-container';
    
    const disc = document.createElement('div');
    disc.className = `disc ${currentPlayer === BLACK ? 'is-black' : 'is-white'}`;
    disc.id = `disc-${newR}-${newC}`;

    const blackFace = document.createElement('div');
    blackFace.className = 'disc-face black';
    const whiteFace = document.createElement('div');
    whiteFace.className = 'disc-face white';

    disc.appendChild(blackFace);
    disc.appendChild(whiteFace);
    discContainer.appendChild(disc);
    newCell.appendChild(discContainer);

    // Remove hints momentarily
    document.querySelectorAll('.valid-move').forEach(el => el.classList.remove('valid-move'));

    // Flip the existing pieces
    for (let f of flips) {
        const flippedDisc = document.getElementById(`disc-${f.r}-${f.c}`);
        if(flippedDisc) {
            flippedDisc.className = `disc ${currentPlayer === BLACK ? 'is-black' : 'is-white'}`;
        }
    }
}

function makeAIMove() {
    if (isGameOver) return;
    const validMoves = getValidMoves(WHITE);
    if (validMoves.length === 0) return;

    // Simple AI: Greedy strategy - pick move that flips the most pieces
    // We prioritize corners since they cannot be flipped back
    let bestMove = validMoves[0];
    let maxFlips = -1;
    
    const corners = [[0,0], [0,7], [7,0], [7,7]];

    for (let move of validMoves) {
        const isCorner = corners.some(c => c[0] === move.r && c[1] === move.c);
        let score = move.flips.length + (isCorner ? 10 : 0);
        
        if (score > maxFlips) {
            maxFlips = score;
            bestMove = move;
        }
    }

    makeMove(bestMove.r, bestMove.c, bestMove.flips);
}

function updateUI() {
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) blackCount++;
            if (board[r][c] === WHITE) whiteCount++;
        }
    }

    blackScoreEl.textContent = blackCount;
    whiteScoreEl.textContent = whiteCount;

    if (currentPlayer === BLACK) {
        turnText.textContent = "黑子回合";
        turnText.style.color = "#38bdf8";
        blackStatEl.classList.add('active');
        whiteStatEl.classList.remove('active');
    } else {
        turnText.textContent = "白子回合";
        turnText.style.color = "#f8fafc";
        whiteStatEl.classList.add('active');
        blackStatEl.classList.remove('active');
    }

    // Re-render board valid hints
    if(!isGameOver) {
        setTimeout(() => {
            renderValidHints();
        }, currentPlayer === WHITE && gameMode === 'pva' ? 0 : 50);
    }
}

function renderValidHints() {
    document.querySelectorAll('.valid-move').forEach(el => el.classList.remove('valid-move'));
    
    if (gameMode === 'pva' && currentPlayer === WHITE) return;

    const validMoves = getValidMoves(currentPlayer);
    for (const move of validMoves) {
        const cell = boardEl.querySelector(`[data-r="${move.r}"][data-c="${move.c}"]`);
        if (cell) cell.classList.add('valid-move');
    }
}

function endGame() {
    isGameOver = true;
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) blackCount++;
            if (board[r][c] === WHITE) whiteCount++;
        }
    }

    finalBlack.textContent = `黑: ${blackCount}`;
    finalWhite.textContent = `白: ${whiteCount}`;

    if (blackCount > whiteCount) {
        winnerText.textContent = "🏆 黑子獲勝！";
        winnerText.style.background = "linear-gradient(135deg, #14b8a6, #38bdf8)";
    } else if (whiteCount > blackCount) {
        winnerText.textContent = "🏆 白子獲勝！";
        winnerText.style.background = "linear-gradient(135deg, #f8fafc, #cbd5e1)";
    } else {
        winnerText.textContent = "🤝 平手！";
        winnerText.style.background = "linear-gradient(135deg, #f59e0b, #fbbf24)";
    }
    
    winnerText.style.webkitBackgroundClip = "text";
    winnerText.style.webkitTextFillColor = "transparent";

    modal.classList.remove('hidden');
}

// Event Listeners
restartBtn.addEventListener('click', initGame);
modalRestartBtn.addEventListener('click', initGame);
modeRadios.forEach(r => r.addEventListener('change', () => {
    if(confirm('切換模式會重新開始遊戲，確定嗎？')){
        initGame();
    } else {
        r.checked = false;
        document.querySelector(`input[name="game-mode"][value="${gameMode}"]`).checked = true;
    }
}));

// Init
initGame();
