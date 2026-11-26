# TIẾN ĐỘ – TLKT

> Claude Code đọc tệp này đầu mỗi phiên và cập nhật sau mỗi nhiệm vụ. Người dùng đọc tệp này để biết đã làm đến đâu.

## Trạng thái hiện tại
- Nhiệm vụ đang làm: T40
- Nhiệm vụ xong gần nhất: T39
- `npm run check`: sạch (524 đạt / 524 tổng; axe 0 lỗi; 524 test đạt)
- Link app (GitHub Pages): — (cập nhật sau T40)

## Nhật ký
### 2026-11-23 – T01–T02 Khởi tạo (Phase 0)
- Đã làm: Vite 7 + TS strict + Preact + signals; Vitest; cấu trúc thư mục; `public/icon.svg`; workflow khớp script (`npm ci`, `npm run check`, upload `dist`).
- Test: 1 đạt / 1 tổng
- Giả định: dùng `xlsx@0.18.5` từ npm (CDN SheetJS bị chặn trong môi trường này).
<!-- Mẫu mỗi mục:
### YYYY-MM-DD – Txx Tên nhiệm vụ
- Đã làm: …
- Test: n đạt / n tổng
- Giả định đã chọn (nếu có): …
- Còn tồn: …
-->

### 2026-11-23 – T03 Lịch làm việc
- Đã làm: core/lich: ngày ISO tự viết (epoch), NLV, cộng ngày/tháng, lùi, đếm NLV, giờ làm việc, chế độ thận trọng, định dạng tiếng Việt.
- Test: 27 đạt / 27 tổng
- Giả định đã chọn: Chế độ thận trọng: ngày sự kiện tính là ngày 1 cả với ngày lịch và tháng (tháng: lùi 1 ngày), không lùi qua ngày nghỉ.

### 2026-11-23 – T04 Bộ quy tắc
- Đã làm: core/quyTac: nạp JSON, gộp keThua+ghiDe (han thay nguyên khối), bản vá người dùng + khôi phục mặc định, chọn bộ theo D0, tinhHan theo bảng ARCH §4.4, thuật toán E, chọn chế độ X, hạn mục tiêu = pháp lý − đệm.
- Test: 50 đạt / 50 tổng (R01–R06 đạt)

### 2026-11-23 – T05 Tính mốc một cuộc (⭐)
- Đã làm: core/vuViec/tinhMoc: mốc thực tế/dự kiến lan truyền, thuật toán E, chế độ X, bước điều kiện B2/S7/S4, tùy chọn T3, sự kiện HOAN/TAM_DUNG/GIA_HAN/GIAI_TRINH/PHUC_TAP/TOI_PHAM/BAI_BO, trạng thái SLA; tests/acceptance.test.ts đọc trực tiếp kich-ban-han.json.
- Test: 99 đạt / 107 tổng (8 ca nhóm N đang skip, bật ở T09); toàn bộ ca A, G, H, R, W đạt (31/31)
- Giả định đã chọn: Bước dự kiến (tính từ mốc chưa có) không bao giờ bị gắn QUA_HAN để tránh báo đỏ dây chuyền. Ngày công bố dự kiến: hoãn > ngày người dùng nhập > hạn Q5. B3a/B3b hết hạn → KHONG_AP_DUNG (không phải quá hạn).

### 2026-11-23 – T06 Giai đoạn, ràng buộc, việc tiếp theo, SLA, ưu tiên
- Đã làm: core/vuViec: tinhGiaiDoan (9 giai đoạn), kiemTraDanhDauBuoc/BoDanhDau (thứ tự mốc, ngày ≥ mốc trước, lý do trễ), kiemTraSuKien + lyDoKhongChoPhep + xemTruocSuKien (hạn đổi từ … thành …), viecTiepTheo, viecSongSong, ngày tại DN, mucSLA, điểm ưu tiên.
- Test: 145 đạt / 153 tổng (8 skip nhóm N)
- Giả định đã chọn: Việc tiếp theo bỏ qua bước nội bộ/không có hạn pháp lý của giai đoạn đã qua (tránh nhắc P1–P4 khi đã có QĐ), và gồm cả S4 theo dõi nộp tiền. Đề nghị gia hạn sau ngày E bị chặn (lỗi), muộn hơn hạn T3 chỉ cảnh báo.

### 2026-11-23 – T07 Đồng hồ yêu cầu tài liệu, vướng mắc, hạn kế hoạch
- Đã làm: core/vuViec/dongHo (06 giờ LV; vướng mắc 3 chặng × 02 NLV) và core/keHoach/han (công khai 30 ngày, chuyên đề phát sinh 15 ngày, báo cáo kết thúc 15 NLV, thời hiệu kiểm tra lại 24 tháng).
- Test: 162 đạt / 170 tổng (8 skip nhóm N)
- Giả định đã chọn: Thời hiệu kiểm tra lại lấy đúng ngày kỷ niệm 24 tháng (không lùi sang ngày làm việc) để hạn không muộn hơn. 3 chặng vướng mắc: chặng n hoàn thành khi có ngày bắt đầu của chặng n+1 (chặng 3: ngày tổng hợp).

