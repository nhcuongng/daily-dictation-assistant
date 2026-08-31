class DeepLearningLoop {
  constructor() {
    this.wrongAttemptsByChallenge = {};
    this.lastChallengeIndex = -1;

    this.peekTips = {
      subtle: [
        '👁️ Peek Transcript',
        '👁️ Take a peek if stuck',
        '👁️ Need a hint? Peek here',
        '👁️ Peek the answer'
      ],
      warning: [
        '💡 Peek Hint',
        '💡 Struggling? Peek to get unstuck',
        '💡 3rd try — take a peek at the sentence',
        '💡 Still tricky? Tap here for a hint'
      ],
      fire: [
        '🔥 Peek Rescue',
        '🔥 Don\'t give up — peek and learn',
        '🔥 6+ tries — check the transcript here',
        '🔥 Tough audio! Peek to move on'
      ]
    };
  }

  init() {
    // Looking for a textarea
    const textarea = document.querySelector('textarea');
    
    if (textarea && !document.querySelector('.dda-actions-container')) {
      this.renderActions(textarea);
    }

    this.checkCurrentChallengeChange();
  }

  checkCurrentChallengeChange() {
    const currentIndex = this.getCurrentChallengeIndex();
    if (currentIndex !== this.lastChallengeIndex) {
      this.lastChallengeIndex = currentIndex;
      this.updatePeekButton();
    }
  }

  renderActions(textarea) {
    const container = document.createElement('div');
    container.className = 'dda-actions-container';

    // Vocab Slot (Word Bank)
    const vocabContainer = document.createElement('div');
    vocabContainer.className = 'dda-vocab-slot';
    container.appendChild(vocabContainer);

    // Peek Transcript button
    const peekBtn = document.createElement('button');
    peekBtn.className = 'dda-btn dda-btn-peek dda-level-subtle';
    this.peekBtn = peekBtn;
    this.actionsContainer = container;
    this.updatePeekButton(peekBtn);

    peekBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleTranscriptPopover(container, peekBtn);
    };

    container.appendChild(peekBtn);
    
    // Insert unified toolbar just above textarea
    textarea.parentNode.insertBefore(container, textarea);
    
    // Load Vocab Prep (anchored to vocab slot inside toolbar)
    const allText = this.getTranscriptText();
    if (allText && window.VocabPrep) {
      window.VocabPrep.renderPanel(allText, vocabContainer, { defaultCollapsed: true });
    }

    // Hotkeys & Enter key handling
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        // When user submits on DailyDictation by pressing Enter
        setTimeout(() => {
          this.handleUserSubmission(textarea.value);
        }, 50);
      }
    });

    this.peekBtn = peekBtn;
    this.actionsContainer = container;
  }

  handleUserSubmission(userText) {
    if (!userText || typeof userText !== 'string' || userText.trim().length === 0) {
      return null;
    }

    const truthText = this.getCurrentSentence() || this.getTranscriptText();
    if (!truthText) return null;

    const diffArray = window.DiffEngine ? window.DiffEngine.compare(truthText, userText) : [];
    const errors = diffArray.filter(d => d.type === 'missing' || d.type === 'wrong').length;
    const isCorrect = errors === 0;

    const idx = this.getCurrentChallengeIndex();
    if (isCorrect) {
      this.wrongAttemptsByChallenge[idx] = 0;
    } else {
      this.wrongAttemptsByChallenge[idx] = (this.wrongAttemptsByChallenge[idx] || 0) + 1;
    }

    this.updatePeekButton();
    return { errors, diffArray, isCorrect };
  }

  getWrongAttemptsCount(index = this.getCurrentChallengeIndex()) {
    return this.wrongAttemptsByChallenge[index] || 0;
  }

  getPeekLevel(index = this.getCurrentChallengeIndex()) {
    const count = this.getWrongAttemptsCount(index);
    if (count >= 6) return 'fire';
    if (count >= 3) return 'warning';
    return 'subtle';
  }

  updatePeekButton(peekBtn = this.peekBtn) {
    if (!peekBtn) return;
    const level = this.getPeekLevel();
    const count = this.getWrongAttemptsCount();
    const progressPercent = Math.min(100, Math.round((count / 6) * 100));

    peekBtn.classList.remove('dda-level-subtle', 'dda-level-warning', 'dda-level-fire');
    peekBtn.classList.add(`dda-level-${level}`);

    // Use peekTips[level][0] as button label, random from full array for tooltip
    const tips = this.peekTips[level];
    const label = tips[0];
    const tip = tips[Math.floor(Math.random() * tips.length)];

    peekBtn.title = tip;
    peekBtn.innerHTML = `
      <div class="dda-peek-progress-bar" style="width: ${progressPercent}%;"></div>
      <span>${label}</span>
    `;
  }

  getAppGlobals() {
    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent || '';
        if (text.includes('window.appGlobals =') || text.includes('appGlobals =')) {
          const match = text.match(/(?:window\.)?appGlobals\s*=\s*(\{.+?\});/s);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }
    return null;
  }

  getChallengesData() {
    // Strategy 1: Look for appGlobals.challenges in script tags
    const appGlobals = this.getAppGlobals();
    if (appGlobals && Array.isArray(appGlobals.challenges) && appGlobals.challenges.length > 0) {
      return appGlobals.challenges.map((c, i) => ({
        position: c.position || (i + 1),
        content: (c.content || '').trim(),
        audioSrc: c.audioSrc || ''
      }));
    }

    // Strategy 2: Look for Accordion transcript items (all challenges)
    const challengeItems = document.querySelectorAll('#transcriptAccordionItem [title^="Challenge"], #transcriptAccordion [title^="Challenge"]');
    if (challengeItems.length > 0) {
      const items = [];
      challengeItems.forEach((el, i) => {
        const content = el.textContent.trim();
        if (content) {
          items.push({
            position: i + 1,
            content: content,
            audioSrc: ''
          });
        }
      });
      if (items.length > 0) return items;
    }

    // Strategy 3: Look for JSON-LD schema (DailyDictation Quiz LD+JSON)
    try {
      const ldJsonEl = document.querySelector('script[type="application/ld+json"]');
      if (ldJsonEl && ldJsonEl.textContent) {
        const data = JSON.parse(ldJsonEl.textContent);
        if (data && data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
          const lines = data.text.split('\n').map(s => s.trim()).filter(Boolean);
          if (lines.length > 0) {
            return lines.map((line, i) => ({
              position: i + 1,
              content: line,
              audioSrc: ''
            }));
          }
        }
      }
    } catch (e) {
      // ignore
    }

    const fullText = this.getTranscriptText();
    if (fullText) {
      const lines = fullText.split('\n').map(s => s.trim()).filter(Boolean);
      return lines.map((line, i) => ({
        position: i + 1,
        content: line,
        audioSrc: ''
      }));
    }
    return [];
  }

  getChallenges() {
    return this.getChallengesData().map(c => c.content);
  }

  getCurrentChallengeIndex() {
    const challenges = this.getChallengesData();
    const maxChallenges = challenges && challenges.length > 0 ? challenges.length : 999;

    // Tier 1: Regex matching DailyDictation's React pagination element (e.g. <span>4</span><span> / </span><span>21</span>)
    // First, check dropdown button in the arrow navigation bar
    const navDropdownBtn = document.querySelector('#btn-arrow-left ~ div button, #btn-arrow-left + div button, .dropdown button[id^="react-aria"]');
    if (navDropdownBtn) {
      const match = (navDropdownBtn.innerHTML || '').match(/<span>\s*(\d+)\s*<\/span>\s*<span>\s*\/\s*<\/span>/i) || (navDropdownBtn.textContent || '').match(/(\d+)\s*\/\s*\d+/);
      if (match) {
        const current = parseInt(match[1], 10);
        if (!isNaN(current) && current >= 1 && current <= maxChallenges) {
          return current - 1;
        }
      }
    }

    // Check all buttons / elements with React Aria dropdown or pagination pattern
    const paginationButtons = document.querySelectorAll('button[id^="react-aria"], .dropdown button, #app-dictation button');
    for (const btn of paginationButtons) {
      const html = btn.innerHTML || '';
      const regexMatch = html.match(/<span>\s*(\d+)\s*<\/span>\s*<span>\s*\/\s*<\/span>\s*<span>\s*\d+\s*<\/span>/i) || (btn.textContent || '').match(/^\s*(\d+)\s*\/\s*\d+\s*$/);
      if (regexMatch) {
        const current = parseInt(regexMatch[1], 10);
        if (!isNaN(current) && current >= 1 && current <= maxChallenges) {
          return current - 1;
        }
      }
    }

    // Global DOM Regex search for <span>N</span><span> / </span><span>Total</span>
    try {
      const bodyHtml = document.body ? document.body.innerHTML : '';
      const globalMatch = bodyHtml.match(/<span>\s*(\d+)\s*<\/span>\s*<span>\s*\/\s*<\/span>\s*<span>\s*\d+\s*<\/span>/i);
      if (globalMatch) {
        const current = parseInt(globalMatch[1], 10);
        if (!isNaN(current) && current >= 1 && current <= maxChallenges) {
          return current - 1;
        }
      }
    } catch (e) {}

    // Tier 2: Match currently active audio element src
    const audioEl = document.querySelector('audio');
    if (audioEl && challenges && challenges.length > 0) {
      const currentSrc = audioEl.currentSrc || audioEl.src || (audioEl.querySelector('source') ? audioEl.querySelector('source').src : '');
      if (currentSrc) {
        const cleanCurrent = currentSrc.split('?')[0].replace(/^https?:\/\/[^\/]+/, '');
        for (let i = 0; i < challenges.length; i++) {
          const chAudio = challenges[i].audioSrc;
          if (chAudio) {
            const cleanChAudio = chAudio.split('?')[0].replace(/^https?:\/\/[^\/]+/, '');
            if (cleanCurrent.endsWith(cleanChAudio) || cleanChAudio.endsWith(cleanCurrent) || currentSrc.includes(chAudio) || chAudio.includes(currentSrc)) {
              return i;
            }
          }
        }
      }
    }

    // Tier 3: Match active challenge button in #app-dictation UI
    const activeBtn = document.querySelector('#app-dictation .btn-primary, #app-dictation .active, #app-dictation [class*="active"], .pagination .active');
    if (activeBtn) {
      const num = parseInt(activeBtn.textContent.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= maxChallenges) {
        return num - 1;
      }
    }

    // Tier 4: Match URL query parameter (?challenge=N)
    try {
      const params = new URLSearchParams(window.location.search);
      const challengeNum = parseInt(params.get('challenge'), 10);
      if (!isNaN(challengeNum) && challengeNum >= 1 && challengeNum <= maxChallenges) {
        return challengeNum - 1;
      }
    } catch (e) {
      // ignore
    }

    return 0;
  }

  getCurrentSentence() {
    const challenges = this.getChallenges();
    const index = this.getCurrentChallengeIndex();
    if (challenges.length > 0 && index >= 0 && index < challenges.length) {
      return challenges[index];
    }
    return this.getTranscriptText();
  }

  toggleTranscriptPopover(container = this.actionsContainer, button = this.peekBtn) {
    if (this.isTranscriptPopoverOpen()) {
      this.closeTranscriptPopover();
    } else {
      this.openTranscriptPopover(container, button);
    }
  }

  openTranscriptPopover(container = this.actionsContainer, button = this.peekBtn) {
    this.closeTranscriptPopover();

    const challenges = this.getChallenges();
    const currentIndex = this.getCurrentChallengeIndex();
    const currentSentence = challenges[currentIndex] || this.getTranscriptText() || 'Transcript not found.';

    const popover = document.createElement('div');
    popover.className = 'dda-transcript-popover';

    popover.innerHTML = `
      <div class="dda-transcript-popover-header">
        <div class="dda-transcript-tabs-nav">
          <button class="dda-transcript-tab-btn active" data-tab="current">🎯 Current Sentence</button>
          <button class="dda-transcript-tab-btn" data-tab="full">📜 Full Transcript</button>
        </div>
        <button class="dda-popover-close-btn" title="Close (Esc)">✖</button>
      </div>
      <div class="dda-transcript-body">
        <div class="dda-tab-content-current">
          <div class="dda-current-sentence-box">
            <div class="dda-challenge-index-tag">Challenge #${currentIndex + 1}${challenges.length > 0 ? ` of ${challenges.length}` : ''}</div>
            <div>${currentSentence}</div>
          </div>
        </div>
        <div class="dda-tab-content-full" style="display: none;">
          <div class="dda-full-transcript-list">
            ${challenges.length > 0 ? challenges.map((sent, i) => `
              <div class="dda-sentence-item ${i === currentIndex ? 'active' : ''}">
                <span style="opacity: 0.5; font-size: 11px; margin-right: 6px;">#${i + 1}</span>
                ${i === currentIndex ? `<strong>${sent}</strong>` : sent}
              </div>
            `).join('') : `<div>${this.getTranscriptText()}</div>`}
          </div>
        </div>
      </div>
      <div class="dda-transcript-popover-footer">
        <span>💡 Use peek sparingly to maximize listening gains</span>
        <small>Press <strong>Esc</strong></small>
      </div>
    `;

    // Stop propagation inside popover
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Tab switching
    const tabBtns = popover.querySelectorAll('.dda-transcript-tab-btn');
    const currentContent = popover.querySelector('.dda-tab-content-current');
    const fullContent = popover.querySelector('.dda-tab-content-full');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (tab === 'current') {
          currentContent.style.display = 'block';
          fullContent.style.display = 'none';
        } else {
          currentContent.style.display = 'none';
          fullContent.style.display = 'block';
        }
      });
    });

    // Close button
    const closeBtn = popover.querySelector('.dda-popover-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeTranscriptPopover();
    });

    // Outside click
    this._transcriptOutsideHandler = (e) => {
      if (container && !container.contains(e.target)) {
        this.closeTranscriptPopover();
      }
    };
    document.addEventListener('click', this._transcriptOutsideHandler);

    // Esc key
    this._transcriptEscHandler = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        this.closeTranscriptPopover();
      }
    };
    document.addEventListener('keydown', this._transcriptEscHandler);

    container.appendChild(popover);
    this.transcriptPopoverElement = popover;
    return popover;
  }

  closeTranscriptPopover() {
    if (this.transcriptPopoverElement) {
      this.transcriptPopoverElement.remove();
      this.transcriptPopoverElement = null;
    }
    if (this._transcriptOutsideHandler) {
      document.removeEventListener('click', this._transcriptOutsideHandler);
      this._transcriptOutsideHandler = null;
    }
    if (this._transcriptEscHandler) {
      document.removeEventListener('keydown', this._transcriptEscHandler);
      this._transcriptEscHandler = null;
    }
  }

  isTranscriptPopoverOpen() {
    return Boolean(this.transcriptPopoverElement && document.body.contains(this.transcriptPopoverElement));
  }

  getTranscriptText() {
    // Strategy 1: Look for JSON-LD schema (DailyDictation Quiz LD+JSON)
    try {
      const ldJsonEl = document.querySelector('script[type="application/ld+json"]');
      if (ldJsonEl && ldJsonEl.textContent) {
        const data = JSON.parse(ldJsonEl.textContent);
        if (data && data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
          return data.text.trim();
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }

    // Strategy 2: Look for Accordion transcript items (all challenges)
    const challengeItems = document.querySelectorAll('#transcriptAccordionItem [title^="Challenge"], #transcriptAccordion [title^="Challenge"]');
    if (challengeItems.length > 0) {
      const texts = Array.from(challengeItems).map(el => el.textContent.trim()).filter(Boolean);
      if (texts.length > 0) {
        return texts.join('\n');
      }
    }

    // Strategy 3: Transcript accordion body
    const accordionBody = document.querySelector('#transcriptAccordionItem .accordion-body, #app-transcript');
    if (accordionBody && accordionBody.textContent) {
      const text = accordionBody.textContent.trim();
      if (text.length > 0) {
        return text;
      }
    }

    // Strategy 4: Safe selectors (removed unsafe .text-success)
    const safeSelectors = ['#dictation-text', '.transcript', '.text-to-dictate', '#answer', '#sentences-list'];
    for (let s of safeSelectors) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim().length > 0) {
        return el.textContent.trim();
      }
    }

    return '';
  }
}
window.DeepLearningLoop = new DeepLearningLoop();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeepLearningLoop;
}
