# KIẾN TRÚC KỸ THUẬT – TLKT (Trợ lý Đoàn kiểm tra)

Tài liệu này quy định **cách xây**. Nghiệp vụ: `docs/SPEC.md`. Giao diện: `docs/UI.md`. Thứ tự việc: `docs/TASKS.md`.

---

## 1. Nền tảng đã chốt
- **Giai đoạn A (làm ngay):** ứng dụng web **PWA** cài được lên màn hình chính điện thoại (Android/iOS) và dùng trên máy tính; chạy offline; **host tĩnh trên GitHub Pages** (HTTPS, miễn phí; chỉ chứa code, không chứa dữ liệu). Tự động build và triển khai bằng GitHub Actions (`.github/workflows/deploy.yml` đã có sẵn).
- **Giai đoạn B (sau, tùy chọn):** app Expo (React Native) dùng lại nguyên `src/core` – xem mục 13.
- Dữ liệu **lưu trên thiết bị** (IndexedDB), mã hóa tùy chọn bằng mật mã; chuyển máy/đồng bộ thủ công bằng tệp sao lưu `.tlkt.json`.

## 2. Công nghệ
| Hạng mục | Chọn | Ghi chú |
|---|---|---|
| Build | Vite (bản mới nhất ổn định) + TypeScript `strict` | `base: './'` để chạy được dưới đường dẫn con của GitHub Pages |
| UI | **Preact** + `@preact/signals` | nhẹ, cú pháp như React; không dùng thư viện UI nặng |
| CSS | CSS thuần + biến CSS (design tokens trong `docs/UI.md`) | không Tailwind |
| Lưu trữ | `idb` (IndexedDB) | bọc toàn bộ trong `src/data/kho.ts` |
| Mã hóa | Web Crypto: PBKDF2-SHA256 (≥ 210.000 vòng) → AES-GCM 256 | |
| PWA | `vite-plugin-pwa` (generateSW) | manifest, icon tự sinh từ SVG |
| Excel | `xlsx` (SheetJS) – nạp động (dynamic import) chỉ khi dùng | |
| Biểu đồ | **SVG tự vẽ** (cột, đường tích lũy, tiến độ) | không cần thư viện biểu đồ |
| Ngày giờ | **Tự viết** trong `src/core/lich` – KHÔNG dùng date-fns/dayjs/moment | tránh lệch múi giờ |
| Test | Vitest (+ `fake-indexeddb`), Playwright cho e2e nếu cài được trình duyệt | |

Không gọi bất kỳ máy chủ/API nào lúc chạy (trừ tải font Google Fonts nếu online – có font dự phòng hệ thống).

## 3. Cấu trúc thư mục
```
src/
  core/                 # TypeScript thuần – KHÔNG import DOM, Preact, idb
    lich/               # ngày làm việc, cộng trừ hạn, giờ làm việc
    quyTac/             # nạp + gộp bộ quy tắc, chọn bộ theo ngày QĐ, tính hạn một bước
    vuViec/             # tính toàn bộ mốc của một cuộc, giai đoạn, việc tiếp theo, SLA, ưu tiên, sự kiện
    checklist/          # sinh việc nhập TTR/iTNK/TMS
    viec/               # việc ngoài cuộc, lặp lại, bộ nhận diện hạn tiếng Việt
    nhacViec/           # sinh lịch nhắc, chuỗi .ics, link Google Calendar
    tomTat/             # sinh văn bản tóm tắt/báo cáo
    keHoach/            # chỉ tiêu, tiến độ kế hoạch năm
    kieu.ts             # toàn bộ kiểu dữ liệu (mục 5)
  data/                 # IndexedDB, mã hóa, sao lưu, audit log, dữ liệu mẫu, migrate
  ui/                   # Preact: app shell, router, các màn hình, component dùng chung
  main.tsx
rules/                  # JSON quy tắc (nguồn sự thật về số ngày) – import trực tiếp vào bundle
tests/                  # kich-ban-han.json + *.test.ts
samples/                # tệp mẫu (Excel/CSV kế hoạch)
public/                 # icon, favicon
```

