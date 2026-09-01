---
title: 'In-Progress Lessons Tracker & Smart Resume with Sync'
type: 'feature'
created: '2026-09-01'
status: 'ready-for-dev'
baseline_commit: 'HEAD'
review_loop_iteration: 0
context:
  - '_bmad-output/planning-artifacts/prds/prd-dicdation-assistant-2026-08-30/prd.md'
  - 'manifest.json'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 
Người học dictation trên `dailydictation.com` thường xuyên bị gián đoạn giữa chừng (đóng tab, tắt máy, chuyển máy tính). Khi quay lại, họ không nhớ mình đang học dở bài nào, câu số mấy, và bị mất toàn bộ nội dung văn bản đang gõ dở (draft text) cũng như vị trí audio đang nghe dở, gây ức chế và làm giảm tỷ lệ duy trì học tập (retention).

**Approach:**
1. **Auto Progress & State Tracker**: Tự động lưu tiến độ học của từng bài (Lesson ID, Title, Câu hiện tại, Tổng số câu, Draft text đang gõ dở, Audio timestamp).
2. **Action Popup & Toolbar Badge**: Thêm popup trên Chrome toolbar hiển thị danh sách các bài đang học dở (Progress %, Draft preview snippet, Time ago) và Badge đếm số lượng trên toolbar icon.
3. **Smart Resume & State Recovery**: Khi click Resume từ Popup, tự động mở tab bài học, kích hoạt chuyển đến đúng câu dở dang, tự động điền lại Draft text vào `textarea`, tua `audio` đến vị trí giây đã dừng, và focus vào ô gõ.
4. **Cross-Device Chrome Sync**: Đồng bộ danh sách bài dở dang qua `chrome.storage.sync` (với fallback `chrome.storage.local`) để người dùng học liền mạch trên nhiều thiết bị dùng chung Google Account.
5. **Auto Cleanup on Completion**: Tự động xóa bài học khỏi danh sách In-Progress khi người dùng hoàn thành 100% câu cuối cùng.

## Boundaries & Constraints

**Always:**
- **Extension UI Standard**: Toàn bộ giao diện Popup (Labels, Buttons, Tooltips, Empty State, Badges) **bắt buộc 100% Tiếng Anh (English)**.
- **Storage Limits**: Tuân thủ hạn mức `chrome.storage.sync` (tối đa 8KB/item, tổng 100KB). Giới hạn danh sách tối đa 15 bài dở dang gần nhất (LRU eviction).
- **Debounce Input**: Lưu Draft text với debounce 500ms để tránh ghi storage liên tục.
- **Non-blocking & Fallback**: Nếu `chrome.storage.sync` bị vô hiệu hóa hoặc quá quota, tự động fallback sang `chrome.storage.local` mà không gây lỗi giao diện.

**Never:**
- Không lưu các bài học đã hoàn thành 100% trong danh sách In-Progress.
- Không làm vỡ layout trang web DailyDictation gốc.
- Không yêu cầu quyền ngoài `storage`, `tts`, `activeTab` không cần thiết.

## Data Schema (`chrome.storage.sync` / `chrome.storage.local`)

