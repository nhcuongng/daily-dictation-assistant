class DiffEngine {
  static compare(truthText, userText) {
    const oldWords = truthText.trim().split(/\s+/).filter(w => w.length > 0);
    const newWords = userText.trim().split(/\s+/).filter(w => w.length > 0);
    
    const m = oldWords.length;
    const n = newWords.length;
    const L = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    const normalize = (w) => w.replace(/[^\w]/g, '').toLowerCase();

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cleanOld = normalize(oldWords[i-1]);
        const cleanNew = normalize(newWords[j-1]);
        if (cleanOld === cleanNew && cleanOld !== '') {
          L[i][j] = L[i-1][j-1] + 1;
        } else {
          L[i][j] = Math.max(L[i-1][j], L[i][j-1]);
        }
      }
    }
    
    let i = m;
    let j = n;
    const diff = [];
    
    while (i > 0 && j > 0) {
      const cleanOld = normalize(oldWords[i-1]);
      const cleanNew = normalize(newWords[j-1]);
      if (cleanOld === cleanNew && cleanOld !== '') {
        diff.push({ type: 'correct', value: newWords[j-1] });
        i--; j--;
      } else if (L[i-1][j] > L[i][j-1]) {
        diff.push({ type: 'missing', value: oldWords[i-1] });
        i--;
      } else {
        diff.push({ type: 'wrong', value: newWords[j-1] });
        j--;
      }
    }
    
    while (i > 0) {
      diff.push({ type: 'missing', value: oldWords[i-1] });
      i--;
    }
    while (j > 0) {
      diff.push({ type: 'wrong', value: newWords[j-1] });
      j--;
    }
    
    return diff.reverse();
  }

  static generateGhostDiff(truthText, userText = '', revealedIndices = new Set()) {
    if (!truthText || typeof truthText !== 'string') {
      return { tokens: [], stats: { total: 0, correct: 0, wrong: 0, hidden: 0, revealed: 0 } };
    }

    const truthWords = truthText.trim().split(/\s+/).filter(w => w.length > 0);
    const userWords = (userText || '').trim().split(/\s+/).filter(w => w.length > 0);
    const normalize = (w) => (w || '').replace(/[^\w]/g, '').toLowerCase();

    const m = truthWords.length;
    const n = userWords.length;
    const L = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cleanOld = normalize(truthWords[i - 1]);
        const cleanNew = normalize(userWords[j - 1]);
        if (cleanOld === cleanNew && cleanOld !== '') {
          L[i][j] = L[i - 1][j - 1] + 1;
        } else {
          L[i][j] = Math.max(L[i - 1][j], L[i][j - 1]);
        }
      }
    }

    // Trace alignment
    let i = m;
    let j = n;
    const alignedTruth = new Array(m).fill(null); // maps truth index to { matchedUserWordIndex, isMatch }

    while (i > 0 && j > 0) {
      const cleanOld = normalize(truthWords[i - 1]);
      const cleanNew = normalize(userWords[j - 1]);
      if (cleanOld === cleanNew && cleanOld !== '') {
        alignedTruth[i - 1] = { userIndex: j - 1, matched: true };
        i--;
        j--;
      } else if (L[i - 1][j] > L[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    const tokens = [];
    let correctCount = 0;
    let wrongCount = 0;
    let hiddenCount = 0;
    let revealedCount = 0;

    for (let idx = 0; idx < truthWords.length; idx++) {
      const truthWord = truthWords[idx];
      const match = alignedTruth[idx];
      const isRevealed = revealedIndices && (revealedIndices === true || revealedIndices.has(idx));

      // Check if user typed an exact or close word at this sequential position
      if (match && match.matched) {
        correctCount++;
        tokens.push({
          index: idx,
          truthWord,
          userWord: userWords[match.userIndex],
          status: 'correct',
          displayText: truthWord
        });
      } else if (idx < userWords.length && normalize(userWords[idx]) !== '') {
        // User typed a non-matching word in this slot
        wrongCount++;
        const hint = this._formatHint(truthWord);
        tokens.push({
          index: idx,
          truthWord,
          userWord: userWords[idx],
          status: isRevealed ? 'revealed' : 'wrong',
          displayText: isRevealed ? truthWord : hint,
          hintText: hint
        });
        if (isRevealed) revealedCount++;
      } else {
        // Word is missing / yet to be typed
        if (isRevealed) {
          revealedCount++;
          tokens.push({
            index: idx,
            truthWord,
            userWord: null,
            status: 'revealed',
            displayText: truthWord
          });
        } else {
          hiddenCount++;
          const hint = this._formatHint(truthWord);
          tokens.push({
            index: idx,
            truthWord,
            userWord: null,
            status: 'hidden',
            displayText: hint,
            hintText: hint
          });
        }
      }
    }

    return {
      tokens,
      stats: {
        total: truthWords.length,
        correct: correctCount,
        wrong: wrongCount,
        hidden: hiddenCount,
        revealed: revealedCount,
        progressPercent: truthWords.length > 0 ? Math.round((correctCount / truthWords.length) * 100) : 0
      }
    };
  }

  static _formatHint(word) {
    if (!word) return '';
    const prefixMatch = word.match(/^[^\w]+/);
    const suffixMatch = word.match(/[^\w]+$/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    const suffix = suffixMatch ? suffixMatch[0] : '';
    const core = word.replace(/^[^\w]+|[^\w]+$/g, '');

    if (core.length === 0) return word;
    if (core.length === 1) return `${prefix}_${suffix}`;
    if (core.length === 2) return `${prefix}${core[0]}_${suffix}`;
    return `${prefix}${core[0]}${'_'.repeat(core.length - 1)}${suffix}`;
  }

  static detectPhoneticClues(truthText) {
    if (!truthText || typeof truthText !== 'string') return [];
    const clues = [];
    const seenTitles = new Set();

    const addClue = (type, badge, title, detail) => {
      const key = `${type}:${title.toLowerCase()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        clues.push({ type, badge, title, detail });
      }
    };

    // 1. Contractions & Reductions
    const contractionPatterns = [
      { regex: /\b([A-Za-z]+'ve)\b/gi, badge: '⚡ Contraction', detail: 'Vowel is reduced to /əv/ and blends smoothly into the subject.' },
      { regex: /\b([A-Za-z]+'ll)\b/gi, badge: '⚡ Contraction', detail: 'Dark /l/ sound; vowel is shortened or elided.' },
      { regex: /\b([A-Za-z]+'d)\b/gi, badge: '⚡ Contraction', detail: 'Brief or unreleased /d/ stop sound (could be "would" or "had").' },
      { regex: /\b([A-Za-z]+n't)\b/gi, badge: '⚡ Negative Contraction', detail: 'Final /t/ is often glottalized or unreleased before another word.' },
      { regex: /\b(gonna|wanna|gotta|kinda|sorta|dunno)\b/gi, badge: '⚡ Informal Reduction', detail: 'Spoken reduction merging auxiliary verb with particle.' },
      { regex: /\b([A-Za-z]+'re)\b/gi, badge: '⚡ Contraction', detail: 'Blends as a single syllable with rhotic /ər/ sound.' },
      { regex: /\b([A-Za-z]+'s)\b/gi, badge: '⚡ Contraction', detail: 'Voiced /z/ or voiceless /s/ attached directly to preceding noun/pronoun.' }
    ];

    contractionPatterns.forEach(({ regex, badge, detail }) => {
      let match;
      while ((match = regex.exec(truthText)) !== null) {
        addClue('contraction', badge, match[1], detail);
      }
    });

    // 2. Connected Speech / Linking (Consonant -> Vowel)
    const words = truthText.trim().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const currentClean = words[i].replace(/[^\w]/g, '').toLowerCase();
      const nextClean = words[i + 1].replace(/[^\w]/g, '').toLowerCase();

      if (currentClean.length > 0 && nextClean.length > 0) {
        const lastChar = currentClean[currentClean.length - 1];
        const firstChar = nextClean[0];
        const isConsonantEnd = /[bcdfghjklmnpqrstvwxyz]/.test(lastChar);
        const isVowelStart = /[aeiou]/.test(firstChar);

        if (isConsonantEnd && isVowelStart) {
          const pair = `${words[i].replace(/[^\w']/g, '')} ${words[i + 1].replace(/[^\w']/g, '')}`;
          addClue(
            'linking',
            '🔗 Connected Speech',
            pair,
            `Final consonant '${lastChar}' glides directly into vowel '${firstChar}' (sounds connected).`
          );
        }
      }
    }

    // 3. Common Weak Forms
    const weakFormWords = [
      { regex: /\b(been)\b/gi, word: 'been', detail: 'Often reduced to unstressed /bɪn/ or /bən/.' },
      { regex: /\b(for)\b/gi, word: 'for', detail: 'Reduced to /fər/ before consonants in natural rhythm.' },
      { regex: /\b(of)\b/gi, word: 'of', detail: 'Weakened to /əv/ or just /ə/ before consonants.' },
      { regex: /\b(to)\b/gi, word: 'to', detail: 'Pronounced as /tə/ when unstressed.' },
      { regex: /\b(can)\b/gi, word: 'can', detail: 'Unstressed modal sounds like /kən/ (contrast with stressed "can\'t").' },
      { regex: /\b(them)\b/gi, word: 'them', detail: 'Often reduced to /ðəm/ or conversational "\'em".' }
    ];

    weakFormWords.forEach(({ regex, word, detail }) => {
      if (regex.test(truthText)) {
        addClue('weak_form', '🔉 Weak Form', word, detail);
      }
    });

    // 4. Flap T in American English
    const flapTPattern = /\b([a-zA-Z]*(?:tt|[aeiouy]t)[aeiouy][a-zA-Z]*)\b/gi;
    const flapTExceptions = new Set(['to', 'at', 'it', 'the', 'this', 'that', 'with', 'out', 'about', 'get', 'put', 'let']);
    let flapMatch;
    while ((flapMatch = flapTPattern.exec(truthText)) !== null) {
      const matchWord = flapMatch[1].toLowerCase();
      if (!flapTExceptions.has(matchWord) && matchWord.length >= 4) {
        addClue(
          'flap_t',
          '🌊 Flap T',
          flapMatch[1],
          'The /t/ sound between vowels is pronounced as a quick tap /d/.'
        );
      }
    }

    // Balance and select up to 6 clues with diversity
    const grouped = {};
    clues.forEach(c => {
      if (!grouped[c.type]) grouped[c.type] = [];
      if (grouped[c.type].length < 2) {
        grouped[c.type].push(c);
      }
    });

    const balanced = [];
    Object.values(grouped).forEach(groupClues => {
      balanced.push(...groupClues);
    });

    return balanced.slice(0, 8);
  }

  static renderHtml(diffArray) {
    return diffArray.map(part => {
      if (part.type === 'correct') {
        return `<span class="dda-diff-correct">${part.value}</span>`;
      } else if (part.type === 'missing') {
        return `<span class="dda-diff-missing" title="Missing word">${part.value}</span>`;
      } else {
        return `<span class="dda-diff-wrong" title="Wrong word">${part.value}</span>`;
      }
    }).join(' ');
  }
}
window.DiffEngine = DiffEngine;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiffEngine;
}
