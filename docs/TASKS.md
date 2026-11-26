# DANH SÁCH NHIỆM VỤ – TLKT (Giai đoạn A: PWA)

Claude Code thực hiện **tuần tự từ trên xuống**, mỗi nhiệm vụ xong thì: chạy `npm run check` (sạch) → đánh dấu `[x]` ở đây → ghi `docs/PROGRESS.md` → commit `Txx: <mô tả>` → push. Không bỏ qua nhiệm vụ. Nhiệm vụ có ⭐ là trọng yếu: phải đạt toàn bộ tiêu chí trước khi sang nhiệm vụ sau.

Tài liệu tham chiếu: SPEC = `docs/SPEC.md` · ARCH = `docs/ARCHITECTURE.md` · UI = `docs/UI.md` · quy tắc = `rules/*.json` · kiểm thử = `tests/kich-ban-han.json`.

---

## Phase 0 – Khởi tạo
- [x] **T01 Khởi tạo dự án.** Vite + TypeScript strict + Preact + `@preact/signals`; Vitest; cấu trúc thư mục ARCH §3; script `dev`, `build`, `test`, `check` (tsc + vitest + build), `preview`. `vite.config.ts` có `base: './'`. Trang tạm “TLKT”.
  *Chấp nhận:* `npm run check` sạch; `npm run build` ra `dist/index.html`.
- [x] **T02 Kiểm tra triển khai sớm.** Rà `.github/workflows/deploy.yml` khớp script; thêm `public/icon.svg` (biểu tượng khiên + dấu tích, màu `--chinh`).
  *Chấp nhận:* workflow chạy `npm ci`, `npm run check`, upload `dist`.

## Phase 1 – Lõi nghiệp vụ (`src/core`, không giao diện)
- [x] **T03 ⭐ Lịch làm việc** (`core/lich`): kiểu ngày ARCH §4.1; ngày nghỉ từ `rules/ngay-nghi.json` + cài đặt; `laNgayLamViec`, `congNLV`, `congNgay`, `congNgayKhongLui`, `congThang`, `lui`, `demNLV`, `congGioLV`; chế độ thận trọng; định dạng tiếng Việt (dd/mm/yyyy, thứ).
  *Chấp nhận:* nhóm W01–W04 và H01 đạt; test biên năm, 29/02, ngày làm bù, thận trọng.
- [x] **T04 ⭐ Bộ quy tắc** (`core/quyTac`): nạp JSON, gộp `keThua` + `ghiDe`, áp patch người dùng (ARCH §4.8), chọn bộ theo D0 (ARCH §4.7), hàm `tinhHan(dacTaHan, mocDaBiet, ngữCảnh)` theo bảng ARCH §4.4; hạn mục tiêu = hạn pháp lý − đệm.
  *Chấp nhận:* R01–R04 đạt; test patch + khôi phục mặc định.
- [x] **T05 ⭐ Tính mốc một cuộc** (`core/vuViec/tinhMoc.ts`): từ `CuocKiemTra` + bộ quy tắc + `homNay` → danh sách `MocTinh` đầy đủ: mốc thực tế/dự kiến (ARCH §4.6), thuật toán E (ARCH §4.5), chọn chế độ X, bước điều kiện (B2, S7, S4), bước tùy chọn T3, áp dụng sự kiện HOAN/TAM_DUNG/GIA_HAN/GIAI_TRINH/PHUC_TAP/TOI_PHAM/BAI_BO.
  *Chấp nhận:* toàn bộ ca nhóm A, G, R trong `tests/kich-ban-han.json` đạt qua `tests/acceptance.test.ts` (đọc trực tiếp JSON).
- [x] **T06 Giai đoạn, ràng buộc, việc tiếp theo, SLA, ưu tiên** (`core/vuViec`): ARCH §6; hàm kiểm tra hợp lệ khi đánh dấu mốc (thứ tự, ngày ≥ mốc trước, bắt buộc lý do trễ); kiểm tra hợp lệ sự kiện (gia hạn 1 lần, giới hạn số ngày, chỉ trong khoảng C–K, cảnh báo muộn so với T3; hoãn chỉ trước C).
  *Chấp nhận:* test đủ 9 giai đoạn, mỗi ràng buộc 1 test, SLA 4 trạng thái + xong đúng/trễ.
- [x] **T07 Đồng hồ** yêu cầu tài liệu (06 giờ LV) và vướng mắc (3 × 02 NLV), hạn kế hoạch (công khai 30 ngày, chuyên đề phát sinh, thời hiệu kiểm tra lại).
  *Chấp nhận:* W01–W04; test vướng mắc; test thời hiệu.
