/**
 * Quiz Overlay System
 * Reusable multiple choice quiz for games
 *
 * Usage:
 *   const quiz = new QuizOverlay({
 *     questions: [...],
 *     onComplete: (score, total) => { },
 *     onCorrect: () => { },
 *     onWrong: () => { }
 *   });
 *
 *   quiz.showNameInput();           // Show name input at game start
 *   quiz.showQuestion();            // Show next question (call when 4 lines cleared)
 *   quiz.isComplete();              // Check if mission complete
 */

class QuizOverlay {
  constructor(options = {}) {
    this.playerName = '';
    this.currentQuestion = 0;
    this.score = 0;
    this.questions = options.questions || DEFAULT_QUESTIONS;
    this.onComplete = options.onComplete || (() => {});
    this.onCorrect = options.onCorrect || (() => {});
    this.onWrong = options.onWrong || (() => {});
    this.onNameSet = options.onNameSet || (() => {});

    this._createOverlay();
    this._injectStyles();
  }

  // ============================================================
  // QUESTIONS - EDIT THESE FOR YOUR GAME!
  // ============================================================
  static get DEFAULT_QUESTIONS() {
    return [
      {
        question: "What is the capital of France?",
        choices: ["London", "Paris", "Berlin", "Madrid"],
        correct: 1
      },
      {
        question: "What is 7 × 8?",
        choices: ["54", "56", "58", "64"],
        correct: 1
      },
      {
        question: "Which planet is closest to the Sun?",
        choices: ["Venus", "Earth", "Mercury", "Mars"],
        correct: 2
      },
      {
        question: "What color do you get mixing blue and yellow?",
        choices: ["Purple", "Orange", "Green", "Brown"],
        correct: 2
      },
      {
        question: "How many legs does a spider have?",
        choices: ["6", "8", "10", "12"],
        correct: 1
      }
    ];
  }

  _injectStyles() {
    if (document.getElementById('quiz-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'quiz-overlay-styles';
    style.textContent = `
      .quiz-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }

      .quiz-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .quiz-box {
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s;
      }

      .quiz-overlay.visible .quiz-box {
        transform: scale(1);
      }

      .quiz-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 8px;
        color: #333;
      }

      .quiz-subtitle {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 24px;
      }

      .quiz-question {
        font-size: 1.2rem;
        margin-bottom: 24px;
        color: #222;
        line-height: 1.4;
      }

      .quiz-choices {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .quiz-choice {
        padding: 14px 20px;
        font-size: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .quiz-choice:hover:not(:disabled) {
        border-color: #0066cc;
        background: #f0f7ff;
      }

      .quiz-choice.correct {
        border-color: #22c55e;
        background: #dcfce7;
        color: #166534;
      }

      .quiz-choice.wrong {
        border-color: #ef4444;
        background: #fee2e2;
        color: #991b1b;
      }

      .quiz-choice:disabled {
        cursor: default;
      }

      .quiz-input {
        width: 100%;
        padding: 14px;
        font-size: 1.1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        margin-bottom: 16px;
        text-align: center;
      }

      .quiz-input:focus {
        outline: none;
        border-color: #0066cc;
      }

      .quiz-button {
        padding: 14px 32px;
        font-size: 1.1rem;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .quiz-button:hover:not(:disabled) {
        background: #0052a3;
      }

      .quiz-button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .quiz-progress {
        font-size: 0.85rem;
        color: #888;
        margin-top: 20px;
      }

      .quiz-result {
        font-size: 1.1rem;
        margin: 16px 0;
        padding: 12px;
        border-radius: 8px;
      }

      .quiz-result.success {
        background: #dcfce7;
        color: #166534;
      }

      .quiz-result.failure {
        background: #fee2e2;
        color: #991b1b;
      }

      .quiz-score {
        font-size: 2rem;
        font-weight: bold;
        color: #0066cc;
        margin: 16px 0;
      }
    `;
    document.head.appendChild(style);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'quiz-overlay';
    this.overlay.innerHTML = '<div class="quiz-box"></div>';
    this.box = this.overlay.querySelector('.quiz-box');
    document.body.appendChild(this.overlay);
  }

  _show() {
    this.overlay.classList.add('visible');
  }

  _hide() {
    this.overlay.classList.remove('visible');
  }

  // Show name input screen
  showNameInput(callback) {
    this.box.innerHTML = `
      <div class="quiz-title">Welcome, Hero!</div>
      <div class="quiz-subtitle">Enter your name to begin the quest</div>
      <input type="text" class="quiz-input" placeholder="Your name..." maxlength="20" autofocus>
      <button class="quiz-button" disabled>Start Adventure</button>
    `;

    const input = this.box.querySelector('.quiz-input');
    const button = this.box.querySelector('.quiz-button');

    input.addEventListener('input', () => {
      button.disabled = input.value.trim().length === 0;
    });

    const submit = () => {
      if (input.value.trim()) {
        this.playerName = input.value.trim();
        this._hide();
        this.onNameSet(this.playerName);
        if (callback) callback(this.playerName);
      }
    };

    button.onclick = submit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) submit();
    });