```typescript
interface InProgressLesson {
  lessonId: string;            // e.g. "/topics/short-stories/the-lion-and-the-mouse"
  title: string;               // e.g. "The Lion and the Mouse"
  topic?: string;              // e.g. "Short Stories"
  url: string;                 // Full lesson URL
  currentSentence: number;     // 1-based index (e.g. 4)
  totalSentences: number;      // Total challenges (e.g. 10)
  progressPercent: number;     // e.g. 40
  draftText?: string;          // User's unsubmitted text in textarea for current challenge
  audioCurrentTime?: number;   // Timestamp in seconds of current challenge audio
  updatedAt: number;           // Unix timestamp (ms) for LRU and Last-Write-Wins
  isCompleted?: boolean;       // Completed flag
}

interface DDAStorageState {
  dda_in_progress_lessons: Record<string, InProgressLesson>; // Keyed by lessonId
}
```

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| :--- | :--- | :--- | :--- |
| **Người dùng gõ câu trong bài học** | Nhập text vào textarea, đổi câu, hoặc nghe audio | Sau 500ms debounce, lưu trạng thái `{ lessonId, currentSentence, draftText, audioCurrentTime, updatedAt }` vào storage. Cập nhật Badge trên icon. | Nếu không lấy được `lessonId`, bỏ qua an toàn. |
| **Hoàn thành câu cuối (100%)** | User submit đúng câu cuối cùng của bài học | Xóa bài học đó khỏi `dda_in_progress_lessons`. Giảm số đếm trên Toolbar Badge. | Đồng bộ lại storage và cập nhật UI popup nếu đang mở. |
| **Mở Chrome Toolbar Popup** | Click icon Extension trên thanh công cụ Chrome | Mở popup hiển thị danh sách bài đang dở dang sắp xếp theo `updatedAt` mới nhất. | Nếu danh sách rỗng, hiển thị Empty State thân thiện kèm nút mở Daily Dictation. |
| **Click "Resume" từ Popup** | Click vào card bài học hoặc nút Resume | Mở tab hoặc focus tab chứa URL bài học kèm tham số resume. Khi trang load xong, tự động nhảy tới câu dở dang, điền lại `draftText`, tua audio và focus textarea. | Nếu audio chưa load xong, chờ event `canplay`/`loadeddata` rồi mới gán `currentTime`. |
| **Click "Dismiss / Delete"** | Click icon thùng rác trên card bài học trong Popup | Xóa bài học khỏi danh sách In-Progress ngay lập tức, cập nhật lại Badge. | Hiển thị trạng thái xóa mượt mà (fade out card). |
| **Học trên 2 thiết bị khác nhau** | Đồng bộ qua Chrome Sync | Thiết bị B nhận thay đổi từ Thiết bị A qua `chrome.storage.onChanged`. Giải quyết xung đột theo nguyên tắc **Last-Write-Wins** (`updatedAt`). | Nếu Sync lỗi/mất mạng, lưu Local và đồng bộ lại khi online. |

</frozen-after-approval>

## Epics & User Stories Breakdown

### 🎯 Epic 1: Auto-Tracking & State Persistence
- **Story 1.1: Content Script Lesson Progress Observer**
  - Tự động trích xuất `lessonId`, `title`, `currentSentenceIndex`, `totalChallenges` từ DOM và `appGlobals`.
  - Lắng nghe thay đổi câu (SPA navigation, pagination click) để cập nhật tiến độ.
- **Story 1.2: Draft Text & Audio Timestamp Capture**
  - Bắt sự kiện `input` trên `textarea` với debounce 500ms để lưu bản nháp chưa nộp.
  - Bắt sự kiện `timeupdate` trên thẻ `audio` để ghi nhận vị trí giây hiện tại.
  - Xóa draft khi câu hiện tại được submit thành công.
- **Story 1.3: Storage Manager with Chrome Sync & LRU Eviction**
  - Đóng gói module `StorageManager` hỗ trợ `chrome.storage.sync` với fallback `chrome.storage.local`.
  - Giới hạn lưu tối đa 15 bài học gần nhất (tự động xóa bài cũ nhất khi vượt ngưỡng).
  - Tự động xóa bài học khi hoàn thành 100%.

### 🎯 Epic 2: Toolbar Action Popup & Badge Indicator
- **Story 2.1: Toolbar Badge Realtime Synchronization**
  - Service Worker (`background.js`) theo dõi `chrome.storage.onChanged`.
  - Cập nhật badge text và màu nền trên toolbar icon (`chrome.action.setBadgeText`).
- **Story 2.2: Extension Action Popup UI (100% English)**
  - Xây dựng `popup/popup.html`, `popup/popup.css`, `popup/popup.js`.
  - Header: Tiêu đề + Active badge.
  - Card view: Title, Topic, Progress Bar (`Sentence 4 of 10 • 40%`), Draft preview snippet (`📝 "The weather was..."`), Last active timestamp (`5m ago`).
  - Empty State: Hình minh họa + thông điệp truyền cảm hứng + nút CTA mở Daily Dictation.