### 2026-11-23 – T08 Checklist hệ thống
- Đã làm: core/checklist: danh mục từ rules JSON, sinh việc theo mốc/sự kiện/điều kiện (KL hay QĐ xử phạt)/lần nộp tiền, hạn = phát sinh + 1 NLV, chặn tích ITNK_HT khi chưa xong ITNK_KT + ITNK_BCKQ, tên chức năng ghi đè, nhật ký hằng ngày tại DN, nội dung Sao chép thông tin, tiến độ/checklistDu/việc còn thiếu.
- Test: 181 đạt / 189 tổng (8 skip nhóm N)
- Giả định đã chọn: Việc chỉ sinh khi mốc đã có ngày THỰC TẾ (mốc dự kiến không sinh). Bãi bỏ: chỉ giữ việc hủy (TTR_HUY, ITNK_HUY), việc khác chưa tích → không áp dụng. Khóa tích: MA hoặc MA#<id sự kiện/lần nộp>.

### 2026-11-23 – T09 Việc ngoài cuộc
- Đã làm: core/viec: cú pháp lặp (NGAY, TUAN, THANG, THANG:CUOI[-n], QUY:CUOI-n, NAM), lần kế tiếp, hoàn thành + tạo lần sau, mẫu việc thường xuyên + đồng bộ, nhận diện hạn tiếng Việt, nhóm/SLA/điểm ưu tiên. Bật lại 8 ca nhóm N trong acceptance.
- Test: 218 đạt / 218 tổng (N01–N08 đạt thật)
- Giả định đã chọn: THANG:CUOI-n trừ n NGÀY LỊCH rồi lùi về ngày làm việc trước. Việc xong muộn → lần kế tiếp bỏ qua các lần đã trôi qua. Điểm ưu tiên việc ngoài cuộc: lãnh đạo giao +2, hệ số 1,5 (LANH_DAO/VAN_BAN/THUONG_XUYEN) hoặc 1 (TU_DAT).

### 2026-11-23 – T10 Nhắc việc, .ics, Google Lịch
- Đã làm: core/nhacViec: sinhLichNhac theo bảng ARCH §8.1 (hạn pháp lý/nội bộ/tùy chọn, nhật ký iTNK 16:30/17:15/07:45, yêu cầu tài liệu, vướng mắc, bản tin sáng, rà soát tuần, kế hoạch năm từ 10, theo dõi nộp tiền hằng tuần, nhắc trước lưu trữ 30 ngày), giờ yên lặng, khóa ổn định, ẩn danh; taoICS RFC 5545 (CRLF, gập 75 octet, escape, UID ổn định, VALARM); linkGoogleLich; caiDatMacDinh.
- Test: 248 đạt / 248 tổng
- Giả định đã chọn: Nhắc bám theo HẠN MỤC TIÊU (hạn pháp lý − đệm); riêng ngày hạn pháp lý có báo thức 07:30 và quá hạn nhắc 08:00 mỗi NLV tính từ sau hạn pháp lý. Bước dự kiến (mốc chưa có ngày thật) không nhắc. DTSTART dạng giờ địa phương không múi giờ; DTSTAMP quy đổi UTC (VN = UTC+7).

### 2026-11-23 – T11 Tóm tắt và báo cáo
- Đã làm: core/tomTat: phanTichCuoc, tongHopHomNay (KPI Quá hạn/Hôm nay/3 NLV/Nhập liệu thiếu/Tại DN, dùng cho màn Hôm nay), tomTatMotCuoc (mẫu câu SPEC §12.7), banTinSang, baoCaoTienDoDoan, baoCaoTuan, tenNgan, ẩn danh (hienDayDu ghi đè).
- Test: 260 đạt / 260 tổng (5 snapshot đã rà soát bằng mắt)
- Giả định đã chọn: Tên bước trong danh sách được rút gọn (bỏ ngoặc phụ, cắt tại dấu hai chấm); tên đầy đủ vẫn hiện ở chi tiết cuộc. Ngày thứ n/tổng: ngày lịch từ C (ngày công bố là ngày 1); bộ 970 đếm theo ngày làm việc.

### 2026-11-23 – T12 Kế hoạch năm
- Đã làm: core/keHoach/thongKe: chỉ tiêu, số cuộc theo từng bước (QĐ/công bố/kết thúc tại DN/QĐ xử lý/bãi bỏ), theo giai đoạn, tổng tiền + còn phải nộp, tích lũy theo tháng (thực tế vs lý tưởng), tồn chuyển năm sau, cảnh báo (quá tháng dự kiến, cuối năm Đ15.5.e, công khai 30 ngày, báo cáo chuyên đề, vượt chỉ tiêu), bộ lọc năm/kế hoạch/trưởng đoàn.
- Test: 272 đạt / 272 tổng
- Giả định đã chọn: Cuộc không gắn kế hoạch tính theo năm ban hành QĐ (hoặc năm tạo). Cuộc bãi bỏ không tính vào số đã ban hành/đã có QĐ xử lý. Không có chỉ tiêu nhập → chỉ tiêu = số cuộc thực tế.

