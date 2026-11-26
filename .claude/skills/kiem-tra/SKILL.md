---
description: Rà soát toàn diện app TLKT - chạy kiểm thử, đối chiếu yêu cầu SPEC/UI, kiểm tra giao diện. Dùng khi người dùng gõ /kiem-tra hoặc hỏi "app đã đủ chưa", "kiểm tra giúp".
disable-model-invocation: true
---

Thực hiện và báo cáo kết quả bằng tiếng Việt, dễ hiểu cho người không chuyên:

1. `npm ci` (nếu cần), `npm run check`. Ghi số test đạt/tổng.
2. Chạy riêng kiểm thử chấp nhận `tests/kich-ban-han.json`: liệt kê từng ca Đạt/Không đạt.
3. Đối chiếu `docs/SPEC.md` (§2–§17) và `docs/UI.md` (§4) với code: cập nhật `docs/DO-PHU-YEU-CAU.md` (Đã làm / Một phần / Chưa + vị trí).
4. Nếu có Playwright + Chromium: chạy e2e, chụp ảnh các màn ở 390×844 và 1440×900 vào `docs/anh-chup/`, kiểm tra không có lỗi console.
5. Kiểm tra nhanh: tắt mạng vẫn mở được (service worker), đổi Sáng/Tối, mật mã khóa/mở, sao lưu → khôi phục, xuất .ics hợp lệ.
6. Tự sửa các lỗi nhỏ phát hiện được (commit `Kiểm tra: …`). Lỗi lớn → thêm thành nhiệm vụ mới cuối TASKS và làm luôn nếu người dùng đã giao `/trien-khai`.
7. Báo cáo: bảng tóm tắt (Hạng mục – Kết quả), danh sách việc đã sửa, việc còn tồn, giả định cần người dùng xác nhận.

Phạm vi riêng nếu người dùng chỉ định: $ARGUMENTS
