# Changelog - Daily Dictation Assistant

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-30 (Phase 1 & Phase 2 Complete)

### Added
- **Speed Control Slider (Phase 1)**: Integrated audio speed adjustment (0.5x to 1.5x, step 0.1x) embedded next to the native audio player. Automatically suppresses redundant native speed dropdowns.
- **Vocab Prep Floating Popover (Phase 2)**:
  - Fixed-height trigger bar positioned above the textarea displaying randomized English Call-to-Action tips and word count badge.
  - Floating modal popover (`position: absolute; z-index: 9999`) displaying vocabulary chips with 0% Cumulative Layout Shift (CLS).
  - Stop-words filter (>4 character filtering) and multi-strategy transcript extraction (`window.appGlobals`, `#transcriptAccordionItem`, JSON-LD).
  - Close support via `✖` button, click-outside (backdrop), and `Esc` key.
- **Progressive Peek Transcript (Phase 2)**:
  - State machine with 3 progressive rescue levels based on wrong submissions:
    - **Level 0 (0-2 wrong)**: Subtle / Discreet mode (`opacity: 0.7`).
    - **Level 1 (3-5 wrong)**: Warning Amber mode (`⚠️` with glowing border and encouragement tips).
    - **Level 2 (>= 6 wrong)**: Fire Rescue mode (`🔥` with pulsing red border and rescue tips).
  - **Top Edge Progress Bar**: Mini progress bar (`top: 0`, 3px height) visually representing error progression (0% ➡️ 50% ➡️ 100%).
  - **Dual-Mode Floating Popover**:
    - *Tab 1 (Current Sentence)*: Displays only the sentence for the active challenge.
    - *Tab 2 (Full Transcript)*: Displays all story sentences with the active sentence highlighted and bolded.
  - **Real-time Active Challenge Detection**: Multi-tier detection via React Aria pagination regex (`<span>N</span> / <span>Total</span>`), audio element `src` matching, and active UI buttons.
  - **Per-Challenge Tracking**: Wrong attempts are isolated per challenge index and reset automatically on SPA navigation.
- **Strict English UI Standard**: 100% English UI text across all extension controls, tooltips, CTAs, badges, and feedback messages.
- **CSS Highlight Suppression**: Forcefully hides DailyDictation's native `.dictation__input-highlight` layer to keep the typing area clean.

### Removed / Deferred
- Removed **Clear Text** button and **Pin Mode (Float/Inline toggle)** to keep the UI clean and clutter-free.
- Deferred **Check Errors** button from the UI at the end of Phase 2.

### Fixed
- Fixed Manifest loading errors by generating valid PNG icon assets (`icon16.png`, `icon48.png`, `icon128.png`).
- Fixed transcript scraper bug that mistakenly extracted promo banner text (`.text-success`).
- Fixed layout shift when expanding vocabulary by switching from accordion to anchored floating popovers.
- Fixed SPA navigation bug where challenge index was stuck at challenge #1 by adding React Aria regex parser.
