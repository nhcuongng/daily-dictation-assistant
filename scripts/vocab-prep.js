class VocabPrep {
  constructor() {
    // Expanded Stopwords / Function words (~350 words)
    this.stopWords = new Set([
      // Question words / Wh-words
      'what', 'whatever', 'when', 'whenever', 'where', 'wherever', 'which', 'whichever',
      'while', 'who', 'whoever', 'whom', 'whose', 'why', 'how', 'however',
      // Articles & Pronouns
      'the', 'this', 'that', 'these', 'those', 'they', 'them', 'their', 'theirs', 'themselves',
      'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
      'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
      'someone', 'somebody', 'something', 'anyone', 'anybody', 'anything', 'everyone', 'everybody',
      'everything', 'noone', 'nobody', 'nothing', 'another', 'other', 'others', 'each', 'every',
      'either', 'neither', 'both', 'some', 'any', 'such', 'none', 'all', 'many', 'much', 'more',
      'most', 'several', 'few', 'fewer', 'fewest', 'little', 'less', 'least',
      // Prepositions & Conjunctions
      'about', 'above', 'across', 'after', 'against', 'along', 'alongside', 'amid', 'among', 'amongst',
      'around', 'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond',
      'down', 'during', 'except', 'from', 'inside', 'into', 'like', 'near', 'next', 'off', 'onto',
      'opposite', 'outside', 'over', 'past', 'round', 'since', 'through', 'throughout', 'till',
      'toward', 'towards', 'under', 'underneath', 'until', 'unto', 'upon', 'with', 'within',
      'without', 'and', 'but', 'for', 'nor', 'so', 'yet', 'because', 'although', 'though',
      'whereas', 'unless', 'whether', 'as', 'if', 'than', 'such', 'same', 'own', 'last',
      'per', 'via',
      // Auxiliary, Modal Verbs & Common Verb Inflections
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'done', 'doing', 'be', 'is', 'am',
      'are', 'was', 'were', 'been', 'being', 'will', 'would', 'shall', 'should', 'can', 'could',
      'may', 'might', 'must', 'ought', 'dare', 'need', 'used',
      // Common Conversational, Greetings & Filler words
      'really', 'actually', 'probably', 'definitely', 'maybe', 'gonna', 'wanna', 'gotta', 'yeah',
      'yep', 'nope', 'okay', 'please', 'thank', 'thanks', 'hello', 'sorry', 'welcome', 'alright',
      'sure', 'yes', 'not', 'just', 'too', 'very', 'also', 'even', 'now', 'then', 'there',
      'here', 'well', 'only', 'quite', 'almost', 'already', 'always', 'never', 'often', 'sometimes',
      'usually', 'again', 'ever', 'away', 'back', 'else', 'even', 'forth', 'still',
      // Numbers & Ordinals
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
      'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
      'hundred', 'thousand', 'million', 'billion', 'first', 'second', 'third', 'fourth', 'fifth'
    ]);

    // Common A1-A2 Basic Content Words (Excluded from "Key Vocab", kept in "All Words")
    this.commonBasicWords = new Set([
      'people', 'time', 'year', 'good', 'bad', 'day', 'way', 'look', 'come', 'think', 'work',
      'new', 'want', 'give', 'use', 'find', 'tell', 'ask', 'seem', 'feel', 'try', 'leave',
      'call', 'know', 'take', 'see', 'get', 'make', 'go', 'say', 'like', 'life', 'man',
      'woman', 'child', 'children', 'world', 'school', 'state', 'family', 'student', 'group',
      'country', 'problem', 'hand', 'part', 'place', 'case', 'week', 'company', 'system',
      'program', 'question', 'government', 'number', 'night', 'point', 'home', 'water', 'room',
      'mother', 'father', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study',
      'book', 'eye', 'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house',
      'service', 'friend', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
      'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body',
      'information', 'parent', 'face', 'level', 'office', 'door', 'health', 'person', 'art',
      'war', 'history', 'party', 'result', 'change', 'morning', 'reason', 'girl', 'guy',
      'moment', 'air', 'teacher', 'force', 'education', 'foot', 'boy', 'food', 'street',
      'start', 'keep', 'hold', 'turn', 'show', 'hear', 'listen', 'play', 'run', 'move', 'live',
      'believe', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet',
      'include', 'continue', 'set', 'learn', 'lead', 'understand', 'watch', 'follow', 'stop',
      'create', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'teach', 'offer',
      'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'send', 'expect',
      'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass',
      'sell', 'require', 'report', 'decide', 'pull', 'great', 'small', 'big', 'high',
      'different', 'large', 'local', 'national', 'important', 'social', 'early', 'long',
      'best', 'better', 'easy', 'hard', 'late', 'main', 'major', 'clear', 'recent', 'ready',
      'happy', 'short', 'young', 'black', 'white', 'nice', 'fine', 'cold', 'hot', 'free',
      'full', 'clean', 'fast', 'slow', 'simple', 'rich', 'poor', 'safe', 'strong', 'weak',
      'cheap', 'dark', 'deep', 'red', 'blue', 'green', 'yellow', 'close', 'wrong', 'true',
      'false', 'busy', 'glad', 'cool', 'warm', 'sick', 'funny', 'quiet', 'fresh', 'quick',
      'sweet', 'wild', 'soft', 'tall', 'wide', 'hungry', 'tired', 'pretty', 'brave', 'proud',
      'angry', 'afraid', 'sad', 'loud', 'sound', 'music', 'class', 'paper', 'space', 'table',
      'phone', 'town', 'river', 'tree', 'road', 'walk', 'step', 'rock', 'land', 'farm',
      'bank', 'park', 'post', 'corner', 'church', 'station', 'library', 'movie', 'shop',
      'store', 'market', 'hotel', 'center', 'centre', 'cross', 'front', 'hall', 'court', 'garden'
    ]);

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
    this.activeTab = 'key'; // 'key' | 'all'
    
    // LRU POS Cache config
    this.MAX_POS_CACHE = 1000;
    this.PRUNE_BATCH = 100;
    this.posCache = {}; // { [word]: { pos: 'adj', ts: number } }

    // Academic Suffixes & POS configurations
    this.academicSuffixes = ['tion', 'ment', 'able', 'ible', 'ous', 'ive', 'ize', 'ical', 'ally', 'ence', 'ance', 'logy', 'ism', 'ist', 'ity', 'ify'];
    this.functionalPos = new Set(['prep', 'pron', 'conj', 'interj', 'num']);
    this.activePosFilter = 'all'; // 'all' | 'n' | 'v' | 'adj' | 'adv'
    
    this.loadDictionaryProvider();
    this.loadPosCache();
  }

  loadPosCache() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['dda_pos_cache'], (res) => {
          if (res && res.dda_pos_cache && typeof res.dda_pos_cache === 'object') {
            this.posCache = res.dda_pos_cache;
          }
        });
      } else if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('dda_pos_cache');
        if (saved) {
          this.posCache = JSON.parse(saved);
        }
      }
    } catch (e) {}
  }

  persistPosCache() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ dda_pos_cache: this.posCache });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dda_pos_cache', JSON.stringify(this.posCache));
      }
    } catch (e) {}
  }

  getWordPosFromCache(word) {
    if (!word || typeof word !== 'string') return null;
    if (!this.posCache) this.posCache = {};
    const clean = word.toLowerCase().trim();
    if (this.posCache[clean]) {
      this.posCache[clean].ts = Date.now();
      return this.posCache[clean].pos;
    }
    return null;
  }

  saveWordPosToCache(word, pos) {
    if (!word || !pos || typeof word !== 'string' || typeof pos !== 'string') return;
    if (!this.posCache) this.posCache = {};
    const clean = word.toLowerCase().trim();
    const keys = Object.keys(this.posCache);
    
    // LRU Eviction: if reaching max capacity, prune the oldest 100 items
    if (keys.length >= this.MAX_POS_CACHE && !this.posCache[clean]) {
      keys.sort((a, b) => (this.posCache[a]?.ts || 0) - (this.posCache[b]?.ts || 0));
      const toRemove = keys.slice(0, this.PRUNE_BATCH);
      toRemove.forEach(k => delete this.posCache[k]);
    }

    this.posCache[clean] = { pos: pos.trim(), ts: Date.now() };
    this.persistPosCache();
  }

  mapPartOfSpeech(rawPos) {
    if (!rawPos || typeof rawPos !== 'string') return null;
    const p = rawPos.toLowerCase().trim();
    if (p.includes('adverb')) return 'adv';
    if (p.includes('adjective')) return 'adj';
    if (p.includes('pronoun')) return 'pron';
    if (p.includes('noun')) return 'n';
    if (p.includes('verb')) return 'v';
    if (p.includes('preposition')) return 'prep';
    if (p.includes('conjunction')) return 'conj';
    if (p.includes('interjection')) return 'interj';
    if (p.includes('numeral') || p.includes('number')) return 'num';
    return p.slice(0, 4);
  }

  async fetchWordPos(word, language = 'en') {
    if (!word || typeof word !== 'string') return null;
    const clean = word.toLowerCase().trim();
    
    const cached = this.getWordPosFromCache(clean);
    if (cached) return cached;

    try {
      const url = `https://freedictionaryapi.com/api/v1/entries/${encodeURIComponent(language)}/${encodeURIComponent(clean)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      
      const entry = Array.isArray(data) ? data[0] : data;
      if (entry) {
        const meanings = entry.meanings || entry.entries;
        const rawPos = (Array.isArray(meanings) && meanings[0] && (meanings[0].partOfSpeech || meanings[0].pos))
          || entry.partOfSpeech
          || entry.pos;
        
        const pos = this.mapPartOfSpeech(rawPos);
        if (pos) {
          this.saveWordPosToCache(clean, pos);
          return pos;
        }
      }
    } catch (e) {}
    return null;
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

    // Update active button state in header/footer
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

    const promoEl = this.popoverElement.querySelector('.dda-vocab-ext-promo');
    if (promoEl) {
      promoEl.style.display = hasExt ? 'none' : 'inline-block';
    }

    const extHintEl = this.popoverElement.querySelector('.dda-vocab-ext-active-hint');
    if (extHintEl) {
      extHintEl.style.display = hasExt ? 'inline-block' : 'none';
    }
  }

  getRandomTip() {
    const index = Math.floor(Math.random() * this.tips.length);
    return this.tips[index];
  }

  isStopWord(word) {
    if (!word || typeof word !== 'string') return false;
    const clean = word.toLowerCase().trim();
    if (this.stopWords.has(clean)) return true;
    if (clean.endsWith('s') && this.stopWords.has(clean.slice(0, -1))) return true;
    return false;
  }

  isCommonBasicWord(word) {
    if (!word || typeof word !== 'string') return false;
    const clean = word.toLowerCase().trim();
    if (this.commonBasicWords.has(clean)) return true;
    if (clean.endsWith('s') && this.commonBasicWords.has(clean.slice(0, -1))) return true;
    if (clean.endsWith('es') && this.commonBasicWords.has(clean.slice(0, -2))) return true;
    if (clean.endsWith('ed') && (this.commonBasicWords.has(clean.slice(0, -2)) || this.commonBasicWords.has(clean.slice(0, -1)))) return true;
    if (clean.endsWith('ing') && (this.commonBasicWords.has(clean.slice(0, -3)) || this.commonBasicWords.has(clean.slice(0, -3) + 'e'))) return true;
    return false;
  }

  calculateWordScore(word, pos = null) {
    if (!word || typeof word !== 'string') return 0;
    const clean = word.toLowerCase().trim();
    if (this.isStopWord(clean)) return -100;
    
    let score = Math.min(clean.length, 12);
    
    // Academic suffix bonus (+3)
    if (this.academicSuffixes.some(s => clean.endsWith(s))) {
      score += 3;
    }
    
    // POS bonus / functional word penalty
    if (pos) {
      if (this.functionalPos.has(pos)) {
        return -50; // Functional words should never be in Key Vocab
      }
      if (pos === 'adj' || pos === 'adv') {
        score += 3;
        if (clean.length >= 6) score += 2;
      } else if (pos === 'n' || pos === 'v') {
        score += 2;
      }
    }
    
    // Common basic words penalty (-10)
    if (this.isCommonBasicWord(clean)) {
      score -= 10;
    }
    
    return score;
  }

  /**
   * Pre-processes raw text and extracts categorized vocabulary:
   * - keyWords: High-value content words sorted by academic & linguistic weight
   * - allWords: All content words excluding stopwords
   */
  extractCategorizedVocab(text) {
    if (!text || typeof text !== 'string') return { keyWords: [], allWords: [] };

    // Clean contractions: "don't" -> "do not", "they're" -> "they", "we've" -> "we"
    const cleanedText = text
      .replace(/n['’]t\b/gi, ' not')
      .replace(/['’](s|ve|re|ll|d|m)\b/gi, '')
      .replace(/[^a-zA-Z\s]/g, ' ');

    const rawTokens = cleanedText.split(/\s+/);
    const keySet = new Set();
    const allSet = new Set();

    rawTokens.forEach(t => {
      const clean = t.toLowerCase().trim();
      if (clean.length > 3 && !this.isStopWord(clean)) {
        const cachedPos = this.getWordPosFromCache(clean);
        
        // Exclude purely functional parts of speech from Key Vocab
        if (cachedPos && this.functionalPos.has(cachedPos)) {
          allSet.add(clean);
          return;
        }

        allSet.add(clean);
        if (!this.isCommonBasicWord(clean) || this.calculateWordScore(clean, cachedPos) >= 8) {
          keySet.add(clean);
        }
      }
    });

    // Sort keyWords descending by score
    const sortedKeyWords = Array.from(keySet).sort((a, b) => {
      const scoreB = this.calculateWordScore(b, this.getWordPosFromCache(b));
      const scoreA = this.calculateWordScore(a, this.getWordPosFromCache(a));
      return scoreB - scoreA;
    });

    return {
      keyWords: sortedKeyWords,
      allWords: Array.from(allSet)
    };
  }

  /**
   * Backward-compatible extractVocab returns all words or key words
   */
  extractVocab(text) {
    const categorized = this.extractCategorizedVocab(text);
    return categorized.allWords;
  }

  renderPanel(text, container, options = {}) {
    const { keyWords, allWords } = this.extractCategorizedVocab(text);
    if (allWords.length === 0) return null;

    // Remove existing wrapper if any
    const existing = container.querySelector('.dda-vocab-wrapper');
    if (existing) existing.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'dda-vocab-wrapper';

    const tipText = options.customTip || this.getRandomTip();
    const panel = document.createElement('div');
    panel.className = 'dda-vocab-panel';
    panel.title = tipText;
    
    // Choose display count badge: show key words count if available, otherwise total words
    const badgeText = keyWords.length > 0 ? `${keyWords.length} key words` : `${allWords.length} words`;

    panel.innerHTML = `
      <div class="dda-vocab-text dda-vocab-title" title="${tipText}">
        <span>${tipText}</span>
      </div>
      <div class="dda-vocab-actions">
        <span class="dda-vocab-count-badge">${badgeText}</span>
        <span class="dda-vocab-toggle-icon">↗</span>
      </div>
    `;

    panel.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePopup({ keyWords, allWords }, wrapper, panel);
    });

    wrapper.appendChild(panel);
    container.appendChild(wrapper);

    this.wrapperElement = wrapper;
    this.panelElement = panel;
    this.currentCategorizedWords = { keyWords, allWords };
    this.currentWords = keyWords.length > 0 ? keyWords : allWords;
    return panel;
  }

  togglePopup(vocabData = this.currentCategorizedWords, wrapper = this.wrapperElement, panel = this.panelElement) {
    if (this.isPopupOpen()) {
      this.closePopup();
    } else {
      this.openPopup(vocabData, wrapper, panel);
    }
  }

  openPopup(vocabData = this.currentCategorizedWords, wrapper = this.wrapperElement, panel = this.panelElement) {
    let keyWords = [];
    let allWords = [];

    if (Array.isArray(vocabData)) {
      allWords = vocabData;
      keyWords = vocabData.filter(w => !this.commonBasicWords.has(w));
    } else if (vocabData && typeof vocabData === 'object') {
      keyWords = vocabData.keyWords || [];
      allWords = vocabData.allWords || [];
    }

    if (allWords.length === 0 || !wrapper) return null;

    this.closePopup(); // Close any active popover

    if (panel) {
      panel.classList.add('dda-active');
    }

    // Default to 'key' tab if keyWords exist, otherwise 'all'
    this.activeTab = keyWords.length > 0 ? 'key' : 'all';

    const hasExt = this.hasVocabularyExtension();
    const provider = this.dictionaryProviders[this.currentProvider] || this.dictionaryProviders.cambridge;

    const popover = document.createElement('div');
    popover.className = 'dda-vocab-popover';
    popover.innerHTML = `
      <div class="dda-vocab-popover-header">
        <div class="dda-vocab-header-top">
          <div class="dda-vocab-header-title">
            <span>📖 Lesson Vocabulary</span>
          </div>
          <button class="dda-popover-close-btn" title="Close (Esc)">✖</button>
        </div>
        <div class="dda-vocab-tabs">
          <button type="button" class="dda-vocab-tab-btn ${this.activeTab === 'key' ? 'active' : ''}" data-tab="key" title="Key and advanced vocabulary">
            ⭐ Key Vocab <span class="dda-vocab-tab-count">${keyWords.length}</span>
          </button>
          <button type="button" class="dda-vocab-tab-btn ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all" title="All content words">
            📋 All Words <span class="dda-vocab-tab-count">${allWords.length}</span>
          </button>
        </div>
        <div class="dda-vocab-pos-filters" style="${this.activeTab === 'all' ? 'display: flex;' : 'display: none;'}"></div>
      </div>
      <div class="dda-vocab-popover-body">
        <div class="dda-vocab-list"></div>
      </div>
      <div class="dda-vocab-popover-footer">
        <div class="dda-vocab-footer-left">
          <div class="dda-vocab-dict-selector" style="${hasExt ? 'display: none;' : 'display: flex;'}">
            <span class="dda-vocab-dict-label">Dict:</span>
            <div class="dda-vocab-dict-options">
              <button type="button" class="dda-dict-btn ${this.currentProvider === 'cambridge' ? 'active' : ''}" data-dict="cambridge" title="Lookup on Cambridge Dictionary">Cambridge</button>
              <button type="button" class="dda-dict-btn ${this.currentProvider === 'vocabulary' ? 'active' : ''}" data-dict="vocabulary" title="Lookup on Vocabulary.com">Vocabulary</button>
            </div>
          </div>
          ${!hasExt ? `<span class="dda-vocab-ext-promo">✨ Want instant popup? <a href="#" class="dda-ext-promo-link" onclick="event.preventDefault();">Get Vocabulary Extension</a></span>` : `<span class="dda-vocab-ext-active-hint">✨ Instant popup enabled</span>`}
        </div>
        <small class="dda-esc-hint">Press <strong>Esc</strong></small>
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

    // Function to render active list of words
    const renderWordsList = (wordsToRender) => {
      const listContainer = popover.querySelector('.dda-vocab-list');
      if (!listContainer) return;
      
      if (wordsToRender.length === 0) {
        listContainer.innerHTML = `<span class="dda-vocab-empty-msg">No words in this category</span>`;
        return;
      }

      listContainer.innerHTML = wordsToRender.map(w => {
        const cachedPos = this.getWordPosFromCache(w);
        const posHtml = cachedPos
          ? `<span class="dda-vocab-pos dda-pos-${cachedPos}">${cachedPos}</span>`
          : `<span class="dda-vocab-pos" style="display: none;"></span>`;
        return `<button type="button" class="dda-vocab-word" data-word="${w}" title="${hasExt ? `Click to look up &quot;${w}&quot; with Vocabulary Extension ↗` : `Click to look up &quot;${w}&quot; on ${provider.fullName} ↗`}"><span class="dda-word-label">${w}</span>${posHtml}</button>`;
      }).join('');

      // Attach word click listeners
      const wordEls = listContainer.querySelectorAll('.dda-vocab-word');
      wordEls.forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const word = el.getAttribute('data-word') || el.querySelector('.dda-word-label')?.textContent.trim() || el.textContent.trim();
          this.lookupWord(word, el);
        });
      });

      // Async progressive enhancement for uncached words
      wordsToRender.forEach(w => {
        const cached = this.getWordPosFromCache(w);
        if (!cached) {
          this.fetchWordPos(w).then(pos => {
            if (pos && document.body.contains(popover)) {
              // If word is discovered to be functional while on Key tab, remove it from keyWords and UI
              if (this.activeTab === 'key' && this.functionalPos.has(pos)) {
                const idx = keyWords.indexOf(w);
                if (idx !== -1) keyWords.splice(idx, 1);
                const wordBtn = listContainer.querySelector(`.dda-vocab-word[data-word="${w}"]`);
                if (wordBtn) wordBtn.remove();
                const keyCountBadge = popover.querySelector('.dda-vocab-tab-btn[data-tab="key"] .dda-vocab-tab-count');
                if (keyCountBadge) keyCountBadge.textContent = keyWords.length;
                return;
              }

              const wordBtn = listContainer.querySelector(`.dda-vocab-word[data-word="${w}"]`);
              if (wordBtn) {
                let posBadge = wordBtn.querySelector('.dda-vocab-pos');
                if (!posBadge) {
                  posBadge = document.createElement('span');
                  wordBtn.appendChild(posBadge);
                }
                posBadge.className = `dda-vocab-pos dda-pos-${pos}`;
                posBadge.textContent = pos;
                posBadge.style.display = 'inline-flex';
              }
              // Update filter counters if on all tab
              if (this.activeTab === 'all') {
                renderPosFilters(allWords);
              }
            }
          }).catch(() => {});
        }
      });
    };

    // Function to render POS filter buttons in All Words tab
    const renderPosFilters = (allWordsList) => {
      const filtersContainer = popover.querySelector('.dda-vocab-pos-filters');
      if (!filtersContainer) return;

      const counts = { all: allWordsList.length, n: 0, v: 0, adj: 0, adv: 0 };
      allWordsList.forEach(w => {
        const p = this.getWordPosFromCache(w);
        if (p && counts[p] !== undefined) {
          counts[p]++;
        }
      });

      const options = [
        { id: 'all', label: `All (${counts.all})` },
        { id: 'n', label: `Noun (${counts.n})` },
        { id: 'v', label: `Verb (${counts.v})` },
        { id: 'adj', label: `Adj (${counts.adj})` },
        { id: 'adv', label: `Adv (${counts.adv})` }
      ];

      filtersContainer.innerHTML = options.map(opt => `
        <button type="button" class="dda-pos-filter-btn ${this.activePosFilter === opt.id ? 'active' : ''}" data-filter="${opt.id}">${opt.label}</button>
      `).join('');

      const filterBtns = filtersContainer.querySelectorAll('.dda-pos-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetFilter = btn.getAttribute('data-filter');
          this.activePosFilter = targetFilter;
          filterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === targetFilter));

          let filtered = allWords;
          if (targetFilter !== 'all') {
            filtered = allWords.filter(w => this.getWordPosFromCache(w) === targetFilter);
          }
          renderWordsList(filtered);
        });
      });
    };

    // Render initial list
    renderWordsList(this.activeTab === 'key' && keyWords.length > 0 ? keyWords : allWords);
    if (this.activeTab === 'all') {
      renderPosFilters(allWords);
    }

    // Tab switching event
    const tabBtns = popover.querySelectorAll('.dda-vocab-tab-btn');
    const filtersContainer = popover.querySelector('.dda-vocab-pos-filters');

    tabBtns.forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetTab = tabBtn.getAttribute('data-tab');
        if (targetTab === this.activeTab) return;

        this.activeTab = targetTab;
        tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === targetTab));

        if (targetTab === 'all') {
          if (filtersContainer) filtersContainer.style.display = 'flex';
          this.activePosFilter = 'all';
          renderPosFilters(allWords);
          renderWordsList(allWords);
        } else {
          if (filtersContainer) filtersContainer.style.display = 'none';
          renderWordsList(keyWords);
        }
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
