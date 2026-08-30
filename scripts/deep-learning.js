class DeepLearningLoop {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    // Looking for a textarea
    const textarea = document.querySelector('textarea');
    
    if (textarea && !document.querySelector('.dda-actions-container')) {
      this.renderActions(textarea);
      this.initialized = true;
    }
  }

  renderActions(textarea) {
    const vocabContainer = document.createElement('div');
    textarea.parentNode.insertBefore(vocabContainer, textarea);

    const container = document.createElement('div');
    container.className = 'dda-actions-container';

    // Toggle Pin button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'dda-btn-toggle';
    toggleBtn.innerHTML = '📌';
    toggleBtn.title = 'Toggle Float/Inline Mode';
    
    // Load state
    chrome.storage.local.get(['uiMode'], (result) => {
      if (result.uiMode === 'float') {
        container.classList.add('dda-float-mode');
        toggleBtn.innerHTML = '🔽';
      }
    });

    toggleBtn.onclick = (e) => {
      e.preventDefault();
      if (container.classList.contains('dda-float-mode')) {
        container.classList.remove('dda-float-mode');
        toggleBtn.innerHTML = '📌';
        chrome.storage.local.set({ uiMode: 'inline' });
      } else {
        container.classList.add('dda-float-mode');
        toggleBtn.innerHTML = '🔽';
        chrome.storage.local.set({ uiMode: 'float' });
      }
    };
    
    // Clear Text button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'dda-btn dda-btn-clear';
    clearBtn.innerHTML = '🧹 Clear';
    clearBtn.title = 'Clear text and try again';
    clearBtn.onclick = (e) => {
      e.preventDefault();
      textarea.value = '';
      textarea.focus();
      // Try to rewind audio
      const audioEl = document.querySelector('audio');
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play();
      }
    };
    
    // Peek Transcript button
    const peekBtn = document.createElement('button');
    peekBtn.className = 'dda-btn dda-btn-peek';
    peekBtn.innerHTML = '👁️ Peek Transcript';
    
    const transcriptContainer = document.createElement('div');
    transcriptContainer.className = 'dda-transcript-peek-container';
    transcriptContainer.style.display = 'none';

    peekBtn.onclick = (e) => {
      e.preventDefault();
      if (transcriptContainer.style.display === 'none') {
        const transcriptText = this.getTranscriptText();
        transcriptContainer.textContent = transcriptText || 'Transcript not found in DOM yet.';
        transcriptContainer.style.display = 'block';
      } else {
        transcriptContainer.style.display = 'none';
      }
    };

    // Diff button
    const diffBtn = document.createElement('button');
    diffBtn.className = 'dda-btn dda-btn-diff';
    diffBtn.innerHTML = '🔍 Check Errors';
    
    const diffContainer = document.createElement('div');
    diffContainer.className = 'dda-diff-container';
    diffContainer.style.display = 'none';

    diffBtn.onclick = (e) => {
      e.preventDefault();
      const userText = textarea.value;
      const truthText = this.getTranscriptText();
      
      if (!truthText) {
        diffContainer.innerHTML = '<em>Transcript not found. Cannot check errors.</em>';
        diffContainer.style.display = 'block';
        return;
      }
      
      const diffArray = window.DiffEngine.compare(truthText, userText);
      diffContainer.innerHTML = window.DiffEngine.renderHtml(diffArray);
      diffContainer.style.display = 'block';
    };

    container.appendChild(toggleBtn);
    container.appendChild(clearBtn);
    container.appendChild(peekBtn);
    container.appendChild(diffBtn);
    
    // Insert just above textarea
    textarea.parentNode.insertBefore(container, textarea);
    textarea.parentNode.insertBefore(transcriptContainer, textarea);
    textarea.parentNode.insertBefore(diffContainer, textarea);
    
    // Load Vocab Prep
    // On SPA, the transcript might be loaded dynamically, but we'll try once here.
    const truthText = this.getTranscriptText();
    if (truthText && window.VocabPrep) {
      window.VocabPrep.renderPanel(truthText, vocabContainer);
    }
  }

  getTranscriptText() {
    const selectors = ['#dictation-text', '.transcript', '.text-to-dictate', '#answer', '.text-success', '#sentences-list'];
    for (let s of selectors) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim().length > 0) {
        return el.textContent.trim();
      }
    }
    // Try catching any h3 or p that might contain it if not hidden
    return '';
  }
}
window.DeepLearningLoop = new DeepLearningLoop();
