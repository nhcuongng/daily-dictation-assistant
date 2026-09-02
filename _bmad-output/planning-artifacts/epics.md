---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-dicdation-assistant-2026-08-30/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-dicdation-assistant-2026-08-30/ARCHITECTURE-SPINE.md
---

# dicdation-assistant - Epic Breakdown

## Overview

Tài liệu này phân tích và phân rã các yêu cầu từ PRD, Architecture Spine và danh sách tính năng mới được yêu cầu thành các Epic và User Story chi tiết, có thể thực thi độc lập cho Daily Dictation Assistant Extension.

## Requirements Inventory

### Functional Requirements

- **FR-1**: Audio Speed Slider (0.5x - 1.5x) nhúng trực tiếp vào player.
- **FR-2**: Ẩn thanh chọn tốc độ mặc định của DailyDictation.
- **FR-3**: Vocab Prep Floating Popover (Zero Layout Shift, trích xuất từ vựng, Call to Action truyền cảm hứng).
- **FR-4**: Progressive Peek Transcript (Cứu trợ theo số lần sai: Subtle -> Warning -> Fire với Progress Bar và Dual-mode transcript).
- **FR-5**: Triệt tiêu lớp highlight mặc định (.dictation__input-highlight).
- **FR-6**: Chuẩn hóa UI Extension 100% Tiếng Anh (English UI Standard).
- **FR-7**: In-Progress State Auto-Save & Draft Text Recovery (Lưu câu dở dang, text nháp, vị trí audio).
- **FR-8**: Chrome Toolbar Action Popup & Badge Counter (Hiển thị danh sách bài đang học dở, nút Resume/Dismiss).
- **FR-9**: Smart Resume & Auto-Recovery (Tự động chuyển câu, điền draft, tua audio, focus textarea).
- **FR-10**: Cross-Device Chrome Sync (Đồng bộ chrome.storage.sync với fallback local).
- **FR-11**: Học tập & Phân tích (Theo dõi thời gian học, đếm lỗi sai hàng ngày).
- **FR-12**: Đặt mục tiêu hàng ngày (Daily Target 30 phút) & Thanh tiến độ.
- **FR-13**: Streak Tracking (Chuỗi ngày học liên tục).
- **FR-14**: Tìm kiếm & Phân loại từ vựng trong Vocab Panel (live search + category filter).
- **FR-15**: Phím tắt chuyển đổi nhanh Preset Tốc độ phát + HUD Toast hiển thị tốc độ hiện tại.
- **FR-16**: Đồng hồ bấm giờ học tập thả nổi (Draggable), hiệu ứng đa dạng theo mốc thời gian, Toggle On/Off.
- **FR-17**: Context Image Search — người học nhập cụm từ/chủ đề từ transcript để lấy ảnh minh họa ngữ cảnh từ Wikimedia Commons API (free, no key required). Graceful empty state khi < 3 kết quả.

### NonFunctional Requirements

- **NFR-1**: Không gây giật lag, không làm vỡ layout gốc của dailydictation.com.
- **NFR-2**: Không gửi dữ liệu người dùng ra server ngoài; sử dụng Wikimedia Commons API (public); lưu trữ local/sync Chrome.
- **NFR-3**: Widget kéo thả phải lưu lại tọa độ vị trí thả; giao diện tối giản, chế độ bật tắt tức thì.
- **NFR-4**: Toàn bộ text UI Extension bắt buộc sử dụng 100% Tiếng Anh (English UI Standard).
- **NFR-5**: Toàn bộ cấu hình cài đặt (Timer toggle, Hotkeys, Vị trí Widget, Tiến độ 30 phút) lưu vào chrome.storage.local/sync.

### Additional Requirements

- **AR-1**: Triển khai theo kiến trúc Content Script DOM Injection Native (Manifest V3, Zero-build Vanilla JS).
- **AR-2**: Đảm bảo các component mới (Floating Timer, Context Image Popover, Vocab Search Filter) được neo/mount an toàn, tránh bị ghi đè khi SPA re-render.
- **AR-3**: Image Search dùng Wikimedia Commons API. Nếu query trả về < 3 kết quả, hiển thị empty state "No visual context found" gracefully.

### UX Design Requirements

