---
title: Daily Dictation Assistant Extension PRD
status: final
created: 2026-08-30
updated: 2026-08-30
---
# Daily Dictation Assistant Extension

## 1. Vision and Principles

**Vision**
Một tiện ích mở rộng (Chrome Extension) giúp loại bỏ hoàn toàn "ma sát" trong thao tác tay và rào cản tâm lý khi luyện nghe chép chính tả trên `dailydictation.com`. Trợ lý này giúp người dùng giữ được nhịp độ học tập (flow), từ việc điều khiển audio mượt mà đến quá trình luyện tập từ vựng chủ đích (deliberate practice), biến việc học dictation từ một nỗi ám ảnh gõ phím thành một trải nghiệm thú vị.

**Principles**
- **Tiện lợi là số 1 (Workflow First)**: Mọi thao tác phải có thể thực hiện nhanh chóng thông qua phím tắt hoặc một click chuột mà không cần rời mắt khỏi vùng gõ văn bản.
- **Không xâm lấn (Non-intrusive)**: UI của Extension phải hòa nhập tự nhiên vào giao diện hiện tại của `dailydictation.com`. Các nút/thanh trượt sẽ được chèn (inject) thông qua JS/CSS, ưu tiên bám vào các thẻ HTML có `id` cố định của trang web để đảm bảo không bị vỡ layout khi trang web gốc cập nhật.
- **Lấy người học làm trung tâm**: Hỗ trợ từ người dễ nản (cần phao cứu sinh) đến người cày cuốc (cần sửa lỗi khắt khe).

## 2. Target Users and Journeys

**Target Users**
- **Học viên dễ nản / bận rộn (The Distracted Learner)**: Cần công cụ để làm chậm audio lại, thao tác tiện lợi khi đang làm việc khác. Dễ bỏ cuộc nếu giao diện quá cứng nhắc.
- **Học viên cày cuốc (The Hardcore Learner)**: Muốn chuẩn bị trước từ vựng, muốn tự mình gõ lại nhiều lần đến khi đúng 100%, có nhu cầu phân tích lỗi sai khắt khe.

**User Journeys (UJ)**

- **UJ-1. Chữa cháy chỗ nghe không kịp (Speed & Hotkey)**
  Người dùng đang gõ dictation thì gặp một câu nối âm quá nhanh. Thay vì dùng chuột bấm pause, họ nhấn phím tắt (VD: `Ctrl + Space`) để tạm dừng, kéo thanh tốc độ (được gắn ngay trên màn hình) xuống 0.7x, và nhấn phím tắt để nghe lại đoạn đó. Nhờ vậy, họ không bị đứt mạch gõ.

- **UJ-2. Vòng lặp thử lại (Retry Loop cho Hardcore)**
  Người dùng vừa nghe xong và đối chiếu đáp án, phát hiện sai 3 chỗ. Thay vì phải xóa thủ công từng chữ, họ nhấn nút "Clear Text" (Xóa để thử lại). Khung nhập liệu trống trơn ngay lập tức, và audio tự động tua lại từ đầu để người dùng sẵn sàng gõ lại toàn bộ câu mà không cần thêm thao tác nào.

- **UJ-3. Chuẩn bị "Phao cứu sinh" (Vocab Prep)**
  Trước khi bắt đầu bài nghe khó, người dùng bấm nút "Vocab Prep". Extension quét transcript ẩn của bài học và hiển thị danh sách các từ vựng ngẫu nhiên hoặc từ khó để người dùng đọc lướt qua, tạo "bộ nhớ đệm" (context) giúp họ tự tin hơn khi vào bài nghe.

## 3. Glossary

- **Audio Controls**: Các thành phần điều khiển âm thanh được Extension inject (tiêm) vào trang web (bao gồm thanh trượt tốc độ).
- **Transcript**: Văn bản chứa lời thoại gốc của bài tập trên dailydictation.com.
- **Khung nhập liệu (Textarea)**: Vùng để người dùng gõ văn bản dictation.
- **Vocab Prep**: Tính năng trích xuất và hiển thị trước từ vựng từ Transcript.

