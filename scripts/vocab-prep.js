class VocabPrep {
  constructor() {
    this.stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','say','her','she','will','one','all','would','there','their','what','out','about','who','get','which','when','make','can','like','time','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
    this.tips = [
      // Learning Tips / Context
      '💡 Tip: Skim vocabulary to catch context before listening',
      '💡 Pro Tip: Previewing words helps you recognize sounds faster',
      '💡 Clue: Get familiar with key words so you don\'t miss a beat',
      '💡 Hint: Warm up with vocabulary for easier dictation',
      // Action / Warm-up
      '⚡ Vocab Warm-up: Check difficult words before you start',
      '🚀 Gear Up: Uncover key words in this lesson before pressing Play',
      '🎧 Ready to Listen? Preview the essential vocabulary here',
      '🔥 Ear Warm-up: Familiarize yourself with words in this story',
      // Guide / Helper
      '📖 Click to glance at vocabulary for this exercise',
      '👀 Lifebuoy: Open to view helpful vocabulary for this lesson',
      '🎯 Key Vocabulary: Tap here to preview words in this audio',
      '✨ Word Bank: Explore key vocabulary used in this exercise'
    ];
  }

  getRandomTip() {
    const index = Math.floor(Math.random() * this.tips.length);
    return this.tips[index];
  }

  extractVocab(text) {
    if (!text || typeof text !== 'string') return [];
    const words = text.split(/\s+/);
    const vocab = new Set();
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (clean.length > 4 && !this.stopWords.has(clean)) {
        vocab.add(clean);
      }
    });
    return Array.from(vocab);
  }

  renderPanel(text, container, options = {}) {
    const words = this.extractVocab(text);
    if (words.length === 0) return null;

    // Remove existing wrapper if any
    const existing = container.querySelector('.dda-vocab-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'dda-vocab-wrapper';

    const tipText = options.customTip || this.getRandomTip();
    const panel = document.createElement('div');
    panel.className = 'dda-vocab-panel';
    panel.title = 'Click to view vocabulary words (Floating popup)';
    panel.innerHTML = `
      <div class="dda-vocab-text dda-vocab-title" title="${tipText}">
        <span>${tipText}</span>
      </div>
      <div class="dda-vocab-actions">
        <span class="dda-vocab-count-badge">${words.length} words</span>
        <span class="dda-vocab-toggle-icon">↗</span>
      </div>
    `;

    panel.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePopup(words, wrapper, panel);
    });

    wrapper.appendChild(panel);
    container.appendChild(wrapper);

    this.wrapperElement = wrapper;
    this.panelElement = panel;
    this.currentWords = words;
    return panel;
  }

  togglePopup(words = this.currentWords, wrapper = this.wrapperElement, panel = this.panelElement) {
    if (this.isPopupOpen()) {
      this.closePopup();
    } else {
      this.openPopup(words, wrapper, panel);
    }
  }

  openPopup(words = this.currentWords, wrapper = this.wrapperElement, panel = this.panelElement) {
    if (!words || words.length === 0 || !wrapper) return null;

    this.closePopup(); // Close any active popover

    if (panel) {
      panel.classList.add('dda-active');
    }

    const popover = document.createElement('div');
    popover.className = 'dda-vocab-popover';
    popover.innerHTML = `
      <div class="dda-vocab-popover-header">
        <div class="dda-vocab-popover-title">
          <span>📖 Lesson Vocabulary</span>
          <span class="dda-vocab-count-badge">${words.length} words</span>
        </div>
        <button class="dda-popover-close-btn" title="Close (Esc)">✖</button>
      </div>
      <div class="dda-vocab-popover-body">
        <div class="dda-vocab-list">
          ${words.map(w => `<span class="dda-vocab-word">${w}</span>`).join('')}
        </div>
      </div>
      <div class="dda-vocab-popover-footer">
        <span>💡 Previewing words boosts listening accuracy</span>
        <small>Press <strong>Esc</strong> or click outside</small>
      </div>
    `;

    // Stop clicks inside popover from propagating
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close button event
    const closeBtn = popover.querySelector('.dda-popover-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closePopup();
    });

    // Click outside handler
    this._outsideClickHandler = (e) => {
      if (wrapper && !wrapper.contains(e.target)) {
        this.closePopup();
      }
    };
    document.addEventListener('click', this._outsideClickHandler);

    // Esc key handler
    this._escHandler = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.closePopup();
      }
    };
    document.addEventListener('keydown', this._escHandler);

    wrapper.appendChild(popover);
    this.popoverElement = popover;
    return popover;
  }

  closePopup() {
    if (this.popoverElement) {
      this.popoverElement.remove();
      this.popoverElement = null;
    }
    if (this.panelElement) {
      this.panelElement.classList.remove('dda-active');
    }
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  isPopupOpen() {
    return Boolean(this.popoverElement && document.body.contains(this.popoverElement));
  }
}
window.VocabPrep = new VocabPrep();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabPrep;
}
