import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration
const HISTORICAL_FIGURES = [
    "Albert Einstein", "Marie Curie", "Leonardo da Vinci", "Cleopatra",
    "Nelson Mandela", "Abraham Lincoln", "William Shakespeare", "Mahatma Gandhi",
    "Ada Lovelace", "Isaac Newton", "Amelia Earhart", "Martin Luther King Jr.",
    "Joan of Arc", "Galileo Galilei", "Rosa Parks", "Winston Churchill",
    "Alexander the Great", "Florence Nightingale", "Charles Darwin", "Frida Kahlo"
];

let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    currentFigure: '',
    questionCount: 0,
    isGameOver: false,
    history: []
};

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const guessBtn = document.getElementById('guess-btn');
const questionCountDisplay = document.getElementById('question-count');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveSettingsBtn = document.getElementById('save-settings');

const guessModal = document.getElementById('guess-modal');
const guessInput = document.getElementById('guess-input');
const submitGuessBtn = document.getElementById('submit-guess');
const closeModalBtn = document.getElementById('close-modal');

const gameOverModal = document.getElementById('game-over-modal');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const restartBtn = document.getElementById('restart-btn');

// Initialize Game
function init() {
    if (!state.apiKey) {
        settingsModal.style.display = 'flex';
    } else {
        startNewGame();
    }
}

function startNewGame() {
    state.currentFigure = HISTORICAL_FIGURES[Math.floor(Math.random() * HISTORICAL_FIGURES.length)];
    state.questionCount = 0;
    state.isGameOver = false;
    state.history = [];

    questionCountDisplay.textContent = '0';
    chatContainer.innerHTML = '';

    addMessage('system', `Welcome! I'm thinking of a famous historical figure. You have 20 questions to guess who it is. Ask your first question!`);

    // For debugging/demo purposes (remove in real prod)
    console.log("Secret Figure:", state.currentFigure);
}

// UI Helpers
function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = `<div class="content">${text}</div>`;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return indicator;
}

function hideTypingIndicator(indicator) {
    if (indicator) indicator.remove();
}

// LLM Integration
async function askLLM(question) {
    if (!state.apiKey) {
        alert("Please set your API key first.");
        return;
    }

    const genAI = new GoogleGenerativeAI(state.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        You are acting as a game master in a '20 Questions' game. 
        The secret historical figure is: ${state.currentFigure}.
        The player has asked: "${question}".
        
        Rules:
        1. Answer the question truthfully about the figure.
        2. Do NOT mention the figure's name in your answer.
        3. Keep answers concise (1-2 sentences).
        4. If the question is not a yes/no question, you can still answer it helpfully but don't give away too much.
        5. Total questions asked so far: ${state.questionCount + 1}/20.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Sorry, I had trouble connecting to the AI. Please check your API key.";
    }
}

async function validateGuess(guess) {
    const genAI = new GoogleGenerativeAI(state.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        The secret historical figure is: ${state.currentFigure}.
        The player guessed: "${guess}".
        Is this guess correct? Consider variations in spelling or full names (e.g., 'Einstein' for 'Albert Einstein').
        Respond ONLY with 'CORRECT' or 'INCORRECT'.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text().trim().toUpperCase();
        return response.includes('CORRECT') && !response.includes('INCORRECT');
    } catch (error) {
        console.error("Gemini Error:", error);
        // Fallback simple check
        return guess.toLowerCase().includes(state.currentFigure.toLowerCase().split(' ').pop());
    }
}

// Event Handlers
async function handleSend() {
    const question = userInput.value.trim();
    if (!question || state.isGameOver) return;

    if (state.questionCount >= 20) {
        endGame(false, `You've reached the 20-question limit! It was ${state.currentFigure}.`);
        return;
    }

    addMessage('user', question);
    userInput.value = '';

    const indicator = showTypingIndicator();
    const answer = await askLLM(question);
    hideTypingIndicator(indicator);

    addMessage('system', answer);
    state.questionCount++;
    questionCountDisplay.textContent = state.questionCount;

    if (state.questionCount >= 20) {
        endGame(false, `That was your last question! Who do you think it is? Use the 'I Know Who It Is!' button.`);
    }
}

async function handleGuess() {
    const guess = guessInput.value.trim();
    if (!guess) return;

    guessModal.style.display = 'none';
    const indicator = showTypingIndicator();
    const isCorrect = await validateGuess(guess);
    hideTypingIndicator(indicator);

    if (isCorrect) {
        endGame(true, `Correct! It was indeed ${state.currentFigure}. You guessed it in ${state.questionCount} questions!`);
    } else {
        if (state.questionCount >= 20) {
            endGame(false, `Wrong! It was actually ${state.currentFigure}. Game over!`);
        } else {
            addMessage('system', `"${guess}" is incorrect. Try asking more questions!`);
        }
    }
    guessInput.value = '';
}

function endGame(won, message) {
    state.isGameOver = true;
    gameOverTitle.textContent = won ? "🎉 Victory!" : "⌛ Game Over";
    gameOverMessage.textContent = message;
    gameOverModal.style.display = 'flex';
}

// Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

guessBtn.addEventListener('click', () => {
    guessModal.style.display = 'flex';
});

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    guessModal.style.display = 'none';
});

submitGuessBtn.addEventListener('click', handleGuess);

saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        state.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        settingsModal.style.display = 'none';
        startNewGame();
    }
});

restartBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    startNewGame();
});

// Start the app
init();
