class AudioControl {
  constructor() {
    this.audioElement = null;
    this.container = null;
  }

  init() {
    this.audioElement = document.querySelector('audio');
    if (!this.audioElement) {
      return false;
    }
    
    // Check if we already injected the UI for this specific audio element
    if (this.audioElement.parentNode.querySelector('.dda-speed-control')) {
      return true; 
    }

    this.renderUI();
    this.loadSpeed();
    return true;
  }

  renderUI() {
    if (!this.audioElement || !this.audioElement.parentNode) return;

    this.container = document.createElement('div');
    this.container.className = 'dda-speed-control';
    this.container.innerHTML = `
      <label>
        Speed: 
        <input type="range" id="dda-speed-slider" min="0.5" max="1.5" step="0.1" value="1.0">
      </label>
      <span id="dda-speed-display">1.0x</span>
    `;

    // Inject after the audio element
    this.audioElement.parentNode.insertBefore(this.container, this.audioElement.nextSibling);

    const slider = this.container.querySelector('#dda-speed-slider');
    const display = this.container.querySelector('#dda-speed-display');

    slider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.setSpeed(speed);
      display.textContent = speed.toFixed(1) + 'x';
    });
  }

  setSpeed(speed) {
    if (this.audioElement) {
      this.audioElement.playbackRate = speed;
      chrome.storage.local.set({ playbackSpeed: speed });
    }
  }

  loadSpeed() {
    chrome.storage.local.get(['playbackSpeed'], (result) => {
      if (result.playbackSpeed) {
        const speed = result.playbackSpeed;
        if (this.audioElement) {
          this.audioElement.playbackRate = speed;
        }
        if (this.container) {
          const slider = this.container.querySelector('#dda-speed-slider');
          const display = this.container.querySelector('#dda-speed-display');
          if (slider) slider.value = speed;
          if (display) display.textContent = speed.toFixed(1) + 'x';
        }
      }
    });
  }
}

window.ddaAudioControl = new AudioControl();