### 2026-11-23 – T13–T14 Kho IndexedDB và mã hóa bằng mật mã (⭐ T14)
- Đã làm: data/kho: 9 kho, CRUD, xóa mềm/khôi phục/xóa hẳn sau 30 ngày, audit log (cắt 2.000 dòng, chỉ ghi trường thay đổi), migrate, nhắc đã phát, chuẩn hóa dữ liệu cũ, storage.persist. data/mat: PBKDF2-SHA256 210.000 vòng → AES-GCM 256, mở khóa/khóa lại, đổi/tắt mật mã (một giao dịch), chặn sai 5 lần/30 giây, khóa tự động. Sửa lỗi phát hiện khi test: khóa dòng nhật ký bị trùng id thực thể.
- Test: 305 đạt / 305 tổng
- Giả định đã chọn: Dòng nhật ký hệ thống cũng được mã hóa khi bật mật mã. Quên mật mã = mất dữ liệu (đúng thiết kế). Nhật ký sửa chỉ lưu các trường đổi (không chép cả cuộc).

### 2026-11-23 – T15 Sao lưu và khôi phục
- Đã làm: data/saoLuu: tệp .tlkt.json (TLKT-sao-luu-YYYYMMDD), mã hóa nếu đã bật mật mã (mật mã lúc tạo tệp), nhập Thay thế / Gộp theo suaLuc, báo cáo thêm/cập nhật/giữ nguyên/bỏ qua, kiểm tra tệp hỏng/sai định dạng/phiên bản mới, nhắc sao lưu thứ Sáu 15:45 nếu quá 7 ngày (core/nhacViec/saoLuu + sinhLichNhac).
- Test: 320 đạt / 320 tổng
- Giả định đã chọn: Tệp sao lưu mã hóa dùng mật mã tại thời điểm tạo tệp (không phải mật mã hiện tại nếu đã đổi sau đó). Nhắc sao lưu chỉ sinh khi truyền saoLuuCuoi (null = chưa từng sao lưu).

### 2026-11-23 – T16 Dữ liệu mẫu
- Đã làm: data/mau: 6 cuộc ở 6 giai đoạn (đang KT tại DN, chờ công bố, biên bản, GDLK chờ QĐ có giải trình, bãi bỏ, chuyển tiếp 970 theo dõi nộp tiền) tính theo ngày hôm nay, 1 kế hoạch năm, 10 việc (lặp lại, quá hạn, hôm nay, hộp thu, đã xong, ghim), 3 khối thời gian; themDuLieuMau (không nhân đôi), xoaDuLieuMau (chỉ xóa bản ghi có cờ mẫu), coDuLieuMau. Thêm core laBuocNoiBoDaQua: bỏ bước nội bộ của giai đoạn đã qua khỏi Hôm nay/nhắc/bản tin/.ics.
- Test: 386 đạt / 386 tổng (kiểm thử trên 7 ngày hôm nay khác nhau)
- Giả định đã chọn: Cuộc mẫu chuyển tiếp QTKT-970 dùng ngày cố định (bộ 970 chỉ áp cho QĐ trước 01/7/2026). Bước nội bộ (P2–P4, …) của giai đoạn đã qua không còn hiện ‘quá hạn’ ở Hôm nay/nhắc việc nhưng vẫn thấy trong dòng thời gian cuộc.

### 2026-11-23 – T17–T18 Khung app, onboarding, màn khóa
- Đã làm: ui: tokens Sáng/Tối (chữ SLA đạt AA), font Be Vietnam Pro + dự phòng, router hash (UI §2), thanh dưới/cột trái/cột phải, nút nổi Thu nhanh (nhận diện hạn tiếng Việt + nhập giọng nói vi-VN nếu có), toast có Hoàn tác, hộp xác nhận tự xây, bảng trượt có bẫy tiêu điểm/Esc, trạng thái rỗng, các nhãn; kho trạng thái signals; khóa tự động; onboarding 4 bước (hồ sơ, giờ làm việc + nhập lịch nghỉ, mật mã + ẩn danh, bắt đầu); màn khóa (sai 5 lần chờ 30 giây, quên mật mã → xóa dữ liệu phải gõ XOA).
- Test: 391 đạt / 391 tổng (đã chạy thử trong Chromium: không lỗi console)
- Giả định đã chọn: Onboarding bước 3: ẩn danh thông báo đề xuất BẬT mặc định (chỉ áp dụng nếu người dùng đi qua bước 3). Màu chữ trạng thái SLA dùng bản đậm hơn màu biểu tượng để đạt tương phản AA.

