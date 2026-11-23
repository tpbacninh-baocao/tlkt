# TIẾN ĐỘ – TLKT

> Claude Code đọc tệp này đầu mỗi phiên và cập nhật sau mỗi nhiệm vụ. Người dùng đọc tệp này để biết đã làm đến đâu.

## Trạng thái hiện tại
- Nhiệm vụ đang làm: T15
- Nhiệm vụ xong gần nhất: T14
- `npm run check`: sạch (305 đạt / 305 tổng)
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

## Góp ý của người dùng sau khi dùng thử
<!-- Người dùng ghi vào đây; chạy /sua-loi hoặc /tiep-tuc để Claude xử lý -->