## 4. Bộ máy tính hạn (phần quan trọng nhất)

### 4.1 Biểu diễn ngày
- Ngày: chuỗi `NgayISO = 'YYYY-MM-DD'`. Ngày giờ: `'YYYY-MM-DDTHH:MM'` (giờ địa phương, không múi giờ). Tính toán nội bộ bằng số ngày kể từ mốc (epoch day) dùng `Date.UTC` – tuyệt đối không dùng `new Date('YYYY-MM-DD')` rồi đọc giờ địa phương.
- Hiển thị: `dd/mm/yyyy`, thứ tiếng Việt (“Thứ Hai”… “Chủ nhật”).

### 4.2 Lịch làm việc
`laNgayLamViec(d) = (thứ Hai–Sáu và d ∉ ngayNghi) hoặc d ∈ ngayLamBu`. Ngày nghỉ = ngày cố định trong `rules/ngay-nghi.json` (theo từng năm) ∪ ngày người dùng nhập.

### 4.3 Hàm cơ bản (`src/core/lich`)
| Hàm | Quy tắc |
|---|---|
| `congNLV(d, n)` | n > 0: đi tới, đếm mỗi ngày làm việc **sau** d, trả về ngày làm việc thứ n. n < 0: đi lùi tương tự. n = 0: trả về d |
| `congNgay(d, n)` | cộng n ngày lịch, rồi `lui(…)` |
| `congThang(d, m)` | cùng ngày của tháng thứ m sau; nếu tháng đó không có ngày ấy → ngày cuối tháng; rồi `lui(…)` |
| `lui(d)` | nếu d không phải ngày làm việc → ngày làm việc kế tiếp (Điều 148 BLDS) |
| `congGioLV(t, h)` | cộng h giờ làm việc theo khung giờ cấu hình; thời điểm bắt đầu nằm ngoài khung → nhảy tới đầu khung kế tiếp |
| `demNLV(a, b)` | số ngày làm việc trong (a, b] – dùng cho SLA |

**Chế độ thận trọng** (cài đặt, mặc định tắt): ngày sự kiện được tính là ngày 1 (nếu là ngày làm việc với NLV) và **không** `lui` qua ngày nghỉ. Mọi hàm nhận tham số `cheDo`.

### 4.4 Đặc tả một hạn trong JSON (`buoc[].han`)
| Trường | Ý nghĩa |
|---|---|
| `tu` | mốc gốc: `P1, D0, C, E, K, B, R, X, HAN_B1, NGAY_GIAO_QD, NGAY_PHAT_HIEN` |
| `so`, `donVi`, `huong` | số lượng, đơn vị `NLV/N/THANG/GIO_LV`, `+`/`-` |
| `soNeuGDLK` | thay `so` khi cuộc có giao dịch liên kết |
| `congTamDung` | cộng tổng số ngày lịch của các sự kiện TAM_DUNG |
| `giaHan` | giới hạn gia hạn cho bước T1 |
| `truoc` | không có số ngày: hạn = mốc đó (thực tế, hoặc dự kiến) |
| `vaTruoc` | hạn = min(hạn tính được, mốc đó nếu đã có) |
| `macDinhNeuChuaCoK` | khi chưa có K thì dùng mốc này (E) |
| `theoCheDo` | bước X: lấy `cheDoX[X1..X4].han` theo quy tắc chọn |
| `thamSo` | lấy `so` từ `thamSo` (người dùng sửa được) |
| `noiBo` | hạn mục tiêu nội bộ, không phải hạn luật định (hiển thị khác, hệ số ưu tiên thấp hơn) |
| `suKienThayThe` | nếu có sự kiện này (HOAN) thì hạn = `denNgay` của sự kiện |
| `dem` (ở cấp bước) | số NLV đệm: **hạn mục tiêu = congNLV(hạn pháp lý, −dem)** |

