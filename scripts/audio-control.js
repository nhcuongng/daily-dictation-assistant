class AudioControl {
  constructor() {
    this.audioElement = null;
    this.container = null;
    this.pillBtn = null;
    this.popover = null;
    this.presetsGrid = null;
    this.configPanel = null;
    this.configSlotsList = null;
    this.currentSpeed = 1.0;
    this.defaultPresets = [0.75, 0.85, 1.0, 1.15, 1.25, 1.5];
    this.presets = [...this.defaultPresets];
    this.maxPresets = 8;
    this.minPresets = 2;
    this.isOpen = false;
    this.boundHandleDocumentClick = this.handleDocumentClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  init() {
    this.audioElement = document.querySelector('audio');
    if (!this.audioElement) {
      return false;
    }

    // Check if we already injected the UI for this specific audio element
    if (this.audioElement.parentNode && this.audioElement.parentNode.querySelector('.dda-speed-control')) {
      return true;
    }

    this.loadSettings(() => {
      this.renderUI();
    });
    return true;
  }

  loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['playbackSpeed', 'speedPresets'], (result) => {
        if (result && typeof result.playbackSpeed === 'number') {
          this.currentSpeed = Math.round(result.playbackSpeed * 100) / 100;
        }
        if (result && Array.isArray(result.speedPresets) && result.speedPresets.length > 0) {
          this.presets = this.normalizePresets(result.speedPresets);
        }
        if (this.audioElement) {
          this.audioElement.playbackRate = this.currentSpeed;
        }
        if (callback) callback();
      });
    } else {
      if (this.audioElement) {
        this.audioElement.playbackRate = this.currentSpeed;
      }
      if (callback) callback();
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

  renderUI() {
    if (!this.audioElement || !this.audioElement.parentNode) return;

    // Remove existing if any
    const existing = this.audioElement.parentNode.querySelector('.dda-speed-control');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.className = 'dda-speed-control dda-speed-control-wrapper';

    // Trigger Pill
    this.pillBtn = document.createElement('button');
    this.pillBtn.type = 'button';
    this.pillBtn.className = 'dda-speed-pill';
    this.pillBtn.setAttribute('aria-label', 'Change playback speed');
    this.pillBtn.setAttribute('title', 'Click to adjust speed (Double-click to reset 1.0x)');
    this.updatePillContent();

    this.pillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    this.pillBtn.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.setSpeed(1.0);
    });

    this.container.appendChild(this.pillBtn);

    // Build Popover
    this.buildPopover();
    this.container.appendChild(this.popover);

    // Inject after the audio element
    this.audioElement.parentNode.insertBefore(this.container, this.audioElement.nextSibling);

    document.addEventListener('click', this.boundHandleDocumentClick);
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  updatePillContent() {
    if (!this.pillBtn) return;
    const formattedSpeed = this.formatSpeed(this.currentSpeed);
    const isNonDefault = Math.abs(this.currentSpeed - 1.0) > 0.01;
    
    if (isNonDefault) {
      this.pillBtn.classList.add('dda-speed-active');
    } else {
      this.pillBtn.classList.remove('dda-speed-active');
    }

    this.pillBtn.textContent = '';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'dda-speed-icon';
    iconSpan.textContent = '⚡';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'dda-speed-value';
    valueSpan.textContent = formattedSpeed;

    const chevronSpan = document.createElement('span');
    chevronSpan.className = 'dda-speed-chevron';
    chevronSpan.textContent = '▾';

    this.pillBtn.appendChild(iconSpan);
    this.pillBtn.appendChild(valueSpan);
    this.pillBtn.appendChild(chevronSpan);
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
    titleBox.textContent = '⚡ Playback Speed';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'dda-speed-reset-btn';
    resetBtn.title = 'Reset playback speed to 1.0x';
    resetBtn.textContent = '↺ Reset 1.0x';

    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setSpeed(1.0);
    });

    header.appendChild(titleBox);
    header.appendChild(resetBtn);
    this.popover.appendChild(header);

    // Popover Body
    const body = document.createElement('div');
    body.className = 'dda-speed-popover-body';

    // Section 1: Quick Presets
    const presetsSection = document.createElement('div');
    presetsSection.className = 'dda-speed-section';

    const presetsLabel = document.createElement('div');
    presetsLabel.className = 'dda-speed-section-label';
    presetsLabel.textContent = 'QUICK PRESETS';
    presetsSection.appendChild(presetsLabel);
    
    this.presetsGrid = document.createElement('div');
    this.presetsGrid.className = 'dda-speed-presets-grid';
    this.renderPresetsGrid();
    presetsSection.appendChild(this.presetsGrid);
    body.appendChild(presetsSection);

    // Section 2: Fine Tuning Slider
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

    this.sliderInput = document.createElement('input');
    this.sliderInput.type = 'range';
    this.sliderInput.className = 'dda-speed-slider-input';
    this.sliderInput.min = '0.5';
    this.sliderInput.max = '2.0';
    this.sliderInput.step = '0.05';
    this.sliderInput.value = String(this.currentSpeed);

    const boundMax = document.createElement('span');
    boundMax.className = 'dda-speed-slider-bound';
    boundMax.textContent = '2.0x';

    sliderWrap.appendChild(boundMin);
    sliderWrap.appendChild(this.sliderInput);
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
    configToggleText.textContent = '⚙️ Custom Presets';

    const configToggleArrow = document.createElement('span');
    configToggleArrow.className = 'dda-config-toggle-arrow';
    configToggleArrow.textContent = '▸';

    configToggle.appendChild(configToggleText);
    configToggle.appendChild(configToggleArrow);

    this.configPanel = document.createElement('div');
    this.configPanel.className = 'dda-speed-config-panel';
    this.configPanel.style.display = 'none';

    const configHint = document.createElement('div');
    configHint.className = 'dda-config-hint';
    configHint.textContent = 'Drag sliders to customize quick preset buttons:';
    this.configPanel.appendChild(configHint);

    this.configSlotsList = document.createElement('div');
    this.configSlotsList.className = 'dda-preset-slots-list';
    this.configPanel.appendChild(this.configSlotsList);

    const configActions = document.createElement('div');
    configActions.className = 'dda-config-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'dda-btn dda-btn-add-preset';
    addBtn.textContent = '＋ Add Preset';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addPresetSlot();
    });

    const defaultBtn = document.createElement('button');
    defaultBtn.type = 'button';
    defaultBtn.className = 'dda-btn dda-btn-default-presets';
    defaultBtn.textContent = '↺ Defaults';
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
      configToggleArrow.textContent = isExpanded ? '▸' : '▾';
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
    footer.textContent = '💡 Tip: Double-click trigger pill to reset 1.0x';
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
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dda-speed-preset-btn';
      const formatted = this.formatSpeed(preset);
      btn.textContent = formatted;
      if (Math.abs(preset - this.currentSpeed) < 0.01) {
        btn.classList.add('dda-preset-active');
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setSpeed(preset);
      });
      this.presetsGrid.appendChild(btn);
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

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'dda-preset-slot-slider';
      slider.min = '0.5';
      slider.max = '2.0';
      slider.step = '0.05';
      slider.value = String(preset);

      const badge = document.createElement('span');
      badge.className = 'dda-preset-slot-badge';
      badge.textContent = this.formatSpeed(preset);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'dda-preset-slot-remove';
      removeBtn.title = 'Remove preset';
      removeBtn.textContent = '✕';
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
      row.appendChild(slider);
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
    if (this.audioElement) {
      this.audioElement.playbackRate = this.currentSpeed;
    }
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
      const btns = this.presetsGrid.querySelectorAll('.dda-speed-preset-btn');
      btns.forEach((btn) => {
        const val = parseFloat(btn.textContent);
        if (Math.abs(val - this.currentSpeed) < 0.01) {
          btn.classList.add('dda-preset-active');
        } else {
          btn.classList.remove('dda-preset-active');
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
