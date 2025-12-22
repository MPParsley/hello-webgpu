/**
 * NPC Dialog System with LLM Integration
 *
 * Creates interactive NPC dialogs where the AI generates
 * both the dialog text and multiple choice options.
 *
 * Usage:
 *   const npc = new NPCDialog({
 *     engine: webllmEngine,        // Your WebLLM engine
 *     npcName: "Wizard",           // NPC name
 *     npcPersonality: "...",       // NPC description
 *     questGoal: "...",            // What player must achieve
 *     onMissionComplete: () => {}, // Called when quest done
 *   });
 *
 *   npc.showNameInput();           // Get player name
 *   npc.startDialog();             // Show NPC dialog overlay
 */

class NPCDialog {
  constructor(options = {}) {
    this.engine = options.engine || null;
    this.playerName = options.playerName || '';
    this.npcName = options.npcName || 'Mysterious Stranger';
    this.npcPersonality = options.npcPersonality || 'A wise and helpful guide';
    this.questGoal = options.questGoal || 'Help the NPC with their problem';
    this.maxTurns = options.maxTurns || 5;
    this.currentTurn = 0;
    this.missionComplete = false;

    this.onMissionComplete = options.onMissionComplete || (() => {});
    this.onDialogClose = options.onDialogClose || (() => {});
    this.onNameSet = options.onNameSet || (() => {});

    this.conversationHistory = [];
    this._createOverlay();
    this._injectStyles();
  }

  _injectStyles() {
    if (document.getElementById('npc-dialog-styles')) return;

    const style = document.createElement('style');
    style.id = 'npc-dialog-styles';
    style.textContent = `
      .npc-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
      }

      .npc-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .npc-box {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #4a9eff;
        border-radius: 16px;
        padding: 24px;
        max-width: 550px;
        width: 90%;
        box-shadow: 0 0 40px rgba(74, 158, 255, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s;
      }

      .npc-overlay.visible .npc-box {
        transform: scale(1);
      }

      .npc-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .npc-avatar {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #4a9eff, #a855f7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }

      .npc-info h2 {
        margin: 0;
        color: #4a9eff;
        font-size: 1.3rem;
      }

      .npc-info .subtitle {
        color: #888;
        font-size: 0.85rem;
        margin-top: 4px;
      }

      .npc-dialog-text {
        color: #eee;
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 24px;
        min-height: 60px;
      }

      .npc-dialog-text.loading::after {
        content: "▊";
        animation: npc-blink 0.8s infinite;
      }

      @keyframes npc-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }

      .npc-choices {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .npc-choice {
        padding: 14px 20px;
        font-size: 1rem;
        background: rgba(74, 158, 255, 0.1);
        border: 1px solid rgba(74, 158, 255, 0.3);
        border-radius: 8px;
        color: #ccc;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .npc-choice:hover:not(:disabled) {
        background: rgba(74, 158, 255, 0.2);
        border-color: #4a9eff;
        color: #fff;
        transform: translateX(4px);
      }

      .npc-choice:disabled {
        opacity: 0.5;
        cursor: wait;
      }

      .npc-choice.selected {
        background: rgba(74, 158, 255, 0.3);
        border-color: #4a9eff;
        color: #fff;
      }

      .npc-progress {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.1);
        font-size: 0.85rem;
        color: #666;
      }

      .npc-input {
        width: 100%;
        padding: 14px;
        font-size: 1.1rem;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        color: #fff;
        margin-bottom: 16px;
      }

      .npc-input::placeholder {
        color: #666;
      }

      .npc-input:focus {
        outline: none;
        border-color: #4a9eff;
      }

      .npc-button {
        padding: 14px 32px;
        font-size: 1.1rem;
        background: linear-gradient(135deg, #4a9eff, #a855f7);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .npc-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(74, 158, 255, 0.4);
      }

      .npc-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .npc-success {
        text-align: center;
        padding: 20px;
      }

      .npc-success-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      .npc-success h2 {
        color: #4ade80;
        margin: 0 0 12px 0;
      }

      .npc-success p {
        color: #aaa;
        margin: 0 0 24px 0;
      }
    `;
    document.head.appendChild(style);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'npc-overlay';
    this.overlay.innerHTML = '<div class="npc-box"></div>';
    this.box = this.overlay.querySelector('.npc-box');
    document.body.appendChild(this.overlay);
  }

  _show() {
    this.overlay.classList.add('visible');
  }

  _hide() {
    this.overlay.classList.remove('visible');
  }

  setEngine(engine) {
    this.engine = engine;
  }

