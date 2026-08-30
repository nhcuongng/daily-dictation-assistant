---
title: Daily Dictation Assistant Extension - Architecture Spine
status: final
updated: 2026-08-30
---
# Architecture Spine: Daily Dictation Assistant Extension

## 1. Paradigm & Starter
**Paradigm:** Content-Script DOM Injection (Manifest V3)
**Starter/Stack:** Vanilla JavaScript + Native Web APIs (Zero-build setup).
*Lý do (Rationale)*: Extension này chủ yếu tương tác với DOM có sẵn (audio player, textarea). Việc dùng framework (React/Vue) hay build tools (Webpack/Vite) sẽ làm cồng kềnh dự án không cần thiết cho một solo developer muốn "code nhanh, chạy ngay".

## 2. Invariants (Architecture Decisions - AD)
*Đây là các luật bất biến. Mọi dòng code viết ra đều phải tuân thủ các luật này.*

### AD-1: Mọi logic cốt lõi nằm ở Content Script
- **Rule:** Mọi xử lý từ DOM Injection (vẽ thanh tốc độ, nút xóa), Event Listening (bắt phím tắt Ctrl+Shift+Space), đến thuật toán lọc từ vựng (Vocab Prep) đều được viết trong `content_script.js` chạy trực tiếp trên context của trang `dailydictation.com`.
- **Binds:** Extension chạy độc lập trong từng tab.
- **Prevents:** Ngăn chặn việc lạm dụng Background Service Worker (background.js) cho các tác vụ không cần thiết, giúp extension nhẹ và xin quyền ít nhất có thể (chỉ cần quyền `activeTab` hoặc host permission cho dailydictation).

### AD-2: Inject UI bằng Native DOM, bám vào Anchor ID
- **Rule:** Dùng `document.createElement` để tạo UI và `Node.insertBefore()` / `appendChild()` để chèn vào DOM. Phải dùng các thẻ có `id` cố định trên trang web gốc làm mỏ neo (Anchor) để xác định vị trí chèn.
- **Binds:** UI của extension sẽ kế thừa một phần CSS của trang gốc. Không dùng Shadow DOM (để giữ code đơn giản, trừ khi bị conflict CSS nặng).
- **Prevents:** Ngăn chặn việc chèn UI dựa trên cấu trúc thẻ (ví dụ `div > div > span`), dễ gây vỡ layout (break) khi tác giả trang web thay đổi một chút HTML.

### AD-3: Bắt sự kiện bàn phím (Hotkey) bằng Event Listener toàn cục
- **Rule:** Bắt phím tắt `Ctrl + Shift + Space` bằng `document.addEventListener('keydown', ...)` trong Content Script, ưu tiên kiểm tra `event.ctrlKey`, `event.shiftKey`, `event.code === 'Space'`. [ASSUMPTION: Cần gọi `event.preventDefault()` để chặn hành vi mặc định của trình duyệt nếu có].
- **Binds:** Phím tắt chỉ hoạt động khi người dùng đang focus vào tab Dailydictation.
- **Prevents:** Ngăn chặn việc phải khai báo `chrome.commands` trong `manifest.json`, vốn dễ bị conflict với các extension khác ở mức độ toàn trình duyệt và khó config đối với user bình thường.

### AD-4: Nguồn chân lý dữ liệu (Source of Truth) là `chrome.storage.local`
- **Rule:** Mọi trạng thái cần lưu trữ (tốc độ audio người dùng ưa thích, lịch sử học tập ở Phase 3) phải được đọc từ `chrome.storage.local` khi load trang, và ghi xuống ngay lập tức khi có thay đổi.
- **Binds:** Không dùng biến memory toàn cục (global JS variables) để lưu trữ vĩnh viễn.
- **Prevents:** Tránh mất dữ liệu khi người dùng reload trang hoặc đóng tab. Tránh dùng `localStorage` của window vì bị giới hạn dung lượng và dễ bị web gốc clear mất.

## 3. Seed Structure (Sơ đồ thư mục tham khảo)
*Đây là cấu trúc khởi điểm (Seed), bạn có thể thêm bớt file khi code.*

```text
dicdation-assistant/
├── manifest.json         # Manifest V3, khai báo host permissions và content_scripts
├── icons/                # Icon extension (16, 48, 128)
├── styles/
│   └── content.css       # CSS style cho thanh tốc độ, nút bấm (tránh trùng class name với web)
├── scripts/
│   ├── content.js        # File chính: Khởi tạo UI, bắt sự kiện
│   ├── audio-control.js  # Tách module: Logic chỉnh tốc độ, tua audio
│   └── vocab-prep.js     # Tách module: Thuật toán bóc tách từ vựng (Phase 2)
```

## 4. Deferred (Các quyết định lùi lại)
- **Kiến trúc Background Script (Service Worker):** Bỏ trống trong V1 & V2. Chỉ thiết kế khi làm đến Phase 3 (nếu cần xử lý push notification nhắc học).
- **Thuật toán Diff (so khớp lỗi sai):** Chưa chốt thư viện. [ASSUMPTION: Khuyến nghị dùng thư viện nhẹ như `diff-match-patch` hoặc tự viết hàm đơn giản nạp qua CDN/local module].

## 5. Open Questions
- (Từ PRD) Thuật toán phân tích lỗi sai (Diff) ở Phase 2 nên tự viết hay dùng thư viện mở? -> *Giải quyết khi code Phase 2.*
