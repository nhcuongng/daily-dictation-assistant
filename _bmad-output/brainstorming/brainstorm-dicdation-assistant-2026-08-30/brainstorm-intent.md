# Brainstorm Intent: Dictation Assistant Extension (dailydictation.com)

## 1. Tổng Quan & Mục Tiêu (Context & Objective)
- **Mục tiêu**: Xây dựng tiện ích mở rộng (Browser Extension) tối ưu hóa trải nghiệm luyện nghe chép chính tả (dictation) trên trang web `dailydictation.com`.
- **Định hướng chiến lược**: Ưu tiên giải quyết ma sát trong luồng thao tác (Workflow/Convenience) để giữ chân người dùng ngay từ đầu, sau đó phát triển sâu vào trải nghiệm học chủ động (Deep Learning) và hệ thống theo dõi tiến độ (Tracking/Motivation).

---

## 2. Phân Khúc Người Dùng & Nhu Cầu Cốt Lõi (Jobs To Be Done)

| Nhóm Nhu Cầu (Job) | Trọng Tâm | Mức Độ Ưu Tiên |
| :--- | :--- | :--- |
| **Job B: Workflow & Convenience** | Tối ưu thao tác, phím tắt, điều khiển phát lại mượt mà, giảm ma sát khi làm bài. | **Must-Have (P0)** — Điểm chạm giữ chân người dùng. |
| **Job C: Deep Learning** | Hỗ trợ học sâu: học từ vựng trước, luyện tập có chủ đích (deliberate practice), xem lại lỗi sai. | **Major (P1)** — Giá trị gia tăng dài hạn. |
| **Job A: Motivation & Tracking** | Thống kê số liệu, mục tiêu hàng ngày, lịch sử học tập. | **Growth (P2)** — Duy trì thói quen học tập. |

### Persona Insights
- **Hardcore Learner**: Cực kỳ cần chuẩn bị trước từ vựng (#13), xóa làm lại để tự kiểm tra (#10), và chỉnh tốc độ audio (#8).
- **Distracted / Busy Learner**: Bắt buộc phải có điều khiển tốc độ (#8) để bắt kịp nội dung khi thao tác.

---

## 3. Lộ Trình Triển Khai (Phased Roadmap)

### Giai Đoạn 1 (V1.0) - Tối Ưu Thao Tác & Trải Nghiệm Cốt Lõi (Core Workflow)
Tập trung vào các tính năng thao tác nhanh, thiết yếu cho mọi người dùng:
- **#8 Speed Control**: Điều khiển và tùy chỉnh tốc độ phát âm thanh linh hoạt.
- **#12 Toggle Pronunciation Hotkey**: Phím tắt bật/tắt nhanh chế độ phát âm mà không cần rời tay khỏi bàn phím.

### Giai Đoạn 2 (V2.0) - Vòng Lặp Học Sâu & Luyện Tập Có Chủ Đích (Deep Learning Loop)
Cụm tính năng có tính phụ thuộc lẫn nhau, phục vụ quá trình học tập bài bản:
- **#13 Vocab Prep**: Chuẩn bị và làm quen từ vựng mới trước khi nghe.
- **#10 Clear on Pronunciation**: Xóa nội dung nhập để nghe và thử lại (hỗ trợ deliberate practice).
- **#4 Transcript Button**: Nút bật/tắt hiển thị transcript linh hoạt trong và sau bài tập.
- **#14 Post-Exercise Review**: Đánh giá và tổng kết kết quả sau khi hoàn thành bài nghe.

### Giai Đoạn 3 (V3.0) - Động Lực & Theo Dõi Tiến Độ (Analytics & Motivation)
Xây dựng hệ thống duy trì thói quen và thống kê:
- **#5 Error History**: Lưu trữ và phân tích lịch sử các lỗi thường gặp.
- **#6 Daily Target**: Thiết lập và theo dõi mục tiêu học tập hàng ngày.
- **#7 Report**: Báo cáo thống kê hiệu suất học tập định kỳ.
- **#9 Learning History**: Lịch sử chi tiết các bài đã hoàn thành.
- *(Các tính năng bổ trợ khác: #1 Timer, #2 Highlight, #3 Reading Reminder, #11 Listen to self)*.

---

## 4. Định Hướng Đầu Vào Cho PRD (PRD Next Steps)
- Đầu vào khả thi trực tiếp cho `bmad-prd`: Tập trung đặc tả chi tiết Epic cho **V1.0** (Speed Control + Pronunciation Hotkey) kèm theo kiến trúc mở rộng sẵn sàng tích hợp các tính năng của **V2.0** (Vocab Prep, Retry Loop, Transcript, Review).
