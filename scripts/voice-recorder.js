/**
 * Voice Recorder Component - Daily Dictation Assistant
 * Allows learners to record multiple voice takes per sentence, preview playback,
 * download recordings in AI-compatible standard WAV format (.wav), and manage takes.
 */

const ICONS = typeof DDA_ICONS !== 'undefined' ? DDA_ICONS : (typeof require !== 'undefined' ? require('./icons.js') : null);

/**
 * Helper: Convert AudioBuffer to standard 16-bit PCM WAV ArrayBuffer
 */
function audioBufferToWav(buffer, opt = {}) {
  const numChannels = opt.float32 ? buffer.numberOfChannels : 1; // Default mono for speech
  const sampleRate = buffer.sampleRate;
  const format = opt.float32 ? 3 : 1; // 1 = 16-bit PCM
  const bitDepth = opt.float32 ? 32 : 16;

  let samples;
  if (numChannels === 1 && buffer.numberOfChannels > 1) {
    // Mix down stereo/multichannel to mono
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    samples = new Float32Array(ch0.length);
    for (let i = 0; i < ch0.length; i++) {
      samples[i] = (ch0[i] + ch1[i]) / 2;
    }
  } else if (numChannels === 2 && buffer.numberOfChannels >= 2) {
    // Interleave stereo
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    samples = new Float32Array(ch0.length + ch1.length);
    let index = 0;
    let inputIndex = 0;
    while (index < samples.length) {
      samples[index++] = ch0[inputIndex];
      samples[index++] = ch1[inputIndex];
      inputIndex++;
    }
  } else {
    samples = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeAscii(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" sub-chunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return arrayBuffer;
}

function writeAscii(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

async function blobToArrayBuffer(blob) {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Helper: Convert any audio Blob to standard WAV Blob
 */
async function blobToWavBlob(blob) {
  if (!blob) return null;
  const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  if (!AudioContextClass) {
    return blob;
  }

  let audioContext = null;
  try {
    audioContext = new AudioContextClass();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (err) {
    console.warn('VoiceRecorder: WAV conversion failed, using fallback blob', err);
    return blob;
  } finally {
    if (audioContext && typeof audioContext.close === 'function') {
      audioContext.close().catch(() => {});
    }
  }
}

class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.recordingDuration = 0;
    this.timerInterval = null;
    this.challengeIndex = 0;

    // Multi-recording state
    this.recordings = [];
    this.takeCounter = 1;
    this.activePlaybackAudio = null;
    this.activePlayingId = null;

    // DOM Elements
    this.containerEl = null;
    this.recordBtn = null;
    this.stopBtn = null;
    this.timerDisplay = null;
    this.listContainerEl = null;

    this.boundHandleAudioEnded = this.handleAudioEnded.bind(this);
  }

  /**
   * Format seconds into MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Start microphone audio recording
   */
  async startRecording() {
    if (this.isRecording) return;

    // Stop any active voice playback
    this.pauseAllPlayback();

    // Stop native lesson audio or TTS if playing
    const audioEl = document.querySelector('audio');
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
    }
    if (window.WhatIfSound && window.WhatIfSound.isPlaying) {
      window.WhatIfSound.stop();
    }

    try {
      this.audioChunks = [];
      this.recordingDuration = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream;

      // Detect supported mime type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mime });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Math.max(1, this.recordingDuration);

        const newTake = {
          id: 'take_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          takeNumber: this.takeCounter++,
          blob: audioBlob,
          url: audioUrl,
          wavBlob: null,
          wavUrl: null,
          duration: duration,
          isPlaying: false
        };

        this.recordings.push(newTake);
        this.stopTracks();
        this.setRecordingState(false);
        this.renderRecordingsList();

        // Convert to WAV in background so it is instantly ready for download
        blobToWavBlob(audioBlob).then((wavBlob) => {
          if (wavBlob) {
            newTake.wavBlob = wavBlob;
            newTake.wavUrl = URL.createObjectURL(wavBlob);
          }
        }).catch((err) => {
          console.warn('VoiceRecorder: Background WAV conversion error', err);
        });
      };

      recorder.start(100);
      this.isRecording = true;
      this.startTimer();
      this.setRecordingState(true);
    } catch (err) {
      console.warn('VoiceRecorder: Microphone access error', err);
      this.showToast('Microphone access denied');
      this.setRecordingState(false);
    }
  }

  /**
   * Stop microphone audio recording
   */
  stopRecording() {
    if (!this.isRecording) return;
    this.stopTimer();
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.stopTracks();
        this.setRecordingState(false);
      }
    } else {
      this.stopTracks();
      this.setRecordingState(false);
    }
  }

  /**
   * Stop media stream tracks
   */
  stopTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Start duration timer
   */
  startTimer() {
    this.stopTimer();
    this.recordingDuration = 0;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.recordingDuration += 1;
      this.updateTimerDisplay();
      if (this.recordingDuration >= 180) {
        this.stopRecording();
      }
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    if (this.timerDisplay) {
      this.timerDisplay.textContent = this.formatTime(this.recordingDuration);
    }
  }

  /**
   * Toggle playback of a specific take
   */
  togglePlayback(takeId) {
    const take = this.recordings.find(r => r.id === takeId);
    if (!take) return;

    if (this.activePlayingId === takeId && take.isPlaying) {
      this.pauseAllPlayback();
    } else {
      this.playRecording(takeId);
    }
  }

  /**
   * Play specific recording take
   */
  playRecording(takeId) {
    const take = this.recordings.find(r => r.id === takeId);
    if (!take || !take.url) return;

    // Pause all other playbacks
    this.pauseAllPlayback();

    // Pause native lesson audio
    const audioEl = document.querySelector('audio');
    if (audioEl && !audioEl.paused) {
      audioEl.pause();
    }

    const audio = new Audio(take.url);
    this.activePlaybackAudio = audio;
    this.activePlayingId = takeId;
    take.isPlaying = true;
    this.updateTakePlayState(takeId, true);

    audio.addEventListener('ended', () => {
      take.isPlaying = false;
      this.activePlayingId = null;
      this.activePlaybackAudio = null;
      this.updateTakePlayState(takeId, false);
    });

    audio.addEventListener('pause', () => {
      if (this.activePlayingId === takeId && !audio.ended) {
        take.isPlaying = false;
        this.activePlayingId = null;
        this.updateTakePlayState(takeId, false);
      }
    });

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          console.warn('VoiceRecorder playback failed', err);
          take.isPlaying = false;
          this.activePlayingId = null;
          this.updateTakePlayState(takeId, false);
        });
      }
    } catch (err) {
      console.warn('VoiceRecorder playback error', err);
      take.isPlaying = false;
      this.activePlayingId = null;
      this.updateTakePlayState(takeId, false);
    }
  }

  /**
   * Pause all active playbacks
   */
  pauseAllPlayback() {
    if (this.activePlaybackAudio) {
      this.activePlaybackAudio.pause();
      this.activePlaybackAudio = null;
    }
    this.recordings.forEach(take => {
      take.isPlaying = false;
      this.updateTakePlayState(take.id, false);
    });
    this.activePlayingId = null;
  }

  handleAudioEnded() {
    this.pauseAllPlayback();
  }

  /**
   * Update play button state in UI for a take
   */
  updateTakePlayState(takeId, isPlaying) {
    if (!this.listContainerEl) return;
    const itemEl = this.listContainerEl.querySelector(`[data-take-id="${takeId}"]`);
    if (!itemEl) return;

    const playBtn = itemEl.querySelector('.dda-btn-take-play');
    if (!playBtn) return;

    const iconSpan = playBtn.querySelector('.dda-vr-btn-icon');
    const labelSpan = playBtn.querySelector('.dda-vr-btn-label');

    if (isPlaying) {
      playBtn.classList.add('dda-playing');
      playBtn.title = 'Pause playback';
      if (iconSpan) iconSpan.innerHTML = ICONS ? ICONS.stop(11) : '⏸';
      if (labelSpan) labelSpan.textContent = 'Pause';
    } else {
      playBtn.classList.remove('dda-playing');
      playBtn.title = 'Play take';
      if (iconSpan) iconSpan.innerHTML = ICONS ? ICONS.play(11) : '▶';
      if (labelSpan) labelSpan.textContent = 'Play';
    }
  }

  /**
   * Download a specific recording in AI-compatible WAV format (.wav)
   */
  async downloadRecording(takeId, customFilename = null) {
    const take = this.recordings.find(r => r.id === takeId);
    if (!take || (!take.url && !take.blob)) {
      this.showToast('Audio not found');
      return false;
    }

    // Ensure WAV format is ready
    let targetBlob = take.wavBlob;
    let targetUrl = take.wavUrl;

    if (!targetBlob) {
      targetBlob = await blobToWavBlob(take.blob);
      if (targetBlob && targetBlob.type === 'audio/wav') {
        take.wavBlob = targetBlob;
        targetUrl = URL.createObjectURL(targetBlob);
        take.wavUrl = targetUrl;
      } else {
        targetUrl = take.url;
      }
    }

    const isWav = targetBlob && targetBlob.type === 'audio/wav';
    const ext = isWav ? 'wav' : (targetBlob && targetBlob.type && targetBlob.type.includes('mp4') ? 'm4a' : 'webm');
    const index = (typeof this.challengeIndex === 'number' && this.challengeIndex >= 0) ? (this.challengeIndex + 1) : 1;
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = customFilename || `daily-dictation-recording-sentence-${index}-take-${take.takeNumber}-${dateStr}.${ext}`;

    const link = document.createElement('a');
    link.href = targetUrl || take.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast(`Take #${take.takeNumber} downloaded (${ext.toUpperCase()})! ⬇️`);
    return true;
  }

  /**
   * Delete a specific take
   */
  deleteRecording(takeId) {
    const takeIndex = this.recordings.findIndex(r => r.id === takeId);
    if (takeIndex === -1) return;

    const take = this.recordings[takeIndex];
    if (this.activePlayingId === takeId) {
      this.pauseAllPlayback();
    }

    if (take.url) {
      URL.revokeObjectURL(take.url);
    }
    if (take.wavUrl) {
      URL.revokeObjectURL(take.wavUrl);
    }

    this.recordings.splice(takeIndex, 1);
    this.renderRecordingsList();
    this.setRecordingState(false);
    this.showToast('Take deleted 🗑️');
  }

  /**
   * Show temporary feedback toast
   */
  showToast(message) {
    if (!this.containerEl) return;
    let toast = this.containerEl.querySelector('.dda-vr-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'dda-vr-toast';
      this.containerEl.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('dda-visible');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      if (toast) toast.classList.remove('dda-visible');
    }, 2500);
  }

  /**
   * Reset all recordings state
   */
  reset() {
    this.stopRecording();
    this.pauseAllPlayback();

    this.recordings.forEach(take => {
      if (take.url) {
        URL.revokeObjectURL(take.url);
      }
      if (take.wavUrl) {
        URL.revokeObjectURL(take.wavUrl);
      }
    });

    this.recordings = [];
    this.takeCounter = 1;
    this.recordingDuration = 0;
    this.setRecordingState(false);
    this.renderRecordingsList();
  }

  /**
   * Handle challenge change in SPA
   */
  onChallengeChange(newIndex) {
    this.challengeIndex = newIndex;
    this.reset();
  }

  /**
   * Update UI recording states
   */
  setRecordingState(isRecording) {
    this.isRecording = !!isRecording;

    if (!this.containerEl) return;

    const hasRecordings = this.recordings.length > 0;

    if (this.isRecording) {
      this.containerEl.classList.add('dda-is-recording');
      if (this.recordBtn) this.recordBtn.style.display = 'none';
      if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
      if (this.timerDisplay) this.timerDisplay.style.display = 'inline-flex';
    } else {
      this.containerEl.classList.remove('dda-is-recording');
      if (this.recordBtn) {
        this.recordBtn.style.display = 'inline-flex';
        const label = this.recordBtn.querySelector('.dda-vr-btn-label');
        if (label) {
          label.textContent = hasRecordings ? 'Record Another Take' : 'Record Voice';
        }
      }
      if (this.stopBtn) this.stopBtn.style.display = 'none';
      if (this.timerDisplay) this.timerDisplay.style.display = 'none';
    }

    if (hasRecordings) {
      this.containerEl.classList.add('dda-has-recording');
    } else {
      this.containerEl.classList.remove('dda-has-recording');
    }
  }

  /**
   * Render the list of recordings (Takes)
   */
  renderRecordingsList() {
    if (!this.listContainerEl) return;

    this.listContainerEl.innerHTML = '';

    if (this.recordings.length === 0) {
      this.listContainerEl.style.display = 'none';
      return;
    }

    this.listContainerEl.style.display = 'flex';

    this.recordings.forEach((take) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'dda-vr-take-item';
      itemEl.setAttribute('data-take-id', take.id);

      // Take Info (Label & Duration)
      const infoEl = document.createElement('div');
      infoEl.className = 'dda-vr-take-info';
      infoEl.innerHTML = `
        <span class="dda-vr-take-badge">Take #${take.takeNumber}</span>
        <span class="dda-vr-take-duration">${this.formatTime(take.duration)}</span>
      `;

      // Actions (Play, Download, Delete)
      const actionsEl = document.createElement('div');
      actionsEl.className = 'dda-vr-take-actions';

      // Play Button
      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = `dda-btn dda-btn-take-play ${take.isPlaying ? 'dda-playing' : ''}`;
      playBtn.title = take.isPlaying ? 'Pause playback' : 'Play take';
      playBtn.innerHTML = `
        <span class="dda-vr-btn-icon">${take.isPlaying ? (ICONS ? ICONS.stop(11) : '⏸') : (ICONS ? ICONS.play(11) : '▶')}</span>
        <span class="dda-vr-btn-label">${take.isPlaying ? 'Pause' : 'Play'}</span>
      `;
      playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePlayback(take.id);
      });

      // Download Button (WAV for AI compatibility)
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'dda-btn dda-btn-take-download';
      downloadBtn.title = 'Download AI-compatible audio (.wav for Gemini / ChatGPT)';
      downloadBtn.innerHTML = `
        <span class="dda-vr-btn-icon">${ICONS ? ICONS.download(12) : '⬇'}</span>
        <span class="dda-vr-btn-label">Download .WAV</span>
      `;
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.downloadRecording(take.id);
      });

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'dda-btn dda-btn-take-delete';
      deleteBtn.title = 'Delete take';
      deleteBtn.innerHTML = `
        <span class="dda-vr-btn-icon">${ICONS ? ICONS.trash(12) : '🗑'}</span>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteRecording(take.id);
      });

      actionsEl.appendChild(playBtn);
      actionsEl.appendChild(downloadBtn);
      actionsEl.appendChild(deleteBtn);

      itemEl.appendChild(infoEl);
      itemEl.appendChild(actionsEl);

      this.listContainerEl.appendChild(itemEl);
    });
  }

  /**
   * Render Voice Recorder component
   */
  render(targetContainer, insertBeforeEl = null) {
    if (!targetContainer) return null;

    // Prevent duplicate rendering
    const existing = targetContainer.querySelector('.dda-voice-recorder-container');
    if (existing) {
      this.containerEl = existing;
      this.listContainerEl = existing.querySelector('.dda-vr-recordings-list');
      return existing;
    }

    const container = document.createElement('div');
    container.className = 'dda-voice-recorder-container dda-vr-compact';

    // Toolbar Row
    const actionRow = document.createElement('div');
    actionRow.className = 'dda-vr-action-row';

    // Record Button
    this.recordBtn = document.createElement('button');
    this.recordBtn.type = 'button';
    this.recordBtn.className = 'dda-btn dda-btn-record';
    this.recordBtn.title = 'Record your voice';
    this.recordBtn.innerHTML = `
      <span class="dda-vr-btn-icon">${ICONS ? ICONS.mic(13) : '🎙️'}</span>
      <span class="dda-vr-btn-label">Record Voice</span>
    `;
    this.recordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startRecording();
    });

    // Stop Button
    this.stopBtn = document.createElement('button');
    this.stopBtn.type = 'button';
    this.stopBtn.className = 'dda-btn dda-btn-stop-record';
    this.stopBtn.title = 'Stop recording';
    this.stopBtn.style.display = 'none';
    this.stopBtn.innerHTML = `
      <span class="dda-vr-btn-icon dda-anim-pulse">${ICONS ? ICONS.stop(12) : '⏹'}</span>
      <span class="dda-vr-btn-label">Stop</span>
    `;
    this.stopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.stopRecording();
    });

    // Timer Display
    this.timerDisplay = document.createElement('span');
    this.timerDisplay.className = 'dda-vr-timer';
    this.timerDisplay.textContent = '00:00';
    this.timerDisplay.style.display = 'none';

    actionRow.appendChild(this.recordBtn);
    actionRow.appendChild(this.stopBtn);
    actionRow.appendChild(this.timerDisplay);
    container.appendChild(actionRow);

    // Multi-recording List Container
    this.listContainerEl = document.createElement('div');
    this.listContainerEl.className = 'dda-vr-recordings-list';
    this.listContainerEl.style.display = 'none';
    container.appendChild(this.listContainerEl);

    this.containerEl = container;

    if (insertBeforeEl && insertBeforeEl.parentNode === targetContainer) {
      targetContainer.insertBefore(container, insertBeforeEl);
    } else {
      targetContainer.appendChild(container);
    }

    this.renderRecordingsList();
    return container;
  }
}

// Instantiate singleton on window
if (typeof window !== 'undefined') {
  window.VoiceRecorder = new VoiceRecorder();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceRecorder, audioBufferToWav, blobToWavBlob };
}