- **UX-DR1**: Draggable Floating Timer Widget với glow animation khi đạt mốc 10m/20m/30m, celebrate effect khi đạt 30m.
- **UX-DR2**: Search Bar + Category Chips (All / Noun / Verb / Adj / Difficult) ngay đầu Vocab Panel.
- **UX-DR3**: Context Image Popover gắn cạnh Transcript Panel — search box nhỏ, grid ảnh 2-3 cột, skeleton loading, đóng bằng Esc/Click outside.
- **UX-DR4**: HUD Speed Toast hiển thị tốc độ phát hiện tại khi nhấn Hotkey chuyển preset (tự ẩn sau 1.5 giây).

### FR Coverage Map

- **FR-1**: Epic 1 — Audio Speed Slider (0.5x–1.5x)
- **FR-2**: Epic 1 — Hide Default Speed Selector
- **FR-15**: Epic 1 — Playback Speed Presets Cycle Hotkey & HUD Toast
- **FR-3**: Epic 2 — Vocab Prep Floating Popover & Extraction
- **FR-14**: Epic 2 — Vocab Panel Live Search & Category Filter
- **FR-4**: Epic 3 — Progressive Peek Transcript (3-tier rescue)
- **FR-5**: Epic 3 — Remove Default Input Highlight Overlay
- **FR-6**: Epic 3 — Enforce 100% English UI Standard
- **FR-17**: Epic 3 — Context Image Search via Wikimedia (Transcript-linked)
- **FR-7**: Epic 4 — In-Progress State & Draft Text Auto-Save
- **FR-8**: Epic 4 — Chrome Toolbar Popup & Badge Counter
- **FR-9**: Epic 4 — Smart Resume & Context Auto-Recovery
- **FR-10**: Epic 4 — Cross-Device Chrome Storage Sync
- **FR-11**: Epic 5 — Study Time Tracking & Daily Error Stats
- **FR-12**: Epic 5 — Daily 30-Minute Target & Progress Bar
- **FR-13**: Epic 5 — Daily Streak Tracking
- **FR-16**: Epic 5 — Draggable Floating Study Timer with Milestones & Toggle

## Epic List

### Epic 1: Audio Controls & Rapid Speed Switching
Người học điều khiển tốc độ âm thanh mượt mà và chuyển đổi tức thì giữa các mức tốc độ nghe quen thuộc bằng phím tắt và thanh trượt trực quan, kèm HUD toast phản hồi ngay lập tức.
**FRs covered:** FR-1, FR-2, FR-15

### Epic 2: Vocabulary Panel — Search & Exploration
Người học tìm kiếm nhanh và phân loại từ vựng trọng tâm trong Vocab Panel trực tiếp trên bài học, với live search và category filter linh hoạt.
**FRs covered:** FR-3, FR-14

### Epic 3: Smart Feedback, Progressive Transcript & Context Image Search
Người học giảm áp lực qua transcript thông minh theo cấp độ sai, đồng thời tra cứu hình ảnh minh họa ngữ cảnh câu transcript bằng từ khóa tùy ý (Wikimedia Commons API), giúp hiểu ngữ cảnh bài nghe sâu hơn.
**FRs covered:** FR-4, FR-5, FR-6, FR-17

> ⚠️ **Architecture note:** FR-17 dùng Wikimedia Commons API (free, no key). Graceful empty state khi < 3 kết quả.

### Epic 4: In-Progress Lessons Tracker & Smart State Recovery
Người học tự tin rời bài học bất kỳ lúc nào, quản lý bài đang học dở qua Chrome Popup và phục hồi chính xác câu, nội dung nháp và vị trí audio khi tiếp tục.
**FRs covered:** FR-7, FR-8, FR-9, FR-10

### Epic 5: Study Habit Motivation & Draggable Focus Timer
Người học duy trì thói quen học tập 30 phút mỗi ngày với đồng hồ bấm giờ nổi kéo thả, hiệu ứng thị giác sinh động theo từng mốc thời gian, bật/tắt linh hoạt và theo dõi chuỗi ngày học.
**FRs covered:** FR-11, FR-12, FR-13, FR-16


---

## Epic 1: Audio Controls & Rapid Speed Switching

Người học điều khiển tốc độ âm thanh mượt mà và chuyển đổi tức thì giữa các mức tốc độ nghe quen thuộc bằng phím tắt và thanh trượt trực quan, kèm HUD toast phản hồi ngay lập tức.

### Story 1.1: Speed Slider Integration

