document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('game-board');
    const cells = document.querySelectorAll('.cell');
    const statusText = document.getElementById('status-text');
    const resetBtn = document.getElementById('reset-btn');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const difficultyBtns = document.querySelectorAll('.btn.difficulty');

    let currentPlayer = 'X';
    let gameState = ["", "", "", "", "", "", "", "", ""];
    let gameActive = true;
    let scores = { X: 0, O: 0 };
    let difficulty = 'hard';

    // Audio Setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'move') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'win') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    }

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== "" || !gameActive || currentPlayer === 'O') {
            return;
        }

        makeMove(clickedCellIndex, 'X');

        if (gameActive) {
            statusText.innerText = "AI is thinking...";
            setTimeout(() => {
                aiMove();
            }, 600);
        }
    }

    function makeMove(index, player) {
        gameState[index] = player;
        const cell = cells[index];
        cell.classList.add(player.toLowerCase());

        playSound('move');
        checkResult();
    }

    function aiMove() {
        if (!gameActive) return;

        let move;
        if (difficulty === 'easy') {
            move = getRandomMove();
        } else {
            move = getBestMove();
        }

        makeMove(move, 'O');
    }

    function getRandomMove() {
        const availableMoves = gameState.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function getBestMove() {
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < 9; i++) {
            if (gameState[i] === "") {
                gameState[i] = 'O';
                let score = minimax(gameState, 0, false);
                gameState[i] = "";
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    const scoresMap = { X: -10, O: 10, tie: 0 };

    function minimax(board, depth, isMaximizing) {
        let result = checkWinner();
        if (result !== null) {
            return scoresMap[result];
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    board[i] = 'O';
                    let score = minimax(board, depth + 1, false);
                    board[i] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === "") {
                    board[i] = 'X';
                    let score = minimax(board, depth + 1, true);
                    board[i] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function checkWinner() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                return gameState[a];
            }
        }

        if (!gameState.includes("")) {
            return 'tie';
        }

        return null;
    }

    function checkResult() {
        let winner = checkWinner();

        if (winner) {
            gameActive = false;
            if (winner === 'tie') {
                statusText.innerText = "It's a draw!";
            } else {
                statusText.innerText = (winner === 'X' ? "You Won!" : "AI Won!");
                scores[winner]++;
                updateScores();
                highlightWinner();
                if (winner === 'X') {
                    createConfetti();
                    playSound('win');
                } else {
                    playSound('move'); // Dull sound for AI win
                }
            }
            return;
        }

        currentPlayer = currentPlayer === "X" ? "O" : "X";
        if (currentPlayer === 'X') {
            statusText.innerText = "Your turn!";
        }
    }

    function highlightWinner() {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                cells[a].classList.add('winning');
                cells[b].classList.add('winning');
                cells[c].classList.add('winning');
            }
        }
    }

    function updateScores() {
        scoreX.innerText = scores.X;
        scoreO.innerText = scores.O;
    }

    function restartGame() {
        currentPlayer = 'X';
        gameState = ["", "", "", "", "", "", "", "", ""];
        gameActive = true;
        statusText.innerText = "Your turn!";
        cells.forEach(cell => {
            cell.innerText = "";
            cell.className = 'cell';
        });
    }

    function createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetto = document.createElement('div');
            confetto.className = 'confetti';
            confetto.style.left = Math.random() * 100 + 'vw';
            confetto.style.backgroundColor = Math.random() > 0.5 ? '#ff2d55' : '#ffffff';
            confetto.style.transform = `rotate(${Math.random() * 360}deg)`;

            document.body.appendChild(confetto);

            const animation = confetto.animate([
                { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate3d(${Math.random() * 100 - 50}px, 100vh, 0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 3000 + 2000,
                easing: 'cubic-bezier(0, .9, .57, 1)',
            });

            animation.onfinish = () => confetto.remove();
        }
    }

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetBtn.addEventListener('click', restartGame);

    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            difficulty = btn.getAttribute('data-difficulty');
            restartGame();
        });
    });
});
