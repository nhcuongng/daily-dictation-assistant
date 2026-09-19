// Initialize Extension using MutationObserver for SPA support with debounce
function startObserver() {
  let isScheduled = false;

  const runUpdates = () => {
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

    // Hide DailyDictation native input highlight layer if present
    const highlightElements = document.querySelectorAll('.dictation__input-highlight, #dictation__input-highlight, [class*="dictation__input-highlight"]');
    highlightElements.forEach(el => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
    });

    // Try to find the audio element and init speed control
    if (audioEl && window.ddaAudioControl) {
      window.ddaAudioControl.init();
      window.ddaAudioControl.syncPlaybackRate();
    }

    // Init and check deep learning loop UI
    if (window.DeepLearningLoop) {
      window.DeepLearningLoop.init();
      window.DeepLearningLoop.checkCurrentChallengeChange();
      window.DeepLearningLoop.renderNavTabFullAudioButton();
    }
  };

  const observer = new MutationObserver((mutations) => {
    // Ignore mutations originating entirely from internal extension elements (.dda-*)
    const isOnlyDda = mutations.every(m => {
      const target = m.target;
      if (!target) return true;
      if (target.nodeType === 1) {
        const classNames = target.className;
        if (typeof classNames === 'string' && classNames.includes('dda-')) return true;
        if (typeof target.closest === 'function' && target.closest('[class*="dda-"]')) return true;
      } else if (target.parentElement && typeof target.parentElement.closest === 'function') {
        if (target.parentElement.closest('[class*="dda-"]')) return true;
      }
      return false;
    });

    if (isOnlyDda) return;

    if (isScheduled) return;
    isScheduled = true;

    const scheduleFn = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb => setTimeout(cb, 30));
    scheduleFn(() => {
      isScheduled = false;
      runUpdates();
    });
  });

  // Watch the whole body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also run once immediately
  runUpdates();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}

// Global Hotkey feature removed as per user request (dailydictation supports it natively)
