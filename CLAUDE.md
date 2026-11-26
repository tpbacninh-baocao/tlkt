# CLAUDE.md – Dự án TLKT “Trợ lý Đoàn kiểm tra”

## Bối cảnh
Người dùng là công chức kiểm tra thuế, **không chuyên lập trình**. Họ giao toàn bộ việc xây dựng cho Claude Code và chỉ kiểm tra kết quả trên app đã chạy. Vì vậy:
- **Tự làm từ đầu đến cuối** theo `docs/TASKS.md`; không hỏi xin phép từng bước, không đưa lựa chọn kỹ thuật cho người dùng quyết định.
- Chỉ dừng lại hỏi khi thật sự bị chặn (thiếu quyền, thiếu tài khoản, lỗi môi trường không tự khắc phục được). Điểm nghiệp vụ chưa rõ → chọn giả định an toàn, ghi vào mục “Giả định đã chọn” của `docs/PROGRESS.md`, làm tiếp.
- Báo cáo cho người dùng bằng tiếng Việt, ngắn, không thuật ngữ lập trình khi không cần.

## Tài liệu (đọc theo thứ tự khi bắt đầu phiên)
1. `docs/PROGRESS.md` – đang ở đâu, giả định, góp ý của người dùng.
2. `docs/TASKS.md` – danh sách nhiệm vụ T01–T40, tiêu chí chấp nhận.
3. `docs/SPEC.md` – nghiệp vụ (cái gì). `docs/ARCHITECTURE.md` – kỹ thuật (cách xây). `docs/UI.md` – giao diện.
4. `rules/*.json` – **nguồn sự thật về thời hạn**. `tests/kich-ban-han.json` – kiểm thử chấp nhận bắt buộc.
Chỉ đọc phần tài liệu cần cho nhiệm vụ đang làm để tiết kiệm ngữ cảnh.

## Quy tắc không được vi phạm
- Không viết cứng số ngày/thời hạn trong code; mọi hạn tính qua `src/core/lich` + `src/core/quyTac` từ `rules/*.json`.
- Không sửa kỳ vọng trong `tests/kich-ban-han.json` để test qua. Nếu tin rằng kỳ vọng sai, giữ nguyên, ghi lý do vào PROGRESS mục “Cần người dùng xác nhận”.
- Không sửa nội dung nghiệp vụ trong `rules/*.json` trừ khi TASKS yêu cầu hoặc người dùng yêu cầu; được thêm trường kỹ thuật nếu cần (ghi PROGRESS).
- `src/core` là TypeScript thuần (không DOM, không Preact, không idb), hàm thuần nhận `homNay` làm tham số.
- Không gửi dữ liệu ra mạng, không analytics, không lưu nội dung văn bản của NNT. Dữ liệu mẫu dùng MST giả `0100000xxx`.
- Giao diện và chú thích tiếng Việt; ngày `dd/mm/yyyy`; số `1.234.567`.

## Vòng làm việc cho mỗi nhiệm vụ
1. Đọc tiêu chí chấp nhận của nhiệm vụ trong TASKS.
2. Viết test trước cho phần `src/core` (đặc biệt nhiệm vụ ⭐).
3. Viết code.
4. `npm run check` (tsc + vitest + build) phải sạch. Sửa đến khi sạch.
5. Đánh dấu `[x]` trong TASKS, cập nhật PROGRESS (Đã làm / Test / Giả định / Còn tồn).
6. `git add -A && git commit -m "Txx: <mô tả tiếng Việt>"` và push lên nhánh đang làm.
7. Sang nhiệm vụ kế tiếp. Khi ngữ cảnh đầy: đảm bảo PROGRESS đã cập nhật rồi để hệ thống tự thu gọn (/compact) và tiếp tục.

## Lệnh
- `npm run dev` · `npm run check` · `npm test` · `npm run build` · `npm run preview`
- Lệnh tắt của dự án: `/trien-khai` (làm tất cả), `/tiep-tuc` (làm tiếp), `/kiem-tra` (rà soát toàn diện), `/sua-loi <mô tả>` (sửa lỗi người dùng báo).

## Triển khai
Push/merge vào `main` → GitHub Actions (`.github/workflows/deploy.yml`) test, build, đăng lên GitHub Pages. Nếu đang làm ở nhánh khác (phiên cloud thường làm ở nhánh `claude/...`), khi xong một phase hãy nhắc người dùng tạo và merge Pull Request (hoặc tự merge nếu có quyền).