  // Show name input
  showNameInput(callback) {
    this.box.innerHTML = `
      <div class="npc-header">
        <div class="npc-avatar">👤</div>
        <div class="npc-info">
          <h2>Welcome, Adventurer!</h2>
          <div class="subtitle">Enter your name to begin</div>
        </div>
      </div>
      <input type="text" class="npc-input" placeholder="Your name..." maxlength="20" autofocus>
      <button class="npc-button" disabled>Begin Quest</button>
    `;

    const input = this.box.querySelector('.npc-input');
    const button = this.box.querySelector('.npc-button');

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

  // Start NPC dialog
  async startDialog(callback) {
    if (!this.engine) {
      console.error('NPCDialog: No engine set!');
      return;
    }

    this.currentTurn = 0;
    this.missionComplete = false;
    this.conversationHistory = [{
      role: "system",
      content: this._getSystemPrompt()
    }];

    await this._showNextTurn(callback);
  }

  _getSystemPrompt() {
    return `You are ${this.npcName}, ${this.npcPersonality}.
You are talking to ${this.playerName}.

QUEST GOAL: ${this.questGoal}

RULES:
1. Stay in character as ${this.npcName}
2. Speak directly to ${this.playerName} (use their name sometimes)
3. Keep dialog to 2-3 sentences max
4. ALWAYS end with EXACTLY 3 choices in this format:

[CHOICES]
1. First option
2. Second option
3. Third option

5. After ${this.maxTurns} turns, decide if quest is complete
6. When quest is done, include [QUEST_COMPLETE] or [QUEST_FAILED] at the end

IMPORTANT: Always include [CHOICES] followed by exactly 3 numbered options.`;
  }

  async _showNextTurn(callback) {
    this.currentTurn++;

    // Show loading state
    this.box.innerHTML = `
      <div class="npc-header">
        <div class="npc-avatar">🧙</div>
        <div class="npc-info">
          <h2>${this.npcName}</h2>
          <div class="subtitle">Speaking to ${this.playerName}</div>
        </div>
      </div>
      <div class="npc-dialog-text loading"></div>
      <div class="npc-choices"></div>
      <div class="npc-progress">
        <span>Turn ${this.currentTurn} of ${this.maxTurns}</span>
        <span>Thinking...</span>
      </div>
    `;

    this._show();

    const dialogText = this.box.querySelector('.npc-dialog-text');
    const choicesDiv = this.box.querySelector('.npc-choices');
    const progress = this.box.querySelector('.npc-progress');

    try {
      // Generate NPC response
      const stream = await this.engine.chat.completions.create({
        messages: this.conversationHistory,
        stream: true,
        max_tokens: 200
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        fullResponse += delta;

        // Show text without [CHOICES] marker
        const displayText = fullResponse.split('[CHOICES]')[0].trim();
        dialogText.textContent = displayText;
      }

      dialogText.classList.remove('loading');

      // Check for quest completion
      if (fullResponse.includes('[QUEST_COMPLETE]')) {
        this.missionComplete = true;
        this._showSuccess(true, callback);
        return;
      }

      if (fullResponse.includes('[QUEST_FAILED]')) {
        this.missionComplete = false;
        this._showSuccess(false, callback);
        return;
      }

      // Parse choices
      const choices = this._parseChoices(fullResponse);

      if (choices.length === 0) {
        // Fallback choices if model didn't generate them
        choices.push("Continue talking", "Ask a question", "Say goodbye");
      }

      // Add to history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse
      });

      // Render choices
      progress.innerHTML = `<span>Turn ${this.currentTurn} of ${this.maxTurns}</span><span>Choose wisely...</span>`;

      choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'npc-choice';
        btn.textContent = `${i + 1}. ${choice}`;
        btn.onclick = () => this._selectChoice(choice, callback);
        choicesDiv.appendChild(btn);
      });

    } catch (error) {
      console.error('NPC Dialog error:', error);
      dialogText.textContent = `*${this.npcName} seems distracted* (Error: ${error.message})`;
      dialogText.classList.remove('loading');

      const retryBtn = document.createElement('button');
      retryBtn.className = 'npc-button';
      retryBtn.textContent = 'Try Again';
      retryBtn.onclick = () => this._showNextTurn(callback);
      choicesDiv.appendChild(retryBtn);
    }
  }

  _parseChoices(text) {
    const choices = [];

    // Look for [CHOICES] section
    const choicesMatch = text.match(/\[CHOICES\]([\s\S]*?)(?:\[|$)/);
    if (choicesMatch) {
      const choicesText = choicesMatch[1];
      const lines = choicesText.split('\n');

      for (const line of lines) {
        const match = line.match(/^\s*\d+\.\s*(.+)/);
        if (match) {
          choices.push(match[1].trim());
        }
      }
    }

    // Fallback: look for numbered lines anywhere
    if (choices.length === 0) {
      const lines = text.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*\d+\.\s*(.+)/);
        if (match && !line.toLowerCase().includes('rule')) {
          choices.push(match[1].trim());
        }
      }
    }

    return choices.slice(0, 3);
  }

  async _selectChoice(choice, callback) {
    // Disable all buttons
    const buttons = this.box.querySelectorAll('.npc-choice');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent.includes(choice)) {
        btn.classList.add('selected');
      }
    });

    // Add player choice to history
    this.conversationHistory.push({
      role: "user",
      content: choice
    });

    // Check if max turns reached
    if (this.currentTurn >= this.maxTurns) {
      // Ask model to wrap up
      this.conversationHistory.push({
        role: "user",
        content: "(This is the final turn. Conclude the quest and include [QUEST_COMPLETE] if successful or [QUEST_FAILED] if not.)"
      });
    }

    // Small delay then next turn
    await new Promise(r => setTimeout(r, 500));
    await this._showNextTurn(callback);
  }

  _showSuccess(success, callback) {
    this.box.innerHTML = `
      <div class="npc-success">
        <div class="npc-success-icon">${success ? '🎉' : '😔'}</div>
        <h2>${success ? 'Quest Complete!' : 'Quest Failed'}</h2>
        <p>${success
          ? `Well done, ${this.playerName}! You have proven yourself worthy.`
          : `Perhaps next time, ${this.playerName}. The quest remains...`
        }</p>
        <button class="npc-button">${success ? 'Continue' : 'Try Again'}</button>
      </div>
    `;

    this.box.querySelector('.npc-button').onclick = () => {
      this._hide();
      if (success) {
        this.onMissionComplete();
      }
      this.onDialogClose(success);
      if (callback) callback(success);
    };
  }

  // Reset for replay
  reset() {
    this.currentTurn = 0;
    this.missionComplete = false;
    this.conversationHistory = [];
  }

  // Check mission status
  isMissionComplete() {
    return this.missionComplete;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NPCDialog;
}