- **Story 2.3: Quick Actions (Resume & Dismiss)**
  - Nút Resume: Điều hướng tab.
  - Nút Dismiss: Xóa bài dở khỏi storage với animation nhẹ nhàng.

### 🎯 Epic 3: Smart Resume & Auto-Recovery
- **Story 3.1: Resume Navigation Protocol**
  - Popup tạo/focus tab với URL kèm query hoặc message: `?dda_resume=1&sentence=N`.
- **Story 3.2: Content Script Auto-Recovery Execution**
  - Tự động kích hoạt câu số N trên giao diện Daily Dictation.
  - Khôi phục `draftText` vào `textarea` và đặt con trỏ chuột ở cuối văn bản.
  - Khôi phục `audio.currentTime` khi audio sẵn sàng.
  - Tự động scroll mượt và `textarea.focus()`.
  - Hiển thị Toast notification nhỏ: *"✨ Restored your draft & audio position"*.

---

## Code Map & Planned Files

| File Path | Action | Description |
| :--- | :--- | :--- |
| `manifest.json` | Modify | Khai báo `action.default_popup: "popup/popup.html"`, đăng ký script `scripts/progress-tracker.js` |
| `scripts/progress-tracker.js` | Create | Module theo dõi tiến độ, bắt draft/audio timestamp, khôi phục trạng thái khi resume |
| `scripts/background.js` | Modify | Lắng nghe thay đổi storage để update badge text/color và xử lý mở tab |
| `popup/popup.html` | Create | Layout giao diện popup toolbar (100% English UI) |
| `popup/popup.css` | Create | Styling hiện đại, bo góc, progress bar, card layout, empty state |
| `popup/popup.js` | Create | Logic render danh sách, tính time ago, tương tác Resume/Dismiss |
| `build.js` | Modify | Đảm bảo copy thư mục `popup/` sang thư mục `dist/` khi build |
| `tests/progress-tracker.test.js` | Create | Unit test cho logic tracking, storage sync, LRU eviction, auto-cleanup |
| `tests/popup.test.js` | Create | Unit test cho popup rendering, time formatting, action dispatching |

---

## Tasks & Acceptance Criteria

**Execution Tasks:**
- [ ] `manifest.json`: Thêm action popup và permission `storage`.
- [ ] `scripts/progress-tracker.js`: Viết module trích xuất bài học, debounce draft, capture audio time, sync storage.
- [ ] `scripts/background.js`: Viết hàm đồng bộ Badge icon realtime.
- [ ] `popup/`: Tạo hoàn chỉnh `popup.html`, `popup.css`, `popup.js` chuẩn 100% English UI.
- [ ] `scripts/content.js`: Tích hợp khởi động `progress-tracker.js`.
- [ ] `build.js`: Cập nhật copy `popup/` sang `dist/`.
- [ ] `tests/`: Viết và chạy test suites đạt 100% PASS.
- [ ] `npm run policy`: Đảm bảo tuân thủ chính sách Chrome Extension.

**Acceptance Criteria:**
1. Khi học một bài bất kỳ trên Daily Dictation, tắt tab và mở lại popup toolbar ➔ Thấy bài học xuất hiện với đúng tiến độ câu và bản nháp đang gõ.
2. Badge trên toolbar icon hiển thị chính xác số lượng bài đang dở dang.
3. Bấm "Resume" ➔ Tab mở ra, tự động chuyển đến đúng câu, điền lại chữ đang gõ dở, tua đúng giây audio và focus vào ô nhập liệu.
4. Khi hoàn thành câu cuối cùng của bài ➔ Bài học tự động biến mất khỏi popup và badge giảm đi 1.
5. Danh sách được đồng bộ giữa các thiết bị đăng nhập cùng Google Account.
