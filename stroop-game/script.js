const COLORS = [
    { name: 'Red', hex: '#ff5e5e' },
    { name: 'Blue', hex: '#5e9fff' },
    { name: 'Green', hex: '#63d471' },
    { name: 'Yellow', hex: '#ffde59' },
    { name: 'Pink', hex: '#ff9ecd' },
    { name: 'Purple', hex: '#b98eff' }
];

let score = 0;
let timeLeft = 30;
let gameActive = false;
let timerId = null;
let currentTargetColor = null;

// DOM Elements
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const wordEl = document.getElementById('target-word');
const colorGrid = document.getElementById('color-grid');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const highScoreEl = document.getElementById('high-score');
const highScoreDisplay = document.querySelector('.high-score-display');
const feedbackContainer = document.getElementById('feedback-container');

function init() {
    startBtn.addEventListener('click', startGame);
    setupColorButtons();
}

function setupColorButtons() {
    colorGrid.innerHTML = '';
    COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.textContent = color.name;
        btn.style.color = color.hex;
        btn.addEventListener('click', () => handleChoice(color.name));
        colorGrid.appendChild(btn);
    });
}

function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;

    overlay.classList.add('none');

    generateRound();
    startTimer();
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function generateRound() {
    // Pick a random word name
    const wordIndex = Math.floor(Math.random() * COLORS.length);
    const wordText = COLORS[wordIndex].name;

    // Pick a random color (ink color)
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    currentTargetColor = COLORS[colorIndex].name;
    const currentTargetHex = COLORS[colorIndex].hex;

    // Update word display
    wordEl.textContent = wordText;
    wordEl.style.color = currentTargetHex;

    // Add pop animation
    wordEl.classList.remove('bouncy-word');
    void wordEl.offsetWidth; // Trigger reflow
    wordEl.classList.add('bouncy-word');
}

function handleChoice(chosenColorName) {
    if (!gameActive) return;

    if (chosenColorName === currentTargetColor) {
        score += 10;
        scoreEl.textContent = score;
        showFeedback('✨');
        generateRound();
    } else {
        score = Math.max(0, score - 5);
        scoreEl.textContent = score;
        showFeedback('❌');
        // Shake animation for incorrect
        wordEl.style.transform = 'translateX(10px)';
        setTimeout(() => wordEl.style.transform = 'translateX(-10px)', 50);
        setTimeout(() => wordEl.style.transform = 'translateX(0)', 100);
    }
}

function showFeedback(emoji) {
    const el = document.createElement('div');
    el.className = 'feedback-emoji';
    el.textContent = emoji;

    // Random position around the center
    const x = window.innerWidth / 2 + (Math.random() * 100 - 50);
    const y = window.innerHeight / 2 + (Math.random() * 100 - 50);

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    feedbackContainer.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function endGame() {
    gameActive = false;
    clearInterval(timerId);

    const highScore = localStorage.getItem('stroop-high-score') || 0;
    if (score > highScore) {
        localStorage.setItem('stroop-high-score', score);
        modalTitle.textContent = "New High Score! 🏆";
    } else {
        modalTitle.textContent = "Game Over! 🍭";
    }

    modalMessage.textContent = `You scored ${score} points!`;
    highScoreEl.textContent = localStorage.getItem('stroop-high-score');
    highScoreDisplay.classList.remove('none');
    startBtn.textContent = "Play Again! 🔄";
    overlay.classList.remove('none');
}

init();