### 4.5 Tính E (bước T1) – thuật toán bắt buộc
```
goc = (donVi == 'N') ? congNgayKhongLui(C, so) : congNLV(C, so)        // so = soNeuGDLK nếu coGDLK
goc = congNgayKhongLui(goc, tongNgayTamDung)                            // nếu có tạm dừng (ngày lịch)
nếu có GIA_HAN: goc = (giaHan.donVi=='N') ? congNgayKhongLui(goc, soNgay) : congNLV(goc, soNgay)
E = lui(goc)                                                            // chỉ lùi ở bước cuối
```
Kiểm chứng bằng ca A04, A06, A07, G01, R05, R06 trong `tests/kich-ban-han.json`.

### 4.6 Mốc thực tế và mốc dự kiến
Mỗi mốc gốc (D0, C, K, B, R, X) có **giá trị thực tế** (người dùng nhập khi xong bước) hoặc **giá trị dự kiến** = hạn của bước sinh ra mốc đó (ví dụ C dự kiến = hạn Q5, hoặc ngày công bố dự kiến người dùng nhập). Hạn các bước phía sau tính từ mốc dự kiến được gắn cờ `duKien: true` (hiển thị nghiêng/nhạt). Sửa ngày thực tế của bất kỳ mốc nào → tính lại toàn bộ (hàm thuần, không lưu kết quả tính, chỉ lưu đầu vào).

### 4.7 Chọn bộ quy tắc
Theo ngày D0 (thực tế hoặc dự kiến; nếu chưa có thì ngày hôm nay): duyệt các bộ, chọn bộ có `apDung.ngayQDTu ≤ D0 ≤ apDung.ngayQDDen` (null = không giới hạn). Bộ có `keThua` = gộp sâu bộ cha + `ghiDe`. Người dùng có thể ghi đè bộ cho từng cuộc (lưu `boQuyTacGhiDe`).

### 4.8 Tham số người dùng sửa được
Mọi `so`, `donVi`, `dem` của từng bước, `thamSo`, giờ làm việc, ngày nghỉ. Lưu thành **bản vá** (patch) đè lên JSON gốc; có nút “Khôi phục mặc định”; mọi thay đổi ghi audit log.

