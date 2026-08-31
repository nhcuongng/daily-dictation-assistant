class VocabPrep {
  constructor() {
    this.stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','say','her','she','will','one','all','would','there','their','what','out','about','who','get','which','when','make','can','like','time','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
    this.tips = [
      // Learning Tips / Context
      '💡 Tip: Preview words before listening',
      '💡 Pro Tip: Catch key words faster',
      '💡 Clue: Learn words before audio plays',
      '💡 Hint: Warm up your vocabulary',
      // Action / Warm-up
      '⚡ Warm-up: Check difficult words',
      '🚀 Gear Up: Preview lesson words',
      '🎧 Listen: Glance at key vocabulary',
      '🔥 Ear Prep: Review audio keywords',
      // Guide / Helper
      '📖 Glance: Preview vocabulary here',
      '👀 Lifebuoy: View helpful words',
      '🎯 Key Vocab: Preview story words',
      '✨ Word Bank: Explore lesson words'
    ];

    this.dictionaryProviders = {
      cambridge: {
        id: 'cambridge',
        name: 'Cambridge',
        fullName: 'Cambridge Dictionary',
        getUrl: (w) => `https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(w)}`
      },
      vocabulary: {
        id: 'vocabulary',
        name: 'Vocabulary.com',
        fullName: 'Vocabulary.com',
        getUrl: (w) => `https://www.vocabulary.com/dictionary/${encodeURIComponent(w)}`
      }
    };
    this.currentProvider = 'cambridge';
    this.loadDictionaryProvider();
  }

  loadDictionaryProvider() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['dda_vocab_dict_provider'], (res) => {
          if (res && res.dda_vocab_dict_provider && this.dictionaryProviders[res.dda_vocab_dict_provider]) {
            this.currentProvider = res.dda_vocab_dict_provider;
            this.updateDictionaryUI();
          }
        });
      } else if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('dda_vocab_dict_provider');
        if (saved && this.dictionaryProviders[saved]) {
          this.currentProvider = saved;
        }
      }
    } catch (e) {}
  }

  setDictionaryProvider(providerKey) {
    if (!this.dictionaryProviders[providerKey]) return;
    this.currentProvider = providerKey;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ dda_vocab_dict_provider: providerKey });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dda_vocab_dict_provider', providerKey);
      }
    } catch (e) {}
    this.updateDictionaryUI();
  }

  hasVocabularyExtension() {
    return typeof document !== 'undefined' && Boolean(document.getElementById('vocabulary-lookup'));
  }

  triggerVocabularyLookup(word, rect = null, source = 'auto') {
    if (typeof document === 'undefined') return false;
    const bridgeElement = document.getElementById('vocabulary-lookup');
    if (!bridgeElement) return false;

    bridgeElement.dispatchEvent(new CustomEvent('vocabulary-lookup', {
      bubbles: true,
      detail: {
        word: (word || '').trim(),
        rect: rect,
        source: source
      }
    }));
    return true;
  }

  lookupWord(word, element = null) {
    if (!word) return;
    const cleanWord = word.toLowerCase().trim();

    if (this.hasVocabularyExtension()) {
      const rect = element && typeof element.getBoundingClientRect === 'function' ? element.getBoundingClientRect() : null;
      const sent = this.triggerVocabularyLookup(cleanWord, rect, 'auto');
      if (sent) return 'extension';
    }

    const provider = this.dictionaryProviders[this.currentProvider] || this.dictionaryProviders.cambridge;
    const url = provider.getUrl(cleanWord);
    try {
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {}
    return url;
  }

  updateDictionaryUI() {
    if (!this.popoverElement) return;
    const hasExt = this.hasVocabularyExtension();
    const provider = this.dictionaryProviders[this.currentProvider] || this.dictionaryProviders.cambridge;

    // If extension is installed, hide dict selector if present and update hints
    const dictSelector = this.popoverElement.querySelector('.dda-vocab-dict-selector');
    if (dictSelector) {
      dictSelector.style.display = hasExt ? 'none' : 'flex';
    }
    const extTitle = this.popoverElement.querySelector('.dda-vocab-ext-title');
    if (extTitle) {
      extTitle.style.display = hasExt ? 'flex' : 'none';
    }

    // Update active button state in header
    const dictBtns = this.popoverElement.querySelectorAll('.dda-dict-btn');
    dictBtns.forEach(btn => {
      if (btn.getAttribute('data-dict') === this.currentProvider) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update word tooltips
    const wordElements = this.popoverElement.querySelectorAll('.dda-vocab-word');
    wordElements.forEach(el => {
      const word = el.getAttribute('data-word') || el.textContent.trim();
      el.title = hasExt
        ? `Click to look up "${word}" with Vocabulary Extension ↗`
        : `Click to look up "${word}" on ${provider.fullName} ↗`;
    });

    // Update footer / hint text
    const footerHint = this.popoverElement.querySelector('.dda-vocab-footer-hint');
    if (footerHint) {
      footerHint.textContent = hasExt
        ? '✨ Click any word for instant definitions & pronunciation'
        : `💡 Click any word to look up on ${provider.name}`;
    }

    const promoEl = this.popoverElement.querySelector('.dda-vocab-ext-promo');
    if (promoEl) {
      promoEl.style.display = hasExt ? 'none' : 'inline-block';
    }
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
    panel.title = tipText;
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

    const hasExt = this.hasVocabularyExtension();
    const provider = this.dictionaryProviders[this.currentProvider] || this.dictionaryProviders.cambridge;

    const popover = document.createElement('div');
    popover.className = 'dda-vocab-popover';
    popover.innerHTML = `
      <div class="dda-vocab-popover-header">
        <div class="dda-vocab-header-top">
          <div class="dda-vocab-dict-selector" style="${hasExt ? 'display: none;' : 'display: flex;'}">
            <span class="dda-vocab-dict-label">📖 Dictionary:</span>
            <div class="dda-vocab-dict-options">
              <button type="button" class="dda-dict-btn ${this.currentProvider === 'cambridge' ? 'active' : ''}" data-dict="cambridge" title="Lookup on Cambridge Dictionary">Cambridge</button>
              <button type="button" class="dda-dict-btn ${this.currentProvider === 'vocabulary' ? 'active' : ''}" data-dict="vocabulary" title="Lookup on Vocabulary.com">Vocabulary.com</button>
            </div>
          </div>
          <div class="dda-vocab-ext-title" style="${hasExt ? 'display: flex;' : 'display: none;'}">
            <span>📖 Lesson Vocabulary</span>
          </div>
          <button class="dda-popover-close-btn" title="Close (Esc)">✖</button>
        </div>
        <div class="dda-vocab-hint-bar">
          <span class="dda-vocab-footer-hint">${hasExt ? '✨ Click any word for instant definitions & pronunciation' : `💡 Click any word to look up on ${provider.name}`}</span>
        </div>
      </div>
      <div class="dda-vocab-popover-body">
        <div class="dda-vocab-list">
          ${words.map(w => `<button type="button" class="dda-vocab-word" data-word="${w}" title="${hasExt ? `Click to look up &quot;${w}&quot; with Vocabulary Extension ↗` : `Click to look up &quot;${w}&quot; on ${provider.fullName} ↗`}">${w}</button>`).join('')}
        </div>
      </div>
      <div class="dda-vocab-popover-footer">
        ${!hasExt ? `<span class="dda-vocab-ext-promo">✨ Want instant in-page popup? <a href="#" class="dda-ext-promo-link" onclick="event.preventDefault();">Get Vocabulary Extension</a></span>` : ''}
        <small>Press <strong>Esc</strong></small>
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

    // Dictionary switcher buttons
    const dictBtns = popover.querySelectorAll('.dda-dict-btn');
    dictBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dict = btn.getAttribute('data-dict');
        this.setDictionaryProvider(dict);
      });
    });

    // Word chip click for dictionary lookup
    const wordEls = popover.querySelectorAll('.dda-vocab-word');
    wordEls.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const word = el.getAttribute('data-word') || el.textContent.trim();
        this.lookupWord(word, el);
      });
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
