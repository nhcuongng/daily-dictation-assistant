---
title: 'Extension MVP Setup: Speed Control & Hotkeys'
type: 'feature'
created: '2026-08-30'
status: 'done'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Người dùng học dictation trên `dailydictation.com` gặp bất tiện lớn khi phải rời tay khỏi bàn phím để thao tác chuột (dừng/phát audio hoặc đổi tốc độ), làm đứt mạch gõ và gây nản chí.

**Approach:** Khởi tạo Chrome Extension (Manifest V3) dạng Vanilla JS (không build tools). Inject một thanh trượt tốc độ vào UI hiện tại của trang thông qua Content Script, đồng thời đăng ký một event listener toàn cục bắt tổ hợp phím `Ctrl+Shift+Space` để Play/Pause audio.

## Boundaries & Constraints

**Always:** 
- Tuân thủ Kiến trúc (AD-1 & AD-2): Viết toàn bộ logic trong Content Script, không dùng Background Script (Service Worker) ở giai đoạn này.
- Mọi DOM injection (chèn UI) phải neo (anchor) vào một phần tử có `id` cố định trên trang `dailydictation.com`.
- Trạng thái tốc độ audio cuối cùng phải được ghi và đọc từ `chrome.storage.local` (AD-4).

**Ask First:** 
- Thay đổi tổ hợp phím tắt mặc định.
- Sử dụng bất kỳ framework/thư viện bên ngoài nào (khuyến nghị chỉ dùng Vanilla JS).

**Never:** 
- Không thay đổi hoặc phá vỡ CSS gốc của trang web `dailydictation.com`.
- Không sử dụng Shadow DOM cho UI được inject trừ khi CSS bị conflict quá nghiêm trọng.
- Không dùng `chrome.commands` trong manifest.json (bắt sự kiện bằng `document.addEventListener('keydown')` trên trang).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Khởi động trang | Mở một trang bài tập dailydictation.com | Load cấu hình tốc độ từ local storage (nếu có), áp dụng cho `<audio>` tag hiện tại. Render thanh tốc độ cạnh audio player. | Nếu không tìm thấy `<audio>` tag, không render UI và log lỗi. |
| Bấm phím tắt Play/Pause | Nhấn `Ctrl + Shift + Space` | Nếu audio đang dừng, sẽ phát. Nếu đang phát, sẽ dừng. Ngăn chặn hành vi mặc định của phím Space (cuộn trang). | Bỏ qua sự kiện nếu thẻ `<audio>` chưa sẵn sàng. |
| Thay đổi tốc độ | Kéo thanh trượt tốc độ (0.5x - 1.5x) | Cập nhật `playbackRate` của `<audio>` tag lập tức. Lưu cấu hình mới vào `chrome.storage.local`. | |

</frozen-after-approval>

## Code Map

- `manifest.json` -- Khởi tạo Extension (Manifest V3), cấp quyền `activeTab`, `storage`, định nghĩa content script chạy trên `*://*.dailydictation.com/*`.
- `scripts/content.js` -- Khởi tạo extension trên trang web, bắt sự kiện `Ctrl+Shift+Space`, điều phối logic UI.
- `scripts/audio-control.js` -- Chứa logic render thanh trượt tốc độ, thay đổi `playbackRate` của thẻ audio, đọc/ghi vào `chrome.storage.local`.
- `styles/content.css` -- CSS tối thiểu để style thanh trượt tốc độ hài hòa với giao diện gốc, tránh trùng lặp class.

## Tasks & Acceptance

**Execution:**
- [x] `manifest.json` -- Khởi tạo cơ bản Manifest V3 -- Để Chrome nhận diện extension và load content script.
- [x] `scripts/audio-control.js` -- Viết module điều khiển audio -- Cung cấp hàm khởi tạo UI thanh trượt, hàm toggle play/pause, và logic load/save tốc độ.
- [x] `scripts/content.js` -- Gắn kết UI và bắt sự kiện bàn phím -- Chờ DOM sẵn sàng, gọi `audio-control.js` để render, thêm event listener `keydown` (Ctrl+Shift+Space).
- [x] `styles/content.css` -- Định dạng thanh trượt -- Style gọn gàng.

**Acceptance Criteria:**
- Given người dùng ở trang bài tập dailydictation.com, when họ nhấn Ctrl+Shift+Space, then audio thay đổi trạng thái (phát <-> dừng).
- Given thanh trượt tốc độ hiển thị, when người dùng kéo thay đổi giá trị, then âm thanh phát nhanh/chậm tương ứng và giá trị được lưu để dùng cho lần sau.

## Spec Change Log

## Design Notes

Giao diện trang `dailydictation.com` thường chứa `<audio>` player và một khung gõ chữ. Khi DOM load, cần tìm ra selector của `<audio>` (VD: `document.querySelector('audio')`) và tìm một parent element phù hợp để chèn thanh tốc độ vào.
Ví dụ hàm chèn UI:
```javascript
const audioEl = document.querySelector('audio');
if (audioEl && audioEl.parentNode) {
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'dda-speed-control';
  sliderContainer.innerHTML = `<label>Speed: <input type="range" min="0.5" max="1.5" step="0.1" value="1"></label>`;
  // Chèn ngay sau audio element
  audioEl.parentNode.insertBefore(sliderContainer, audioEl.nextSibling);
}
```

## Verification

**Manual checks (if no CLI):**
- Mở extension ở chế độ Developer Mode trong Chrome (`chrome://extensions/`).
- Truy cập `https://dailydictation.com/exercises` (nếu cần, tạo mock HTML file).
- Nhấn phím `Ctrl + Shift + Space` để xem video/audio có Play/Pause không.
- Chỉnh thanh tốc độ và reload trang xem tốc độ có giữ nguyên không.

## Suggested Review Order

**Khởi tạo Extension**
- Khai báo Manifest V3, cấp quyền và link file JS/CSS.
  [`manifest.json:1`](../../manifest.json#L1)

**Logic Điều khiển Audio**
- Module lõi xử lý thanh trượt tốc độ và Play/Pause
  [`audio-control.js:1`](../../scripts/audio-control.js#L1)

**Gắn kết và Sự kiện**
- Inject audio control và bắt sự kiện `Ctrl+Shift+Space`.
  [`content.js:1`](../../scripts/content.js#L1)

**Giao diện UI**
- CSS hiển thị thanh tốc độ hòa hợp với website gốc.
  [`content.css:1`](../../styles/content.css#L1)