### 2026-11-23 – T19 Màn Hôm nay (⭐)
- Đã làm: ui/man/homNay: lời chào theo giờ, tóm tắt, KPI (quá hạn/hôm nay/3 NLV/nhập liệu thiếu), nhóm QUÁ HẠN/HÔM NAY/3 NGÀY LV TỚI bằng ThẻViệc (✓ Xong mở form đánh dấu bước, tích nhập liệu, hoàn thành việc có Hoàn tác; menu Mở cuộc/Thêm Google Lịch/Ghi lý do trễ), Tại DN hôm nay (tích nhật ký iTNK, yêu cầu tài liệu), nhập liệu thiếu, lịch trong ngày, cảnh báo lịch nghỉ/sao lưu, dải xanh khi không có việc gấp, thẻ gợi ý khi chưa có cuộc; cột phải Việc tiếp theo trên máy tính. Logic cập nhật cuộc thuần (core/vuViec/capNhat) + form Xong (ngày, số VB, lý do trễ bắt buộc, cảnh báo S5 thiếu checklist).
- Test: 399 đạt / 399 tổng; đã chạy luồng thật trong Chromium (nạp dữ liệu mẫu → ✓ Xong → Lưu → Hoàn tác → tích nhật ký) không lỗi console
- Giả định đã chọn: Nhắc lịch nghỉ Tết năm nay chỉ trong 6 tháng đầu năm; năm sau luôn nhắc.

### 2026-11-23 – T20 Danh sách cuộc: Danh sách, Kanban, Gantt
- Đã làm: core/tomTat/danhSachCuoc (tìm không dấu/MST, lọc, sắp xếp, SLA cả cuộc, quy tắc kéo-thả, dữ liệu Gantt) + ui/man/dsCuoc, kanban, gantt: thanh tìm/lọc/sắp xếp, 3 chế độ xem (nhớ lựa chọn), Kanban 9 cột kéo thả chỉ mở form xác nhận (bãi bỏ → tab Sự kiện), Gantt SVG (đoạn giai đoạn, nét đứt cho dự kiến, gạch chéo tạm dừng, ◆ hạn pháp lý, vạch Hôm nay, tự cuộn tới hôm nay).
- Test: 411 đạt / 411 tổng; đã chạy thử trong Chromium (tìm, lọc, đổi chế độ xem, kéo thả) không lỗi console
- Giả định đã chọn: SLA của cả cuộc = mức nặng nhất trong các bước pháp lý đang mở (việc nhập liệu quá hạn không tính). Kéo thả chỉ cho sang giai đoạn liền kề; lùi hoặc nhảy cóc bị từ chối kèm lý do.

### 2026-11-23 – T21 Thêm/Sửa cuộc 3 bước
- Đã làm: ui/man/themCuoc: form 3 bước (NNT → phân loại → đoàn & nội dung) + xem trước dòng thời gian dự kiến; kiểm tra MST 10/13 số (chuẩn hóa 10-3), cảnh báo trùng MST cùng năm, mã cuộc KT-năm-số tự sinh, gợi ý theo loại cuộc, thời hiệu kiểm tra lại, danh sách thành viên/giám sát động; dùng cho cả sửa cuộc. core/vuViec/nhapCuoc (+test). Sửa lỗi: onClick truyền sự kiện thành id cuộc; trùng tên lớp CSS .rong.
- Test: 415 đạt / 415 tổng; đã thử trong Chromium: MST sai khóa nút Tiếp, lưu xong chuyển tới trang cuộc
- Giả định đã chọn: KHÔNG kiểm tra chữ số kiểm tra của MST (thuật toán tôi nhớ không khớp MST thật nên bỏ để tránh cảnh báo sai); chỉ kiểm tra độ dài 10/13 số. Gợi ý theo loại cuộc lấy từ SPEC §6, đối chiếu Điều 16.1 khi soạn tờ trình.

### 2026-11-23 – T22 Chi tiết cuộc – Dòng thời gian + đánh dấu mốc (⭐)
- Đã làm: ui/man/chiTietCuoc (đầu trang dính: NNT, trưởng đoàn, việc tiếp theo + ✓ Đánh dấu xong + Google Lịch, menu Sửa/Nhân bản/Xuất .ics/In/Xóa; 8 tab), ui/chiTiet/dongThoiGian (bước theo 6 giai đoạn, trạng thái SLA, căn cứ, biểu mẫu, bước tùy chọn/có điều kiện viền đứt, bước dự kiến nghiêng mờ; Xong…/Sửa/Bỏ đánh dấu; khóa nút kèm lý do khi thiếu bước trước), cột phải dòng thời gian mốc (máy tính), form Xong hỗ trợ sửa, nhanBanCuocTho, xuat.ts (tải .ics).
- Test: 416 đạt / 416 tổng; đã thử trong Chromium: bước khóa khi thiếu tiền đề, ngày trước D0 báo lỗi + khóa Lưu, quá hạn bắt buộc lý do trễ, sửa, bỏ đánh dấu có xác nhận
- Giả định đã chọn: Tab Sự kiện, Nhập hệ thống, Nhật ký, Tài liệu, Kết quả, Lưu trữ, Lịch sử hiện là chỗ giữ chỗ – hoàn thiện ở T23–T25.

