/**
 * Unit tests for WhatIfSound Component
 */

const { WhatIfSound } = require('../scripts/what-if-sound.js');

describe('WhatIfSound Component', () => {
  let whatIf;
  let container;
  let originalChrome;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock chrome extension APIs
    originalChrome = global.chrome;
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((msg, cb) => {
          if (cb) cb({ success: true, status: 'speaking' });
        }),
        onMessage: {
          addListener: jest.fn()
        },
        lastError: null
      }
    };

    whatIf = new WhatIfSound();
  });

  afterEach(() => {
    global.chrome = originalChrome;
  });

  test('should instantiate with default properties', () => {
    expect(whatIf.isPlaying).toBe(false);
    expect(whatIf.containerEl).toBeNull();
    expect(whatIf.inputEl).toBeNull();
    expect(whatIf.speakBtn).toBeNull();
  });

  test('should render DOM structure into target container', () => {
    const el = whatIf.render(container);
    expect(el).not.toBeNull();
    expect(container.querySelector('.dda-what-if-sound-container')).toBe(el);

    const input = el.querySelector('.dda-what-if-input');
    const speakBtn = el.querySelector('.dda-what-if-btn-speak');
    const clearBtn = el.querySelector('.dda-what-if-btn-clear');
    const title = el.querySelector('.dda-what-if-title');

    expect(input).not.toBeNull();
    expect(speakBtn).not.toBeNull();
    expect(clearBtn).not.toBeNull();
    expect(title.textContent).toContain('What If Sound?');
    expect(input.placeholder).toContain('Enter to speak');
  });

  test('should avoid duplicate renders in the same container', () => {
    const el1 = whatIf.render(container);
    const el2 = whatIf.render(container);
    expect(el1).toBe(el2);
    expect(container.querySelectorAll('.dda-what-if-sound-container').length).toBe(1);
  });

  test('should insert before reference element when insertBeforeEl is provided', () => {
    const sibling1 = document.createElement('div');
    const sibling2 = document.createElement('textarea');
    container.appendChild(sibling1);
    container.appendChild(sibling2);

    const el = whatIf.render(container, sibling2);
    expect(container.children[0]).toBe(sibling1);
    expect(container.children[1]).toBe(el);
    expect(container.children[2]).toBe(sibling2);
  });

  test('should toggle clear button visibility on input change', () => {
    whatIf.render(container);
    expect(whatIf.clearBtn.style.display).toBe('none');

    whatIf.setText('check your');
    expect(whatIf.clearBtn.style.display).toBe('inline-flex');

    whatIf.clearText();
    expect(whatIf.inputEl.value).toBe('');
    expect(whatIf.clearBtn.style.display).toBe('none');
  });

  test('should send chrome.runtime message when speak is called with valid text', () => {
    whatIf.render(container);
    whatIf.setText('Have you check your email?');

    whatIf.toggleSpeak();

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'tts_speak',
        text: 'Have you check your email?',
        lang: 'en-US',
        rate: 1.0
      }),
      expect.any(Function)
    );
    expect(whatIf.isPlaying).toBe(true);
    expect(whatIf.speakBtn.classList.contains('dda-playing')).toBe(true);
    expect(whatIf.speakBtn.textContent).toContain('Stop');
  });

  test('should not speak when input is empty', () => {
    whatIf.render(container);
    whatIf.setText('   ');

    whatIf.toggleSpeak();

    expect(global.chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(whatIf.isPlaying).toBe(false);
  });

  test('should stop speaking when toggleSpeak is called while playing', () => {
    whatIf.render(container);
    whatIf.setText('test audio');

    whatIf.toggleSpeak();
    expect(whatIf.isPlaying).toBe(true);

    whatIf.toggleSpeak();
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tts_stop' })
    );
    expect(whatIf.isPlaying).toBe(false);
    expect(whatIf.speakBtn.classList.contains('dda-playing')).toBe(false);
    expect(whatIf.speakBtn.textContent).toContain('Speak');
  });

  test('should pause native audio if playing when speak is called', () => {
    const audio = document.createElement('audio');
    audio.pause = jest.fn();
    Object.defineProperty(audio, 'paused', { value: false, writable: true });
    document.body.appendChild(audio);

    whatIf.render(container);
    whatIf.speak('check');

    expect(audio.pause).toHaveBeenCalled();
  });

  test('should handle Enter key to trigger speak and Escape key to clear', () => {
    whatIf.render(container);
    whatIf.setText('checked email');

    // Trigger Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    whatIf.inputEl.dispatchEvent(enterEvent);

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tts_speak', text: 'checked email' }),
      expect.any(Function)
    );

    // Trigger Escape key
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    whatIf.inputEl.dispatchEvent(escEvent);

    expect(whatIf.inputEl.value).toBe('');
  });

  test('should clear text and stop playback when clearText(false) is invoked on sentence change', () => {
    whatIf.render(container);
    whatIf.setText('pronounce this');
    whatIf.isPlaying = true;
    const focusSpy = jest.spyOn(whatIf.inputEl, 'focus');

    whatIf.clearText(false);

    expect(whatIf.inputEl.value).toBe('');
    expect(whatIf.isPlaying).toBe(false);
    expect(focusSpy).not.toHaveBeenCalled();
  });
});