- [x] **T08 Checklist hệ thống** (`core/checklist`): sinh việc từ `rules/checklist-he-thong.json` theo mốc/sự kiện/điều kiện/lần nộp tiền; hạn = ngày phát sinh + `hanNhapLieuNLV`; nội dung “Sao chép thông tin” theo `saoChep` (ARCH §5); tên chức năng ghi đè được; việc nhật ký hằng ngày.
  *Chấp nhận:* test một cuộc đi từ D0 đến X sinh đúng số việc từng mốc; có GIA_HAN/TAM_DUNG/BAI_BO sinh thêm đúng việc; 2 lần nộp tiền → 2 việc TTR_NOP.
- [x] **T09 Việc ngoài cuộc** (`core/viec`): lặp lại (ARCH §7), tạo lần kế tiếp, mẫu từ `rules/mau-viec-thuong-xuyen.json`, **nhận diện hạn tiếng Việt**.
  *Chấp nhận:* N01–N08 đạt; test mỗi kiểu `lap`.
- [x] **T10 Nhắc việc** (`core/nhacViec`): `sinhLichNhac` theo bảng ARCH §8.1; giờ yên lặng; khóa ổn định; tạo chuỗi `.ics` (RFC 5545: CRLF, gập dòng, escape, UID ổn định, VALARM) và link Google Lịch; ẩn danh.
  *Chấp nhận:* test số nhắc cho 1 hạn; test nhật ký 16:30/17:15/07:45; .ics được kiểm tra cấu trúc bằng test (BEGIN/END cân, dòng ≤ 75 octet).
- [x] **T11 Tóm tắt** (`core/tomTat`): bản tin sáng, báo cáo tiến độ đoàn, báo cáo tuần, tóm tắt một cuộc (mẫu câu theo SPEC §12.7), định dạng số/ngày tiếng Việt, ẩn danh.
  *Chấp nhận:* test snapshot từng loại với dữ liệu cố định.
- [x] **T12 Kế hoạch năm** (`core/keHoach`): chỉ tiêu, đếm theo giai đoạn, tổng tiền, tích lũy theo tháng, đường lý tưởng, các cảnh báo UI §4.11.
  *Chấp nhận:* test với dữ liệu mẫu.

## Phase 2 – Dữ liệu (`src/data`)
- [x] **T13 Kho IndexedDB** theo ARCH §9: các store, CRUD, xóa mềm/khôi phục/xóa hẳn sau 30 ngày, audit log, migrate, `storage.persist()`.
  *Chấp nhận:* test với `fake-indexeddb`.
- [x] **T14 ⭐ Mã hóa bằng mật mã** (PBKDF2 → AES-GCM), mở khóa, khóa tự động, đổi/tắt mật mã.
  *Chấp nhận:* test mã hóa → giải mã đúng; sai mật mã bị từ chối; đổi mật mã giữ nguyên dữ liệu.
- [x] **T15 Sao lưu/khôi phục** `.tlkt.json` (Thay thế / Gộp theo `suaLuc`), nhắc sao lưu hằng tuần.
- [x] **T16 Dữ liệu mẫu**: 6 cuộc ở các giai đoạn khác nhau **tính tương đối theo ngày hôm nay** (1 KH đang kiểm tra tại DN, 1 TH chờ công bố, 1 GT đang biên bản, 1 có GDLK chờ QĐ xử lý có giải trình, 1 bãi bỏ, 1 chuyển tiếp QTKT-970 sau QĐ đang theo dõi nộp tiền) + 1 kế hoạch năm + 10 việc khác (có lặp lại, có quá hạn) + vài khối thời gian; MST giả `0100000xxx`. Có nút xóa riêng dữ liệu mẫu.

