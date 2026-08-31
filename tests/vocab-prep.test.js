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
    const text = 'Hello, this is a beautiful world!';
    const vocab = prep.extractVocab(text);
    // 'hello' (length 5), 'beautiful' (length 9), 'world' (length 5)
    expect(vocab).toContain('hello');
    expect(vocab).toContain('beautiful');
    expect(vocab).toContain('world');
  });

  test('filters out short words (<= 4 characters)', () => {
    const text = 'A big cat sat on the roof';
    const vocab = prep.extractVocab(text);
    // All words are <= 4 chars or stop words
    expect(vocab.length).toBe(0);
  });

  test('filters out common stop words even if length > 4', () => {
    const text = 'There their these because would could should amazing';
    const vocab = prep.extractVocab(text);
    // 'should' is not in our default set but 'amazing' is definitely kept. 
    // Let's check our stop words: 'there', 'their', 'these', 'because', 'would', 'could'.
    // The only non-stopwords > 4 should be 'should' (since we didn't add it to stop words in the script) and 'amazing'.
    expect(vocab).toContain('amazing');
    expect(vocab).not.toContain('there');
    expect(vocab).not.toContain('their');
    expect(vocab).not.toContain('because');
  });

  test('renders fixed-height trigger panel to DOM container', () => {
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
    expect(badge.textContent).toBe('3 words');

    const toggleIcon = panel.querySelector('.dda-vocab-toggle-icon');
    expect(toggleIcon).not.toBeNull();
    expect(toggleIcon.textContent).toBe('↗');
  });

  test('opens anchored popover on panel click and displays vocabulary words', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const panel = prep.renderPanel('Listen to the beautiful symphony', container);

    panel.click();

    expect(prep.isPopupOpen()).toBe(true);
    const popover = document.querySelector('.dda-vocab-popover');
    expect(popover).not.toBeNull();

    const words = popover.querySelectorAll('.dda-vocab-word');
    expect(words.length).toBe(3); // listen, beautiful, symphony

    const extracted = Array.from(words).map(w => w.textContent);
    expect(extracted).toContain('listen');
    expect(extracted).toContain('beautiful');
    expect(extracted).toContain('symphony');
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
    prep.currentProvider = 'cambridge';
    expect(prep.lookupWord('symphony')).toBe('https://dictionary.cambridge.org/dictionary/english/symphony');

    prep.setDictionaryProvider('vocabulary');
    expect(prep.currentProvider).toBe('vocabulary');
    expect(prep.lookupWord('symphony')).toBe('https://www.vocabulary.com/dictionary/symphony');
  });

  test('renders dictionary provider switcher in popover header and updates on button click', () => {
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

    const hintBar = popover.querySelector('.dda-vocab-hint-bar');
    expect(hintBar).not.toBeNull();
    expect(hintBar.textContent).toContain('Vocabulary.com');

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

    const hintBar = popover.querySelector('.dda-vocab-hint-bar');
    expect(hintBar.textContent).toContain('instant');

    const wordEl = popover.querySelector('.dda-vocab-word[data-word="symphony"]');
    wordEl.click();

    expect(eventDispatched).not.toBeNull();
    expect(eventDispatched.word).toBe('symphony');
    expect(eventDispatched.source).toBe('auto');
    expect(mockOpen).not.toHaveBeenCalled();

    window.open = originalOpen;
  });
});
