# Ảnh chụp màn hình

Chụp tự động bằng `npm run chup-anh` (cần Playwright + Chromium; app đang chạy ở `http://localhost:4173/`, ví dụ `npm run build && npm run preview -- --port 4173`).

- `dien-thoai-*.png`: khổ 390×844 (điện thoại).
- `may-tinh-*.png`: khổ 1440×900 (máy tính).
- Dữ liệu là dữ liệu mẫu (MST giả `0100000xxx`), ngày hệ thống lúc chụp là ngày chạy lệnh.
- Kiểm thử luồng chính (tạo cuộc → đi hết 22 bước → Hoàn thành): `npm run e2e`.
