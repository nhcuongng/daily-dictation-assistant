// Initialize Extension using MutationObserver for SPA support
function startObserver() {
  const observer = new MutationObserver((mutations) => {
    // Hide default speed control (which is usually a sibling dropdown next to the audio element)
    const audioEl = document.querySelector('audio');
    if (audioEl && audioEl.parentNode) {
      const siblings = Array.from(audioEl.parentNode.children);
      siblings.forEach(el => {
        if (el !== audioEl && !el.classList.contains('dda-speed-control')) {
          // If it's a dropdown or contains text like '1x', '1.5x'
          const text = el.textContent.trim();
          if (el.classList.contains('dropdown') || el.classList.contains('btn-group') || text.match(/^[0-9.]+x$/) || text.includes('Speed:')) {
            el.style.display = 'none';
          }
        }
      });
    }

    // If the UI is already rendered and still in the DOM, do nothing
    if (window.ddaAudioControl && document.querySelector('.dda-speed-control')) {
      return;
    }

    // Try to find the audio element
    if (audioEl && window.ddaAudioControl) {
      window.ddaAudioControl.init();
    }

    // Init deep learning loop UI
    if (window.DeepLearningLoop) {
      window.DeepLearningLoop.init();
    }
  });

  // Watch the whole body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also try once immediately in case it's already there
  if (window.ddaAudioControl) {
    window.ddaAudioControl.init();
  }
  if (window.DeepLearningLoop) {
    window.DeepLearningLoop.init();
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

// Global Hotkey feature removed as per user request (dailydictation supports it natively)