## 5. Mô hình dữ liệu (`src/core/kieu.ts`)
```ts
type NgayISO = string;            // 'YYYY-MM-DD'
type NgayGio = string;            // 'YYYY-MM-DDTHH:MM'
type Id = string;                 // crypto.randomUUID()

interface CanBo { id: Id; hoTen: string; chucVu?: string; email?: string }

interface CaiDat {
  canBo: { hoTen: string; chucVu?: string; donVi: string; email?: string };
  gioLamViec: [string, string][];        // [['07:30','11:30'],['13:00','17:00']]
  ngayNghiThem: NgayISO[]; ngayLamBu: NgayISO[]; namDaXacNhanNgayNghi: number[];
  cheDoThanTrong: boolean;
  vaQuyTac: Record<string, unknown>;      // patch đè lên rules JSON
  tenChucNangHeThong: Record<string, string>; // ghi đè tên chức năng checklist
  nhac: { bat: boolean; gioYenLangTu: string; gioYenLangDen: string; banTinSang: string; nhatKy: string; nhatKyBaoThuc: string; amThanh: boolean };
  anDanh: boolean;                        // che MST/tên trong thông báo, tóm tắt
  giaoDien: 'sang' | 'toi' | 'heThong';
  khoaTuDongPhut: number;                 // 5
  mauViecDaBat: string[];
}

interface KeHoach {
  id: Id; nam: number; loai: 'KH_NAM' | 'CD_DAU_NAM' | 'CD_PHAT_SINH' | 'DOT_XUAT';
  ten: string; soQD?: string; ngayPheDuyet?: NgayISO; ngayCongKhai?: NgayISO;
  ngayBaoCaoCapTren?: NgayISO; ngayTongKet?: NgayISO; ngayBaoCaoKetThuc?: NgayISO;
  chiTieuSoCuoc?: number; ghiChu?: string;
}

type LoaiCuoc = 'KH'|'CD'|'TH'|'SH'|'GT'|'CDD'|'TCS'|'VP'|'CĐ'|'KN'|'MG'|'CQT'|'KL';

interface BuocThucHien { xong: boolean; ngay?: NgayISO; soVB?: string; ghiChu?: string; lyDoTre?: string }

interface SuKien {
  id: Id; loai: 'HOAN'|'TAM_DUNG'|'GIA_HAN'|'DIEU_CHINH'|'BAI_BO'|'GIAI_TRINH'|'PHUC_TAP'|'TOI_PHAM'|'KHONG_NHAN_QD'|'TAM_GIU_TL'|'PHU_LUC_BB';
  [truong: string]: unknown;            // theo rules suKien[loai].truong
  taoLuc: NgayGio;
}

interface YeuCauTaiLieu { id: Id; noiDung: string; guiLuc: NgayGio; nhanLuc?: NgayGio; ghiChu?: string }
interface VuongMac { id: Id; noiDung: string; ngayBaoCao: NgayISO; ngayLanhDaoBaoCao?: NgayISO; ngayNhanYKien?: NgayISO; ngayTongHop?: NgayISO; daXong: boolean }
interface LanNop { id: Id; ngay: NgayISO; soTien: number; ghiChu?: string; daNhapTTR: boolean }

interface CuocKiemTra {
  id: Id; ma: string;                       // mã nội bộ tự sinh: KT-2026-001
  mst: string; tenNNT: string; diaChi?: string; doiTuong: 'TO_CHUC' | 'HKD';
  coQuanQuanLyKhac: boolean;                // phải gửi bản sao cho CQT/bộ phận quản lý trực tiếp
  loai: LoaiCuoc; keHoachId?: Id; thangDuKien?: string; // 'YYYY-MM' theo mẫu 06/QTKT-TC
  coGDLK: boolean; kiemTraDienTu: boolean; kiemTraLai: boolean; ngayKLBiKiemTraLai?: NgayISO;
  hanNgoai?: NgayISO; hanNgoaiGhiChu?: string; vanBanGiao?: string;
  truongDoan: string; thanhVien: { hoTen: string; phanViec?: string }[]; giamSat: string[];
  noiDung?: string; thoiKy?: string; ngayCongBoDuKien?: NgayISO;
  buoc: Record<string, BuocThucHien>;       // khóa = mã bước (P1..S7)
  suKien: SuKien[];
  ketQua: { coXuLy: boolean; truyThu: number; phat: number; chamNop: number; giamKhauTru: number; giamLo: number; thuHoiHoan: number; loaiVanBanXL?: 'QD_XU_PHAT'|'KET_LUAN'; soQDXL?: string; hanhViViPham?: string };
  nopTien: LanNop[];
  checklist: Record<string, NgayISO>;       // mã việc (có hậu tố lần nếu lặp) → ngày tích
  nhatKy: Record<NgayISO, { daGhiITNK: boolean; ghiChu?: string }>;
  ngayKhongLamTaiDN: NgayISO[];             // ngày làm việc nhưng đoàn không xuống DN
  yeuCauTaiLieu: YeuCauTaiLieu[]; vuongMac: VuongMac[];
  boQuyTacGhiDe?: string; ghim?: boolean; nhan?: string[];
  taoLuc: NgayGio; suaLuc: NgayGio; xoaLuc?: NgayGio;
}

interface CongViec {
  id: Id; tieuDe: string; nguon: 'LANH_DAO'|'VAN_BAN'|'TU_DAT'|'THUONG_XUYEN'; nhom?: string;
  soVB?: string; nguoiGiao?: string; han?: NgayISO; gio?: string; lap?: string; mauMa?: string;
  cuocId?: Id; viecCon: { id: Id; tieuDe: string; xong: boolean }[];
  xong?: NgayGio; ghim?: boolean; ghiChu?: string;
  taoLuc: NgayGio; suaLuc: NgayGio; xoaLuc?: NgayGio;
}

interface KhoiThoiGian { id: Id; ngay: NgayISO; tu: string; den: string; tieuDe: string; cuocId?: Id; viecId?: Id }
interface KeHoachNgay { ngay: NgayISO; mucTieu: string[]; nhacNho: string; ghiChu: string; choNgayMai: string; camNhan?: 1|2|3|4|5 }
interface NhatKyHeThong { luc: NgayGio; hanhDong: 'THEM'|'SUA'|'XOA'|'KHOI_PHUC'|'CAI_DAT'|'NHAP'|'XUAT'; doiTuong: string; id?: Id; truoc?: unknown; sau?: unknown }
```
Kết quả tính (không lưu): `MocTinh { ma, ten, giaiDoan, hanPhapLy?, hanMucTieu?, duKien, noiBo, trangThai: 'XONG_DUNG_HAN'|'XONG_TRE'|'CHUA_DEN'|'SAP_DEN'|'HOM_NAY'|'QUA_HAN'|'KHONG_AP_DUNG', ngayXong?, canCu, bieuMau, nguoi }`.