As a dictation learner,
I want a smooth speed slider (0.5x–1.5x) injected directly next to the audio player,
So that I can adjust playback speed instantly without leaving the typing area or using the mouse to navigate elsewhere.

**Acceptance Criteria:**

**Given** the user is on a dailydictation.com lesson page
**When** the content script loads
**Then** a speed slider (range: 0.5x to 1.5x, step: 0.05x) is injected adjacent to the native audio player, anchored to the player's fixed DOM ID
**And** the default speed is set to 1.0x on first load, or to the last saved value from chrome.storage.local
**And** the default DailyDictation speed dropdowns (1x/1.5x) are hidden from view

**Given** the user drags or clicks the speed slider to a new value
**When** the slider value changes
**Then** the audio playbackRate is updated in real-time with no perceptible lag
**And** the new speed value is persisted immediately to chrome.storage.local
**And** all slider and label text is 100% in English (e.g., "Speed: 0.75x")

**Given** the user reloads the page or navigates to a new lesson
**When** the content script re-initializes
**Then** the slider restores to the last saved speed value from chrome.storage.local

### Story 1.2: Playback Speed Presets Cycle Hotkey & HUD Toast

As a dictation learner,
I want to press a keyboard shortcut to instantly cycle through preset playback speeds (0.75x → 1.0x → 1.25x → 0.75x...),
So that I can switch speed without touching the mouse or breaking my typing flow, with immediate visual feedback of the current speed.

**Acceptance Criteria:**

**Given** the user is on a dailydictation.com lesson page with focus in the tab
**When** the user presses the designated hotkey (default: Alt + S)
**Then** the playback speed cycles to the next preset in the sequence: 0.75x → 1.0x → 1.25x → 0.75x
**And** the audio playbackRate is updated immediately
**And** the speed slider (Story 1.1) visually updates to reflect the new preset value
**And** the new speed is persisted to chrome.storage.local

**Given** the speed has just been changed by hotkey
**When** the speed changes
**Then** a HUD toast notification appears on screen displaying "Speed: 0.75x"
**And** the toast auto-dismisses after 1.5 seconds with a fade-out animation
**And** the toast does NOT block the typing textarea
**And** all toast text is in English

**Given** the user triggers the hotkey rapidly in succession
**When** multiple hotkey presses occur within 1.5 seconds
**Then** the toast updates in-place (no stacking) to show the latest speed value
**And** the dismiss timer resets with each new hotkey press

---

## Epic 2: Vocabulary Panel — Search & Exploration

Người học tìm kiếm nhanh và phân loại từ vựng trọng tâm trong Vocab Panel trực tiếp trên bài học, với live search và category filter linh hoạt.

### Story 2.1: Vocab Prep Floating Popover

As a dictation learner,
I want a "Vocab Prep" trigger button that opens a floating popover with key vocabulary extracted from the lesson transcript,
So that I can quickly preview important words before listening, building mental context without causing any layout shift on the page.

**Acceptance Criteria:**

**Given** the user is on a dailydictation.com lesson page
**When** the content script loads and the lesson transcript is available (from appGlobals or accordion)
**Then** a "Vocab Prep" trigger button is injected into the page (anchored to a fixed DOM element)
**And** the button displays a randomized English Call-to-Action tip from a pool of 12+ messages (e.g., "Prime your brain!", "Unlock the words!")

**Given** the user clicks the "Vocab Prep" button
**When** the popover opens
**Then** a floating popover appears above the page content with ZERO layout shift
**And** the popover displays a list of key vocabulary words extracted from the transcript, filtered to remove common stop words
**And** all popover UI text is in English

**Given** the user clicks outside the popover or presses Escape
**When** the dismiss action occurs
**Then** the popover closes smoothly without affecting page layout
**And** the trigger button remains visible and functional for re-opening

**Given** the user navigates to a new sentence/challenge within the SPA
**When** the lesson sentence changes
**Then** the vocab list auto-refreshes to reflect the new sentence's vocabulary

### Story 2.2: Vocab Panel Live Search & Category Filter

As a dictation learner,
I want to filter and search the Key Vocab list in the Vocab Panel using a live search bar and category chips,
So that I can quickly find specific words or focus on words by type without scrolling through the entire list.

**Acceptance Criteria:**

