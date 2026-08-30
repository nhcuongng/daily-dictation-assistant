# Project Operating Rules & Workflow Guidelines

## 1. Nguyên Tắc Hoạt Động Cốt Lõi (Core Principles)

Dự án này tuân thủ quy trình 2 giai đoạn: **Lập kế hoạch trước (Plan First)** và **Thực thi tự động liên tục (Autonomous Execution Loop)**.

---

### Giai Đoạn 1: Lập Kế Hoạch Trước (Planning Gate)
- **Bắt buộc**: Với mọi yêu cầu, tính năng, sửa lỗi hoặc thay đổi mã nguồn/hệ thống, AI Agent **luôn phải phân tích và trình bày kế hoạch chi tiết (Plan / Proposal)** cho người dùng duyệt trước khi thực hiện.
- **Quy tắc hiển thị (Crucial)**: 
  - **Luôn in toàn bộ nội dung Plan trực tiếp ra màn hình chat** (sử dụng Markdown rõ ràng, đẹp mắt, có code block/mermaid nếu cần).
  - **Tuyệt đối không chỉ gửi link hoặc tạo mỗi file `.md`** rồi yêu cầu người dùng tự mở xem. Người dùng phải đọc được trọn vẹn kế hoạch ngay tại khung chat.
- **Nội dung Plan cần có**:
  1. **Mục tiêu và phạm vi công việc**.
  2. **Chiến lược Git (Git Worktree & Branching Strategy)**:
     - Đánh giá có nên tạo `git worktree` mới hay không (cô lập môi trường song song vs làm trực tiếp trên nhánh hiện tại).
     - Khuyến nghị base branch: Tạo từ `main` (nếu feature độc lập) hay commit nhánh hiện tại rồi tạo từ `nhánh hiện tại` (nếu có quan hệ phụ thuộc code).
  3. **Các bước triển khai cụ thể** (kèm các file/thư mục dự kiến sửa đổi hoặc tạo mới).
  4. **Phương án kiểm thử và tiêu chí nghiệm thu** (Test / Verification Plan).
- **Ngoại lệ duy nhất**: Chỉ bỏ qua bước lập plan nếu người dùng chỉ định rõ ràng cho phép thực thi luôn trong câu lệnh (ví dụ: *"làm luôn"*, *"thực thi ngay"*, *"không cần plan"*, *"execute directly"*).

---

### Giai Đoạn 2: Thực Thi Tự Động Toàn Diện (Autonomous Execution Loop)
- **Kích hoạt**: Ngay khi người dùng đã xem preview plan và đưa ra phản hồi đồng ý/phê duyệt (ví dụ: *"đồng ý"*, *"tiến hành"*, *"làm đi"*, *"ok"*, *"approve"*, *"proceed"*):
  1. **Tự động thực thi xuyên suốt**: Tự động gọi tất cả các tool, bash script, lệnh shell (`npm`, `uv`, `python`, `git`, `grep`, `find`, code edit...) theo chuỗi liên tục.
  2. **Không dừng lại giữa chừng**: Tuyệt đối không dừng lại để hỏi các câu hỏi vụn vặt hoặc yêu cầu xác nhận từng lệnh nhỏ.
  3. **Tự động sửa lỗi (Self-Healing / Debug Loop)**: Nếu trong quá trình chạy có lỗi build/lỗi cú pháp/lỗi test, Agent phải tự động phân tích output, chỉnh sửa code và chạy lại kiểm thử.
  4. **Điều kiện dừng**:
     - ✅ **Hoàn thành thành công**: Mọi bước trong plan đã xong và toàn bộ các bài test / verification đã **PASS 100%**.
     - 🛑 **Lỗi chặn bất khả kháng**: Chỉ tạm dừng nếu gặp xung đột hoặc thiếu thông tin bí mật/credentials nghiêm trọng cần người dùng can thiệp.

---

### Giai Đoạn 3: Báo Cáo Kết Quả (Reporting)
- Khi toàn bộ quá trình thực thi và kiểm thử đã hoàn tất thành công:
  - Dừng vòng lặp thực thi.
  - Báo cáo kết quả rõ ràng, súc tích:
    - Tóm tắt các thay đổi đã thực hiện (kèm link file).
    - Kết quả chạy test / build (output log minh chứng).
    - Hướng dẫn kiểm tra nhanh cho người dùng (nếu có).

---

## 2. Chiến Lược Git Worktree & Branching (Tham Chiếu Quyết Định)

```
                            ┌────────────────────────────────────────┐
                            │      Bạn đề xuất một Feature mới       │
                            └───────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Tác vụ nhỏ / làm tiếp / không song song]                     [Tác vụ lớn / chạy song song / độc lập]
                 │                                                             │
                 ▼                                                             ▼
       Dùng workspace hiện tại                                       Tạo Git Worktree mới
     (Checkout branch thông thường)                     (git worktree add ../<dir> -b <branch>)
                                                                               │
                                               ┌───────────────────────────────┴───────────────────────────────┐
                                               ▼                                                               ▼
                                  [Feature độc lập hoàn toàn]                                     [Phụ thuộc code nhánh hiện tại]
                                               │                                                               │
                                               ▼                                                               ▼
                                     Tạo từ nhánh `main`                                           Commit nhánh hiện tại,
                                                                                                    rồi tạo từ nhánh hiện tại
```

---

## 3. Ngôn Ngữ Giao Tiếp (Communication)
- Mặc định sử dụng **Tiếng Việt** trong giao tiếp và tài liệu trừ khi có yêu cầu cụ thể khác.