## 6. Máy trạng thái, việc tiếp theo, SLA, ưu tiên (`src/core/vuViec`)
- **Giai đoạn** (cột Kanban), xét theo thứ tự: `BAI_BO` (có sự kiện BAI_BO) → `HOAN_THANH` (X xong, S1 xong, S5 xong, S4 xong hoặc không áp dụng) → `THEO_DOI_NOP_TIEN` (như trên nhưng S4 chưa xong) → `SAU_QD` (X xong) → `CHO_QD_XU_LY` (R xong) → `BIEN_BAN` (K xong) → `DANG_KIEM_TRA` (C xong) → `CHO_CONG_BO` (D0 xong) → `CHUAN_BI`.
- **Ràng buộc thứ tự:** không cho đánh dấu xong mốc C khi chưa có D0; K khi chưa có C; B khi chưa có K; R khi chưa có B; X khi chưa có B (cảnh báo mềm nếu chưa có B5). Ngày thực tế phải ≥ ngày của mốc trước; nhập ngày sau hạn pháp lý → bắt buộc nhập `lyDoTre`.
- **Việc tiếp theo:** bước đầu tiên theo thứ tự có `loai ∈ {buoc, moc, dieuKien(thỏa)}`, chưa xong, áp dụng được. Ngoài ra luôn kèm các mục song song đang mở: yêu cầu tài liệu, vướng mắc, checklist quá hạn, nhật ký hôm nay chưa ghi.
- **SLA** (theo hạn pháp lý; hạn mục tiêu dùng cho nhắc): `QUA_HAN` (hôm nay > hạn) · `HOM_NAY` (hôm nay = hạn) · `SAP_DEN` (demNLV(hôm nay, hạn) ≤ 3) · `CHUA_DEN`. Đã xong: `XONG_DUNG_HAN`/`XONG_TRE`. Quá hạn mà chưa có `lyDoTre` → hiển thị “quá hạn chưa giải trình”.
- **Điểm ưu tiên:** `diem = (10 − min(10, NLV còn lại)) × heSo + cong`, `heSo` = 3 (hạn luật định) / 1,5 (`noiBo`) / 1 (việc tự đặt); `cong` = +2 lãnh đạo giao hoặc `vanBanGiao`; +2 loại TH hoặc có `hanNgoai` trong 10 NLV; +1 có vướng mắc mở; quá hạn: +20. Ghim → lên đầu.