**Given** the user has opened the Vocab Prep Popover (Story 2.1)
**When** the popover is visible with a vocab list
**Then** a search input field is displayed at the top of the vocab list with placeholder text "Search vocabulary..."
**And** category filter chips are displayed below: "All", "Noun", "Verb", "Adjective", "Difficult"

**Given** the user types into the search input
**When** each keystroke occurs (live/instant filtering)
**Then** the vocab list filters in real-time to show only words containing the search text (case-insensitive)
**And** if no words match, an empty state "No matching words found" is displayed in English

**Given** the user clicks a category chip (e.g., "Noun")
**When** the chip is selected
**Then** the vocab list filters to show only words matching that part-of-speech category
**And** the selected chip is visually highlighted
**And** the search text filter and category filter work in combination (AND logic)

**Given** the user clicks "All"
**When** the filter is cleared
**Then** all vocab words are shown again

**Given** the "Difficult" chip is selected
**When** the filter is applied
**Then** words flagged as low-frequency or difficult (based on transcript metadata or frequency heuristic) are shown
**And** if POS tagging data is unavailable for a word, that word is shown under "All" but not under POS chips (graceful degradation)

---

## Epic 3: Smart Feedback, Progressive Transcript & Context Image Search

Người học giảm áp lực qua transcript thông minh theo cấp độ sai, đồng thời tra cứu hình ảnh minh họa ngữ cảnh câu transcript bằng từ khóa tùy ý qua Wikimedia Commons API.

### Story 3.1: Progressive Peek Transcript (3-Tier Rescue)

As a dictation learner,
I want a "Peek" button that progressively reveals transcript hints based on how many times I've submitted wrong answers,
So that I get gentle encouragement when I'm struggling slightly, and stronger rescue when I'm truly stuck.

**Acceptance Criteria:**

**Given** the user is on a lesson page
**When** the "Peek" button is present
**Then** it reflects the current tier based on wrong submission count for the current sentence:
- Level 0 (0-2 wrong): Button styled as subtle/muted
- Level 1 (3-5 wrong): Button styled as warning (yellow + warning icon)
- Level 2 (6+ wrong): Button styled as fire/urgent (red + fire icon)
**And** a progress bar at the top of the button fills from 0% to 50% to 100% as tiers progress
**And** all button labels and tooltips are in English

**Given** the user clicks the "Peek" button
**When** the Peek Popover opens
**Then** Tab 1 ("Current Sentence") shows the transcript text for the current sentence with key words highlighted
**And** Tab 2 ("Full Transcript") shows the complete lesson transcript with the current sentence bolded

**Given** the user navigates to a new sentence in the SPA
**When** the sentence changes
**Then** the wrong submission counter resets to 0 for the new sentence
**And** the button returns to Level 0 styling automatically

### Story 3.2: Clean Typing Area — Remove Default Highlight Overlay

As a dictation learner,
I want the default DailyDictation input highlight overlay to be hidden,
So that my typing area stays clean and uncluttered.

**Acceptance Criteria:**

**Given** the user is on any lesson page on dailydictation.com
**When** the content script loads
**Then** the .dictation__input-highlight element is hidden via CSS injection
**And** this suppression persists across sentence navigation within the SPA
**And** removing the highlight does NOT affect the textarea's functionality or user input behavior

### Story 3.3: Enforce 100% English UI Standard

As a developer maintaining the extension,
I want all user-facing text in the extension to be 100% in English,
So that the extension maintains a consistent, professional UI standard across all features.

**Acceptance Criteria:**

**Given** any UI element injected by the extension is visible on the page
**When** the element renders
**Then** all button labels, tooltip text, toast messages, badge text, CTA tips, tab labels, filter chips, empty state messages, and popover headings are written in English only
**And** there is no mixed-language text in any injected UI element
**And** this standard applies to all features across all Epics

### Story 3.4: Context Image Search via Wikimedia Commons

As a dictation learner,
I want to search for illustrative images using a keyword or phrase from the lesson transcript,
So that I can visualize the context of the listening content and better understand unfamiliar topics without opening a new browser tab.

**Acceptance Criteria:**

**Given** the user is on a lesson page with the transcript area visible
**When** the "Search Image" input field is visible adjacent to the transcript area
**Then** the user can type a keyword or phrase (e.g., "climate summit") into the search field

