const DeepLearningLoop = require('../scripts/deep-learning.js');
const DiffEngine = require('../scripts/diff-engine.js');
window.DiffEngine = DiffEngine;

describe('DeepLearningLoop - getTranscriptText', () => {
  let loop;

  beforeEach(() => {
    document.body.innerHTML = '';
    loop = new DeepLearningLoop();
  });

  test('extracts transcript from application/ld+json script tag', () => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@type': 'Quiz',
      name: '1. First snowfall',
      text: 'Today is November 26th.\nIt snowed all day today.'
    });
    document.body.appendChild(script);

    const text = loop.getTranscriptText();
    expect(text).toContain('Today is November 26th.');
    expect(text).toContain('It snowed all day today.');
  });

  test('ignores text-success promo banner and extracts from challenge accordion items', () => {
    // Add promo banner
    const banner = document.createElement('strong');
    banner.className = 'text-success me-2 text-center';
    banner.textContent = '🔥🔥🔥 Download app';
    document.body.appendChild(banner);

    // Add challenge accordion
    const accordion = document.createElement('div');
    accordion.id = 'transcriptAccordionItem';
    accordion.innerHTML = `
      <div class="accordion-body">
        <div title="Challenge #1">Today is November 26th.</div>
        <div title="Challenge #2">It snowed all day today.</div>
      </div>
    `;
    document.body.appendChild(accordion);

    const text = loop.getTranscriptText();
    expect(text).not.toContain('Download app');
    expect(text).toContain('Today is November 26th.');
    expect(text).toContain('It snowed all day today.');
  });

  test('falls back to safe selectors when no LD+JSON or accordion is present', () => {
    const dictationText = document.createElement('div');
    dictationText.id = 'dictation-text';
    dictationText.textContent = 'The snow finally stopped.';
    document.body.appendChild(dictationText);

    const text = loop.getTranscriptText();
    expect(text).toBe('The snow finally stopped.');
  });
});