    this._show();
    setTimeout(() => input.focus(), 100);
  }

  // Show next question
  showQuestion(callback) {
    if (this.currentQuestion >= this.questions.length) {
      this.showComplete(callback);
      return;
    }

    const q = this.questions[this.currentQuestion];

    this.box.innerHTML = `
      <div class="quiz-title">${this.playerName}, answer this!</div>
      <div class="quiz-subtitle">Question ${this.currentQuestion + 1} of ${this.questions.length}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-choices">
        ${q.choices.map((choice, i) => `
          <button class="quiz-choice" data-index="${i}">${choice}</button>
        `).join('')}
      </div>
      <div class="quiz-progress">Score: ${this.score} / ${this.currentQuestion}</div>
    `;

    const buttons = this.box.querySelectorAll('.quiz-choice');

    buttons.forEach((btn, i) => {
      btn.onclick = () => {
        // Disable all buttons
        buttons.forEach(b => b.disabled = true);

        const isCorrect = i === q.correct;

        // Show correct/wrong
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          buttons[q.correct].classList.add('correct');
        }

        if (isCorrect) {
          this.score++;
          this.onCorrect();
        } else {
          this.onWrong();
        }

        this.currentQuestion++;

        // Continue after delay
        setTimeout(() => {
          this._hide();
          if (callback) callback(isCorrect);
        }, 1500);
      };
    });

    this._show();
  }

  // Show completion screen
  showComplete(callback) {
    const passed = this.score >= Math.ceil(this.questions.length / 2);

    this.box.innerHTML = `
      <div class="quiz-title">Mission ${passed ? 'Complete' : 'Failed'}!</div>
      <div class="quiz-subtitle">Well done, ${this.playerName}!</div>
      <div class="quiz-score">${this.score} / ${this.questions.length}</div>
      <div class="quiz-result ${passed ? 'success' : 'failure'}">
        ${passed
          ? 'Congratulations! You have completed the quest!'
          : 'Keep practicing and try again!'}
      </div>
      <button class="quiz-button">${passed ? 'Victory!' : 'Try Again'}</button>
    `;

    this.box.querySelector('.quiz-button').onclick = () => {
      this._hide();
      this.onComplete(this.score, this.questions.length, passed);
      if (callback) callback(passed);
    };

    this._show();
  }

  // Check if all questions answered
  isComplete() {
    return this.currentQuestion >= this.questions.length;
  }

  // Check if mission passed (>50% correct)
  isPassed() {
    return this.score >= Math.ceil(this.questions.length / 2);
  }

  // Reset quiz for replay
  reset() {
    this.currentQuestion = 0;
    this.score = 0;
  }

  // Get current progress
  getProgress() {
    return {
      playerName: this.playerName,
      current: this.currentQuestion,
      total: this.questions.length,
      score: this.score,
      isComplete: this.isComplete(),
      isPassed: this.isPassed()
    };
  }
}

// Default questions if none provided
const DEFAULT_QUESTIONS = QuizOverlay.DEFAULT_QUESTIONS;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizOverlay;
}