**Given** the user submits a search query (Enter key or search button click)
**When** the query is sent to the Wikimedia Commons API
**Then** up to 6 relevant images are fetched and displayed in a 2-3 column image grid within a floating Popover
**And** a skeleton loading animation is shown while images are being fetched
**And** all image popover UI text is in English

**Given** the Wikimedia API returns fewer than 3 results for the query
**When** the results are rendered
**Then** an empty state message "No visual context found for '[query]'" is displayed gracefully
**And** the user can retry with a different keyword

**Given** the image popover is open
**When** the user presses Escape OR clicks outside the popover
**Then** the popover closes immediately without affecting the underlying page layout

**Given** the Wikimedia API call fails (network error, timeout)
**When** the error occurs
**Then** an error message "Could not load images. Please check your connection." is shown in the popover
**And** the extension does NOT crash or affect other functionality

---

## Epic 4: In-Progress Lessons Tracker & Smart State Recovery

Người học tự tin rời bài học bất kỳ lúc nào, quản lý bài dở qua Chrome Popup và phục hồi chính xác câu, nội dung nháp và vị trí audio khi tiếp tục.

### Story 4.1: In-Progress State & Draft Text Auto-Save

As a dictation learner,
I want the extension to automatically save my current lesson progress (sentence position, typed draft text, and audio position) as I work,
So that I never lose my place even if I close the tab or get interrupted.

**Acceptance Criteria:**

**Given** the user is actively working on a lesson
**When** the user types in the textarea
**Then** the draft text is auto-saved to chrome.storage.local with a debounce of 500ms
**And** the saved record includes: lessonId, lesson title, current sentence index, total sentence count, draft text, audio position (seconds), and last-updated timestamp

**Given** the user navigates to a different sentence within the SPA
**When** the sentence changes
**Then** the previous sentence's draft and audio position are saved
**And** a new save record is initialized for the new sentence

**Given** the user completes the final sentence of a lesson (100% progress)
**When** the lesson is marked complete
**Then** the lesson record is automatically removed from chrome.storage.local

### Story 4.2: Chrome Toolbar Popup & Badge Counter

As a dictation learner,
I want the extension icon to show a badge with the count of lessons I'm currently working on, and a popup where I can see and manage all in-progress lessons,
So that I can easily track and resume my lessons from anywhere in the browser.

**Acceptance Criteria:**

**Given** the user has one or more in-progress lessons saved
**When** the extension icon is visible in the Chrome toolbar
**Then** a badge displays the count of in-progress lessons
**And** the badge is removed when there are no in-progress lessons

**Given** the user clicks the extension toolbar icon
**When** the popup opens
**Then** a list of in-progress lessons is displayed, each showing: lesson title, progress bar, a snippet of the last draft text, and last-studied timestamp
**And** all popup UI text is in English
**And** each lesson has a "Resume" button and a "Dismiss" button

**Given** the user clicks "Dismiss" on a lesson
**When** the action is confirmed
**Then** the lesson is removed from chrome.storage.local and disappears from the popup immediately

### Story 4.3: Smart Resume & Context Auto-Recovery

As a dictation learner,
I want clicking "Resume" on an in-progress lesson to take me directly back to the exact sentence I was on, with my draft text restored and audio cued to where I left off,
So that I can continue learning seamlessly from exactly where I stopped.

**Acceptance Criteria:**

**Given** the user clicks "Resume" on an in-progress lesson in the popup
**When** the lesson page loads (or is already open in a tab)
**Then** the extension automatically navigates to the saved sentence index within the SPA
**And** the typed draft text is restored into the textarea
**And** the audio is cued (seeked) to the saved timestamp in seconds
**And** focus is set to the textarea so the user can begin typing immediately

**Given** the target lesson page is already open in another tab
**When** the user clicks "Resume"
**Then** the browser switches to that existing tab and applies the auto-recovery
**And** the popup closes after successful resume initiation

### Story 4.4: Cross-Device Chrome Storage Sync

As a dictation learner using multiple devices,
I want my in-progress lesson list to sync across all my Chrome profiles/devices,
So that I can start a lesson on one device and continue it on another.

**Acceptance Criteria:**

**Given** the user has chrome.storage.sync available and quota is not exceeded
**When** lesson progress is saved
**Then** the data is written to chrome.storage.sync in addition to chrome.storage.local as a local cache

**Given** chrome.storage.sync is unavailable or quota is exceeded
**When** the save attempt fails
**Then** the extension falls back gracefully to chrome.storage.local only with no error surfaced to the user

