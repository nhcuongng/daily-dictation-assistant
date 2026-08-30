class VocabPrep {
  constructor() {
    this.stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','say','her','she','will','one','all','would','there','their','what','out','about','who','get','which','when','make','can','like','time','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
  }

  extractVocab(text) {
    const words = text.split(/\s+/);
    const vocab = new Set();
    words.forEach(w => {
      const clean = w.replace(/[^\w]/g, '').toLowerCase();
      if (clean.length > 4 && !this.stopWords.has(clean)) {
        vocab.add(clean);
      }
    });
    return Array.from(vocab);
  }

  renderPanel(text, container) {
    const words = this.extractVocab(text);
    if (words.length === 0) return;

    const panel = document.createElement('div');
    panel.className = 'dda-vocab-panel';
    panel.innerHTML = `
      <div class="dda-vocab-header">Vocab Prep (${words.length} words):</div>
      <div class="dda-vocab-list">
        ${words.map(w => `<span class="dda-vocab-word">${w}</span>`).join('')}
      </div>
    `;
    container.appendChild(panel);
  }
}
window.VocabPrep = new VocabPrep();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabPrep;
}
