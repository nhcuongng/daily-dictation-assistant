const VocabPrep = require('../scripts/vocab-prep.js');

describe('VocabPrep', () => {
  let prep;

  beforeEach(() => {
    document.body.innerHTML = '';
    prep = new VocabPrep();
  });

  afterEach(() => {
    if (prep) prep.closePopup();
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
    const panel = prep.renderPanel(text, container);

    expect(panel).not.toBeNull();
    expect(panel.classList.contains('dda-vocab-panel')).toBe(true);
    
    const badge = panel.querySelector('.dda-vocab-count-badge');
    expect(badge.textContent).toBe('3 words');
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
    const tip = prep.getRandomTip();
    expect(typeof tip).toBe('string');
    expect(prep.tips).toContain(tip);
  });
});
