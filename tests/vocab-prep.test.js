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
    expect(toggleIcon.querySelector('svg')).not.toBeNull();
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
    expect(Array.isArray(eventDispatched.words)).toBe(true);
    expect(eventDispatched.words).toContain('symphony');
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

  test('sorts keyWords and allWords in alphabetical order (A-Z)', () => {
    prep.saveWordPosToCache('symphony', 'n');
    prep.saveWordPosToCache('extraordinary', 'adj');
    prep.saveWordPosToCache('apple', 'n');

    const text = 'The people listened to the extraordinary symphony and ate delicious apple';
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);

    // 'people' and 'listened' are basic content words (in allWords, not in keyWords)
    expect(keyWords).toEqual(['apple', 'delicious', 'extraordinary', 'symphony']);
    expect(allWords).toEqual(['apple', 'delicious', 'extraordinary', 'listened', 'people', 'symphony']);
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
    expect(allExtracted).toEqual(['beautiful', 'investigate', 'remarkably', 'symphony']);
  });

  test('renders word buttons in popover in alphabetical order by default', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('zebra elephant cat apple bird dog giraffe', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const allTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="all"]');
    allTabBtn.click();

    const words = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(w => w.getAttribute('data-word'));
    expect(words).toEqual(['apple', 'bird', 'elephant', 'giraffe', 'zebra']); // 'cat' and 'dog' <= 3 chars filtered
  });

  test('caches "none" and returns null when dictionary API returns 404 or no POS', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    const pos = await prep.fetchWordPos('alice');
    expect(pos).toBeNull();
    expect(prep.getWordPosFromCache('alice')).toBe('none');

    // Second call hits cache without triggering fetch
    global.fetch.mockClear();
    const cached = await prep.fetchWordPos('alice');
    expect(cached).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('extractCategorizedVocab completely skips words cached with "none" (proper nouns/unknown words)', () => {
    prep.saveWordPosToCache('alice', 'none');
    prep.saveWordPosToCache('wonderland', 'n');

    const text = 'Alice went to wonderland';
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);

    expect(allWords).not.toContain('alice');
    expect(keyWords).not.toContain('alice');
    expect(allWords).toContain('wonderland');
  });

  test('automatically removes words from DOM and updates counters when API returns no POS / none', async () => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/foobarxyz')) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ meanings: [{ partOfSpeech: 'noun' }] }]
      });
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('foobarxyz explored wonderland', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    // Wait for async fetch calls to resolve
    await new Promise(resolve => setTimeout(resolve, 50));

    const wordBtns = popover.querySelectorAll('.dda-vocab-word');
    const words = Array.from(wordBtns).map(w => w.getAttribute('data-word'));

    expect(words).not.toContain('foobarxyz');
    expect(words).toContain('wonderland');
    expect(prep.getWordPosFromCache('foobarxyz')).toBe('none');
  });

  test('filters out proper nouns like Antonio and Susan immediately during extraction', () => {
    const text = 'Antonio: Have you seen Susan today? Mr. Henderson told me she was in London.';
    const { keyWords, allWords } = prep.extractCategorizedVocab(text);

    expect(allWords).not.toContain('antonio');
    expect(allWords).not.toContain('susan');
    expect(allWords).not.toContain('henderson');
    expect(allWords).not.toContain('london');
    expect(allWords).toContain('today');
  });

  test('toggles pin state on pin button click, persists setting, and updates pin button UI', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const pinBtn = popover.querySelector('.dda-popover-pin-btn');
    expect(pinBtn).not.toBeNull();
    expect(prep.isPinned).toBe(false);
    expect(pinBtn.classList.contains('pinned')).toBe(false);

    // Click pin button -> pin
    pinBtn.click();
    expect(prep.isPinned).toBe(true);
    expect(pinBtn.classList.contains('pinned')).toBe(true);
    expect(pinBtn.title).toBe('Unpin panel');
    expect(localStorage.getItem('dda_vocab_pinned')).toBe('true');

    // Click pin button again -> unpin
    pinBtn.click();
    expect(prep.isPinned).toBe(false);
    expect(pinBtn.classList.contains('pinned')).toBe(false);
    expect(pinBtn.title).toBe('Pin panel (keep open)');
    expect(localStorage.getItem('dda_vocab_pinned')).toBe('false');
  });

  test('keeps popover open when clicking outside if pinned', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const pinBtn = popover.querySelector('.dda-popover-pin-btn');
    pinBtn.click(); // Pin the panel

    expect(prep.isPinned).toBe(true);
    expect(prep.isPopupOpen()).toBe(true);

    // Click outside
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.click();

    // Popover should stay open!
    expect(prep.isPopupOpen()).toBe(true);
    expect(document.querySelector('.dda-vocab-popover')).not.toBeNull();
  });

  test('automatically opens popover on renderPanel if pinned', () => {
    prep.isPinned = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    prep.renderPanel('Discover the extraordinary landscape', container);

    expect(prep.isPopupOpen()).toBe(true);
    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    const words = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(w => w.getAttribute('data-word'));
    expect(words).toContain('extraordinary');
    expect(words).toContain('landscape');
  });

  test('applies default left-side positioning to popover', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();
    expect(popover.style.position).toBe('fixed');
    expect(popover.style.left).toBe('24px');
    expect(popover.style.top).toBe('120px');
  });

  test('supports dragging header with mouse to reposition panel and saves position', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    const header = popover.querySelector('.dda-vocab-popover-header');
    
    // Mock getBoundingClientRect
    popover.getBoundingClientRect = () => ({
      left: 24,
      top: 120,
      width: 380,
      height: 300,
      right: 404,
      bottom: 420
    });

    // Start mouse drag at (50, 130)
    const mousedownEvt = new MouseEvent('mousedown', { clientX: 50, clientY: 130, bubbles: true });
    header.dispatchEvent(mousedownEvt);
    expect(popover.classList.contains('dda-dragging')).toBe(true);

    // Move mouse by delta (+100, +50) -> to (150, 180)
    const mousemoveEvt = new MouseEvent('mousemove', { clientX: 150, clientY: 180 });
    document.dispatchEvent(mousemoveEvt);

    expect(popover.style.left).toBe('124px');
    expect(popover.style.top).toBe('170px');

    // Finish mouse drag
    // Mock updated getBoundingClientRect
    popover.getBoundingClientRect = () => ({
      left: 124,
      top: 170,
      width: 380,
      height: 300,
      right: 504,
      bottom: 470
    });
    const mouseupEvt = new MouseEvent('mouseup', {});
    document.dispatchEvent(mouseupEvt);

    expect(popover.classList.contains('dda-dragging')).toBe(false);
    expect(prep.customPosition).toEqual({ left: 124, top: 170 });
    expect(localStorage.getItem('dda_vocab_position')).toBe(JSON.stringify({ left: 124, top: 170 }));
  });

  test('restores custom position on subsequent popover opens', () => {
    prep.customPosition = { left: 80, top: 200 };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);
    panel.click();

    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover.style.left).toBe('80px');
    expect(popover.style.top).toBe('200px');
  });

  describe('Smart Search & Scope Toggle', () => {
    test('defaults scope mode to "current" and persists to localStorage', () => {
      expect(prep.scopeMode).toBe('current');
      prep.scopeMode = 'full';
      prep.persistSettings();
      expect(localStorage.getItem('dda_vocab_scope_mode')).toBe('full');

      const freshPrep = new VocabPrep();
      expect(freshPrep.scopeMode).toBe('full');
    });

    test('extracts vocabulary according to active scope (Current Sentence vs Full Story)', () => {
      const fullStory = 'The extraordinary architect designed a magnificent museum. Then the happy family visited the park.';
      const currentSentence = 'The extraordinary architect designed a magnificent museum.';
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'current';
      prep.renderPanel(fullStory, container, { currentSentence });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      expect(popover).not.toBeNull();
      
      // In current sentence, key words should be 'architect', 'extraordinary', 'magnificent', 'museum'
      const wordChips = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(wordChips).toContain('architect');
      expect(wordChips).toContain('extraordinary');
      expect(wordChips).toContain('magnificent');
      expect(wordChips).toContain('museum');
      expect(wordChips).not.toContain('visited'); // 'visited' is in sentence 2
    });

    test('toggles scope between Current and Full and updates words list and storage', () => {
      const fullStory = 'The extraordinary architect designed a magnificent museum. Then the curious astronaut explored Mars.';
      const currentSentence = 'The extraordinary architect designed a magnificent museum.';
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'current';
      prep.renderPanel(fullStory, container, { currentSentence });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const currentBtn = popover.querySelector('.dda-vocab-scope-btn[data-scope="current"]');
      const fullBtn = popover.querySelector('.dda-vocab-scope-btn[data-scope="full"]');

      expect(currentBtn.classList.contains('active')).toBe(true);
      expect(fullBtn.classList.contains('active')).toBe(false);

      // Click Full scope
      fullBtn.click();

      expect(prep.scopeMode).toBe('full');
      expect(localStorage.getItem('dda_vocab_scope_mode')).toBe('full');
      expect(fullBtn.classList.contains('active')).toBe(true);

      const wordChips = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(wordChips).toContain('architect');
      expect(wordChips).toContain('astronaut');
      expect(wordChips).toContain('curious');
      expect(wordChips).toContain('explored');
    });

    test('filters words in real-time via live search input', () => {
      const text = 'The extraordinary architect designed a magnificent museum and spectacular cathedral.';
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'full';
      prep.renderPanel(text, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');
      const searchClearBtn = popover.querySelector('.dda-vocab-search-clear');

      expect(searchInput).not.toBeNull();
      expect(searchClearBtn.classList.contains('visible')).toBe(false);

      // Type search query 'arch'
      searchInput.value = 'arch';
      searchInput.dispatchEvent(new Event('input'));

      expect(prep.searchQuery).toBe('arch');
      expect(searchClearBtn.classList.contains('visible')).toBe(true);

      const visibleChips = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(visibleChips).toEqual(['architect']);
    });

    test('clears search input and restores words list when clicking clear button', () => {
      const text = 'The extraordinary architect designed a magnificent museum.';
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'full';
      prep.renderPanel(text, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');
      const searchClearBtn = popover.querySelector('.dda-vocab-search-clear');

      searchInput.value = 'extra';
      searchInput.dispatchEvent(new Event('input'));
      expect(popover.querySelectorAll('.dda-vocab-word').length).toBe(1);

      // Click clear button
      searchClearBtn.click();

      expect(prep.searchQuery).toBe('');
      expect(searchInput.value).toBe('');
      expect(searchClearBtn.classList.contains('visible')).toBe(false);
      expect(popover.querySelectorAll('.dda-vocab-word').length).toBe(5);
    });

    test('handles Escape key: first clears search text, second closes popover', () => {
      const text = 'The extraordinary architect designed a magnificent museum.';
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.renderPanel(text, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');

      searchInput.value = 'museum';
      searchInput.dispatchEvent(new Event('input'));
      expect(prep.searchQuery).toBe('museum');

      // First Escape: clear search query
      const esc1 = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
      searchInput.dispatchEvent(esc1);

      expect(prep.searchQuery).toBe('');
      expect(searchInput.value).toBe('');
      expect(prep.isPopupOpen()).toBe(true);

      // Second Escape: close popover
      const esc2 = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
      document.dispatchEvent(esc2);

      expect(prep.isPopupOpen()).toBe(false);
    });

    test('auto-clears search query and updates words on SPA challenge change', () => {
      const fullStory = 'Sentence 1 has extraordinary architect. Sentence 2 has brilliant mathematician.';
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'current';
      prep.customCurrentSentence = 'Sentence 1 has extraordinary architect.';
      prep.renderPanel(fullStory, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');
      searchInput.value = 'extra';
      searchInput.dispatchEvent(new Event('input'));
      expect(prep.searchQuery).toBe('extra');

      // Navigate to challenge 2
      prep.customCurrentSentence = 'Sentence 2 has brilliant mathematician.';
      prep.onChallengeChange(1);

      expect(prep.searchQuery).toBe('');
      expect(searchInput.value).toBe('');
      
      const wordChips = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(wordChips).toContain('brilliant');
      expect(wordChips).toContain('mathematician');
      expect(wordChips).not.toContain('architect');
    });

    test('renders friendly empty state when searching non-existent word', () => {
      const text = 'The extraordinary architect designed a magnificent museum.';
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.renderPanel(text, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');

      searchInput.value = 'supercalifragilistic';
      searchInput.dispatchEvent(new Event('input'));

      const emptyNotice = popover.querySelector('.dda-vocab-empty-notice');
      expect(emptyNotice).not.toBeNull();
      expect(emptyNotice.textContent).toContain('No matching words for "supercalifragilistic"');
    });

    test('renders friendly familiar notice and show all words button when current sentence has only basic words', () => {
      const fullStory = 'They are in the school and going to the room. The architect designed the museum.';
      const basicSentence = 'They are in the school and going to the room.';
      
      const container = document.createElement('div');
      document.body.appendChild(container);
      
      prep.scopeMode = 'current';
      prep.renderPanel(fullStory, container, { currentSentence: basicSentence });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const familiarNotice = popover.querySelector('.dda-vocab-familiar-notice');
      
      expect(familiarNotice).not.toBeNull();
      expect(familiarNotice.textContent).toContain('All familiar words in this sentence');
      
      const showBasicBtn = popover.querySelector('.dda-vocab-show-basic-btn');
      expect(showBasicBtn).not.toBeNull();
      expect(showBasicBtn.textContent).toContain('Show all words');

      // Click show basic words button
      showBasicBtn.click();

      expect(prep.activeTab).toBe('all');
      const wordChips = Array.from(popover.querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(wordChips).toContain('going');
      expect(wordChips).toContain('school');
      expect(wordChips).toContain('room');
    });
  });

  describe('Full Mode Challenge Categorization & Auto-Scroll', () => {
    test('extracts and groups vocabulary correctly across multiple challenges', () => {
      prep.customChallenges = [
        'The extraordinary architect designed a magnificent museum.',
        'Then the brilliant mathematician solved the complex puzzle.'
      ];
      prep.allStoryText = prep.customChallenges.join('\n');

      const grouped = prep.getGroupedChallengesVocab();
      expect(grouped.length).toBe(2);
      expect(grouped[0].title).toBe('Challenge #1');
      expect(grouped[0].keyWords).toContain('architect');
      expect(grouped[0].keyWords).toContain('extraordinary');
      expect(grouped[0].keyWords).toContain('magnificent');
      expect(grouped[0].keyWords).toContain('museum');

      expect(grouped[1].title).toBe('Challenge #2');
      expect(grouped[1].keyWords).toContain('brilliant');
      expect(grouped[1].keyWords).toContain('complex');
      expect(grouped[1].keyWords).toContain('mathematician');
      expect(grouped[1].keyWords).toContain('puzzle');
    });

    test('renders challenge groups in Full mode with headers and active challenge highlighted', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const challenges = [
        'The extraordinary architect designed a magnificent museum.',
        'Then the brilliant mathematician solved the complex puzzle.'
      ];

      prep.scopeMode = 'full';
      prep.currentChallengeIndex = 1; // Second challenge is active
      prep.renderPanel(challenges.join('\n'), container, { challenges });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      expect(popover).not.toBeNull();

      const groups = popover.querySelectorAll('.dda-vocab-challenge-group');
      expect(groups.length).toBe(2);

      // Check group 1
      const group1Header = groups[0].querySelector('.dda-vocab-group-header');
      expect(group1Header.textContent).toContain('Challenge #1');
      expect(groups[0].classList.contains('active')).toBe(false);
      expect(groups[0].querySelector('.dda-vocab-current-badge')).toBeNull();

      const group1Words = Array.from(groups[0].querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(group1Words).toContain('architect');
      expect(group1Words).toContain('magnificent');

      // Check group 2 (Active)
      const group2Header = groups[1].querySelector('.dda-vocab-group-header');
      expect(group2Header.textContent).toContain('Challenge #2');
      expect(groups[1].classList.contains('active')).toBe(true);
      expect(groups[1].querySelector('.dda-vocab-current-badge')).not.toBeNull();
      expect(groups[1].querySelector('.dda-vocab-current-badge').textContent).toBe('Current');

      const group2Words = Array.from(groups[1].querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(group2Words).toContain('brilliant');
      expect(group2Words).toContain('mathematician');
    });

    test('auto-scrolls to active challenge group in Full mode', (done) => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const challenges = [
        'Sentence 1 with extraordinary architect.',
        'Sentence 2 with magnificent sculpture.',
        'Sentence 3 with brilliant mathematician.'
      ];

      prep.scopeMode = 'full';
      prep.currentChallengeIndex = 2; // Third challenge is active
      prep.renderPanel(challenges.join('\n'), container, { challenges });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const activeGroup = popover.querySelector('.dda-vocab-challenge-group.active');
      expect(activeGroup).not.toBeNull();
      expect(activeGroup.getAttribute('data-challenge-index')).toBe('2');

      const scrollSpy = jest.fn();
      activeGroup.scrollIntoView = scrollSpy;

      // Trigger scroll logic
      prep.scrollToActiveChallenge();

      setTimeout(() => {
        expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
        done();
      }, 70);
    });

    test('filters challenge groups during live search in Full mode', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const challenges = [
        'The extraordinary architect designed a magnificent museum.',
        'Then the brilliant mathematician solved the complex puzzle.'
      ];

      prep.scopeMode = 'full';
      prep.renderPanel(challenges.join('\n'), container, { challenges });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const searchInput = popover.querySelector('.dda-vocab-search-input');

      // Search for word in Challenge 2 only
      searchInput.value = 'mathem';
      searchInput.dispatchEvent(new Event('input'));

      const visibleGroups = popover.querySelectorAll('.dda-vocab-challenge-group');
      expect(visibleGroups.length).toBe(1);
      expect(visibleGroups[0].querySelector('.dda-vocab-group-header').textContent).toContain('Challenge #2');

      const words = Array.from(visibleGroups[0].querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(words).toEqual(['mathematician']);
    });

    test('updates challenge groups when switching tabs and applying POS filters in Full mode', () => {
      prep.saveWordPosToCache('extraordinary', 'adj');
      prep.saveWordPosToCache('architect', 'n');
      prep.saveWordPosToCache('mathematician', 'n');
      prep.saveWordPosToCache('brilliant', 'adj');

      const container = document.createElement('div');
      document.body.appendChild(container);

      const challenges = [
        'extraordinary architect',
        'brilliant mathematician'
      ];

      prep.scopeMode = 'full';
      prep.renderPanel(challenges.join('\n'), container, { challenges });
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const allTabBtn = popover.querySelector('.dda-vocab-tab-btn[data-tab="all"]');

      // Switch to All Words
      allTabBtn.click();
      expect(allTabBtn.classList.contains('active')).toBe(true);

      // Select Adj filter
      const adjFilter = popover.querySelector('.dda-pos-filter-btn[data-filter="adj"]');
      adjFilter.click();

      const groups = popover.querySelectorAll('.dda-vocab-challenge-group');
      expect(groups.length).toBe(2);

      const g1Words = Array.from(groups[0].querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(g1Words).toEqual(['extraordinary']);

      const g2Words = Array.from(groups[1].querySelectorAll('.dda-vocab-word')).map(el => el.getAttribute('data-word'));
      expect(g2Words).toEqual(['brilliant']);
    });

    test('handles fallback to newline splitting when DeepLearningLoop or custom challenges are absent', () => {
      const text = 'First challenge with magnificent architecture.\nSecond challenge with extraordinary astrophysics.';
      const container = document.createElement('div');
      document.body.appendChild(container);

      prep.customChallenges = null;
      prep.scopeMode = 'full';
      prep.renderPanel(text, container);
      prep.openPopup();

      const popover = document.querySelector('.dda-vocab-popover');
      const groups = popover.querySelectorAll('.dda-vocab-challenge-group');
      expect(groups.length).toBe(2);
      expect(groups[0].querySelector('.dda-vocab-group-header').textContent).toContain('Challenge #1');
      expect(groups[1].querySelector('.dda-vocab-group-header').textContent).toContain('Challenge #2');
    });
  });
});