describe('DeepLearningLoop - Progressive Peek & Transcript Popover', () => {
  let loop;
  let textarea;

  beforeEach(() => {
    document.body.innerHTML = '';
    loop = new DeepLearningLoop();
    
    // Add LD+JSON transcript
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@type': 'Quiz',
      name: 'Test',
      text: 'Sentence 1.\nSentence 2.\nSentence 3.'
    });
    document.body.appendChild(script);

    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    loop.renderActions(textarea);
  });

  afterEach(() => {
    loop.closeTranscriptPopover();
    document.body.innerHTML = '';
  });

  test('renders unified toolbar containing vocab slot and peek button in the same container', () => {
    const container = document.querySelector('.dda-actions-container');
    expect(container).not.toBeNull();
    
    const vocabSlot = container.querySelector('.dda-vocab-slot');
    expect(vocabSlot).not.toBeNull();

    const peekBtn = container.querySelector('.dda-btn-peek');
    expect(peekBtn).not.toBeNull();
    expect(peekBtn).toBe(loop.peekBtn);
  });

  test('starts at subtle level, transitions to warning after 3 errors, fire after 6 errors, and resets for new challenge', () => {
    expect(loop.getPeekLevel()).toBe('subtle');
    expect(loop.peekBtn.classList.contains('dda-level-subtle')).toBe(true);
    expect(loop.peekBtn.textContent).toContain('Peek Transcript');
    expect(loop.peekBtn.querySelector('svg')).not.toBeNull();
    expect(loop.peekBtn.title.length).toBeGreaterThan(0);
    let bar = loop.peekBtn.querySelector('.dda-peek-progress-bar');
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('0%');

    // Simulate 3 wrong checks on challenge 0
    loop.wrongAttemptsByChallenge[0] = 3;
    loop.updatePeekButton();
    expect(loop.getPeekLevel(0)).toBe('warning');
    expect(loop.peekBtn.classList.contains('dda-level-warning')).toBe(true);
    expect(loop.peekBtn.textContent).toContain('Peek Hint');
    expect(loop.peekBtn.querySelector('svg')).not.toBeNull();
    expect(loop.peekBtn.textContent).not.toContain('(3/6)');
    expect(loop.peekBtn.title.length).toBeGreaterThan(0);
    bar = loop.peekBtn.querySelector('.dda-peek-progress-bar');
    expect(bar.style.width).toBe('50%');

    // Simulate 6 wrong checks on challenge 0
    loop.wrongAttemptsByChallenge[0] = 6;
    loop.updatePeekButton();
    expect(loop.getPeekLevel(0)).toBe('fire');
    expect(loop.peekBtn.classList.contains('dda-level-fire')).toBe(true);
    expect(loop.peekBtn.textContent).toContain('Peek Rescue');
    expect(loop.peekBtn.querySelector('svg')).not.toBeNull();
    expect(loop.peekBtn.textContent).not.toContain('(6/6)');
    expect(loop.peekBtn.title.length).toBeGreaterThan(0);
    bar = loop.peekBtn.querySelector('.dda-peek-progress-bar');
    expect(bar.style.width).toBe('100%');

    // Check challenge 1 (should be subtle level / 0 attempts)
    expect(loop.getPeekLevel(1)).toBe('subtle');
  });

  test('opens dual-mode transcript popover on click with current and full tabs', () => {
    loop.peekBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);

    const popover = document.querySelector('.dda-transcript-popover');
    expect(popover).not.toBeNull();

    // Check Current tab content
    const currentBox = popover.querySelector('.dda-current-sentence-box');
    expect(currentBox.textContent).toContain('Sentence 1.');

    // Switch to Full tab
    const fullTabBtn = popover.querySelector('.dda-transcript-tab-btn[data-tab="full"]');
    fullTabBtn.click();

    const fullList = popover.querySelector('.dda-full-transcript-list');
    expect(fullList.textContent).toContain('Sentence 1.');
    expect(fullList.textContent).toContain('Sentence 2.');
    expect(fullList.textContent).toContain('Sentence 3.');

    // Verify active sentence is bolded
    const activeItem = fullList.querySelector('.dda-sentence-item.active strong');
    expect(activeItem).not.toBeNull();
    expect(activeItem.textContent).toBe('Sentence 1.');
  });

  test('closes transcript popover on close button, outside click, or Esc key', () => {
    loop.peekBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);

    const closeBtn = document.querySelector('.dda-popover-close-btn');
    closeBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(false);

    // Test Esc key
    loop.peekBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    expect(loop.isTranscriptPopoverOpen()).toBe(false);
  });

  test('renders zen sentence stream with blurred words and allows click-to-reveal', () => {
    // Current sentence is "Sentence 1."
    textarea.value = 'Sentence';
    loop.peekBtn.click();

    const popover = document.querySelector('.dda-transcript-popover');
    expect(popover).not.toBeNull();

    // Check words in stream
    const words = popover.querySelectorAll('.dda-zen-word');
    expect(words.length).toBe(2);
    expect(words[0].classList.contains('dda-word-correct')).toBe(true);
    expect(words[0].textContent).toBe('Sentence');
    expect(words[1].classList.contains('dda-word-hidden')).toBe(true);

    // Click hidden blurred word to reveal
    words[1].click();
    const updatedWords = popover.querySelectorAll('.dda-zen-word');
    expect(updatedWords[1].classList.contains('dda-word-revealed')).toBe(true);
    expect(updatedWords[1].textContent).toBe('1.');
  });

  test('supports pinning popover so it remains open on outside clicks', () => {
    loop.peekBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);

    const pinBtn = document.querySelector('.dda-popover-pin-btn');
    expect(pinBtn).not.toBeNull();
    expect(loop.isTranscriptPinned).toBe(false);

    // Pin the popover
    pinBtn.click();
    expect(loop.isTranscriptPinned).toBe(true);
    expect(pinBtn.classList.contains('active')).toBe(true);

    // Click outside -> should NOT close because it is pinned
    document.body.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);

    // Unpin
    pinBtn.click();
    expect(loop.isTranscriptPinned).toBe(false);
    expect(pinBtn.classList.contains('active')).toBe(false);

    // Click outside -> should close now
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(loop.isTranscriptPopoverOpen()).toBe(false);
  });

  test('supports dragging popover by its header handle', () => {
    loop.peekBtn.click();
    const popover = document.querySelector('.dda-transcript-popover');
    const header = popover.querySelector('.dda-transcript-popover-header');

    // Simulate drag start
    header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 }));
    expect(header.classList.contains('dda-dragging')).toBe(true);

    // Simulate drag move
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 180 }));
    expect(popover.style.left).toBeDefined();

    // Simulate drag end
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 150, clientY: 180 }));
    expect(header.classList.contains('dda-dragging')).toBe(false);
    expect(loop.customPopoverCoords).not.toBeNull();
  });

  test('scrolls to active sentence when full tab is selected', (done) => {
    loop.peekBtn.click();
    const popover = document.querySelector('.dda-transcript-popover');
    const fullTabBtn = popover.querySelector('.dda-transcript-tab-btn[data-tab="full"]');

    const activeItem = popover.querySelector('.dda-full-transcript-list .dda-sentence-item.active');
    activeItem.scrollIntoView = jest.fn();

    fullTabBtn.click();

    setTimeout(() => {
      expect(activeItem.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
      done();
    }, 60);
  });

  test('synchronizes sentence words in real-time as user types into textarea', () => {
    // Start with empty input and open popover
    textarea.value = '';
    loop.peekBtn.click();

    const popover = document.querySelector('.dda-transcript-popover');
    expect(popover).not.toBeNull();

    let words = popover.querySelectorAll('.dda-zen-word');
    expect(words[0].classList.contains('dda-word-hidden')).toBe(true);
    expect(words[1].classList.contains('dda-word-hidden')).toBe(true);

    // User types "Sentence" into textarea
    textarea.value = 'Sentence';
    textarea.dispatchEvent(new Event('input'));

    words = popover.querySelectorAll('.dda-zen-word');
    expect(words[0].classList.contains('dda-word-correct')).toBe(true);
    expect(words[0].textContent).toBe('Sentence');
    expect(words[1].classList.contains('dda-word-hidden')).toBe(true);

    // User types full sentence "Sentence 1."
    textarea.value = 'Sentence 1.';
    textarea.dispatchEvent(new Event('input'));

    words = popover.querySelectorAll('.dda-zen-word');
    expect(words[0].classList.contains('dda-word-correct')).toBe(true);
    expect(words[1].classList.contains('dda-word-correct')).toBe(true);
  });
});

