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

## 4. Features

### 4.1 Core Workflow: Điều khiển âm thanh và Phím tắt (Giai đoạn 1 - MVP)
**Description:** Đưa quyền kiểm soát audio lên bàn phím và trực quan hóa thanh chỉnh tốc độ ra ngoài màn hình chính để người dùng không phải click qua nhiều menu. Realizes UJ-1.

**Functional Requirements:**
#### FR-1: Thanh trượt tốc độ (Speed Slider)
- Extension phải chèn một thanh trượt (slider) tốc độ phát audio (từ 0.5x đến 1.5x, bước nhảy 0.1x) vào giao diện của trang web, ngay cạnh vùng Audio Player.
#### FR-2: Phím tắt Play/Pause
- Người dùng có thể nhấn tổ hợp phím tắt `Ctrl + Shift + Space` để Play/Pause audio bất kỳ lúc nào dù con trỏ chuột đang ở đâu. (Extension sẽ can thiệp vào event listener toàn cục của trang web để bắt sự kiện này).

### 4.2 Deep Learning Loop: Trải nghiệm học sâu (Giai đoạn 2)
**Description:** Cung cấp công cụ để người dùng học chủ động: chuẩn bị từ vựng, dọn dẹp để làm lại, và so sánh kết quả. Realizes UJ-2, UJ-3.

**Functional Requirements:**
#### FR-3: Nút Clear Text (Xóa và thử lại)
- Extension chèn một nút (icon) bên cạnh khung nhập liệu. Khi nhấn, nó sẽ xóa toàn bộ nội dung trong khung nhập liệu hiện tại.
#### FR-4: Hiển thị nhanh Transcript
- Thêm một nút bật/tắt Transcript ngay cạnh vùng ghi chú. Nút này cho phép xem lén Transcript mà không cần cuộn trang hay bấm nhiều lần.
#### FR-5: Trích xuất từ vựng (Vocab Prep)
- Cung cấp một panel hiển thị danh sách từ vựng được rút trích từ Transcript. Sử dụng thuật toán lọc cơ bản ngay trên Extension: bỏ qua các stop-words (a, an, the...) và chỉ lấy các từ có độ dài trên 4 ký tự, không cần gọi API AI bên ngoài để tối ưu tốc độ và chi phí.
#### FR-6: Báo cáo từ sai (Post-Exercise Review)
- Khi kết thúc bài, thuật toán so khớp (diff) sẽ chạy để so sánh văn bản người dùng gõ và transcript, làm nổi bật (highlight) các từ gõ sai nhiều nhất.

### 4.3 Motivation & Tracking: Động lực và Thống kê (Giai đoạn 3)
**Description:** Giữ chân người dùng bằng các số liệu và mục tiêu.
**Functional Requirements:**
- **FR-7**: Theo dõi và lưu trữ (Local Storage) thời gian học mỗi ngày và số lỗi sai.
- **FR-8**: Đặt mục tiêu hàng ngày (VD: 30 phút, 2 tiếng) và hiển thị thanh tiến độ (Progress bar).
- **FR-9**: Cung cấp giao diện báo cáo (Report) đơn giản hiển thị số ngày học liên tục (Streak).

## 5. Non-Goals (Explicit)

- **Không thay thế UI gốc của dailydictation.com**: Extension chỉ "tiêm" (inject) thêm các công cụ bổ trợ, không viết lại toàn bộ giao diện của trang web.
- **Không có backend phức tạp trong V1**: Mọi dữ liệu lịch sử học tập (History/Report) ở Giai đoạn 3 sẽ được lưu hoàn toàn tại Local Storage của trình duyệt. Không yêu cầu đồng bộ qua tài khoản Google hay cloud.
- **Không thu phí (trước mắt)**: Tập trung vào thu hút người dùng trên Chrome Web Store (Free).

## 6. MVP Scope

### 6.1 In Scope (Phase 1)
- Thanh trượt chỉnh tốc độ (FR-1).
- Phím tắt bật/tắt âm thanh (FR-2).
- *Lý do: Đây là các "Quick Wins" có Tác động rất cao và Nỗ lực lập trình thấp, giải quyết nỗi đau lớn nhất của người dùng.*

### 6.2 Out of Scope for MVP
- Tính năng Vocab Prep (FR-5), Xóa thử lại (FR-3) -> *Chuyển sang Phase 2*.
- Tính năng so khớp từ sai (FR-6) -> *Chuyển sang Phase 2*.
- Toàn bộ tính năng Thống kê, Lịch sử, Báo cáo (Phase 3) -> *[NOTE FOR PM] Tính năng báo cáo tốn nhiều công sức làm UI và quản lý dữ liệu, sẽ làm chậm tiến độ ra mắt bản MVP.*

## 7. Success Metrics

**Primary**
- **SM-1: Daily Active Users (DAU)**. Target: Đạt 100 người dùng tích cực mỗi ngày trong tháng đầu tiên trên Chrome Web Store.
- **SM-2: Tần suất sử dụng phím tắt & thanh tốc độ**. Target: Tính năng được kích hoạt ít nhất 10 lần trên mỗi bài tập (chứng tỏ nó giải quyết đúng nhu cầu).

## 8. Open Questions

1. Thuật toán phân tích lỗi sai (Diff) ở Phase 2 nên tự viết hay dùng một thư viện Javascript mã nguồn mở có sẵn?

## 9. Assumptions Index
- Không còn Assumption nào chưa được xác nhận. Mọi giả định kỹ thuật đã được chốt (Ctrl+Shift+Space, LocalStorage, Lọc từ vựng cơ bản, Inject UI qua thẻ ID cố định).
