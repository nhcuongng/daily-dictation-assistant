# Changelog - Daily Dictation Assistant

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-08-31 (Phase 1.1: Compact Speed Pill & Visual Customizable Presets)

### Added
- **Compact Speed Trigger Pill**: Replaced the bulky native HTML5 range slider with a sleek, pill-shaped button (`[ ⚡ 1.0x ▾ ]`) embedded seamlessly next to the native audio player.
- **Speed Popover Panel**: Added an anchored floating popover with smooth entrance animations, elevation shadows, and full dark/light theme support.
  - **Quick Presets Grid**: 1-click speed selection chips (`0.75x`, `0.85x`, `1.0x`, `1.15x`, `1.25x`, `1.5x`) with active speed highlight.
  - **Fine-Tuning Slider**: Smooth continuous slider ranging from `0.5x` to `2.0x` (step `0.05x`) for precision adjustments.
  - **Quick Reset (1.0x)**: Dedicated `↺ Reset 1.0x` button in popover header and instant reset via double-click on the trigger pill.
- **Visual Custom Presets Configuration (`⚙️ Custom Presets`)**:
  - Interactive preset slots with individual mini-sliders (`0.5x` to `2.0x`) and live number badges—eliminating keyboard typing friction.
  - `＋ Add Preset` (up to 8 slots) and `✕` remove button per slot.
  - `↺ Defaults` button to restore the standard 6 preset speeds.
  - Real-time two-way synchronization between preset sliders and the Quick Presets grid.
- **Persistent Storage**: Playback speed and custom presets are automatically saved to and loaded from `chrome.storage.local`.
- **Unit Test Suite**: Added 13 comprehensive Jest tests in `tests/audio-control.test.js` covering pill rendering, popover toggling, preset interactions, visual slider configuration, and storage persistence.

### Changed
- **Zero XSS Warnings**: Refactored `AudioControl` DOM creation to 100% safe APIs (`document.createElement`, `textContent`), clearing all Chrome Web Store policy scanner warnings for this module.

---

## [1.1.0] - 2026-08-30 (Phase 2.1: Single-Row Toolbar & DailyDictation Adaptive Theme)

### Added
- **Single-Row Unified Actions Toolbar**: Combined Word Bank panel and Progressive Peek Transcript button into a single horizontal row (`.dda-actions-container`) above the textarea, maximizing vertical screen real estate.
- **Responsive Toolbar Layout**: Added `@media (max-width: 560px)` breakpoint stacking controls vertically on mobile screens.
- **Word Bank Text Truncation**: Added `text-overflow: ellipsis` on CTA tips to prevent overflow and keep Peek button layout stable.
- **Design Tokens Architecture**: Refactored entire styling into CSS custom properties (`--dda-bg-*`, `--dda-border-*`, `--dda-text-*`, `--dda-accent-*`, `--dda-peek-*`, `--dda-diff-*`).
- **DailyDictation Theme Synchronization**:
  - Automatically matches DailyDictation's Bootstrap 5 theme (`[data-bs-theme="light"]` and `[data-bs-theme="dark"]`).
  - Real-time reactive theme updates when toggling the Sun/Moon theme switcher on DailyDictation without page refresh.
  - Fallback support for OS/browser `prefers-color-scheme`.
- **Refined Light Theme**: High-contrast, clean light mode styling with subtle layered elevation shadows, pastel chip tags, and polished micro-interactions.

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