describe('DeepLearningLoop - Real-time Challenge & Active Audio Detection', () => {
  let loop;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.DiffEngine = DiffEngine;
    loop = new DeepLearningLoop();
  });

  test('extracts challenges accurately from window.appGlobals in script tag', () => {
    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "lessonId": 1,
        "challenges": [
          { "id": 1, "position": 1, "content": "Today is November 26th.", "audioSrc": "https://dailydictation.com/upload/1.mp3" },
          { "id": 2, "position": 2, "content": "It snowed all day today.", "audioSrc": "https://dailydictation.com/upload/2.mp3" },
          { "id": 3, "position": 3, "content": "The snow is beautiful.", "audioSrc": "https://dailydictation.com/upload/3.mp3" }
        ]
      };
    `;
    document.body.appendChild(script);

    const challenges = loop.getChallenges();
    expect(challenges.length).toBe(3);
    expect(challenges[0]).toBe('Today is November 26th.');
    expect(challenges[1]).toBe('It snowed all day today.');
    expect(challenges[2]).toBe('The snow is beautiful.');
  });

  test('detects active challenge index in real-time from audio src', () => {
    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "challenges": [
          { "position": 1, "content": "Sentence 1.", "audioSrc": "https://dailydictation.com/upload/1.mp3" },
          { "position": 2, "content": "Sentence 2.", "audioSrc": "https://dailydictation.com/upload/2.mp3" },
          { "position": 3, "content": "Sentence 3.", "audioSrc": "https://dailydictation.com/upload/3.mp3" }
        ]
      };
    `;
    document.body.appendChild(script);

    const audio = document.createElement('audio');
    audio.src = 'https://dailydictation.com/upload/2.mp3';
    document.body.appendChild(audio);

    expect(loop.getCurrentChallengeIndex()).toBe(1);
    expect(loop.getCurrentSentence()).toBe('Sentence 2.');

    // Switch audio to challenge 3
    audio.src = 'https://dailydictation.com/upload/3.mp3';
    expect(loop.getCurrentChallengeIndex()).toBe(2);
    expect(loop.getCurrentSentence()).toBe('Sentence 3.');
  });

  test('detects active challenge index from active UI button in #app-dictation', () => {
    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "challenges": [
          { "position": 1, "content": "Sentence 1." },
          { "position": 2, "content": "Sentence 2." },
          { "position": 3, "content": "Sentence 3." }
        ]
      };
    `;
    document.body.appendChild(script);

    const appDictation = document.createElement('div');
    appDictation.id = 'app-dictation';
    appDictation.innerHTML = `
      <button class="btn btn-outline-secondary">1</button>
      <button class="btn btn-primary active">2</button>
      <button class="btn btn-outline-secondary">3</button>
    `;
    document.body.appendChild(appDictation);

    expect(loop.getCurrentChallengeIndex()).toBe(1);
    expect(loop.getCurrentSentence()).toBe('Sentence 2.');
  });

  test('detects active challenge index from React Aria dropdown pagination HTML (e.g. 4 / 21)', () => {
    const challengesList = Array.from({ length: 21 }, (_, i) => ({
      position: i + 1,
      content: 'Sentence ' + (i + 1) + '.'
    }));
    const script = document.createElement('script');
    script.textContent = `window.appGlobals = ${JSON.stringify({ challenges: challengesList })};`;
    document.body.appendChild(script);

    // Exact snippet provided by user
    const paginationContainer = document.createElement('div');
    paginationContainer.innerHTML = `
      <div class="d-flex align-items-center">
        <button id="btn-arrow-left" class="btn btn-sm border-0" style="font-size: 1rem;"><i class="bi bi-lg bi-arrow-left"></i></button>
        <div class="mx-1 d-flex align-items-center">
          <div class="dropdown">
            <button type="button" id="react-aria1353435570-1" aria-expanded="false" class="border-0 px-0 text-nowrap none btn btn-none">
              <span>4</span><span> / </span><span>21</span>
            </button>
          </div>
        </div>
        <button id="btn-arrow-right" class="btn btn-sm border-0" style="font-size: 1rem;"><i class="bi bi-arrow-right"></i></button>
      </div>
    `;
    document.body.appendChild(paginationContainer);

    expect(loop.getCurrentChallengeIndex()).toBe(3); // 4th sentence -> index 3
    expect(loop.getCurrentSentence()).toBe('Sentence 4.');
  });

  test('handleUserSubmission only counts wrong attempts when user submits non-empty incorrect text', () => {
    const script = document.createElement('script');
    script.textContent = `window.appGlobals = ${JSON.stringify({ challenges: [{ position: 1, content: 'Hello world.' }] })};`;
    document.body.appendChild(script);

    // Empty strings should return null and not increment
    expect(loop.handleUserSubmission('')).toBeNull();
    expect(loop.handleUserSubmission('   ')).toBeNull();
    expect(loop.getWrongAttemptsCount(0)).toBe(0);

    // Mock DiffEngine
    window.DiffEngine = {
      compare: (truth, user) => truth.trim() === user.trim() ? [] : [{ type: 'wrong', word: 'x' }]
    };

    // Submitting wrong text increments wrong attempts
    const result1 = loop.handleUserSubmission('wrong answer');
    expect(result1).not.toBeNull();
    expect(result1.isCorrect).toBe(false);
    expect(loop.getWrongAttemptsCount(0)).toBe(1);

    // Submitting correct text resets wrong attempts
    const truth = loop.getCurrentSentence();
    const result2 = loop.handleUserSubmission(truth);
    expect(result2).not.toBeNull();
    expect(result2.isCorrect).toBe(true);
    expect(loop.getWrongAttemptsCount(0)).toBe(0);
  });

  test('automatically updates open popover content when challenge changes', () => {
    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "challenges": [
          { "position": 1, "content": "Sentence 1.", "audioSrc": "https://dailydictation.com/upload/1.mp3" },
          { "position": 2, "content": "Sentence 2.", "audioSrc": "https://dailydictation.com/upload/2.mp3" }
        ]
      };
    `;
    document.body.appendChild(script);

    const audio = document.createElement('audio');
    audio.src = 'https://dailydictation.com/upload/1.mp3';
    document.body.appendChild(audio);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    loop.renderActions(textarea);

    // Open popover for challenge 1
    loop.peekBtn.click();
    expect(loop.isTranscriptPopoverOpen()).toBe(true);
    let titleEl = document.querySelector('.dda-popover-title');
    expect(titleEl.textContent).toContain('Sentence #1');

    // Simulate audio changing to challenge 2
    audio.src = 'https://dailydictation.com/upload/2.mp3';
    loop.checkCurrentChallengeChange();

    titleEl = document.querySelector('.dda-popover-title');
    expect(titleEl.textContent).toContain('Sentence #2');
    const words = document.querySelectorAll('.dda-zen-word');
    expect(words[0].textContent).toBe('Sentence');
    expect(words[1].textContent).toBe('2.');
  });

  test('clears WhatIfSound text and syncs audio speed on challenge change', () => {
    window.WhatIfSound = {
      isPlaying: true,
      stop: jest.fn(),
      clearText: jest.fn()
    };
    window.ddaAudioControl = {
      syncPlaybackRate: jest.fn()
    };

    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "challenges": [
          { "position": 1, "content": "Sentence 1.", "audioSrc": "https://dailydictation.com/upload/1.mp3" },
          { "position": 2, "content": "Sentence 2.", "audioSrc": "https://dailydictation.com/upload/2.mp3" }
        ]
      };
    `;
    document.body.appendChild(script);

    const audio = document.createElement('audio');
    audio.src = 'https://dailydictation.com/upload/1.mp3';
    document.body.appendChild(audio);

    loop.checkCurrentChallengeChange();

    audio.src = 'https://dailydictation.com/upload/2.mp3';
    loop.checkCurrentChallengeChange();

    expect(window.WhatIfSound.stop).toHaveBeenCalled();
    expect(window.WhatIfSound.clearText).toHaveBeenCalledWith(false);
    expect(window.ddaAudioControl.syncPlaybackRate).toHaveBeenCalled();

    delete window.WhatIfSound;
    delete window.ddaAudioControl;
  });
});

describe('DeepLearningLoop - Full Conversation Audio Player', () => {
  let loop;
  let textarea;

  beforeEach(() => {
    document.body.innerHTML = '';
    loop = new DeepLearningLoop();

    // Mock HTMLMediaElement play/pause
    window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = jest.fn();

    const script = document.createElement('script');
    script.textContent = `
      window.appGlobals = {
        "audioSrc": "https://dailydictation.com/upload/full-conversation.mp3",
        "challenges": [
          { "position": 1, "content": "Sentence 1.", "audioSrc": "https://dailydictation.com/upload/1.mp3", "timeStart": 0, "timeEnd": 5 },
          { "position": 2, "content": "Sentence 2.", "audioSrc": "https://dailydictation.com/upload/2.mp3", "timeStart": 5, "timeEnd": 10 }
        ]
      };
    `;
    document.body.appendChild(script);

    textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    loop.renderActions(textarea);
  });

  afterEach(() => {
    loop.closeTranscriptPopover();
    loop.cleanupFullAudio();
    document.body.innerHTML = '';
  });

  test('extracts full audio source from appGlobals', () => {
    const src = loop.getFullAudioSrc();
    expect(src).toBe('https://dailydictation.com/upload/full-conversation.mp3');
  });

  test('renders full audio play button next to tabs in popover', () => {
    loop.openTranscriptPopover();
    const popover = loop.transcriptPopoverElement;
    expect(popover).not.toBeNull();

    const fullAudioBtn = popover.querySelector('.dda-full-audio-btn');
    expect(fullAudioBtn).not.toBeNull();
    expect(fullAudioBtn.title).toBe('Play Full Audio');
  });

  test('toggles full audio play and pause on button click', async () => {
    loop.openTranscriptPopover();
    const fullAudioBtn = loop.transcriptPopoverElement.querySelector('.dda-full-audio-btn');
    expect(fullAudioBtn).not.toBeNull();

    // Click play
    fullAudioBtn.click();
    expect(loop.isFullAudioPlaying).toBe(true);
    expect(fullAudioBtn.classList.contains('playing')).toBe(true);
    expect(fullAudioBtn.title).toBe('Pause Full Audio');

    // Click pause
    fullAudioBtn.click();
    expect(loop.isFullAudioPlaying).toBe(false);
    expect(fullAudioBtn.classList.contains('playing')).toBe(false);
    expect(fullAudioBtn.title).toBe('Play Full Audio');
  });

  test('pauses page audio when full audio plays', () => {
    const pageAudio = document.createElement('audio');
    Object.defineProperty(pageAudio, 'paused', { value: false, configurable: true });
    pageAudio.pause = jest.fn();
    document.body.appendChild(pageAudio);

    loop.openTranscriptPopover();
    const fullAudioBtn = loop.transcriptPopoverElement.querySelector('.dda-full-audio-btn');
    fullAudioBtn.click();

    expect(pageAudio.pause).toHaveBeenCalled();
  });

  test('pauses full audio when popover is closed', () => {
    loop.openTranscriptPopover();
    const fullAudioBtn = loop.transcriptPopoverElement.querySelector('.dda-full-audio-btn');
    fullAudioBtn.click();
    expect(loop.isFullAudioPlaying).toBe(true);

    loop.closeTranscriptPopover();
    expect(loop.isFullAudioPlaying).toBe(false);
  });

  test('highlights active speaking sentence during full audio playback timeupdate', () => {
    loop.openTranscriptPopover();
    const items = loop.transcriptPopoverElement.querySelectorAll('.dda-sentence-item');
    expect(items.length).toBe(2);

    // Simulate playback at time = 2.5s (within Challenge 1: 0 - 5s)
    loop.handleFullAudioTimeUpdate(2.5);
    expect(items[0].classList.contains('dda-playing-item')).toBe(true);
    expect(items[1].classList.contains('dda-playing-item')).toBe(false);

    // Simulate playback at time = 7.0s (within Challenge 2: 5 - 10s)
    loop.handleFullAudioTimeUpdate(7.0);
    expect(items[0].classList.contains('dda-playing-item')).toBe(false);
    expect(items[1].classList.contains('dda-playing-item')).toBe(true);

    // Clear highlights on pause
    loop.clearPlayingSentenceHighlight();
    expect(items[0].classList.contains('dda-playing-item')).toBe(false);
    expect(items[1].classList.contains('dda-playing-item')).toBe(false);
  });

  test('renders inline play/pause icon button inside Full transcript tab link on page', () => {
    // Setup DailyDictation nav-tabs structure
    const navTabs = document.createElement('ul');
    navTabs.className = 'nav nav-tabs';
    navTabs.innerHTML = `
      <li class="nav-item js-tab" data-target-id="app-dictation-container">
        <a class="nav-link text-muted active" href="#">Dictation</a>
      </li>
      <li class="nav-item js-tab" data-target-id="app-transcript">
        <a class="nav-link text-muted" href="#">Full transcript</a>
      </li>
    `;
    document.body.appendChild(navTabs);

    loop.renderNavTabFullAudioButton();

    const inlineBtn = document.querySelector('.dda-tab-inline-audio-btn');
    expect(inlineBtn).not.toBeNull();
    expect(inlineBtn.title).toBe('Play Full Audio');

    const transcriptLink = document.querySelector('.nav-item.js-tab[data-target-id="app-transcript"] a');
    expect(transcriptLink.contains(inlineBtn)).toBe(true);

    // Click inline button to play
    inlineBtn.click();
    expect(loop.isFullAudioPlaying).toBe(true);
    expect(inlineBtn.classList.contains('playing')).toBe(true);
    expect(inlineBtn.title).toBe('Pause Full Audio');

    // Click again to pause
    inlineBtn.click();
    expect(loop.isFullAudioPlaying).toBe(false);
    expect(inlineBtn.classList.contains('playing')).toBe(false);
    expect(inlineBtn.title).toBe('Play Full Audio');
  });
});