## 4. Features & Implementation Status

### 4.1 Core Workflow: Điều khiển âm thanh và Phím tắt (Phase 1 - Completed ✅)
- **FR-1: Thanh trượt tốc độ (Speed Slider)**: Tích hợp thanh trượt 0.5x - 1.5x ngay cạnh audio player.
- **FR-2: Ẩn thanh tốc độ mặc định**: Ẩn các dropdown 1x/1.5x của DailyDictation để giao diện gọn gàng.

### 4.2 Deep Learning Loop & UX Cải Tiến (Phase 2 - Completed ✅)
- **FR-3: Vocab Prep Floating Popover (Zero Layout Shift)**:
  - Thanh gợi ý từ vựng đính kèm mở ra Floating Popover nổi trên trang web, loại bỏ 100% layout shift.
  - Tự động trích xuất từ vựng từ `appGlobals` và accordion, lọc stop words.
  - Kho 12+ câu Call to Action tiếng Anh truyền cảm hứng ngẫu nhiên.
- **FR-4: Progressive Peek Transcript (Cứu trợ theo số lần sai)**:
  - Nút bấm thay đổi 3 cấp độ theo số lần nộp bài sai:
    - **Level 0 (0-2 lần)**: Mờ nhạt (`subtle`, khuyến khích tự nghe).
    - **Level 1 (3-5 lần)**: Vàng cảnh báo (`warning ⚠️`).
    - **Level 2 (>= 6 lần)**: Đỏ rực cháy (`fire 🔥`, giải cứu khẩn cấp).
  - **Thanh Progress Bar ở mép trên nút (`top: 0`)**: Phản chiếu trực quan tiến trình sai (0% ➡️ 50% ➡️ 100%).
  - **Dual-Mode Floating Popover**:
    - *Tab 1 (Current Sentence)*: Xem nhanh câu thoại của câu/challenge hiện tại.
    - *Tab 2 (Full Transcript)*: Xem toàn bài và in đậm nổi bật câu hiện tại.
  - Quản lý số lần sai theo từng câu riêng biệt và tự động reset khi chuyển câu mới trong SPA.
- **FR-5: Triệt tiêu lớp highlight mặc định**:
  - Ẩn hoàn toàn phần tử `.dictation__input-highlight` của DailyDictation để khung gõ luôn sạch sẽ.
- **FR-6: Quy chuẩn Extension UI 100% Tiếng Anh**:
  - Toàn bộ text, buttons, tooltips, CTA tips và badges sử dụng 100% tiếng Anh.

### 4.3 Các Tính Năng Đã Tinh Chỉnh / Tạm Hoãn (Adjustments & Deferred)
- **Clear Text & Pin Button**: Đã loại bỏ hoàn toàn theo phản hồi người dùng để giữ giao diện tối giản.
- **Check Errors (Diff Button)**: Tạm hoãn (Deferred) đưa ra khỏi UI ở Phase 2, chỉ giữ cơ chế đếm lỗi khi nộp bài trên DailyDictation.

### 4.4 Motivation & Tracking: Động lực và Thống kê (Phase 3 - Upcoming ⏳)
- **FR-7**: Theo dõi thời gian học và thống kê lỗi sai hàng ngày.
- **FR-8**: Đặt mục tiêu hàng ngày (Daily Target) và thanh tiến độ.
- **FR-9**: Báo cáo chuỗi ngày học liên tục (Streak Tracking).

## 5. Non-Goals (Explicit)
- Không thay thế UI gốc của dailydictation.com.
- Không có backend phức tạp trong V1 (lưu trữ hoàn toàn tại Local Storage).
- Miễn phí 100% trên Chrome Web Store.
