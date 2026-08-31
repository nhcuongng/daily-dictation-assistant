const VocabPrep = require('../scripts/vocab-prep.js');

describe('VocabPrep', () => {
  let prep;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    document.body.innerHTML = '';
    prep = new VocabPrep();
    prep.currentProvider = 'cambridge';
  });

  afterEach(() => {
    if (prep) prep.closePopup();
    if (typeof localStorage !== 'undefined') localStorage.clear();
    document.body.innerHTML = '';
  });

  test('extracts words correctly, ignoring punctuation and casing', () => {
    const text = 'Discover, this is a beautiful landscape!';
    const vocab = prep.extractVocab(text);
    // 'discover' (length 8), 'beautiful' (length 9), 'landscape' (length 9)
    expect(vocab).toContain('discover');
    expect(vocab).toContain('beautiful');
    expect(vocab).toContain('landscape');
  });

  test('filters out short words (<= 3 characters)', () => {
    const text = 'A big cat sat on the roof';
    const vocab = prep.extractVocab(text);
    // 'roof' (length 4) is extracted into allWords, 'big' / 'cat' / 'sat' / 'on' / 'the' are filtered
    expect(vocab).toEqual(['roof']);
  });

  test('filters out all question words (where, how, why, what, which, who, whose, whom)', () => {
    const text = 'Where are they going? How does it work? Why and which person wondered what happened?';
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);
    
    // None of the question words should be in either list
    const questionWords = ['where', 'how', 'why', 'what', 'which', 'who', 'whose', 'whom'];
    questionWords.forEach(q => {
      expect(keyWords).not.toContain(q);
      expect(allWords).not.toContain(q);
    });

    // Content words should be kept
    expect(allWords).toContain('going');
    expect(allWords).toContain('person');
    expect(allWords).toContain('wondered');
    expect(keyWords).toContain('wondered');
  });

  test('filters out common stop words, modals, pronouns, and filler words', () => {
    const text = 'There their these because would could should amazing themselves really actually from down next';
    const vocab = prep.extractVocab(text);
    
    expect(vocab).toContain('amazing');
    expect(vocab).not.toContain('there');
    expect(vocab).not.toContain('their');
    expect(vocab).not.toContain('these');
    expect(vocab).not.toContain('because');
    expect(vocab).not.toContain('would');
    expect(vocab).not.toContain('could');
    expect(vocab).not.toContain('should');
    expect(vocab).not.toContain('themselves');
    expect(vocab).not.toContain('really');
    expect(vocab).not.toContain('actually');
    expect(vocab).not.toContain('from');
    expect(vocab).not.toContain('down');
    expect(vocab).not.toContain('next');
  });

  test('categorizes words accurately into keyWords (B1+) and allWords', () => {
    const text = 'The people in the school listened to the beautiful symphony and fascinating lecture.';
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);

    // Common A1-A2 words ('people', 'school') in allWords, but not in keyWords
    expect(allWords).toContain('people');
    expect(allWords).toContain('school');
    expect(allWords).toContain('listened');
    expect(allWords).toContain('beautiful');
    expect(allWords).toContain('symphony');
    expect(allWords).toContain('fascinating');
    expect(allWords).toContain('lecture');

    // Key words should only contain advanced/distinguishing words
    expect(keyWords).not.toContain('people');
    expect(keyWords).not.toContain('school');
    expect(keyWords).not.toContain('listened');
    expect(keyWords).toContain('beautiful');
    expect(keyWords).toContain('symphony');
    expect(keyWords).toContain('fascinating');
    expect(keyWords).toContain('lecture');
  });

  test('handles contractions properly during extraction', () => {
    const text = "They don't understand what's happening in our society";
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);

    expect(allWords).toContain('understand');
    expect(allWords).toContain('happening');
    expect(allWords).toContain('society');
    expect(keyWords).toContain('society');
    expect(allWords).not.toContain('dont');
    expect(allWords).not.toContain('whats');
  });

  test('renders fixed-height trigger panel to DOM container with key words count', () => {
    const container = document.createElement('div');
    const text = 'Listen to the beautiful symphony';
    const panel = prep.renderPanel(text, container, { customTip: '✨ Word Bank: Explore key vocabulary' });

    expect(panel).not.toBeNull();
    expect(panel.classList.contains('dda-vocab-panel')).toBe(true);
    expect(panel.title).toBe('✨ Word Bank: Explore key vocabulary');
    
    const vocabText = panel.querySelector('.dda-vocab-text');
    expect(vocabText).not.toBeNull();
    expect(vocabText.getAttribute('title')).toBe('✨ Word Bank: Explore key vocabulary');
    expect(vocabText.textContent.trim()).toBe('✨ Word Bank: Explore key vocabulary');

    const actions = panel.querySelector('.dda-vocab-actions');
    expect(actions).not.toBeNull();

    const badge = panel.querySelector('.dda-vocab-count-badge');
    expect(badge.textContent).toBe('2 key words'); // beautiful, symphony (listen is in commonBasicWords)

    const toggleIcon = panel.querySelector('.dda-vocab-toggle-icon');
    expect(toggleIcon).not.toBeNull();
    expect(toggleIcon.textContent).toBe('↗');
  });

  test('opens anchored popover with 2-tab switcher and displays key words by default', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('The students listened to the beautiful symphony and fascinating lecture', container);

    panel.click();

    expect(prep.isPopupOpen()).toBe(true);
    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    // Check Tabs
    const tabsContainer = popover.querySelector('.dda-vocab-tabs');
    expect(tabsContainer).not.toBeNull();

    const keyTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="key"]');
    const allTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="all"]');
    expect(keyTabBtn).not.toBeNull();
    expect(allTabBtn).not.toBeNull();
    expect(keyTabBtn.classList.contains('active')).toBe(true);
    expect(allTabBtn.classList.contains('active')).toBe(false);

    // Initial words in Key tab
    const words = popover.querySelectorAll('.dda-vocab-word');
    const extracted = Array.from(words).map(w => w.getAttribute('data-word') || w.textContent.trim());
    expect(extracted).toContain('beautiful');
    expect(extracted).toContain('symphony');
    expect(extracted).toContain('fascinating');
    expect(extracted).toContain('lecture');
    expect(extracted).not.toContain('students'); // 'student' is basic
  });

  test('switches tabs and updates word chips in popover body', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('The students listened to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const keyTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="key"]');
    const allTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="all"]');

    // Click "All Words" tab
    allTabBtn.click();
    expect(allTabBtn.classList.contains('active')).toBe(true);
    expect(keyTabBtn.classList.contains('active')).toBe(false);

    let words = popover.querySelectorAll('.dda-vocab-word');
    let extracted = Array.from(words).map(w => w.getAttribute('data-word') || w.textContent.trim());
    expect(extracted).toContain('students');
    expect(extracted).toContain('listened');
    expect(extracted).toContain('beautiful');
    expect(extracted).toContain('symphony');

    // Switch back to "Key Vocab" tab
    keyTabBtn.click();
    expect(keyTabBtn.classList.contains('active')).toBe(true);
    words = popover.querySelectorAll('.dda-vocab-word');
    extracted = Array.from(words).map(w => w.getAttribute('data-word') || w.textContent.trim());
    expect(extracted).toContain('beautiful');
    expect(extracted).toContain('symphony');
    expect(extracted).not.toContain('students');
  });

  test('toggles popover when clicking panel repeatedly', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);

    panel.click();
    expect(prep.isPopupOpen()).toBe(true);

    panel.click();
    expect(prep.isPopupOpen()).toBe(false);
  });

  test('closes popover on close button click', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    expect(prep.isPopupOpen()).toBe(true);
    const closeBtn = document.querySelector('.dda-popover-close-btn');
    closeBtn.click();

    expect(prep.isPopupOpen()).toBe(false);
    expect(document.querySelector('.dda-vocab-popover')).toBeNull();
  });

  test('closes popover on click outside', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    expect(prep.isPopupOpen()).toBe(true);

    // Click outside
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.click();

    expect(prep.isPopupOpen()).toBe(false);
  });

  test('closes popover on Escape key press', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    expect(prep.isPopupOpen()).toBe(true);

    const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' });
    document.dispatchEvent(event);

    expect(prep.isPopupOpen()).toBe(false);
  });

  test('provides English tips catalog and random tip selection', () => {
    expect(prep.tips.length).toBeGreaterThanOrEqual(10);
    prep.tips.forEach(t => {
      expect(t).toContain(':');
      expect(t.split(':')[0].trim().length).toBeGreaterThan(0);
      expect(t.length).toBeLessThanOrEqual(45);
    });
    const tip = prep.getRandomTip();
    expect(typeof tip).toBe('string');
    expect(prep.tips).toContain(tip);
  });

  test('supports Cambridge and Vocabulary.com dictionary lookup URLs', () => {
    const originalOpen = window.open;
    window.open = jest.fn();

    prep.currentProvider = 'cambridge';
    expect(prep.lookupWord('symphony')).toBe('https://dictionary.cambridge.org/dictionary/english/symphony');

    prep.setDictionaryProvider('vocabulary');
    expect(prep.currentProvider).toBe('vocabulary');
    expect(prep.lookupWord('symphony')).toBe('https://www.vocabulary.com/dictionary/symphony');

    window.open = originalOpen;
  });

  test('renders dictionary provider switcher in popover footer and updates on button click', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    const dictSelector = popover.querySelector('.dda-vocab-dict-selector');
    expect(dictSelector).not.toBeNull();

    const camBtn = popover.querySelector('.dda-dict-btn[data-dict="cambridge"]');
    const vocabBtn = popover.querySelector('.dda-dict-btn[data-dict="vocabulary"]');
    expect(camBtn.classList.contains('active')).toBe(true);
    expect(vocabBtn.classList.contains('active')).toBe(false);

    // Switch to Vocabulary.com
    vocabBtn.click();
    expect(prep.currentProvider).toBe('vocabulary');
    expect(vocabBtn.classList.contains('active')).toBe(true);
    expect(camBtn.classList.contains('active')).toBe(false);

    const wordEl = popover.querySelector('.dda-vocab-word[data-word="symphony"]');
    expect(wordEl.getAttribute('title')).toContain('Vocabulary.com');
  });

  test('opens dictionary search on word chip click', () => {
    const originalOpen = window.open;
    const mockOpen = jest.fn();
    window.open = mockOpen;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const wordEl = popover.querySelector('.dda-vocab-word[data-word="symphony"]');
    expect(wordEl).not.toBeNull();

    wordEl.click();
    expect(mockOpen).toHaveBeenCalledWith(
      'https://dictionary.cambridge.org/dictionary/english/symphony',
      '_blank',
      'noopener,noreferrer'
    );

    window.open = originalOpen;
  });

  test('detects Vocabulary Extension bridge element in DOM', () => {
    expect(prep.hasVocabularyExtension()).toBe(false);

    const bridge = document.createElement('div');
    bridge.id = 'vocabulary-lookup';
    bridge.style.display = 'none';
    bridge.setAttribute('data-extension', 'vocabulary-lookup');
    document.body.appendChild(bridge);

    expect(prep.hasVocabularyExtension()).toBe(true);
  });

  test('dispatches CustomEvent to #vocabulary-lookup bridge element on word click when installed', () => {
    const bridge = document.createElement('div');
    bridge.id = 'vocabulary-lookup';
    bridge.style.display = 'none';
    document.body.appendChild(bridge);

    let eventDispatched = null;
    bridge.addEventListener('vocabulary-lookup', (e) => {
      eventDispatched = e.detail;
    });

    const originalOpen = window.open;
    const mockOpen = jest.fn();
    window.open = mockOpen;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    // Dict selector should be hidden, and instant lookup hint should show
    const dictSelector = popover.querySelector('.dda-vocab-dict-selector');
    expect(dictSelector.style.display).toBe('none');

    const activeHint = popover.querySelector('.dda-vocab-ext-active-hint');
    expect(activeHint).not.toBeNull();
    expect(activeHint.textContent).toContain('Instant popup enabled');

    const wordEl = popover.querySelector('.dda-vocab-word[data-word="symphony"]');
    wordEl.click();

    expect(eventDispatched).not.toBeNull();
    expect(eventDispatched.word).toBe('symphony');
    expect(eventDispatched.source).toBe('auto');
    expect(mockOpen).not.toHaveBeenCalled();

    window.open = originalOpen;
  });

  test('correctly maps raw part of speech strings to short codes', () => {
    expect(prep.mapPartOfSpeech('noun')).toBe('n');
    expect(prep.mapPartOfSpeech('proper noun')).toBe('n');
    expect(prep.mapPartOfSpeech('verb')).toBe('v');
    expect(prep.mapPartOfSpeech('transitive verb')).toBe('v');
    expect(prep.mapPartOfSpeech('adjective')).toBe('adj');
    expect(prep.mapPartOfSpeech('adverb')).toBe('adv');
    expect(prep.mapPartOfSpeech('preposition')).toBe('prep');
    expect(prep.mapPartOfSpeech('pronoun')).toBe('pron');
    expect(prep.mapPartOfSpeech('conjunction')).toBe('conj');
    expect(prep.mapPartOfSpeech('interjection')).toBe('interj');
    expect(prep.mapPartOfSpeech(null)).toBeNull();
  });

  test('saves, retrieves, and updates LRU timestamps in POS cache', () => {
    prep.saveWordPosToCache('symphony', 'n');
    expect(prep.getWordPosFromCache('symphony')).toBe('n');

    const entry = prep.posCache['symphony'];
    expect(entry).toBeDefined();
    expect(entry.pos).toBe('n');
    expect(typeof entry.ts).toBe('number');
  });

  test('prunes oldest 100 entries when POS cache reaches MAX_POS_CACHE (1000)', () => {
    prep.MAX_POS_CACHE = 10;
    prep.PRUNE_BATCH = 3;

    // Fill cache with 10 words with distinct timestamps
    for (let i = 1; i <= 10; i++) {
      prep.posCache[`word${i}`] = { pos: 'n', ts: 1000 + i };
    }
    expect(Object.keys(prep.posCache).length).toBe(10);

    // Adding 11th word triggers pruning of 3 oldest entries (word1, word2, word3)
    prep.saveWordPosToCache('word11', 'adj');

    expect(Object.keys(prep.posCache).length).toBe(8); // 10 - 3 + 1 = 8
    expect(prep.posCache['word1']).toBeUndefined();
    expect(prep.posCache['word2']).toBeUndefined();
    expect(prep.posCache['word3']).toBeUndefined();
    expect(prep.posCache['word4']).toBeDefined();
    expect(prep.posCache['word11']).toBeDefined();
    expect(prep.posCache['word11'].pos).toBe('adj');
  });

  test('fetches POS from Free Dictionary API and caches the result', async () => {
    const mockApiResponse = [
      {
        word: 'fascinating',
        meanings: [
          {
            partOfSpeech: 'adjective',
            definitions: [{ definition: 'Extremely interesting.' }]
          }
        ]
      }
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    const pos = await prep.fetchWordPos('fascinating');
    expect(pos).toBe('adj');
    expect(prep.getWordPosFromCache('fascinating')).toBe('adj');
    expect(global.fetch).toHaveBeenCalledWith('https://freedictionaryapi.com/api/v1/entries/en/fascinating');

    // Second call should hit cache without calling fetch again
    global.fetch.mockClear();
    const cachedPos = await prep.fetchWordPos('fascinating');
    expect(cachedPos).toBe('adj');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('renders cached POS badges inside word chips on popover open', () => {
    prep.saveWordPosToCache('beautiful', 'adj');
    prep.saveWordPosToCache('symphony', 'n');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    const beautifulBadge = popover.querySelector('.dda-vocab-word[data-word="beautiful"] .dda-vocab-pos');
    expect(beautifulBadge).not.toBeNull();
    expect(beautifulBadge.textContent).toBe('adj');
    expect(beautifulBadge.classList.contains('dda-pos-adj')).toBe(true);

    const symphonyBadge = popover.querySelector('.dda-vocab-word[data-word="symphony"] .dda-vocab-pos');
    expect(symphonyBadge).not.toBeNull();
    expect(symphonyBadge.textContent).toBe('n');
    expect(symphonyBadge.classList.contains('dda-pos-n')).toBe(true);
  });

  test('calculates word scores accurately with academic suffix and POS bonuses', () => {
    // Academic suffix (+3), length 11 -> high score
    const scoreFascinating = prep.calculateWordScore('fascinating', 'adj');
    expect(scoreFascinating).toBeGreaterThan(12);

    // Functional word (pron, prep) -> negative score, excluded from Key Vocab
    const scoreFunctional = prep.calculateWordScore('throughout', 'prep');
    expect(scoreFunctional).toBeLessThan(0);

    // Common basic word -> penalized
    const scorePeople = prep.calculateWordScore('people', 'n');
    expect(scorePeople).toBeLessThan(5);
  });

  test('sorts keyWords by importance score descending', () => {
    prep.saveWordPosToCache('symphony', 'n');
    prep.saveWordPosToCache('extraordinary', 'adj'); // length 13 + adj bonus (+3) + length >= 6 (+2)

    const text = 'The symphony was extraordinary';
    const { keyWords } = prep.extractCategorizedVocab(text);

    expect(keyWords[0]).toBe('extraordinary');
    expect(keyWords).toContain('symphony');
  });

  test('renders Mini POS Filter Bar in All Words tab and filters word chips', () => {
    prep.saveWordPosToCache('beautiful', 'adj');
    prep.saveWordPosToCache('symphony', 'n');
    prep.saveWordPosToCache('investigate', 'v');
    prep.saveWordPosToCache('remarkably', 'adv');

    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('beautiful symphony investigate remarkably', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const allTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="all"]');

    // Switch to All Words tab
    allTabBtn.click();

    const filtersContainer = popover.querySelector('.dda-vocab-pos-filters');
    expect(filtersContainer).not.toBeNull();
    expect(filtersContainer.style.display).toBe('flex');

    const adjFilterBtn = popover.querySelector('.dda-pos-filter-btn[data-filter="adj"]');
    expect(adjFilterBtn).not.toBeNull();
    expect(adjFilterBtn.textContent).toContain('Adj');

    // Click Adj filter
    adjFilterBtn.click();
    expect(adjFilterBtn.classList.contains('active')).toBe(true);

    const words = popover.querySelectorAll('.dda-vocab-word');
    const extracted = Array.from(words).map(w => w.getAttribute('data-word'));
    expect(extracted).toEqual(['beautiful']);

    // Click All filter to reset
    const allFilterBtn = popover.querySelector('.dda-pos-filter-btn[data-filter="all"]');
    allFilterBtn.click();
    const allExtracted = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(w => w.getAttribute('data-word'));
    expect(allExtracted.length).toBe(4);
  });
});
