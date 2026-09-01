// What If Sound? - Pronunciation Sandbox Component
// Allows dictation learners to test and compare English pronunciation on the fly using chrome.tts

const ICONS = typeof DDA_ICONS !== 'undefined' ? DDA_ICONS : (typeof require !== 'undefined' ? require('./icons.js') : null);

class WhatIfSound {
  constructor() {
    this.isPlaying = false;
    this.containerEl = null;
    this.inputEl = null;
    this.speakBtn = null;
    this.clearBtn = null;
    this._messageListenerAttached = false;
    this._audioListenerAttached = false;
    this.setupMessageListener();
  }

  setupMessageListener() {
    if (this._messageListenerAttached) return;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.action === 'tts_event') {
          if (msg.type === 'end' || msg.type === 'cancelled' || msg.type === 'error') {
            this.setPlayingState(false);
          }
        }
      });
      this._messageListenerAttached = true;
    }
  }

  setupAudioListener() {
    const audioEl = document.querySelector('audio');
    if (audioEl && !this._audioListenerAttached) {
      audioEl.addEventListener('play', () => {
        if (this.isPlaying) {
          this.stop();
        }
      });
      this._audioListenerAttached = true;
    }
  }

  render(targetContainer, insertBeforeEl = null) {
    if (!targetContainer) return null;

    // Avoid duplicate renders
    const existing = targetContainer.querySelector('.dda-what-if-sound-container');
    if (existing) {
      this.containerEl = existing;
      this.inputEl = existing.querySelector('.dda-what-if-input');
      this.speakBtn = existing.querySelector('.dda-what-if-btn-speak');
      this.clearBtn = existing.querySelector('.dda-what-if-btn-clear');
      this.setupAudioListener();
      return existing;
    }

    const container = document.createElement('div');
    container.className = 'dda-what-if-sound-container';

    // Header label
    const header = document.createElement('div');
    header.className = 'dda-what-if-header';
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'dda-what-if-title';
    titleSpan.innerHTML = `${ICONS ? ICONS.speaker(14) : '🔊 '} <strong>What If Sound?</strong>`;
    
    const hintSpan = document.createElement('span');
    hintSpan.className = 'dda-what-if-hint';
    hintSpan.textContent = 'Test & contrast pronunciation';

    header.appendChild(titleSpan);
    header.appendChild(hintSpan);
    container.appendChild(header);

    // Input row wrapper
    const row = document.createElement('div');
    row.className = 'dda-what-if-row';

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'dda-what-if-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dda-what-if-input';
    input.placeholder = 'Type or paste text to test pronunciation (Enter to speak)...';
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('autocomplete', 'off');
    this.inputEl = input;

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'dda-what-if-btn-clear';
    clearBtn.title = 'Clear text (Esc)';
    clearBtn.setAttribute('aria-label', 'Clear text');
    clearBtn.innerHTML = ICONS ? ICONS.close(12) : '✕';
    clearBtn.style.display = 'none';
    this.clearBtn = clearBtn;

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(clearBtn);

    // Speak Button
    const speakBtn = document.createElement('button');
    speakBtn.type = 'button';
    speakBtn.className = 'dda-btn dda-what-if-btn-speak';
    speakBtn.title = 'Speak text (Enter / Ctrl+Enter)';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'dda-what-if-icon';
    iconSpan.innerHTML = ICONS ? ICONS.speaker(14) : '🔊';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'dda-what-if-label';
    labelSpan.textContent = 'Speak';

    speakBtn.appendChild(iconSpan);
    speakBtn.appendChild(labelSpan);
    this.speakBtn = speakBtn;

    row.appendChild(inputWrapper);
    row.appendChild(speakBtn);
    container.appendChild(row);

    // Event Listeners
    input.addEventListener('input', () => {
      this.updateControlsState();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSpeak();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.clearText();
      }
    });

    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearText();
    });

    speakBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSpeak();
    });

    this.containerEl = container;
    if (insertBeforeEl && insertBeforeEl.parentNode === targetContainer) {
      targetContainer.insertBefore(container, insertBeforeEl);
    } else {
      targetContainer.appendChild(container);
    }
    this.updateControlsState();
    this.setupAudioListener();

    return container;
  }

  updateControlsState() {
    if (!this.inputEl || !this.clearBtn) return;
    const hasText = this.inputEl.value.trim().length > 0;
    this.clearBtn.style.display = hasText ? 'inline-flex' : 'none';
  }

  toggleSpeak() {
    if (this.isPlaying) {
      this.stop();
      return;
    }

    if (!this.inputEl) return;
    const text = this.inputEl.value.trim();
    if (!text) {
      this.inputEl.focus();
      return;
    }

    this.speak(text);
  }

  speak(text) {
    if (!text || typeof text !== 'string') return;
    const cleanedText = text.trim();
    if (!cleanedText) return;

    // Pause main dictation audio if playing to prevent acoustic overlap
    const audioEl = document.querySelector('audio');
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
    }

    this.setPlayingState(true);

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'tts_speak',
        text: cleanedText,
        lang: 'en-US',
        rate: 1.0
      }, (response) => {
        if (chrome.runtime.lastError || (response && response.success === false)) {
          this.setPlayingState(false);
        }
      });
    } else {
      // Fallback for non-extension or testing environment if needed
      setTimeout(() => {
        this.setPlayingState(false);
      }, 500);
    }
  }

  stop() {
    this.setPlayingState(false);
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ action: 'tts_stop' });
      } catch (err) {
        // Ignore message failure on teardown
      }
    }
  }

  setPlayingState(isPlaying) {
    this.isPlaying = !!isPlaying;
    if (!this.speakBtn) return;

    const icon = this.speakBtn.querySelector('.dda-what-if-icon');
    const label = this.speakBtn.querySelector('.dda-what-if-label');

    if (this.isPlaying) {
      this.speakBtn.classList.add('dda-playing');
      if (icon) {
        icon.innerHTML = ICONS ? ICONS.stop(12) : '⏹️';
        icon.classList.add('dda-anim-pulse');
      }
      if (label) label.textContent = 'Stop';
      this.speakBtn.title = 'Stop speaking';
    } else {
      this.speakBtn.classList.remove('dda-playing');
      if (icon) {
        icon.innerHTML = ICONS ? ICONS.speaker(14) : '🔊';
        icon.classList.remove('dda-anim-pulse');
      }
      if (label) label.textContent = 'Speak';
      this.speakBtn.title = 'Speak text (Enter / Ctrl+Enter)';
    }
  }

  clearText(shouldFocus = true) {
    if (this.inputEl) {
      this.inputEl.value = '';
      this.updateControlsState();
      if (shouldFocus) {
        this.inputEl.focus();
      }
    }
    if (this.isPlaying) {
      this.stop();
    }
  }

  setText(text) {
    if (this.inputEl && typeof text === 'string') {
      this.inputEl.value = text;
      this.updateControlsState();
    }
  }
}

// Instantiate singleton on window
if (typeof window !== 'undefined') {
  window.WhatIfSound = new WhatIfSound();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WhatIfSound };
}
