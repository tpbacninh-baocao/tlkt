---
description: Sửa lỗi hoặc điều chỉnh theo góp ý người dùng khi dùng thử app TLKT. Dùng khi người dùng gõ /sua-loi kèm mô tả, hoặc báo "sai hạn", "thiếu", "lệch".
disable-model-invocation: true
argument-hint: "[mô tả lỗi/góp ý, ví dụ: cuộc QĐ 05/10 công bố 12/10 app báo hạn kết thúc 01/11, đúng phải 02/11]"
---

Góp ý của người dùng: $ARGUMENTS
(Nếu trống: đọc mục “Góp ý của người dùng” trong `docs/PROGRESS.md`.)

1. Diễn giải lại góp ý thành yêu cầu cụ thể (1–3 dòng). Nếu là sai hạn: xác định bước, mốc gốc, quy tắc trong `rules/*.json`, cách đếm đang dùng.
2. Phân loại:
   - **Sai do code** → viết test tái hiện (thêm ca mới vào nhóm “Bổ sung từ người dùng” trong `tests/kich-ban-han.json` nếu là thời hạn), sửa code, test phải qua.
   - **Do tham số quy tắc khác cách đơn vị làm** → không sửa code: hướng dẫn người dùng đổi trong Cài đặt → Quy tắc thời hạn; nếu người dùng muốn đổi mặc định cho mọi người thì sửa `rules/*.json`, ghi căn cứ, cập nhật kỳ vọng test liên quan và ghi rõ trong PROGRESS.
   - **Yêu cầu mới** → thêm nhiệm vụ mới cuối `docs/TASKS.md` rồi làm.
3. `npm run check` sạch → commit `Sửa: <mô tả>` → push.
4. Đánh dấu góp ý đã xử lý trong PROGRESS; báo người dùng 2–3 dòng: đã sửa gì, cách kiểm tra lại trên app (sau khi GitHub Pages cập nhật, kéo xuống để tải lại).
