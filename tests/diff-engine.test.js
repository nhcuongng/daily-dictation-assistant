const DiffEngine = require('../scripts/diff-engine.js');

describe('DiffEngine', () => {
  test('returns correct for exact match', () => {
    const truth = 'hello world';
    const user = 'hello world';
    const diff = DiffEngine.compare(truth, user);
    
    expect(diff.length).toBe(2);
    expect(diff[0]).toEqual({ type: 'correct', value: 'hello' });
    expect(diff[1]).toEqual({ type: 'correct', value: 'world' });
  });

  test('identifies wrong words', () => {
    const truth = 'hello world';
    const user = 'hello word';
    const diff = DiffEngine.compare(truth, user);
    
    expect(diff).toEqual([
      { type: 'correct', value: 'hello' },
      { type: 'missing', value: 'world' },
      { type: 'wrong', value: 'word' }
    ]);
  });

  test('identifies missing words', () => {
    const truth = 'hello beautiful world';
    const user = 'hello world';
    const diff = DiffEngine.compare(truth, user);
    
    expect(diff).toEqual([
      { type: 'correct', value: 'hello' },
      { type: 'missing', value: 'beautiful' },
      { type: 'correct', value: 'world' }
    ]);
  });

  test('identifies extra words', () => {
    const truth = 'hello world';
    const user = 'hello my beautiful world';
    const diff = DiffEngine.compare(truth, user);
    
    expect(diff).toEqual([
      { type: 'correct', value: 'hello' },
      { type: 'wrong', value: 'my' },
      { type: 'wrong', value: 'beautiful' },
      { type: 'correct', value: 'world' }
    ]);
  });

  test('ignores punctuation and casing when matching', () => {
    const truth = 'Hello, world!';
    const user = 'hello world';
    const diff = DiffEngine.compare(truth, user);
    
    expect(diff).toEqual([
      { type: 'correct', value: 'hello' },
      { type: 'correct', value: 'world' }
    ]);
  });

  test('renderHtml returns correct HTML string', () => {
    const diff = [
      { type: 'correct', value: 'hello' },
      { type: 'missing', value: 'beautiful' },
      { type: 'wrong', value: 'word' }
    ];
    const html = DiffEngine.renderHtml(diff);
    
    expect(html).toContain('<span class="dda-diff-correct">hello</span>');
    expect(html).toContain('<span class="dda-diff-missing" title="Missing word">beautiful</span>');
    expect(html).toContain('<span class="dda-diff-wrong" title="Wrong word">word</span>');
  });
});