## 7. Việc ngoài cuộc (`src/core/viec`)
- **Lặp lại** (`lap`): `NGAY` (mỗi ngày làm việc) · `TUAN:<1-5>` (thứ trong tuần, 1 = thứ Hai) · `THANG:<1-31>` · `THANG:CUOI` · `THANG:CUOI-<n>` · `QUY:CUOI-<n>` · `NAM:<MM-DD>`. Hoàn thành một lần → tự tạo lần kế tiếp (một bản ghi duy nhất đang mở cho mỗi chuỗi). Nếu ngày rơi vào ngày nghỉ → lùi về ngày làm việc **trước** (việc báo cáo nên làm sớm).
- **Nhận diện hạn** (`nhanDienHan(cau, ngayGoc)`), không phân biệt hoa thường/dấu thừa: `hôm nay`, `ngày mai`/`mai`, `ngày kia`, `thứ hai…chủ nhật` (gần nhất từ hôm nay trở đi, không tính hôm nay), `… tuần sau` (thứ đó của tuần kế tiếp, tuần bắt đầu thứ Hai), `sau n ngày làm việc`/`n ngày làm việc`, `sau n ngày`, `trước dd/mm`, `dd/mm`, `dd/mm/yyyy`, `cuối tuần` (thứ Sáu tuần này), `cuối tháng` (ngày cuối tháng, lùi về ngày làm việc trước). `dd/mm` đã qua trong năm → năm sau. Trả về `{ han, phanConLai }` để tách tiêu đề. Kiểm chứng bằng nhóm N01–N08.

## 8. Nhắc việc (`src/core/nhacViec`)
### 8.1 Sinh danh sách nhắc (hàm thuần)
`sinhLichNhac(tatCaDuLieu, tuNgay, denNgay) → Nhac[] { khoa, luc: NgayGio, mucDo: 'THONG_TIN'|'CANH_BAO'|'KHAN'|'BAO_THUC'|'QUA_HAN', tieuDe, noiDung, lienKet }` với `khoa` duy nhất, ổn định (để không nhắc trùng). Quy tắc mặc định (sửa được trong Cài đặt):
| Loại | Thời điểm |
|---|---|
| Hạn pháp lý (bước chưa xong) | T−5 NLV 08:00 (thông tin) · T−2 NLV 08:00 (cảnh báo) · T−1 NLV 08:00 và 14:00 (khẩn) · ngày T 07:30 (báo thức) + 13:30 · quá hạn: 08:00 mỗi NLV |
| Hạn nội bộ, checklist nhập liệu, việc khác | T−1 NLV 08:00 · ngày T 07:30 · quá hạn 08:00 mỗi NLV |
| Nhật ký iTNK | mỗi ngày làm việc tại DN (C ≤ ngày ≤ K hoặc E, không tạm dừng, không thuộc `ngayKhongLamTaiDN`): 16:30; 17:15 báo thức nếu chưa tích; 07:45 hôm sau nếu vẫn chưa |
| Yêu cầu tài liệu | hạn − 60 phút; đúng hạn |
| Bản tin sáng | 07:15 mỗi ngày làm việc |
| Rà soát tuần / kế hoạch tuần | thứ Sáu 15:30 / thứ Hai 07:30 |
| Kế hoạch năm | từ 01/10: thứ Hai đầu tháng – danh sách cuộc kế hoạch chưa có QĐ |
| Giờ yên lặng | 21:00–06:30: dời sang 06:30, trừ mức BAO_THUC |