### 2026-11-23 – T23 Chi tiết cuộc – Tab Sự kiện (⭐)
- Đã làm: ui/chiTiet/formSuKien (11 loại form theo rules, hướng dẫn từng loại, kiểm tra hợp lệ tức thì, khung “Hạn kết thúc sẽ đổi từ … thành …” + danh sách các hạn khác đổi, xác nhận khi có cảnh báo như gia hạn muộn hơn hạn T3), tabSuKien (lưới 11 nút mờ kèm lý do, danh sách sự kiện, sửa/xóa có Hoàn tác); core: ganSuKienVaoCuoc (Điều chỉnh QĐ cập nhật trưởng đoàn/nội dung/thời kỳ và lưu giá trị cũ), xoaSuKienKhoiCuoc, moTaSuKien.
- Test: 421 đạt / 421 tổng; đã thử trong Chromium: tạm dừng 3 ngày (08/12→11/12), gia hạn 20 ngày (→31/12), 21 ngày bị chặn, gia hạn lần 2 bị khóa
- Giả định đã chọn: Điều chỉnh QĐ: xóa/sửa sự kiện KHÔNG tự hoàn lại thông tin đoàn đã đổi (giá trị cũ lưu trong sự kiện để xem; chỉnh tay ở Sửa thông tin).

### 2026-11-23 – T24 Tab Nhập hệ thống + màn Nhập liệu còn thiếu
- Đã làm: ui/chiTiet/tabNhapHeThong + hangNhapLieu (3 nhóm TTR/iTNK/TMS, tiến độ x/y, tích/bỏ tích, chặn tích khi chưa đủ điều kiện kèm lý do, nút Sao chép khối thông tin đúng thứ tự trường), ui/man/nhapLieu (gom mọi cuộc, lọc hệ thống + mức khẩn, nhóm theo cuộc, nhắc chốt số liệu ngày 15/cuối tháng), core/viec/chotSoLieu.
- Test: 422 đạt / 422 tổng; đã thử trong Chromium: lọc iTNK, Sao chép → clipboard đúng nội dung, tích làm giảm 6→5
- Giả định đã chọn: Mốc chốt số liệu: ngày 15 và ngày cuối tháng, rơi ngày nghỉ thì lùi về ngày làm việc trước.

### 2026-11-23 – T25 Chi tiết cuộc – Nhật ký, Tài liệu & vướng mắc, Kết quả & nộp tiền, Lưu trữ, Lịch sử
- Đã làm: ui/chiTiet: tabNhatKy (lưới theo tuần, tích iTNK, ghi chú nhanh + nói + sao chép, đánh dấu không xuống DN), tabTaiLieu (yêu cầu 06 giờ LV có đồng hồ/quá hạn gợi ý lập biên bản VPHC; vướng mắc 3 chặng × 02 NLV, nút lập phụ lục 16/KTT), tabKetQua (số liệu 6 khoản định dạng 1.234.567, có xử lý → chế độ X, loại văn bản/số QĐ/hành vi, các lần nộp + đã nhập TTR, thanh Đã nộp n% – còn …), tabLuuTruVaLichSu (hạn bàn giao S6, 7 thành phần hồ sơ Đ35.2, lịch sử sửa riêng của cuộc từ audit log). core/capNhat: yêu cầu, vướng mắc, kết quả, lần nộp, tinhHinhNop, hồ sơ lưu trữ.
- Test: 427 đạt / 427 tổng; đã thử trong Chromium đủ 5 tab (tích nhật ký 2/4→3/4, thêm yêu cầu + vướng mắc, lưu kết quả, thêm lần nộp 33%, tích hồ sơ, lịch sử)
- Giả định đã chọn: Thành phần hồ sơ lưu trữ lưu trong cuoc.checklist với khóa tiền tố LT: (không lẫn với checklist hệ thống).

### 2026-11-23 – T26 Lịch tháng/tuần/ngày + khối thời gian
- Đã làm: core/tomTat/lichNgay (luoiThang, gomMucTheoNgay, goiYKhoiThoiGian: Tại DN theo khung giờ làm việc + Nhập TTR/iTNK 30 phút cuối ngày, xepLanKhoi) + ui/man/lich: Tháng (chấm màu theo mức khẩn, ngày nghỉ nền xám + tên lễ, ngày làm bù, chọn ngày xem danh sách hạn), Tuần/Ngày (cột giờ 07–18, vạch giờ hiện tại, kéo trên cột để tạo khối trên máy tính, nút ＋ Khối, khối chồng giờ chia làn, gợi ý viền đứt bấm để nhận), xuất .ics 30 ngày/tất cả.
- Test: 439 đạt / 439 tổng; đã thử trong Chromium (tháng/tuần/ngày, nhận gợi ý, kéo tạo khối)
- Giả định đã chọn: Gợi ý ‘Nhập TTR/iTNK’: 30 phút cuối khung giờ làm việc của ngày có việc nhập liệu đến hạn (thay cho ‘30 phút sau mỗi mốc’ vì mốc chỉ có ngày, không có giờ).

