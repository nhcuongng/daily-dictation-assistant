const VocabPrep = require('../scripts/vocab-prep.js');

describe('VocabPrep', () => {
  let prep;

  beforeEach(() => {
    // Jest with JSDOM creates a window, but we should clear it if needed.
    prep = new VocabPrep();
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

  test('renders vocab panel to DOM container', () => {
    const container = document.createElement('div');
    const text = 'Listen to the beautiful symphony';
    prep.renderPanel(text, container);

    const panel = container.querySelector('.dda-vocab-panel');
    expect(panel).not.toBeNull();
    
    const words = container.querySelectorAll('.dda-vocab-word');
    expect(words.length).toBe(3); // listen, beautiful, symphony
    
    const extracted = Array.from(words).map(w => w.textContent);
    expect(extracted).toContain('listen');
    expect(extracted).toContain('beautiful');
    expect(extracted).toContain('symphony');
  });
});
