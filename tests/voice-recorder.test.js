const { VoiceRecorder, audioBufferToWav, blobToWavBlob } = require('../scripts/voice-recorder.js');

describe('VoiceRecorder & WAV Encoder', () => {
  let recorder;
  let mockMediaStream;
  let mockMediaRecorderInstance;

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();

    // Mock MediaStream
    const mockTrack = { stop: jest.fn(), readyState: 'live' };
    mockMediaStream = {
      active: true,
      getAudioTracks: jest.fn().mockReturnValue([mockTrack]),
      getTracks: jest.fn().mockReturnValue([mockTrack])
    };

    // Mock MediaRecorder
    mockMediaRecorderInstance = {
      start: jest.fn(),
      stop: jest.fn(function() {
        if (this.onstop) this.onstop();
      }),
      state: 'recording',
      mimeType: 'audio/webm',
      ondataavailable: null,
      onstop: null
    };

    global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorderInstance);
    global.MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(true);

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
      },
      writable: true,
      configurable: true
    });

    // Mock URL.createObjectURL & revokeObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-audio-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock HTML Audio Element
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      ended: false
    }));

    // Mock AudioContext and decodeAudioData
    const mockAudioBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(44100))
    };

    global.AudioContext = jest.fn().mockImplementation(() => ({
      decodeAudioData: jest.fn().mockResolvedValue(mockAudioBuffer),
      close: jest.fn().mockResolvedValue(undefined)
    }));

    recorder = new VoiceRecorder();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('audioBufferToWav & blobToWavBlob', () => {
    test('encodes AudioBuffer into valid RIFF WAV with 16-bit PCM format', () => {
      const pcmSamples = new Float32Array([0.0, 0.5, -0.5, 0.99, -0.99]);
      const mockBuffer = {
        numberOfChannels: 1,
        sampleRate: 44100,
        length: pcmSamples.length,
        getChannelData: jest.fn().mockReturnValue(pcmSamples)
      };

      const wavArrayBuffer = audioBufferToWav(mockBuffer);
      expect(wavArrayBuffer).toBeInstanceOf(ArrayBuffer);

      const view = new DataView(wavArrayBuffer);
      // Check RIFF header
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      expect(riff).toBe('RIFF');

      // Check WAVE identifier
      const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      expect(wave).toBe('WAVE');

      // Check fmt subchunk
      const fmt = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
      expect(fmt).toBe('fmt ');

      // Check AudioFormat (1 = PCM)
      expect(view.getUint16(20, true)).toBe(1);
      // Check NumChannels (1 = Mono)
      expect(view.getUint16(22, true)).toBe(1);
      // Check SampleRate (44100)
      expect(view.getUint32(24, true)).toBe(44100);
      // Check BitsPerSample (16)
      expect(view.getUint16(34, true)).toBe(16);

      // Check data subchunk
      const dataHeader = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
      expect(dataHeader).toBe('data');
    });

    test('downmixes multi-channel audio to mono for speech optimization', () => {
      const ch0 = new Float32Array([0.2, 0.4]);
      const ch1 = new Float32Array([0.4, 0.8]);
      const mockStereoBuffer = {
        numberOfChannels: 2,
        sampleRate: 44100,
        length: 2,
        getChannelData: jest.fn((ch) => (ch === 0 ? ch0 : ch1))
      };

      const wavArrayBuffer = audioBufferToWav(mockStereoBuffer, { float32: false });
      expect(wavArrayBuffer.byteLength).toBe(44 + 2 * 2); // 44 bytes header + 2 samples * 2 bytes
    });

    test('blobToWavBlob converts raw Blob to audio/wav Blob', async () => {
      const inputBlob = new Blob(['mock-audio'], { type: 'audio/webm' });
      inputBlob.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(100));

      const wavBlob = await blobToWavBlob(inputBlob);
      expect(wavBlob).not.toBeNull();
      expect(wavBlob.type).toBe('audio/wav');
    });
  });

  describe('formatTime', () => {
    test('formats seconds to MM:SS format correctly', () => {
      expect(recorder.formatTime(0)).toBe('00:00');
      expect(recorder.formatTime(5)).toBe('00:05');
      expect(recorder.formatTime(59)).toBe('00:59');
      expect(recorder.formatTime(60)).toBe('01:00');
      expect(recorder.formatTime(75)).toBe('01:15');
      expect(recorder.formatTime(3599)).toBe('59:59');
    });
  });

  describe('UI Rendering & Elements', () => {
    test('renders compact container with record button, tip, and hidden list initially', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);

      const rendered = recorder.render(parent);
      expect(rendered).not.toBeNull();
      expect(parent.querySelector('.dda-voice-recorder-container')).not.toBeNull();

      expect(recorder.recordBtn).not.toBeNull();
      expect(recorder.stopBtn).not.toBeNull();
      expect(recorder.listContainerEl).not.toBeNull();
      expect(recorder.tipEl).not.toBeNull();
      expect(recorder.tipEl.textContent).toContain('Tip: Speak loudly & slowly to shadow');

      // Check initial visibility in idle state
      expect(recorder.recordBtn.style.display).not.toBe('none');
      expect(recorder.stopBtn.style.display).toBe('none');
      expect(recorder.listContainerEl.style.display).toBe('none');
    });

    test('avoids duplicate render in same container', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);

      const first = recorder.render(parent);
      const second = recorder.render(parent);

      expect(first).toBe(second);
      expect(parent.querySelectorAll('.dda-voice-recorder-container').length).toBe(1);
    });
  });

  describe('Multi-Take Recording Lifecycle', () => {
    test('starts recording when startRecording is called', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      await recorder.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(global.MediaRecorder).toHaveBeenCalledWith(mockMediaStream, { mimeType: 'audio/webm;codecs=opus' });
      expect(mockMediaRecorderInstance.start).toHaveBeenCalledWith(100);
      expect(recorder.isRecording).toBe(true);

      expect(recorder.recordBtn.style.display).toBe('none');
      expect(recorder.stopBtn.style.display).toBe('inline-flex');
      expect(recorder.timerDisplay.style.display).toBe('inline-flex');
    });

    test('updates timer interval while recording and auto-stops at 180s', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      await recorder.startRecording();

      jest.advanceTimersByTime(3000);
      expect(recorder.recordingDuration).toBe(3);
      expect(recorder.timerDisplay.textContent).toBe('00:03');

      // Advance to 180s to trigger auto-stop
      jest.advanceTimersByTime(177000);
      expect(recorder.isRecording).toBe(false);
    });

    test('allows recording multiple takes with newest take placed first', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      // Record Take 1
      await recorder.startRecording();
      mockMediaRecorderInstance.ondataavailable({ data: new Blob(['take1-data'], { type: 'audio/webm' }) });
      recorder.recordingDuration = 4;
      recorder.stopRecording();

      expect(recorder.recordings.length).toBe(1);
      expect(recorder.recordings[0].takeNumber).toBe(1);
      expect(recorder.recordings[0].duration).toBe(4);
      expect(recorder.listContainerEl.style.display).toBe('flex');
      expect(recorder.listContainerEl.querySelectorAll('.dda-vr-take-item').length).toBe(1);
      expect(recorder.recordBtn.textContent).toContain('Record Another Take');

      // Record Take 2
      await recorder.startRecording();
      mockMediaRecorderInstance.ondataavailable({ data: new Blob(['take2-data'], { type: 'audio/webm' }) });
      recorder.recordingDuration = 7;
      recorder.stopRecording();

      expect(recorder.recordings.length).toBe(2);
      // Newest take (Take 2) should be at index 0 (top of the list)
      expect(recorder.recordings[0].takeNumber).toBe(2);
      expect(recorder.recordings[0].duration).toBe(7);
      expect(recorder.recordings[1].takeNumber).toBe(1);
      expect(recorder.recordings[1].duration).toBe(4);

      const items = recorder.listContainerEl.querySelectorAll('.dda-vr-take-item');
      expect(items.length).toBe(2);
      expect(items[0].querySelector('.dda-vr-take-badge').textContent).toContain('Take #2');
      expect(items[1].querySelector('.dda-vr-take-badge').textContent).toContain('Take #1');

      // Verify getUserMedia was called ONLY once because the warm stream was reused
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });

    test('prewarms microphone stream on mouseenter without starting recording', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordBtn.dispatchEvent(new Event('mouseenter'));
      await Promise.resolve();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
      expect(recorder.isRecording).toBe(false);
      expect(recorder.stream).not.toBeNull();
    });

    test('handles microphone permission denial gracefully', async () => {
      navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      await recorder.startRecording();

      expect(recorder.isRecording).toBe(false);
      expect(recorder.containerEl.querySelector('.dda-vr-toast')).not.toBeNull();
      expect(recorder.containerEl.querySelector('.dda-vr-toast').textContent).toContain('Microphone access denied');
    });
  });

  describe('Playback Management', () => {
    test('plays and pauses specific take independently', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', duration: 5, isPlaying: false },
        { id: 'take_2', takeNumber: 2, blob: new Blob(['2']), url: 'blob:take-2', duration: 8, isPlaying: false }
      ];
      recorder.renderRecordingsList();

      // Play take 1
      recorder.playRecording('take_1');
      expect(global.Audio).toHaveBeenCalledWith('blob:take-1');
      expect(recorder.activePlayingId).toBe('take_1');
      expect(recorder.recordings[0].isPlaying).toBe(true);
      expect(recorder.recordings[1].isPlaying).toBe(false);

      // Play take 2 (should stop take 1 and start take 2)
      recorder.playRecording('take_2');
      expect(global.Audio).toHaveBeenCalledWith('blob:take-2');
      expect(recorder.activePlayingId).toBe('take_2');
      expect(recorder.recordings[0].isPlaying).toBe(false);
      expect(recorder.recordings[1].isPlaying).toBe(true);

      // Pause all playback
      recorder.pauseAllPlayback();
      expect(recorder.activePlayingId).toBeNull();
      expect(recorder.recordings[1].isPlaying).toBe(false);
    });

    test('toggles playback for a take', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', duration: 5, isPlaying: false }
      ];
      recorder.renderRecordingsList();

      recorder.togglePlayback('take_1');
      expect(recorder.activePlayingId).toBe('take_1');

      recorder.togglePlayback('take_1');
      expect(recorder.activePlayingId).toBeNull();
    });
  });

  describe('Download Take Audio in WAV format', () => {
    test('creates download link with sentence index and .wav extension', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.challengeIndex = 2; // Challenge #3
      const wavBlob = new Blob(['RIFFwavdata'], { type: 'audio/wav' });

      recorder.recordings = [
        {
          id: 'take_1',
          takeNumber: 1,
          blob: new Blob(['1'], { type: 'audio/webm' }),
          url: 'blob:take-1',
          wavBlob: wavBlob,
          wavUrl: 'blob:take-1-wav',
          duration: 5,
          isPlaying: false
        },
        {
          id: 'take_2',
          takeNumber: 2,
          blob: new Blob(['2'], { type: 'audio/webm' }),
          url: 'blob:take-2',
          wavBlob: wavBlob,
          wavUrl: 'blob:take-2-wav',
          duration: 8,
          isPlaying: false
        }
      ];

      let clicked = false;
      let downloadFilename = '';
      let downloadHref = '';

      const origAppend = document.body.appendChild;
      document.body.appendChild = jest.fn((el) => {
        if (el.tagName === 'A') {
          downloadFilename = el.download;
          downloadHref = el.href;
          el.click = () => { clicked = true; };
        }
        return origAppend.call(document.body, el);
      });

      const success = await recorder.downloadRecording('take_2');

      expect(success).toBe(true);
      expect(clicked).toBe(true);
      expect(downloadHref).toBe('blob:take-2-wav');
      expect(downloadFilename).toMatch(/^daily-dictation-recording-sentence-3-take-2-\d{4}-\d{2}-\d{2}\.wav$/);
    });

    test('returns false when downloading nonexistent take', async () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      const success = await recorder.downloadRecording('nonexistent_id');
      expect(success).toBe(false);
    });
  });

  describe('Delete Take', () => {
    test('deletes specific take and revokes its URLs', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', wavUrl: 'blob:take-1-wav', duration: 5, isPlaying: false },
        { id: 'take_2', takeNumber: 2, blob: new Blob(['2']), url: 'blob:take-2', wavUrl: 'blob:take-2-wav', duration: 8, isPlaying: false }
      ];
      recorder.renderRecordingsList();

      recorder.deleteRecording('take_1');

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1-wav');
      expect(recorder.recordings.length).toBe(1);
      expect(recorder.recordings[0].id).toBe('take_2');
      expect(recorder.listContainerEl.querySelectorAll('.dda-vr-take-item').length).toBe(1);
    });

    test('deleting last remaining take updates UI to empty state', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', duration: 5, isPlaying: false }
      ];
      recorder.renderRecordingsList();
      recorder.setRecordingState(false);

      recorder.deleteRecording('take_1');

      expect(recorder.recordings.length).toBe(0);
      expect(recorder.listContainerEl.style.display).toBe('none');
      expect(recorder.recordBtn.textContent).toContain('Record Voice');
    });
  });

  describe('Reset & Challenge Change', () => {
    test('resets all recordings and revokes all URLs', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', wavUrl: 'blob:take-1-wav', duration: 5, isPlaying: false },
        { id: 'take_2', takeNumber: 2, blob: new Blob(['2']), url: 'blob:take-2', wavUrl: 'blob:take-2-wav', duration: 8, isPlaying: false }
      ];
      recorder.renderRecordingsList();

      recorder.reset();

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-1-wav');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-2');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:take-2-wav');
      expect(recorder.recordings.length).toBe(0);
      expect(recorder.listContainerEl.style.display).toBe('none');
    });

    test('onChallengeChange updates challenge index and resets state', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      recorder.render(parent);

      recorder.recordings = [
        { id: 'take_1', takeNumber: 1, blob: new Blob(['1']), url: 'blob:take-1', duration: 5, isPlaying: false }
      ];

      recorder.onChallengeChange(4);
      expect(recorder.challengeIndex).toBe(4);
      expect(recorder.recordings.length).toBe(0);
    });
  });
});