### 2026-11-23 – T27 Màn Việc
- Đã làm: ui/man/viec: 5 tab (Hộp thu, Đang làm theo Quá hạn/Hôm nay/Tuần này/Sau, Lặp lại, Mẫu bật/tắt, Đã xong), ô thu nhanh nhận diện hạn + nhập giọng nói vi-VN (ẩn nếu trình duyệt không hỗ trợ), form chi tiết (nguồn, nhóm đột xuất, số VB, người giao, hạn, giờ, kiểu lặp có xem trước các lần tới, liên kết cuộc, việc con), hoàn thành việc lặp tự tạo lần sau + Hoàn tác, ghim, xóa mềm. Sửa lỗi: dữ liệu mẫu không tạo trùng việc lặp đã có từ mẫu.
- Test: 440 đạt / 440 tổng; đã thử trong Chromium: thu nhanh ‘trước 15/12’ → chip hạn 15/12/2026, hoàn thành + hoàn tác việc lặp, form lặp hằng tuần, tab Mẫu 7 mục
- Giả định đã chọn: Việc ‘Lặp lại’ chỉ có một bản ghi đang mở mỗi chuỗi; bật mẫu mới sẽ tạo việc ngay.

### 2026-11-23 – T28 Kế hoạch ngày
- Đã làm: ui/man/keHoachNgay: phiếu ‘KẾ HOẠCH MỖI NGÀY’ – chọn ngày/tuần, Việc cần làm (tự đổ từ hạn ≤ ngày + kéo từ Hộp thu), Mục tiêu ≤ 3, Nhắc nhở (tự đổ từ lịch nhắc + ghi thêm), Lịch trong ngày, Ghi chú, Cho ngày mai (+ nút chuyển việc ngoài cuộc chưa xong sang ngày làm việc kế tiếp, có Hoàn tác), Cảm nhận 5 mức; tự lưu sau 600 ms.
- Test: 440 đạt / 440 tổng; đã thử trong Chromium: tự lưu rồi tải lại còn nguyên, chuyển 3 việc sang ngày mai và hoàn tác
- Giả định đã chọn: Nút ‘Chuyển sang ngày mai’ chỉ chuyển việc ngoài cuộc (hạn pháp lý của cuộc không đổi được).

### 2026-11-23 – T29 Kế hoạch năm + biểu đồ
- Đã làm: ui/man/keHoachNam + bieuDo: chọn năm/kế hoạch, 6 ô KPI số cuộc, 6 ô tiền (truy thu, phạt, chậm nộp, giảm khấu trừ, giảm lỗ, đã nộp/phải nộp), biểu đồ SVG tích lũy theo tháng (thực tế vs đường lý tưởng, có bảng thay thế cho trình đọc màn hình) + cột theo giai đoạn, cảnh báo (quá tháng dự kiến, cuối năm Đ15.5.e, hạn công khai 30 ngày, báo cáo chuyên đề), tồn chuyển năm sau; quản lý kế hoạch (thêm/sửa/xóa mềm có Hoàn tác, hạn công khai/báo cáo kèm SLA).
- Test: 440 đạt / 440 tổng; -

### 2026-11-23 – T30 Báo cáo & tóm tắt + trang in
- Đã làm: ui/man/baoCao: 4 loại văn bản (bản tin sáng, báo cáo tiến độ đoàn, báo cáo tuần, tóm tắt một cuộc) có xem trước, Sao chép, Soạn email (mailto), In/Lưu PDF; tùy chọn ‘Hiện đầy đủ MST lần này’ khi đang ẩn danh; khối Xuất Excel 5 loại (nối ở T35); CSS @media print ẩn khung điều hướng, chỉ in nội dung (cũng dùng cho In chi tiết cuộc).
- Test: 440 đạt / 440 tổng; -

### 2026-11-23 – T31 Cài đặt
- Đã làm: Màn Cài đặt 6 nhóm: hồ sơ/giờ làm việc/ngày nghỉ/việc thường xuyên; quy tắc thời hạn sửa từng bước, khôi phục mặc định, chế độ thận trọng, tên chức năng hệ thống; nhắc việc; mật mã (đặt/đổi/tắt, khóa tự động, ẩn danh); giao diện; sao lưu/khôi phục, dữ liệu mẫu, xóa toàn bộ
- Test: 442 đạt / 442 tổng; kiểm tra trên Chromium: sửa số ngày → khôi phục mặc định, đặt/tắt mật mã, sao lưu → xóa mẫu → khôi phục, đổi giao diện tối

