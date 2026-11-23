# TIẾN ĐỘ – TLKT

> Claude Code đọc tệp này đầu mỗi phiên và cập nhật sau mỗi nhiệm vụ. Người dùng đọc tệp này để biết đã làm đến đâu.

## Trạng thái hiện tại
- Nhiệm vụ đang làm: T07
- Nhiệm vụ xong gần nhất: T06
- `npm run check`: sạch (145 đạt / 153 tổng (8 skip nhóm N))
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
