// Background Service Worker for Daily Dictation Assistant
// Handles chrome.tts speech synthesis and background utilities

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) {
      return false;
    }

    if (message.action === 'tts_speak') {
      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (!text) {
        sendResponse({ success: false, status: 'empty' });
        return false;
      }

      try {
        if (chrome.tts) {
          chrome.tts.stop();
          chrome.tts.speak(text, {
            lang: message.lang || 'en-US',
            rate: typeof message.rate === 'number' ? message.rate : 1.0,
            onEvent: (event) => {
              if (sender && sender.tab && sender.tab.id && (event.type === 'end' || event.type === 'cancelled' || event.type === 'error')) {
                chrome.tabs.sendMessage(sender.tab.id, {
                  action: 'tts_event',
                  type: event.type,
                  errorMessage: event.errorMessage
                }).catch(() => {
                  // Tab might have navigated or closed, ignore safely
                });
              }
            }
          }, () => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ success: true, status: 'speaking' });
            }
          });
          return true; // Keep channel open for async response
        } else {
          sendResponse({ success: false, error: 'chrome.tts API not available' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (message.action === 'tts_stop') {
      try {
        if (chrome.tts) {
          chrome.tts.stop();
          sendResponse({ success: true, status: 'stopped' });
        } else {
          sendResponse({ success: false, error: 'chrome.tts API not available' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (message.action === 'tts_is_speaking') {
      try {
        if (chrome.tts && chrome.tts.isSpeaking) {
          chrome.tts.isSpeaking((speaking) => {
            sendResponse({ isSpeaking: speaking });
          });
          return true;
        } else {
          sendResponse({ isSpeaking: false });
        }
      } catch (err) {
        sendResponse({ isSpeaking: false, error: err.message });
      }
      return true;
    }

    return false;
  });
}