### 2026-11-23 – T32 Căn cứ & hướng dẫn, Kiểm thử, Giới thiệu, Thùng rác
- Đã làm: Màn Căn cứ (văn bản, bảng quy trình theo giai đoạn có trích dẫn, chuyển tiếp, biểu mẫu, điểm chưa xác nhận, hướng dẫn 5 bước + cài màn hình chính + thêm lịch); màn Kiểm thử chạy lại 39 ca kich-ban-han.json ngay trong trình duyệt (tách bộ chạy dùng chung src/core/kiemThu); Giới thiệu (phiên bản, ngày build); Thùng rác khôi phục/xóa vĩnh viễn
- Test: 444 đạt / 444 tổng; Chromium: Kiểm thử 39/39 đạt, thùng rác xóa→khôi phục OK

### 2026-11-23 – T33 Bộ phát nhắc trong app
- Đã làm: Lõi chọn nhắc cần phát/hoãn/bỏ không trùng (core/nhacViec/phat.ts); vòng 30 giây: thẻ nhắc nổi + Notification (xin quyền có giải thích ở chuông) + âm báo; chuông 🔔 liệt kê nhắc 36 giờ gần nhất với Mở / Hoãn 15 phút, 1 giờ, sáng mai / Đã làm; lưu trạng thái qua tải lại
- Test: 455 đạt / 455 tổng; Chromium: nhắc hiện, hoãn, đã làm, tải lại không phát trùng
- Giả định đã chọn: Cửa sổ nhắc 36 giờ gần nhất để mở app sau thời gian vắng không bị dồn quá nhiều; “Sáng mai” = ngày làm việc kế tiếp 07:30; “Đã làm” chỉ ẩn nhắc, việc thật vẫn đánh dấu xong ở cuộc/việc

### 2026-11-23 – T34 Xuất lịch
- Đã làm: Tải .ics (30 ngày tới / tất cả hạn trong Cài đặt → Nhắc việc và menu Lịch; một cuộc ở menu cuộc); nút Thêm Google Lịch ở mọi ThẻViệc, mốc trong dòng thời gian, mục Việc, cột Việc tiếp theo; hướng dẫn iPhone/Android ở Cài đặt và Căn cứ; thẻ nhắc nổi tự ẩn sau 20–60 giây
- Test: 455 đạt / 455 tổng; Chromium: tải .ics hợp lệ (CRLF, VALARM, UID không trùng), link Google Lịch xuất hiện

### 2026-11-23 – T35 Excel
- Đã làm: Nhập kế hoạch từ .xlsx/.csv (tự nhận cột, ghép cột, chọn dòng tiêu đề/trang tính, xem trước lỗi–trùng MST, tạo kế hoạch + cuộc); tải tệp mẫu .xlsx/.csv; xuất 5 loại Excel (danh sách cuộc+mốc+SLA, nhập liệu thiếu, thu nộp, tiến độ kế hoạch, việc khác); nhập ngày nghỉ từ tệp; SheetJS tải khi dùng (gói riêng)
- Test: 487 đạt / 487 tổng; Chromium: tải mẫu → nhập 3 cuộc, nhập lại báo trùng, tải đủ 5 tệp, nhập ngày nghỉ từ CSV
- Giả định đã chọn: SheetJS bản miễn phí không ghi được in đậm/cố định dòng đầu → dùng độ rộng cột, ô số 1.234.567 và bộ lọc ở dòng tiêu đề; CSV đọc dạng chữ (tránh Excel đoán 03/2027 là ngày); MST thiếu số 0 đầu (Excel làm mất) tự thêm 0 và cảnh báo; trưởng đoàn trùng họ tên trong Cài đặt → tự đánh dấu đã nhận phân công (P1); dòng trùng MST mặc định không nhập

### 2026-11-23 – T36 PWA
- Đã làm: vite-plugin-pwa (manifest, icon 192/512/maskable/apple-touch sinh từ icon.svg, service worker lưu sẵn toàn bộ gói kể cả SheetJS); phông Be Vietnam Pro cài sẵn (không tải từ mạng); thanh “Có phiên bản mới – Cập nhật ngay”; báo “sẵn sàng dùng offline”; nút Cài app ngay + hướng dẫn thêm vào màn hình chính
- Test: 487 đạt / 487 tổng; Chromium: service worker kiểm soát trang, tải lại khi ngắt mạng vẫn mở được, xuất Excel offline OK, 0 yêu cầu ra ngoài
- Giả định đã chọn: Cập nhật phiên bản theo kiểu hỏi người dùng (registerType prompt) để không đổi app giữa lúc đang nhập; kiểm tra bản mới mỗi giờ

