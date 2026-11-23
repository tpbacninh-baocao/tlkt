---
description: Xây dựng toàn bộ app TLKT tự động từ đầu đến cuối theo docs/TASKS.md. Dùng khi người dùng gõ /trien-khai hoặc yêu cầu "làm app", "triển khai toàn bộ".
disable-model-invocation: true
---

Bạn sẽ xây dựng toàn bộ ứng dụng TLKT mà KHÔNG cần người dùng duyệt từng bước.

1. Đọc `CLAUDE.md`, `docs/PROGRESS.md`, `docs/TASKS.md`. Lướt mục lục `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/UI.md` (đọc chi tiết từng phần khi tới nhiệm vụ liên quan).
2. Gửi người dùng 3–5 dòng tiếng Việt: sẽ làm gì, khoảng bao nhiêu nhiệm vụ, họ có thể rời đi và quay lại xem `docs/PROGRESS.md`.
3. Tạo danh sách việc (task list) gồm các nhiệm vụ chưa `[x]` trong TASKS.
4. Thực hiện tuần tự từng nhiệm vụ theo “Vòng làm việc” trong CLAUDE.md (test → code → `npm run check` sạch → cập nhật TASKS/PROGRESS → commit → push).
5. Nhiệm vụ ⭐ (T03, T04, T05, T14, T19, T22, T23, T33): không sang nhiệm vụ sau khi chưa đạt 100% tiêu chí. Riêng T05: toàn bộ ca trong `tests/kich-ban-han.json` phải đạt.
6. Có thể dùng subagent cho việc độc lập (ví dụ viết test, vẽ biểu đồ SVG, viết tài liệu) nhưng tự kiểm tra lại kết quả.
7. Gặp điểm nghiệp vụ chưa rõ: chọn giả định an toàn (hạn sớm hơn), ghi PROGRESS, làm tiếp. Chỉ dừng hỏi người dùng khi bị chặn thật sự.
8. Sau mỗi Phase (0–5): gửi người dùng tóm tắt 3 dòng (đã xong gì, test đạt bao nhiêu, phase kế tiếp).
9. Khi xong T40: chạy `/kiem-tra` một lượt, rồi báo người dùng: link app (GitHub Pages), cách cài lên điện thoại, 5 điều nên thử đầu tiên, các giả định cần họ xác nhận.

Tham số thêm từ người dùng (nếu có): $ARGUMENTS