### 8.2 Phát nhắc
- **Khi app đang mở** (tab hoặc PWA): bộ đếm mỗi 30 giây; nhắc đến giờ và chưa phát → toast trong app + `Notification` của trình duyệt (qua `registration.showNotification` nếu có service worker) + âm báo nếu bật. Đánh dấu đã phát (lưu `khoa`) – không phát lại.
- **Khi app đóng**: trình duyệt không cho web tự hẹn giờ thông báo khi không có máy chủ đẩy. Vì vậy báo thức “thật” đi qua **Lịch của điện thoại**:
  - **Xuất `.ics`** (RFC 5545): mỗi hạn pháp lý/nội bộ chưa xong = 1 VEVENT lúc 07:30–08:00 ngày hạn mục tiêu, `UID` ổn định = `khoa`@tlkt (nhập lại không nhân đôi), VALARM `-P2D`, `-P1D`, `PT0M` (DISPLAY); hạn pháp lý thêm VEVENT riêng “HẠN PHÁP LÝ” vào ngày hạn pháp lý. Xuất theo: một cuộc / tất cả / 30 ngày tới.
  - **Nút “Thêm vào Google Lịch”** từng hạn: link `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=YYYYMMDDT073000/YYYYMMDDT080000&ctz=Asia/Ho_Chi_Minh&details=…` (mở tab mới) – cách dễ nhất trên Android.
  - Hướng dẫn trong app: iPhone mở tệp .ics → Thêm tất cả; Android: Google Lịch trên web → Cài đặt → Nhập, hoặc dùng nút từng hạn.
- Tôn trọng `anDanh`: tiêu đề nhắc dạng “KT …1234 – Hạn ký biên bản”.

## 9. Lưu trữ, mã hóa, sao lưu (`src/data`)
- IndexedDB `tlkt`, các store: `caiDat`, `keHoach`, `cuoc`, `viec`, `khoiThoiGian`, `keHoachNgay`, `nhacDaPhat`, `nhatKyHeThong`, `meta`. Có số phiên bản schema + hàm migrate.
- **Mã hóa (tùy chọn, khuyến nghị bật):** người dùng đặt mật mã ≥ 6 ký tự → `meta` lưu `salt`, `soVong`, `kiemTra` (chuỗi cố định đã mã hóa). Mỗi bản ghi lưu `{ id, iv, ct }` (trừ `meta`). Mở app → màn khóa nhập mật mã → giải mã toàn bộ vào bộ nhớ. Quên mật mã = mất dữ liệu (cảnh báo rõ khi bật; nhắc sao lưu). Đổi mật mã = mã hóa lại toàn bộ.
- **Khóa tự động** sau `khoaTuDongPhut` không thao tác hoặc khi ẩn tab quá thời gian đó: xóa khóa khỏi bộ nhớ, hiện màn khóa.
- **Xóa mềm** (`xoaLuc`), Thùng rác, khôi phục; tự xóa hẳn sau 30 ngày.
- **Audit log** mọi thêm/sửa/xóa/khôi phục/đổi cài đặt/nhập/xuất; giữ 2.000 dòng gần nhất.
- **Sao lưu:** xuất `TLKT-sao-luu-YYYYMMDD.tlkt.json` (đã mã hóa nếu bật mật mã); nhập: chọn Thay thế hoặc Gộp (theo `id`, giữ bản `suaLuc` mới hơn). Nhắc sao lưu mỗi thứ Sáu nếu đã quá 7 ngày chưa sao lưu.
- `navigator.storage.persist()` khi khởi động để trình duyệt hạn chế tự xóa dữ liệu.
- Không gửi dữ liệu ra mạng. Không analytics. Không lưu nội dung văn bản/tài liệu của NNT.

## 10. Nhập/xuất (`src/data` + `src/ui`)
- **Nhập kế hoạch** từ .xlsx/.csv: tự nhận diện cột theo tên gần đúng (bỏ dấu, không phân biệt hoa thường) với các trường mẫu 06/QTKT-TC; màn ghép cột (select); bảng xem trước + cảnh báo trùng MST (với cuộc đã có cùng năm); xác nhận → tạo `KeHoach` + các `CuocKiemTra` (loại KH, `buoc.P1` = ngày nhập nếu có trưởng đoàn là người dùng). Có nút tải tệp mẫu (`samples/mau-ke-hoach.csv` và bản .xlsx sinh bằng SheetJS).
- **Xuất Excel:** Danh sách cuộc + mốc + SLA; Nhập liệu còn thiếu; Theo dõi thu nộp; Tiến độ kế hoạch năm; Việc khác. Định dạng ngày dd/mm/yyyy, số có dấu chấm ngăn cách, dòng tiêu đề in đậm, cố định dòng đầu.
- **In/PDF:** trang in (`@media print`) cho Báo cáo tiến độ đoàn, Báo cáo tuần, Chi tiết cuộc (người dùng dùng In → Lưu PDF của trình duyệt).
- **Nhập ngày nghỉ:** dán danh sách ngày hoặc nhập .xlsx/.csv một cột.

