const DeepLearningLoop = require('../scripts/deep-learning.js');

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
    let bar = loop.peekBtn.querySelector('.dda-peek-progress-bar');
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('0%');

    // Simulate 3 wrong checks on challenge 0
    loop.wrongAttemptsByChallenge[0] = 3;
    loop.updatePeekButton();
    expect(loop.getPeekLevel(0)).toBe('warning');
    expect(loop.peekBtn.classList.contains('dda-level-warning')).toBe(true);
    bar = loop.peekBtn.querySelector('.dda-peek-progress-bar');
    expect(bar.style.width).toBe('50%');

    // Simulate 6 wrong checks on challenge 0
    loop.wrongAttemptsByChallenge[0] = 6;
    loop.updatePeekButton();
    expect(loop.getPeekLevel(0)).toBe('fire');
    expect(loop.peekBtn.classList.contains('dda-level-fire')).toBe(true);
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
});

describe('DeepLearningLoop - Real-time Challenge & Active Audio Detection', () => {
  let loop;

  beforeEach(() => {
    document.body.innerHTML = '';
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
});
