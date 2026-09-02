const ICONS = typeof DDA_ICONS !== 'undefined' ? DDA_ICONS : (typeof require !== 'undefined' ? require('./icons.js') : null);

class AudioControl {
  constructor() {
    this.audioElement = null;
    this.container = null;
    this.widgetGroup = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.speedValBtn = null;
    this.pillBtn = null;
    this.quickResetBtn = null;
    this.popover = null;
    this.resetBtn = null;
    this.presetsGrid = null;
    this.configPanel = null;
    this.configSlotsList = null;
    this.currentSpeed = 1.0;
    this.defaultSpeed = 1.0;
    this.defaultPresets = [0.75, 0.85, 1.0, 1.15, 1.25, 1.5];
    this.presets = [...this.defaultPresets];
    this.maxPresets = 8;
    this.minPresets = 2;
    this.isOpen = false;
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleAudioEvent = this.handleAudioEvent.bind(this);
    this._enforcingPlaybackRate = false;
  }

  init() {
    const audioEl = document.querySelector('audio');
    if (!audioEl) {
      return false;
    }

    this.bindAudioElement(audioEl);

    // Check if we already injected the UI for this specific audio element
    if (this.audioElement.parentNode && this.audioElement.parentNode.querySelector('.dda-speed-control')) {
      return true;
    }

    this.loadSettings(() => {
      this.renderUI();
    });
    return true;
  }

  bindAudioElement(audioEl) {
    if (!audioEl) return;
    if (this.audioElement && this.audioElement !== audioEl) {
      this.unbindAudioEvents();
    }
    this.audioElement = audioEl;
    const events = ['loadstart', 'loadedmetadata', 'canplay', 'play', 'playing', 'ratechange'];
    events.forEach(evt => {
      this.audioElement.removeEventListener(evt, this.boundHandleAudioEvent);
      this.audioElement.addEventListener(evt, this.boundHandleAudioEvent);
    });
    this.applyPlaybackRate();
  }

  unbindAudioEvents() {
    if (this.audioElement && this.boundHandleAudioEvent) {
      const events = ['loadstart', 'loadedmetadata', 'canplay', 'play', 'playing', 'ratechange'];
      events.forEach(evt => {
        try {
          this.audioElement.removeEventListener(evt, this.boundHandleAudioEvent);
        } catch (err) {
          // ignore
        }
      });
    }
  }

  applyPlaybackRate() {
    if (!this.audioElement) return;
    this._enforcingPlaybackRate = true;
    try {
      this.audioElement.defaultPlaybackRate = this.currentSpeed;
      this.audioElement.playbackRate = this.currentSpeed;
    } finally {
      this._enforcingPlaybackRate = false;
    }
  }

  handleAudioEvent() {
    if (!this.audioElement || this._enforcingPlaybackRate) return;
    if (Math.abs(this.audioElement.playbackRate - this.currentSpeed) > 0.001 ||
        Math.abs(this.audioElement.defaultPlaybackRate - this.currentSpeed) > 0.001) {
      this.applyPlaybackRate();
    }
  }

  syncPlaybackRate() {
    const audioEl = document.querySelector('audio');
    if (!audioEl) return;
    if (this.audioElement !== audioEl) {
      this.bindAudioElement(audioEl);
    } else {
      if (Math.abs(this.audioElement.playbackRate - this.currentSpeed) > 0.001 ||
          Math.abs(this.audioElement.defaultPlaybackRate - this.currentSpeed) > 0.001) {
        this.applyPlaybackRate();
      }
    }
  }

  loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['playbackSpeed', 'speedPresets', 'defaultSpeed'], (result) => {
        if (result && typeof result.playbackSpeed === 'number') {
          this.currentSpeed = Math.round(result.playbackSpeed * 100) / 100;
        }
        if (result && typeof result.defaultSpeed === 'number') {
          this.defaultSpeed = Math.round(result.defaultSpeed * 100) / 100;
        }
        if (result && Array.isArray(result.speedPresets) && result.speedPresets.length > 0) {
          this.presets = this.normalizePresets(result.speedPresets);
        }
        this.applyPlaybackRate();
        if (callback) callback();
      });
    } else {
      this.applyPlaybackRate();
      if (callback) callback();
    }
  }

  setDefaultSpeed(speed) {
    this.defaultSpeed = Math.round(speed * 100) / 100;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ defaultSpeed: this.defaultSpeed });
    }
    this.renderPresetsGrid();
    this.updatePillContent();
    if (this.resetBtn) {
      this.resetBtn.innerHTML = `${ICONS ? ICONS.reset(13) : '↺'} Reset (${this.formatSpeed(this.defaultSpeed)})`;
      this.resetBtn.title = `Reset playback speed to default (${this.formatSpeed(this.defaultSpeed)})`;
    }
  }

  normalizePresets(arr) {
    const valid = arr
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && v >= 0.25 && v <= 3.0)
      .map(v => Math.round(v * 100) / 100);
    const unique = Array.from(new Set(valid));
    unique.sort((a, b) => a - b);
    return unique.length > 0 ? unique : [...this.defaultPresets];
  }

  prevPreset() {
    if (!this.presets || this.presets.length === 0) return;
    const sorted = [...this.presets].sort((a, b) => a - b);
    const lower = sorted.filter(p => p < this.currentSpeed - 0.001);
    const target = lower.length > 0 ? lower[lower.length - 1] : sorted[sorted.length - 1];
    this.setSpeed(target);
  }

  nextPreset() {
    if (!this.presets || this.presets.length === 0) return;
    const sorted = [...this.presets].sort((a, b) => a - b);
    const higher = sorted.filter(p => p > this.currentSpeed + 0.001);
    const target = higher.length > 0 ? higher[0] : sorted[0];
    this.setSpeed(target);
  }

  stepSpeed(delta) {
    const nextVal = Math.max(0.5, Math.min(2.0, Math.round((this.currentSpeed + delta) * 100) / 100));
    this.setSpeed(nextVal);
  }

  stepPresetSlot(index, delta) {
    if (index < 0 || index >= this.presets.length) return;
    const current = this.presets[index];
    const nextVal = Math.max(0.5, Math.min(2.0, Math.round((current + delta) * 100) / 100));
    this.presets[index] = nextVal;
    this.presets = this.normalizePresets(this.presets);
    this.renderPresetsGrid();
    this.renderConfigSlots();
    this.savePresetsToStorage();
  }

  renderUI() {
    if (!this.audioElement || !this.audioElement.parentNode) return;

    // Remove existing if any
    const existing = this.audioElement.parentNode.querySelector('.dda-speed-control');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.className = 'dda-speed-control dda-speed-control-wrapper';

    // Segmented Widget Group
    this.widgetGroup = document.createElement('div');
    this.widgetGroup.className = 'dda-speed-widget-group';

    // Prev Preset Button
    this.prevBtn = document.createElement('button');
    this.prevBtn.type = 'button';
    this.prevBtn.className = 'dda-speed-nav-btn dda-speed-prev-btn';
    this.prevBtn.setAttribute('aria-label', 'Previous speed preset');
    this.prevBtn.setAttribute('title', 'Previous preset speed');
    this.prevBtn.innerHTML = ICONS ? ICONS.chevronLeft(14) : '‹';
    this.prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevPreset();
    });

    // Speed Value Button (center) - click to toggle popover, double click to reset
    this.speedValBtn = document.createElement('button');
    this.speedValBtn.type = 'button';
    this.speedValBtn.className = 'dda-speed-pill dda-speed-val-btn';
    this.speedValBtn.setAttribute('aria-label', 'Playback speed');
    this.pillBtn = this.speedValBtn;

    this.speedValBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    this.speedValBtn.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.setSpeed(this.defaultSpeed);
    });

    // Quick Reset Button - only shows when currentSpeed !== defaultSpeed
    this.quickResetBtn = document.createElement('button');
    this.quickResetBtn.type = 'button';
    this.quickResetBtn.className = 'dda-speed-quick-reset';
    this.quickResetBtn.setAttribute('aria-label', 'Reset to default speed');
    this.quickResetBtn.setAttribute('title', `Reset to default (${this.formatSpeed(this.defaultSpeed)})`);
    this.quickResetBtn.innerHTML = ICONS ? ICONS.reset(9) : '↺';
    this.quickResetBtn.style.display = 'none';
    this.quickResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setSpeed(this.defaultSpeed);
    });

    // Next Preset Button
    this.nextBtn = document.createElement('button');
    this.nextBtn.type = 'button';
    this.nextBtn.className = 'dda-speed-nav-btn dda-speed-next-btn';
    this.nextBtn.setAttribute('aria-label', 'Next speed preset');
    this.nextBtn.setAttribute('title', 'Next preset speed');
    this.nextBtn.innerHTML = ICONS ? ICONS.chevronRight(14) : '›';
    this.nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextPreset();
    });

    this.widgetGroup.appendChild(this.prevBtn);
    this.widgetGroup.appendChild(this.speedValBtn);
    this.widgetGroup.appendChild(this.nextBtn);
    this.container.appendChild(this.widgetGroup);
    this.container.appendChild(this.quickResetBtn);

    this.updatePillContent();

    // Build Popover
    this.buildPopover();
    this.container.appendChild(this.popover);

    // Inject after the audio element
    this.audioElement.parentNode.insertBefore(this.container, this.audioElement.nextSibling);

    document.addEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  updatePillContent() {
    if (!this.speedValBtn) return;
    const formattedSpeed = this.formatSpeed(this.currentSpeed);
    const isNonDefault = Math.abs(this.currentSpeed - this.defaultSpeed) > 0.01;
    
    if (isNonDefault) {
      this.speedValBtn.classList.add('dda-speed-active');
      if (this.widgetGroup) this.widgetGroup.classList.add('dda-speed-active');
      if (this.quickResetBtn) {
        this.quickResetBtn.style.display = 'inline-flex';
        this.quickResetBtn.setAttribute('title', `Reset to default (${this.formatSpeed(this.defaultSpeed)})`);
      }
    } else {
      this.speedValBtn.classList.remove('dda-speed-active');
      if (this.widgetGroup) this.widgetGroup.classList.remove('dda-speed-active');
      if (this.quickResetBtn) {
        this.quickResetBtn.style.display = 'none';
      }
    }

    this.speedValBtn.textContent = '';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'dda-speed-value';
    valueSpan.textContent = formattedSpeed;

    this.speedValBtn.appendChild(valueSpan);
    this.speedValBtn.setAttribute('title', `Click to adjust speed (Double-click to reset ${this.formatSpeed(this.defaultSpeed)})`);
  }

  buildPopover() {
    this.popover = document.createElement('div');
    this.popover.className = 'dda-speed-popover';
    this.popover.style.display = 'none';

    // Popover Header
    const header = document.createElement('div');
    header.className = 'dda-speed-popover-header';

    const titleBox = document.createElement('div');
    titleBox.className = 'dda-speed-popover-title';
    titleBox.textContent = 'Playback Speed';

    this.resetBtn = document.createElement('button');
    this.resetBtn.type = 'button';
    this.resetBtn.className = 'dda-speed-reset-btn';
    this.resetBtn.title = `Reset playback speed to default (${this.formatSpeed(this.defaultSpeed)})`;
    this.resetBtn.innerHTML = `${ICONS ? ICONS.reset(13) : '↺'} Reset (${this.formatSpeed(this.defaultSpeed)})`;

    this.resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setSpeed(this.defaultSpeed);
    });

    header.appendChild(titleBox);
    header.appendChild(this.resetBtn);
    this.popover.appendChild(header);

    // Popover Body
    const body = document.createElement('div');
    body.className = 'dda-speed-popover-body';

    // Section 1: Quick Presets
    const presetsSection = document.createElement('div');
    presetsSection.className = 'dda-speed-section';

    const presetsLabel = document.createElement('div');
    presetsLabel.className = 'dda-speed-section-label';
    presetsLabel.textContent = 'QUICK PRESETS (★ SET DEFAULT)';
    presetsSection.appendChild(presetsLabel);
    
    this.presetsGrid = document.createElement('div');
    this.presetsGrid.className = 'dda-speed-presets-grid';
    this.renderPresetsGrid();
    presetsSection.appendChild(this.presetsGrid);
    body.appendChild(presetsSection);

    // Section 2: Fine Tuning Slider & Steppers
    const fineTuningSection = document.createElement('div');
    fineTuningSection.className = 'dda-speed-section';

    const sliderHeader = document.createElement('div');
    sliderHeader.className = 'dda-speed-slider-header';

    const fineLabel = document.createElement('span');
    fineLabel.className = 'dda-speed-section-label';
    fineLabel.textContent = 'FINE TUNING';

    this.sliderDisplay = document.createElement('span');
    this.sliderDisplay.className = 'dda-speed-slider-current';
    this.sliderDisplay.textContent = this.formatSpeed(this.currentSpeed);

    sliderHeader.appendChild(fineLabel);
    sliderHeader.appendChild(this.sliderDisplay);
    fineTuningSection.appendChild(sliderHeader);

    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'dda-speed-slider-wrap';

    const boundMin = document.createElement('span');
    boundMin.className = 'dda-speed-slider-bound';
    boundMin.textContent = '0.5x';

    const stepDownBtn = document.createElement('button');
    stepDownBtn.type = 'button';
    stepDownBtn.className = 'dda-speed-stepper-btn dda-speed-step-down';
    stepDownBtn.title = 'Decrease speed (-0.05x)';
    stepDownBtn.setAttribute('aria-label', 'Decrease speed');
    stepDownBtn.innerHTML = ICONS ? ICONS.minus(12) : '−';
    stepDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stepSpeed(-0.05);
    });

    this.sliderInput = document.createElement('input');
    this.sliderInput.type = 'range';
    this.sliderInput.className = 'dda-speed-slider-input';
    this.sliderInput.min = '0.5';
    this.sliderInput.max = '2.0';
    this.sliderInput.step = '0.05';
    this.sliderInput.value = String(this.currentSpeed);

    const stepUpBtn = document.createElement('button');
    stepUpBtn.type = 'button';
    stepUpBtn.className = 'dda-speed-stepper-btn dda-speed-step-up';
    stepUpBtn.title = 'Increase speed (+0.05x)';
    stepUpBtn.setAttribute('aria-label', 'Increase speed');
    stepUpBtn.innerHTML = ICONS ? ICONS.plus(12) : '+';
    stepUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stepSpeed(0.05);
    });

    const boundMax = document.createElement('span');
    boundMax.className = 'dda-speed-slider-bound';
    boundMax.textContent = '2.0x';

    sliderWrap.appendChild(boundMin);
    sliderWrap.appendChild(stepDownBtn);
    sliderWrap.appendChild(this.sliderInput);
    sliderWrap.appendChild(stepUpBtn);
    sliderWrap.appendChild(boundMax);
    fineTuningSection.appendChild(sliderWrap);

    this.sliderInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.setSpeed(val, false);
      if (this.sliderDisplay) {
        this.sliderDisplay.textContent = this.formatSpeed(val);
      }
    });

    this.sliderInput.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      this.setSpeed(val, true);
    });

    body.appendChild(fineTuningSection);

    // Section 3: Custom Presets Configuration (Sliders List)
    const configSection = document.createElement('div');
    configSection.className = 'dda-speed-config-section';
    
    const configToggle = document.createElement('button');
    configToggle.type = 'button';
    configToggle.className = 'dda-speed-config-toggle';

    const configToggleText = document.createElement('span');
    configToggleText.className = 'dda-config-toggle-label';
    configToggleText.innerHTML = `${ICONS ? ICONS.gear(13) : ''} Custom Presets`;

    const configToggleArrow = document.createElement('span');
    configToggleArrow.className = 'dda-config-toggle-arrow';
    configToggleArrow.innerHTML = ICONS ? ICONS.chevronDown(12) : '▸';

    configToggle.appendChild(configToggleText);
    configToggle.appendChild(configToggleArrow);

    this.configPanel = document.createElement('div');
    this.configPanel.className = 'dda-speed-config-panel';
    this.configPanel.style.display = 'none';

    const configHint = document.createElement('div');
    configHint.className = 'dda-config-hint';
    configHint.textContent = 'Adjust preset slots and fine-tune with − / +:';
    this.configPanel.appendChild(configHint);

    this.configSlotsList = document.createElement('div');
    this.configSlotsList.className = 'dda-preset-slots-list';
    this.configPanel.appendChild(this.configSlotsList);

    const configActions = document.createElement('div');
    configActions.className = 'dda-config-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'dda-btn dda-btn-add-preset';
    addBtn.innerHTML = `${ICONS ? ICONS.plus(12) : '+'} Add Preset`;
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addPresetSlot();
    });

    const defaultBtn = document.createElement('button');
    defaultBtn.type = 'button';
    defaultBtn.className = 'dda-btn dda-btn-default-presets';
    defaultBtn.innerHTML = `${ICONS ? ICONS.reset(12) : '↺'} Defaults`;
    defaultBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetDefaultPresets();
    });

    configActions.appendChild(addBtn);
    configActions.appendChild(defaultBtn);
    this.configPanel.appendChild(configActions);

    configToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = this.configPanel.style.display !== 'none';
      this.configPanel.style.display = isExpanded ? 'none' : 'block';
      configToggle.classList.toggle('expanded', !isExpanded);
    });

    configSection.appendChild(configToggle);
    configSection.appendChild(this.configPanel);
    body.appendChild(configSection);

    this.renderConfigSlots();
    this.popover.appendChild(body);

    // Popover Footer Tip
    const footer = document.createElement('div');
    footer.className = 'dda-speed-popover-footer';
    footer.textContent = '💡 Tip: Double-click widget speed to reset default';
    this.popover.appendChild(footer);

    // Prevent clicks inside popover from closing it
    this.popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  renderPresetsGrid() {
    if (!this.presetsGrid) return;
    this.presetsGrid.textContent = '';
    this.presets.forEach(preset => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'dda-speed-preset-item';
      if (Math.abs(preset - this.currentSpeed) < 0.01) {
        itemWrapper.classList.add('dda-preset-active');
      }

      const isDefault = Math.abs(preset - this.defaultSpeed) < 0.01;
      if (isDefault) {
        itemWrapper.classList.add('dda-preset-is-default');
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dda-speed-preset-btn';
      btn.textContent = this.formatSpeed(preset);
      btn.title = `Select ${this.formatSpeed(preset)}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setSpeed(preset);
      });

      const starBtn = document.createElement('button');
      starBtn.type = 'button';
      starBtn.className = 'dda-preset-star-btn';
      if (isDefault) starBtn.classList.add('dda-star-active');
      starBtn.innerHTML = ICONS ? ICONS.star(isDefault, 13) : (isDefault ? '★' : '☆');
      starBtn.title = isDefault ? `Default speed (${this.formatSpeed(preset)})` : `Set ${this.formatSpeed(preset)} as default speed`;
      starBtn.setAttribute('aria-label', `Set ${this.formatSpeed(preset)} as default speed`);
      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setDefaultSpeed(preset);
      });

      itemWrapper.appendChild(btn);
      itemWrapper.appendChild(starBtn);
      this.presetsGrid.appendChild(itemWrapper);
    });
  }

  renderConfigSlots() {
    if (!this.configSlotsList) return;
    this.configSlotsList.textContent = '';

    this.presets.forEach((preset, index) => {
      const row = document.createElement('div');
      row.className = 'dda-preset-slot-row';

      const label = document.createElement('span');
      label.className = 'dda-preset-slot-label';
      label.textContent = `#${index + 1}`;

      const stepDownBtn = document.createElement('button');
      stepDownBtn.type = 'button';
      stepDownBtn.className = 'dda-slot-stepper-btn dda-slot-step-down';
      stepDownBtn.title = 'Decrease preset (-0.05x)';
      stepDownBtn.setAttribute('aria-label', 'Decrease preset');
      stepDownBtn.innerHTML = ICONS ? ICONS.minus(11) : '−';
      stepDownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stepPresetSlot(index, -0.05);
      });

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'dda-preset-slot-slider';
      slider.min = '0.5';
      slider.max = '2.0';
      slider.step = '0.05';
      slider.value = String(preset);

      const stepUpBtn = document.createElement('button');
      stepUpBtn.type = 'button';
      stepUpBtn.className = 'dda-slot-stepper-btn dda-slot-step-up';
      stepUpBtn.title = 'Increase preset (+0.05x)';
      stepUpBtn.setAttribute('aria-label', 'Increase preset');
      stepUpBtn.innerHTML = ICONS ? ICONS.plus(11) : '+';
      stepUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stepPresetSlot(index, 0.05);
      });

      const badge = document.createElement('span');
      badge.className = 'dda-preset-slot-badge';
      badge.textContent = this.formatSpeed(preset);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'dda-preset-slot-remove';
      removeBtn.title = 'Remove preset';
      removeBtn.innerHTML = ICONS ? ICONS.close(11) : '✕';
      if (this.presets.length <= this.minPresets) {
        removeBtn.disabled = true;
        removeBtn.classList.add('disabled');
      }

      slider.addEventListener('input', (e) => {
        const val = Math.round(parseFloat(e.target.value) * 100) / 100;
        this.presets[index] = val;
        badge.textContent = this.formatSpeed(val);
        this.renderPresetsGrid();
      });

      slider.addEventListener('change', () => {
        this.presets = this.normalizePresets(this.presets);
        this.renderPresetsGrid();
        this.renderConfigSlots();
        this.savePresetsToStorage();
      });

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removePresetSlot(index);
      });

      row.appendChild(label);
      row.appendChild(stepDownBtn);
      row.appendChild(slider);
      row.appendChild(stepUpBtn);
      row.appendChild(badge);
      row.appendChild(removeBtn);
      this.configSlotsList.appendChild(row);
    });

    // Update Add button disabled state if max reached
    if (this.configPanel) {
      const addBtn = this.configPanel.querySelector('.dda-btn-add-preset');
      if (addBtn) {
        addBtn.disabled = this.presets.length >= this.maxPresets;
        addBtn.classList.toggle('disabled', this.presets.length >= this.maxPresets);
      }
    }
  }

  addPresetSlot() {
    if (this.presets.length >= this.maxPresets) return;
    const last = this.presets[this.presets.length - 1] || 1.0;
    let nextVal = Math.min(2.0, Math.round((last + 0.1) * 100) / 100);
    if (this.presets.includes(nextVal)) {
      nextVal = Math.max(0.5, Math.round((last - 0.1) * 100) / 100);
    }
    this.presets.push(nextVal);
    this.presets = this.normalizePresets(this.presets);
    this.renderPresetsGrid();
    this.renderConfigSlots();
    this.savePresetsToStorage();
  }

  removePresetSlot(index) {
    if (this.presets.length <= this.minPresets) return;
    this.presets.splice(index, 1);
    this.presets = this.normalizePresets(this.presets);
    this.renderPresetsGrid();
    this.renderConfigSlots();
    this.savePresetsToStorage();
  }

  resetDefaultPresets() {
    this.presets = [...this.defaultPresets];
    this.renderPresetsGrid();
    this.renderConfigSlots();
    this.savePresetsToStorage();
  }

  savePresetsToStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ speedPresets: this.presets });
    }
  }

  setSpeed(speed, shouldSave = true) {
    this.currentSpeed = Math.round(speed * 100) / 100;
    this.applyPlaybackRate();
    if (shouldSave && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ playbackSpeed: this.currentSpeed });
    }
    this.updatePillContent();
    this.syncUI();
  }

  syncUI() {
    if (this.sliderInput) {
      this.sliderInput.value = String(this.currentSpeed);
    }
    if (this.sliderDisplay) {
      this.sliderDisplay.textContent = this.formatSpeed(this.currentSpeed);
    }
    if (this.presetsGrid) {
      const items = this.presetsGrid.querySelectorAll('.dda-speed-preset-item');
      items.forEach((item) => {
        const btn = item.querySelector('.dda-speed-preset-btn');
        if (btn) {
          const val = parseFloat(btn.textContent);
          if (Math.abs(val - this.currentSpeed) < 0.01) {
            item.classList.add('dda-preset-active');
          } else {
            item.classList.remove('dda-preset-active');
          }
        }
      });
    }
  }

  formatSpeed(speed) {
    return Number.isInteger(speed) ? `${speed}.0x` : `${speed}x`;
  }

  togglePopover() {
    if (this.isOpen) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  openPopover() {
    if (!this.popover) return;
    this.popover.style.display = 'block';
    this.isOpen = true;
    if (this.pillBtn) this.pillBtn.classList.add('dda-popover-open');
  }

  closePopover() {
    if (!this.popover) return;
    this.popover.style.display = 'none';
    this.isOpen = false;
    if (this.pillBtn) this.pillBtn.classList.remove('dda-popover-open');
  }

  handleDocumentClick(e) {
    if (!this.isOpen) return;
    if (this.container && !this.container.contains(e.target)) {
      this.closePopover();
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.closePopover();
    }
  }

  destroy() {
    this.unbindAudioEvents();
    document.removeEventListener('click', this.boundHandleDocumentClick);
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.container && this.container.parentNode) {
      this.container.remove();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioControl;
}
if (typeof window !== 'undefined') {
  window.ddaAudioControl = new AudioControl();
}