## Phase 3 – Giao diện (`src/ui`) – làm đúng `docs/UI.md`
- [x] **T17 Khung app**: tokens Sáng/Tối, font, router hash (UI §2), thanh dưới/cột trái/cột phải, toast, hộp xác nhận, bảng trượt, trạng thái rỗng, các nhãn (UI §3).
- [x] **T18 Onboarding + màn khóa** (UI §4.1, §4.2).
- [x] **T19 ⭐ Hôm nay** (UI §4.3) + cột “Việc tiếp theo” trên máy tính.
- [x] **T20 Danh sách cuộc**: Danh sách + lọc/tìm/sắp xếp, Kanban, Dòng thời gian Gantt SVG (UI §4.4).
- [x] **T21 Thêm/Sửa cuộc** 3 bước + xem trước mốc dự kiến (UI §4.5); kiểm tra MST, trùng.
- [x] **T22 ⭐ Chi tiết cuộc – tab Dòng thời gian + đánh dấu mốc** với mọi ràng buộc T06 (UI §4.6).
- [x] **T23 ⭐ Chi tiết cuộc – tab Sự kiện**: 11 loại form, hiển thị “hạn sẽ đổi từ… thành…” trước khi lưu, sửa/xóa sự kiện.
- [x] **T24 Chi tiết cuộc – tab Nhập hệ thống + màn Nhập liệu còn thiếu** (UI §4.6, §4.7), nút Sao chép.
- [x] **T25 Chi tiết cuộc – tab Nhật ký, Tài liệu & vướng mắc, Kết quả & nộp tiền, Hồ sơ lưu trữ, Lịch sử sửa.**
- [x] **T26 Lịch** tháng/tuần/ngày + khối thời gian + gợi ý “Tại DN” (UI §4.8).
- [x] **T27 Việc**: Hộp thu, Đang làm, Lặp lại, Mẫu, Đã xong; thu nhanh có nhận diện hạn; nhập giọng nói Web Speech API (`vi-VN`) nếu trình duyệt có, ẩn nút nếu không (UI §4.9).
- [x] **T28 Kế hoạch ngày** (UI §4.10).
- [x] **T29 Kế hoạch năm** + quản lý kế hoạch + biểu đồ SVG (UI §4.11).
- [x] **T30 Báo cáo & tóm tắt** + trang in (UI §4.12).
- [x] **T31 Cài đặt** đủ các nhóm UI §4.13, gồm bảng sửa quy tắc có trích dẫn và Khôi phục mặc định.
- [x] **T32 Căn cứ & hướng dẫn** + màn Kiểm thử trong app (UI §4.14, §4.15) + Giới thiệu (phiên bản, ngày build).

## Phase 4 – Nhắc việc, nhập/xuất, PWA
- [x] **T33 ⭐ Bộ phát nhắc trong app**: vòng 30 giây, toast + Notification (xin quyền có giải thích), âm báo, “Hoãn 15 phút / 1 giờ / sáng mai”, danh sách nhắc ở chuông 🔔, không phát trùng.
- [x] **T34 Xuất lịch**: tải `.ics` (một cuộc / tất cả / 30 ngày tới), nút “Thêm vào Google Lịch” ở mọi ThẻViệc và mốc, trang hướng dẫn iPhone/Android.
- [x] **T35 Excel**: nhập kế hoạch (ghép cột, xem trước, trùng MST), tải tệp mẫu, xuất 5 loại (ARCH §10); nhập ngày nghỉ.
- [x] **T36 PWA**: `vite-plugin-pwa`, manifest, icon, chạy offline, thanh “Có phiên bản mới”, hướng dẫn “Thêm vào màn hình chính”.

## Phase 5 – Hoàn thiện và bàn giao
- [x] **T37 E2E + ảnh chụp**: Playwright (nếu cài được Chromium; nếu không, ghi lý do vào PROGRESS và kiểm thử thủ công bằng `vite preview` + mô tả). Luồng ARCH §11; ảnh 390×844 & 1440×900 của mọi màn vào `docs/anh-chup/`.
- [x] **T38 Rà soát độ phủ yêu cầu**: tạo `docs/DO-PHU-YEU-CAU.md` – bảng mỗi yêu cầu trong SPEC §2–§17 và UI §4 → Đã làm / Một phần / Chưa → vị trí code/test. Làm nốt mọi mục “Chưa”/“Một phần” làm được.
- [x] **T39 Hiệu năng & truy cập**: bundle chính < 300 KB gzip (SheetJS tải động), Lighthouse PWA/Accessibility ≥ 90 nếu đo được, tương phản AA, bàn phím.
- [x] **T40 Bàn giao**: `docs/HUONG-DAN-SU-DUNG.md` (≤ 2 trang, tiếng Việt, cho cán bộ), cập nhật `README.md` (link app), tăng version 1.0.0, ghi PROGRESS tổng kết, push `main` để GitHub Pages triển khai.

---

## Phase B – App di động (KHÔNG làm trong đợt này; chỉ thực hiện khi người dùng yêu cầu)
B01 monorepo dùng chung `src/core` · B02 Expo + SQLite/SQLCipher · B03 dựng lại màn hình · B04 thông báo cục bộ/báo thức thật · B05 build APK · B06 TestFlight.
