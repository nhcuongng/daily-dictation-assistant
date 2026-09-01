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

  describe('generateGhostDiff', () => {
    test('handles empty or untyped user input by masking all words', () => {
      const truth = 'We have been working hard';
      const result = DiffEngine.generateGhostDiff(truth, '');

      expect(result.tokens.length).toBe(5);
      expect(result.stats.total).toBe(5);
      expect(result.stats.correct).toBe(0);
      expect(result.stats.hidden).toBe(5);
      expect(result.tokens[0].status).toBe('hidden');
      expect(result.tokens[0].displayText).toBe('W_');
      expect(result.tokens[3].displayText).toBe('w______');
    });

    test('marks correctly typed prefix words and keeps rest hidden with hints', () => {
      const truth = 'We have been working hard';
      const user = 'We have';
      const result = DiffEngine.generateGhostDiff(truth, user);

      expect(result.tokens[0].status).toBe('correct');
      expect(result.tokens[0].displayText).toBe('We');
      expect(result.tokens[1].status).toBe('correct');
      expect(result.tokens[1].displayText).toBe('have');
      expect(result.tokens[2].status).toBe('hidden');
      expect(result.tokens[2].displayText).toBe('b___');
      expect(result.stats.correct).toBe(2);
      expect(result.stats.hidden).toBe(3);
    });

    test('identifies wrong word in slot', () => {
      const truth = 'We have been working hard';
      const user = 'We hav been';
      const result = DiffEngine.generateGhostDiff(truth, user);

      expect(result.tokens[0].status).toBe('correct');
      expect(result.tokens[1].status).toBe('wrong');
      expect(result.tokens[1].userWord).toBe('hav');
      expect(result.tokens[2].status).toBe('correct');
      expect(result.stats.wrong).toBe(1);
    });

    test('respects selectively revealed word indices', () => {
      const truth = 'We have been working hard';
      const user = 'We';
      const revealed = new Set([2]); // Reveal "been" (index 2)
      const result = DiffEngine.generateGhostDiff(truth, user, revealed);

      expect(result.tokens[0].status).toBe('correct');
      expect(result.tokens[1].status).toBe('hidden');
      expect(result.tokens[2].status).toBe('revealed');
      expect(result.tokens[2].displayText).toBe('been');
      expect(result.stats.revealed).toBe(1);
    });
  });

  describe('detectPhoneticClues', () => {
    test('detects contractions, connected speech, weak forms, and flap t', () => {
      const sentence = "We've been looking at the water bottle, and it's better to pick up now.";
      const clues = DiffEngine.detectPhoneticClues(sentence);

      expect(clues.length).toBeGreaterThan(0);
      const types = clues.map(c => c.type);
      expect(types).toContain('contraction');
      expect(types).toContain('linking');
      expect(types).toContain('weak_form');
      expect(types).toContain('flap_t');
    });

    test('returns empty array on empty or invalid input', () => {
      expect(DiffEngine.detectPhoneticClues('')).toEqual([]);
      expect(DiffEngine.detectPhoneticClues(null)).toEqual([]);
    });
  });
});
