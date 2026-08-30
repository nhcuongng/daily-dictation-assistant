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
