const AudioControl = require('../scripts/audio-control.js');

describe('AudioControl', () => {
  let audioCtrl;
  let audioEl;
  let containerEl;
  let storageMock;

  beforeEach(() => {
    document.body.innerHTML = '';
    storageMock = {};
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => {
            const res = {};
            keys.forEach(k => {
              if (storageMock[k] !== undefined) res[k] = storageMock[k];
            });
            cb(res);
          }),
          set: jest.fn((obj, cb) => {
            Object.assign(storageMock, obj);
            if (cb) cb();
          })
        }
      }
    };

    containerEl = document.createElement('div');
    audioEl = document.createElement('audio');
    containerEl.appendChild(audioEl);
    document.body.appendChild(containerEl);

    audioCtrl = new AudioControl();
  });

  afterEach(() => {
    if (audioCtrl) {
      audioCtrl.destroy();
    }
    document.body.innerHTML = '';
    delete global.chrome;
  });

  test('initializes and injects trigger pill and popover into the DOM', () => {
    const initialized = audioCtrl.init();
    expect(initialized).toBe(true);

    const pill = document.querySelector('.dda-speed-pill');
    expect(pill).not.toBeNull();
    expect(pill.textContent).toContain('1.0x');
    expect(pill.textContent).toContain('⚡');

    const popover = document.querySelector('.dda-speed-popover');
    expect(popover).not.toBeNull();
    expect(popover.style.display).toBe('none');
  });

  test('toggles popover visibility when clicking the trigger pill', () => {
    audioCtrl.init();
    const pill = document.querySelector('.dda-speed-pill');
    const popover = document.querySelector('.dda-speed-popover');

    // Click to open
    pill.click();
    expect(popover.style.display).toBe('block');
    expect(audioCtrl.isOpen).toBe(true);

    // Click to close
    pill.click();
    expect(popover.style.display).toBe('none');
    expect(audioCtrl.isOpen).toBe(false);
  });

  test('closes popover on click outside', () => {
    audioCtrl.init();
    const pill = document.querySelector('.dda-speed-pill');
    const popover = document.querySelector('.dda-speed-popover');

    pill.click();
    expect(popover.style.display).toBe('block');

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.click();

    expect(popover.style.display).toBe('none');
    expect(audioCtrl.isOpen).toBe(false);
  });

  test('closes popover on Escape key press', () => {
    audioCtrl.init();
    const pill = document.querySelector('.dda-speed-pill');
    const popover = document.querySelector('.dda-speed-popover');

    pill.click();
    expect(popover.style.display).toBe('block');

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' });
    document.dispatchEvent(escapeEvent);

    expect(popover.style.display).toBe('none');
    expect(audioCtrl.isOpen).toBe(false);
  });

  test('changes speed and highlights preset when a quick preset button is clicked', () => {
    audioCtrl.init();
    const presetBtns = document.querySelectorAll('.dda-speed-preset-btn');
    expect(presetBtns.length).toBe(6);

    // Find and click '0.75x' preset button
    const btn075 = Array.from(presetBtns).find(btn => btn.textContent.includes('0.75x'));
    expect(btn075).not.toBeNull();
    btn075.click();

    expect(audioEl.playbackRate).toBe(0.75);
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ playbackSpeed: 0.75 }));
    expect(btn075.classList.contains('dda-preset-active')).toBe(true);

    const pill = document.querySelector('.dda-speed-pill');
    expect(pill.textContent).toContain('0.75x');
    expect(pill.classList.contains('dda-speed-active')).toBe(true);
  });

  test('resets speed to 1.0x on reset button click and double click on pill', () => {
    audioCtrl.init();
    audioCtrl.setSpeed(1.25);
    expect(audioEl.playbackRate).toBe(1.25);

    const resetBtn = document.querySelector('.dda-speed-reset-btn');
    resetBtn.click();
    expect(audioEl.playbackRate).toBe(1.0);

    // Test double-click on pill
    audioCtrl.setSpeed(1.5);
    expect(audioEl.playbackRate).toBe(1.5);

    const pill = document.querySelector('.dda-speed-pill');
    pill.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(audioEl.playbackRate).toBe(1.0);
  });

  test('updates speed when fine-tuning slider moves', () => {
    audioCtrl.init();
    const slider = document.querySelector('.dda-speed-slider-input');
    const display = document.querySelector('.dda-speed-slider-current');

    slider.value = '1.15';
    slider.dispatchEvent(new Event('input'));

    expect(audioEl.playbackRate).toBe(1.15);
    expect(display.textContent).toBe('1.15x');

    slider.dispatchEvent(new Event('change'));
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({ playbackSpeed: 1.15 }));
  });

  test('renders visual preset slider slots in the custom presets panel', () => {
    audioCtrl.init();
    const toggle = document.querySelector('.dda-speed-config-toggle');
    const configPanel = document.querySelector('.dda-speed-config-panel');

    // Toggle open
    toggle.click();
    expect(configPanel.style.display).toBe('block');

    const slotRows = configPanel.querySelectorAll('.dda-preset-slot-row');
    expect(slotRows.length).toBe(6);

    const firstBadge = slotRows[0].querySelector('.dda-preset-slot-badge');
    expect(firstBadge.textContent).toBe('0.75x');
  });

  test('adjusts preset value via preset slot slider and auto-syncs to grid and storage', () => {
    audioCtrl.init();
    const toggle = document.querySelector('.dda-speed-config-toggle');
    toggle.click();

    const slotRows = document.querySelectorAll('.dda-preset-slot-row');
    const firstSlider = slotRows[0].querySelector('.dda-preset-slot-slider');
    const firstBadge = slotRows[0].querySelector('.dda-preset-slot-badge');

    // Drag slider from 0.75 to 0.60
    firstSlider.value = '0.6';
    firstSlider.dispatchEvent(new Event('input'));

    expect(firstBadge.textContent).toBe('0.6x');
    expect(audioCtrl.presets[0]).toBe(0.6);

    // Commit change
    firstSlider.dispatchEvent(new Event('change'));
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(expect.objectContaining({
      speedPresets: expect.arrayContaining([0.6])
    }));
  });

  test('adds a new preset slot when + Add Preset is clicked', () => {
    audioCtrl.init();
    const toggle = document.querySelector('.dda-speed-config-toggle');
    toggle.click();

    const addBtn = document.querySelector('.dda-btn-add-preset');
    addBtn.click();

    expect(audioCtrl.presets.length).toBe(7);
    const slotRows = document.querySelectorAll('.dda-preset-slot-row');
    expect(slotRows.length).toBe(7);
    const presetBtns = document.querySelectorAll('.dda-speed-preset-btn');
    expect(presetBtns.length).toBe(7);
  });

  test('removes a preset slot when remove button ✕ is clicked', () => {
    audioCtrl.init();
    const toggle = document.querySelector('.dda-speed-config-toggle');
    toggle.click();

    let slotRows = document.querySelectorAll('.dda-preset-slot-row');
    expect(slotRows.length).toBe(6);

    const firstRemoveBtn = slotRows[0].querySelector('.dda-preset-slot-remove');
    firstRemoveBtn.click();

    expect(audioCtrl.presets.length).toBe(5);
    slotRows = document.querySelectorAll('.dda-preset-slot-row');
    expect(slotRows.length).toBe(5);
    expect(audioCtrl.presets).not.toContain(0.75);
  });

  test('resets custom presets back to default presets', () => {
    audioCtrl.init();
    const toggle = document.querySelector('.dda-speed-config-toggle');
    toggle.click();

    audioCtrl.presets = [0.5, 2.0];
    audioCtrl.renderConfigSlots();

    const defaultBtn = document.querySelector('.dda-btn-default-presets');
    defaultBtn.click();

    expect(audioCtrl.presets).toEqual([0.75, 0.85, 1.0, 1.15, 1.25, 1.5]);
    const slotRows = document.querySelectorAll('.dda-preset-slot-row');
    expect(slotRows.length).toBe(6);
  });

  test('loads persisted playbackSpeed and custom presets on initialization', () => {
    storageMock['playbackSpeed'] = 1.25;
    storageMock['speedPresets'] = [0.8, 1.0, 1.2, 1.4];

    const customCtrl = new AudioControl();
    customCtrl.init();

    expect(customCtrl.currentSpeed).toBe(1.25);
    expect(customCtrl.presets).toEqual([0.8, 1.0, 1.2, 1.4]);
    expect(audioEl.playbackRate).toBe(1.25);

    const pill = document.querySelector('.dda-speed-pill');
    expect(pill.textContent).toContain('1.25x');

    customCtrl.destroy();
  });
});