## 11. Kiểm thử
- `tests/acceptance.test.ts` đọc **trực tiếp** `tests/kich-ban-han.json`, mỗi ca một `it()`. Không sửa kỳ vọng trong JSON.
- Unit test cho: `lich` (biên năm, tháng 2, ngày làm bù, thận trọng), `quyTac` (gộp kế thừa, patch người dùng), `vuViec` (từng sự kiện, giai đoạn, việc tiếp theo, ràng buộc thứ tự, SLA, ưu tiên), `checklist`, `viec` (lặp lại, nhận diện hạn), `nhacViec` (số lượng, giờ yên lặng, khóa không trùng, .ics hợp lệ: CRLF, gập dòng 75 octet, escape `,;\`), `tomTat`, `data` (fake-indexeddb: lưu/đọc/mã hóa/giải mã/sao lưu/nhập gộp).
- E2E (Playwright, nếu môi trường cài được Chromium): khởi động lần đầu → dữ liệu mẫu → đi hết một cuộc từ P1 đến hoàn thành → kiểm tra không lỗi console; chụp ảnh màn hình 390×844 và 1440×900 lưu `docs/anh-chup/`.
- `npm run check` = `tsc --noEmit` + `vitest run` + `vite build`. Phải sạch trước mỗi commit.

## 12. Triển khai
- `vite.config.ts`: `base: './'`; `vite-plugin-pwa` với `registerType: 'autoUpdate'`, manifest tên “Trợ lý Đoàn kiểm tra”, `short_name: 'TLKT'`, `display: 'standalone'`, màu nền/chủ đạo theo UI.md, icon 192/512 (+ maskable) sinh từ `public/icon.svg`.
- GitHub Pages qua `.github/workflows/deploy.yml` (đã có): push lên `main` → test → build → deploy. Link dạng `https://<tài-khoản>.github.io/<tên-repo>/`.
- Màn “Giới thiệu” hiển thị phiên bản (`package.json` version + ngày build) để biết điện thoại đã cập nhật chưa; khi có bản mới → thanh “Có phiên bản mới – Tải lại”.

## 13. Giai đoạn B (không làm trong đợt này – chỉ chuẩn bị)
Giữ `src/core` không phụ thuộc trình duyệt để sau này dùng lại trong app Expo: `expo-notifications` (thông báo cục bộ hẹn giờ thật, kênh Android, báo thức chính xác, iOS Time-Sensitive, lập lịch cửa sổ trượt 7 ngày vì iOS giới hạn 64 thông báo chờ), `expo-sqlite` + SQLCipher, `expo-local-authentication`, `expo-calendar`. Cần development build; iOS cần tài khoản Apple Developer.

## 14. Quy ước code
- Tên biến/hàm nghiệp vụ tiếng Việt không dấu kiểu camelCase (như mô hình dữ liệu); chú thích tiếng Việt; chuỗi giao diện tập trung trong `src/ui/chuoi.ts`.
- Hàm trong `src/core` là hàm thuần, nhận `homNay` làm tham số (không gọi `Date.now()` bên trong) để test được.
- Không `any` trừ chỗ bắt buộc; không bỏ qua lỗi TypeScript.
- Mỗi nhiệm vụ trong TASKS.md = ít nhất 1 commit, thông điệp tiếng Việt `T07: …`.