**Given** a conflict occurs (same lessonId updated on two devices simultaneously)
**When** the sync resolves
**Then** the Last-Write-Wins strategy is applied using the lastUpdated timestamp

---

## Epic 5: Study Habit Motivation & Draggable Focus Timer

Người học duy trì thói quen học tập 30 phút mỗi ngày với đồng hồ bấm giờ nổi kéo thả, hiệu ứng thị giác sinh động theo từng mốc thời gian, bật/tắt linh hoạt và theo dõi chuỗi ngày học.

### Story 5.1: Study Time Tracking & Daily Statistics

As a dictation learner,
I want the extension to track how many minutes I've studied today and how many errors I've made,
So that I have real data on my daily learning effort.

**Acceptance Criteria:**

**Given** the user is actively on a dailydictation.com lesson page with the tab focused
**When** the user is typing or interacting with the audio player
**Then** the extension increments a session timer stored in chrome.storage.local under today's date key
**And** every wrong submission increments today's error count in chrome.storage.local

**Given** the date changes (midnight) while the user has stored stats
**When** the new day begins
**Then** a new daily stats record is created for the new date
**And** previous days' data is retained for streak calculation

### Story 5.2: Draggable Floating Study Timer with Milestone Effects & Toggle

As a dictation learner,
I want a draggable floating timer widget that shows my daily study progress toward a 30-minute goal with visual milestone effects, and the ability to turn it off when it's distracting,
So that I stay motivated during study sessions without feeling pressured or annoyed.

**Acceptance Criteria:**

**Given** the Timer feature is enabled (default: ON) in extension settings
**When** the user is on a dailydictation.com lesson page
**Then** a compact floating timer widget is injected showing elapsed time today (e.g., "12:34 / 30:00")
**And** the widget is draggable — the user can click-and-drag it to any position on the screen
**And** the widget's last position is saved to chrome.storage.local and restored on next page load

**Given** the timer is running and the user reaches a milestone
**When** elapsed time crosses 10 minutes
**Then** the widget applies a blue glow/pulse animation ("Warming up!")
**When** elapsed time crosses 20 minutes
**Then** the widget applies an orange/amber glow animation ("Getting there!")
**When** elapsed time crosses 30 minutes (goal reached)
**Then** a celebratory confetti/fireworks animation plays for 3 seconds
**And** the widget displays "Goal reached!" with a green highlight
**And** all widget text is in English

**Given** the user toggles "Study Timer" to OFF in extension popup settings
**When** the toggle is disabled
**Then** the floating timer widget is immediately hidden from the page
**And** the preference is saved to chrome.storage.local
**And** the timer stops accumulating time while disabled

**Given** the Timer is disabled and the user re-enables it
**When** the toggle is turned ON
**Then** the widget reappears at its last saved position and resumes counting from the already-elapsed time for today

### Story 5.3: Daily Streak Tracking

As a dictation learner,
I want to see how many consecutive days I've studied,
So that I feel motivated to maintain my learning habit.

**Acceptance Criteria:**

**Given** the user has studied for at least 1 minute on a given day
**When** the day's study session is recorded
**Then** that day is marked as a "studied day" in chrome.storage.local

**Given** the user opens the extension popup
**When** streak data is available
**Then** the popup displays the current streak count (e.g., "7-day streak!")
**And** if the user missed yesterday, the streak resets to 0 or 1 (today only)
**And** all streak text is in English

**Given** the user has a streak of 0
**When** the popup is opened
**Then** an encouraging message "Start your streak today!" is shown in English

### Story 5.4: Daily 30-Minute Target & Progress Indicator

As a dictation learner,
I want to see my progress toward a daily 30-minute study goal displayed clearly,
So that I know exactly how much more time I need to study to hit my daily target.

**Acceptance Criteria:**

**Given** the user opens the extension popup
**When** study time data is available for today
**Then** a progress bar is shown indicating today's study time vs. the 30-minute target (e.g., "18 / 30 min")
**And** the progress bar fills proportionally (0% to 100%)
**And** once 30 minutes is exceeded, the bar shows 100% with a "Daily goal achieved!" message
**And** all text is in English

**Given** no study time has been recorded yet today
**When** the popup is opened
**Then** the bar shows 0% with message "Study today to reach your goal!"