### 2026-11-23 – T37 E2E + ảnh chụp
- Đã làm: Kịch bản Playwright (e2e/luong-chinh.cjs): mở lần đầu → onboarding → dữ liệu mẫu → tạo cuộc mới → đánh dấu xong 22 bước đến giai đoạn Hoàn thành → mở 14 màn, Kiểm thử trong app đạt, không lỗi console; chụp 66 ảnh 390×844 và 1440×900 vào docs/anh-chup (e2e/chup-anh.cjs); thêm npm run e2e và npm run chup-anh
- Test: 487 đạt / 487 tổng; Chromium: E2E đạt toàn bộ, 0 lỗi console ở cả hai khổ màn hình
- Giả định đã chọn: Playwright không nằm trong package.json của dự án (cần cài sẵn trong máy chạy) để việc cài đặt và triển khai không nặng thêm

### 2026-11-23 – T38 Rà soát độ phủ yêu cầu
- Đã làm: Lập docs/DO-PHU-YEU-CAU.md (SPEC §2–§17, UI §4) kèm vị trí mã/test; làm nốt các mục làm được: soạn tin báo lãnh đạo khi quá hạn > 1 ngày LV, nhắc Tổng kết ngày 16:50, che nội dung khi app ra nền, ô “Chỉ cuộc của tôi” ở Kế hoạch năm. Còn Chưa: mẫu quy trình cho bộ phận khác, khóa vân tay/Face ID; Một phần: ẩn danh chỉ che hiển thị, bản đơn vị
- Test: 490 đạt / 490 tổng; thêm test tin báo lãnh đạo và nhắc tổng kết ngày
- Giả định đã chọn: Mẫu quy trình bộ phận khác và sinh trắc để giai đoạn sau (SPEC nêu rõ là hướng mở rộng/bản app sau này)

### 2026-11-23 – T39 Hiệu năng & truy cập
- Đã làm: Gói chính 126 KB gzip (<300 KB; SheetJS tải riêng khi dùng; có cache offline); test tương phản WCAG AA cho toàn bộ cặp màu ở giao diện Sáng và Tối (tests/tuongphan.test.ts); kiểm tra axe-core (WCAG 2.1 A/AA) trên 18 màn × 2 khổ × 2 giao diện → 0 lỗi (e2e/truy-cap.cjs, npm run truy-cap); kiểm tra bàn phím (Tab, bẫy focus, Esc, vòng focus ≥ 2px, phóng chữ 200%); sửa các lỗi tìm thấy: màu chữ xanh/đỏ/nhãn hệ thống ở giao diện tối, huy hiệu đỏ, ô lịch (nhãn, bỏ vai trò sai), bảng cuộn ngang cuộn được bằng bàn phím
- Test: 524 đạt / 524 tổng; axe 0 lỗi; 524 test đạt
- Giả định đã chọn: Không đo Lighthouse (không có trong môi trường này); thay bằng axe-core + kiểm tra bàn phím + kiểm tra tương phản; axe-core là thư viện chỉ dùng khi kiểm tra (devDependency)

## Giả định đã chọn khi chưa có xác nhận (để người dùng xem lại)
- T1 (20 ngày tại trụ sở) tính theo **ngày lịch**, đổi được trong Cài đặt.
- Cách đếm “kể từ”: ngày sự kiện không tính; hạn ngày lịch/tháng rơi ngày nghỉ → ngày làm việc kế tiếp.

## Cần người dùng xác nhận (không chặn tiến độ – app vẫn chạy với giả định trên)
- [ ] 20 ngày tại trụ sở: ngày lịch hay ngày làm việc (TTR đang tính thế nào)?
- [ ] Đã có Quy chế giám sát mới thay QĐ 1614/QĐ-TCT chưa?
- [ ] Tên/mã chức năng TMS (4.1; 1.4.1), TTR, iTNK theo phiên bản đang dùng.
- [ ] Lịch nghỉ Tết, Giỗ Tổ, nghỉ bù năm 2026–2027.
- [ ] Tham số bộ chuyển tiếp QTKT-970.
- [ ] Hạn nộp tiền theo QĐ xử phạt (mặc định nhận QĐ + 10 ngày).
- [ ] Mẫu quy trình tự tạo cho bộ phận khác (SPEC §11) – chưa làm, chờ đơn vị chốt nhu cầu (xem `docs/DO-PHU-YEU-CAU.md`).
- [ ] Khóa bằng vân tay/Face ID – chưa làm (cần app di động); hiện dùng mật mã.
- [ ] Chế độ ẩn danh chỉ che hiển thị, dữ liệu vẫn lưu đầy đủ trên thiết bị (để tính hạn); nếu cần lưu rút gọn thật sự, báo để đổi.
- [ ] Kế hoạch năm “bản đơn vị” (nhiều cán bộ): hiện gộp bằng nhập Excel/sao lưu, chưa gộp tự động.

## Góp ý của người dùng sau khi dùng thử
<!-- Người dùng ghi vào đây; chạy /sua-loi hoặc /tiep-tuc để Claude xử lý -->
