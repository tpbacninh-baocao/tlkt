# THIẾT KẾ GIAO DIỆN – TLKT

Nguyên tắc: **nhìn là biết việc gì gấp, bấm một lần là làm được**. Mobile-first (màn 390 px), mở rộng thành bố cục 3 cột trên máy tính (≥ 1200 px). Toàn bộ tiếng Việt.

Cảm hứng thị giác (từ ảnh mẫu người dùng cung cấp):
- **Giao diện Sáng – “Planner”**: nền kem ấm, thẻ trắng bo tròn, màu pastel phân nhóm, chữ đậm rõ (kiểu ảnh “Plan Your Day with AI”).
- **Giao diện Tối – “Dashboard”**: nền xanh navy sâu, thẻ kính mờ viền mảnh, điểm nhấn cyan phát sáng nhẹ (kiểu ảnh “AI Study Dashboard”).
- **Kế hoạch ngày**: bố cục ô như phiếu giấy “KẾ HOẠCH MỖI NGÀY” (Việc cần làm, Mục tiêu, Nhắc nhở, Ghi chú, Cho ngày mai).

---

## 1. Design tokens (biến CSS trong `src/ui/tokens.css`)
| Token | Sáng | Tối |
|---|---|---|
| `--nen` | `#FAF7F2` | `#0B1220` |
| `--be-mat` (thẻ) | `#FFFFFF` | `rgba(17, 28, 48, 0.85)` |
| `--be-mat-2` | `#F3EFE8` | `#132038` |
| `--vien` | `#E7E1D6` | `#1E3A5F` |
| `--chu` | `#1C1B1A` | `#E6EEF8` |
| `--chu-phu` | `#6B665E` | `#8AA0BD` |
| `--chinh` (primary) | `#5B5BD6` | `#22D3EE` |
| `--chinh-nhat` | `#ECECFB` | `rgba(34, 211, 238, 0.12)` |
| `--bong` | `0 2px 10px rgba(28,27,26,.06)` | `0 0 0 1px #1E3A5F, 0 8px 24px rgba(0,0,0,.35)` |

**Màu trạng thái SLA (giống nhau ở 2 giao diện, chữ luôn kèm biểu tượng – không dựa chỉ vào màu):**
| Trạng thái | Màu | Biểu tượng | Nhãn |
|---|---|---|---|
| Còn > 3 NLV | `#16A34A` | ● | Còn n ngày LV |
| ≤ 3 NLV | `#CA8A04` | ◐ | Sắp đến hạn |
| Hôm nay / ngày mai | `#EA580C` | ▲ | Hôm nay / Ngày mai |
| Quá hạn | `#DC2626` | ✖ | Quá hạn n ngày LV |
| Quá hạn chưa giải trình | `#7F1D1D` nền đỏ nhạt | ⚠ | Quá hạn – chưa ghi lý do |
| Xong đúng hạn | `#16A34A` nhạt | ✓ | Đúng hạn |
| Xong trễ | `#9CA3AF` | ☑ | Trễ n ngày |
| Dự kiến (tính từ mốc chưa có) | chữ nghiêng, độ mờ 60% | ~ | Dự kiến |

**Màu giai đoạn (Kanban, Gantt):** Chuẩn bị `#94A3B8` · Chờ công bố `#A78BFA` · Đang kiểm tra `#3B82F6` · Biên bản `#F59E0B` · Chờ QĐ xử lý `#EC4899` · Sau QĐ `#14B8A6` · Theo dõi nộp tiền `#84CC16` · Hoàn thành `#22C55E` · Bãi bỏ `#6B7280`.

**Hệ thống (checklist):** TTR `#2563EB`, iTNK `#7C3AED`, TMS `#0891B2` – dạng nhãn chữ nhỏ bo tròn.

**Chữ:** `Be Vietnam Pro` (Google Fonts) → dự phòng `system-ui`. Cỡ: 12 (phụ) · 14 (thân) · 16 (thân trên di động) · 18 (tiêu đề thẻ) · 22 (tiêu đề màn) · 32 (số KPI). Số dùng `font-variant-numeric: tabular-nums`.
**Khoảng cách:** lưới 4 px (4/8/12/16/24/32). **Bo góc:** thẻ 16, nút 12, nhãn 999. **Vùng chạm:** ≥ 44×44 px. **Chuyển động:** 150–200 ms, tắt khi `prefers-reduced-motion`.
**Tương phản:** đạt WCAG AA (≥ 4.5:1 cho chữ thân) ở cả 2 giao diện.

## 2. Khung ứng dụng và điều hướng
**Điện thoại:**
```
┌──────────────────────────────┐
│ ☰  Hôm nay          🔔3  🔒 │  ← thanh trên: menu, tiêu đề, chuông nhắc (số chưa xem), khóa nhanh
├──────────────────────────────┤
│                              │
│        (nội dung màn)        │
│                              │
│                        (＋)  │  ← nút nổi “Thu nhanh” (mở bảng thêm việc / thêm cuộc)
├──────────────────────────────┤
│ 🏠Hôm nay 📁Cuộc 📅Lịch ✅Việc ⋯Thêm │  ← thanh điều hướng dưới, có huy hiệu số quá hạn
└──────────────────────────────┘
```
“⋯ Thêm” mở danh sách: Kế hoạch ngày · Kế hoạch năm · Nhập liệu còn thiếu · Báo cáo & tóm tắt · Cài đặt · Căn cứ & hướng dẫn · Thùng rác · Giới thiệu.

**Máy tính (≥ 1200 px):** cột trái 240 px (menu đầy đủ, nhóm như trên) · cột giữa nội dung · cột phải 360 px “Việc tiếp theo” (danh sách ưu tiên luôn hiển thị; ở màn Chi tiết cuộc thì cột phải là dòng thời gian mốc). 768–1199 px: menu thu gọn icon + 2 cột.

**Định tuyến bằng hash:** `#hom-nay`, `#cuoc`, `#cuoc-<id>`, `#lich`, `#viec`, `#ke-hoach-ngay`, `#ke-hoach-nam`, `#nhap-lieu`, `#bao-cao`, `#cai-dat`, `#can-cu`, `#thung-rac`, `#gioi-thieu`, `#kiem-thu`.

## 3. Thành phần dùng chung
- **ThẻViệc** (dùng ở Hôm nay, Việc tiếp theo): `[biểu tượng SLA] Tên bước · KT-2026-007 Cty A (…1234)` / dòng 2: `Hạn 06/11 (T6) · còn 2 ngày LV · Đ17.3.c` / nút phải `✓ Xong` và `⋯` (Hoãn nhắc, Mở cuộc, Thêm Google Lịch).
- **NhãnSLA**, **NhãnGiaiĐoạn**, **NhãnHệThống**, **NhãnLoạiCuộc** (KH, TH, GT…; di chuột/nhấn giữ xem tên đầy đủ).
- **ĐồngHồĐếmNgược**: “còn 3 ngày LV” / “còn 2 giờ 15 phút LV” (yêu cầu tài liệu).
- **BảngChọnNgày**: nhập dd/mm/yyyy hoặc chọn lịch; hiển thị thứ; cảnh báo nếu là ngày nghỉ.
- **HộpXácNhận** tự xây (không dùng `alert/confirm`): tiêu đề, mô tả hậu quả, nút chính/phụ.
- **Toast** góc dưới (trên thanh điều hướng): thành công 3 giây, lỗi giữ đến khi đóng, có “Hoàn tác” với thao tác xóa/đánh dấu xong.
- **Trạng thái rỗng** có minh họa đơn giản + 1 nút hành động (ví dụ “Chưa có cuộc kiểm tra nào – Thêm cuộc / Nhập kế hoạch từ Excel / Dùng dữ liệu mẫu”).
- **Nút Sao chép** → đổi thành “Đã chép ✓” 2 giây.

## 4. Màn hình

### 4.1 Lần đầu mở (Onboarding – 4 bước, bỏ qua được)
1. Chào + tên cán bộ, chức vụ, đơn vị.
2. Giờ làm việc (mặc định 07:30–11:30, 13:00–17:00) + kiểm tra lịch nghỉ năm nay/năm sau (“Chưa nhập lịch nghỉ Tết 2027 – Nhập ngay / Để sau”).
3. Bảo mật: đặt mật mã (khuyến nghị) + bật chế độ ẩn danh thông báo.
4. Bắt đầu: “Thêm cuộc đầu tiên” / “Nhập kế hoạch từ Excel” / “Dùng dữ liệu mẫu để xem thử”.

### 4.2 Màn khóa
Logo, “Nhập mật mã”, ô mật mã, nút Mở; sai 5 lần → chờ 30 giây. Liên kết “Quên mật mã?” → giải thích không khôi phục được, chỉ có thể xóa dữ liệu và nhập lại từ tệp sao lưu.

### 4.3 Hôm nay (`#hom-nay`)
```
Chào buổi sáng, anh A · Thứ Hai 23/11/2026
┌ Tóm tắt ─────────────────────────────────┐
│ 2 việc quá hạn · 3 việc đến hạn hôm nay   │
│ Đang kiểm tra tại DN: Cty A (ngày 8/20)   │
│ 4 mục nhập liệu chưa làm                  │
└───────────────────────────────────────────┘
[ KPI: Quá hạn 2 ] [ Hôm nay 3 ] [ 3 ngày LV tới 5 ] [ Nhập liệu thiếu 4 ]
▼ QUÁ HẠN (đỏ)            … ThẻViệc
▼ HÔM NAY                  … ThẻViệc
▼ 3 NGÀY LÀM VIỆC TỚI      … ThẻViệc
▼ TẠI DOANH NGHIỆP HÔM NAY
   Cty A – ngày 8/20 – hạn E 02/12   [☐ Đã ghi nhật ký iTNK hôm nay]
   Yêu cầu tài liệu: 2 đang chờ (1 còn 45 phút)
▼ NHẬP LIỆU CÒN THIẾU (4) → mở #nhap-lieu
▼ LỊCH HÔM NAY (khối thời gian) 07:30–11:30 Tại DN Cty A · 14:00 Họp phòng
```
Khi 4 KPI đều 0: dải xanh “Không có việc gấp – xem kế hoạch tuần”.

### 4.4 Danh sách cuộc (`#cuoc`)
Thanh trên: ô tìm (MST/tên/số QĐ) · nút lọc (giai đoạn, loại cuộc, kế hoạch, năm, SLA, trưởng đoàn, có hạn ngoài) · chuyển chế độ **Danh sách | Kanban | Dòng thời gian** · nút “＋ Thêm cuộc” · “Nhập Excel”.
**Danh sách:** mỗi dòng
```
[NhãnLoại KH] KT-2026-007 · Công ty A (…1234)          [NhãnGiaiĐoạn Đang kiểm tra]
Việc tiếp theo: Công khai dự thảo biên bản – hạn 02/12 ◐ còn 3 ngày LV
Trưởng đoàn: Nguyễn Văn A · QĐ 123/QĐ-CT 05/10 · Công bố 12/10      ▮▮▮▮▮▯▯▯ 5/8 giai đoạn
```
Sắp xếp mặc định theo điểm ưu tiên; tùy chọn theo hạn, theo ngày tạo, theo tên.
**Kanban:** 9 cột theo giai đoạn (cuộn ngang trên điện thoại), thẻ rút gọn (tên, việc tiếp theo, SLA). Kéo thả trên máy tính chỉ để **mở form xác nhận mốc** tương ứng (không tự đổi dữ liệu khi thả).
**Dòng thời gian (Gantt):** trục tháng; mỗi cuộc 1 hàng: thanh Chuẩn bị (P1→D0) · Chờ công bố (D0→C) · Tại DN (C→K, tô đậm, phần tạm dừng gạch chéo) · Sau kiểm tra (K→X) · dấu ◆ tại các hạn pháp lý; vạch đỏ “Hôm nay”; đoạn dự kiến vẽ nét đứt.

### 4.5 Thêm/Sửa cuộc (bảng trượt từ dưới lên trên điện thoại, cửa sổ giữa trên máy tính) – 3 bước
1. **NNT:** MST (kiểm tra 10 hoặc 13 số, cảnh báo trùng), Tên, Địa chỉ, Đối tượng (Tổ chức/HKD), “CQT/bộ phận khác quản lý trực tiếp”.
2. **Phân loại:** Loại cuộc (danh sách mục 6 SPEC, có mô tả ngắn và gợi ý nội dung/thời kỳ theo Đ16.1), Kế hoạch (chọn), Tháng dự kiến, Có GDLK, Kiểm tra điện tử, Kiểm tra lại (+ ngày KL bị kiểm tra lại → hiện thời hiệu), Hạn ngoài + ghi chú, Văn bản giao.
3. **Đoàn & nội dung:** Trưởng đoàn (mặc định là mình), Thành viên (+ phần việc), Người/tổ giám sát, Nội dung, Thời kỳ, Ngày nhận phân công (P1), Ngày công bố dự kiến.
Cuối: xem trước **dòng thời gian dự kiến** các mốc chính trước khi Lưu.

### 4.6 Chi tiết cuộc (`#cuoc-<id>`)
**Đầu trang (dính khi cuộn):**
```
‹ Quay lại   KT-2026-007 [KH] [Đang kiểm tra]                 ⋯ (Sửa, Nhân bản, Xuất .ics, In, Xóa)
Công ty A · MST 0101234567 · Trưởng đoàn: Nguyễn Văn A
Hạn gần nhất: Công khai dự thảo biên bản – 02/12 (T4) ◐ còn 3 ngày LV     Bộ quy tắc: QTKT-1161
[ Việc tiếp theo: …………………… ]  [✓ Đánh dấu xong]  [Thêm Google Lịch]
```
**Các tab:** Dòng thời gian · Sự kiện · Nhập hệ thống · Nhật ký · Tài liệu & vướng mắc · Kết quả & nộp tiền · Hồ sơ lưu trữ · Lịch sử sửa.

- **Dòng thời gian:** danh sách dọc theo giai đoạn; mỗi bước: biểu tượng trạng thái, tên, người thực hiện, hạn pháp lý (và hạn mục tiêu nếu khác), ngày xong, số văn bản, căn cứ (nhấn để xem trích dẫn), biểu mẫu (nhãn), nút “Xong…” mở form nhỏ (ngày thực tế mặc định hôm nay, số VB, ghi chú, lý do trễ bắt buộc nếu sau hạn). Bước đã xong: nút “Sửa/Bỏ đánh dấu”. Bước tùy chọn (T3) và điều kiện (B2, S7) hiển thị khung viền đứt.
- **Sự kiện:** lưới nút lớn: Hoãn · Tạm dừng · Gia hạn · Điều chỉnh QĐ · Bãi bỏ · NNT giải trình · Vụ việc phức tạp · Dấu hiệu tội phạm · NNT không chấp hành · Tạm giữ tài liệu · Phụ lục biên bản. Nút không hợp lệ ở giai đoạn hiện tại bị mờ kèm lý do (“Gia hạn chỉ khi đang kiểm tra tại DN”). Mỗi form hiển thị **trước khi lưu**: “Hạn kết thúc sẽ đổi từ 02/11 thành 23/11”. Danh sách sự kiện đã có, sửa/xóa được.
- **Nhập hệ thống:** 3 nhóm TTR / iTNK / TMS; mỗi việc: ô tích, tên chức năng, hạn + SLA, nút **Sao chép thông tin** (khối văn bản đúng thứ tự trường), ngày đã tích. Thanh tiến độ “7/12 việc nhập liệu”.
- **Nhật ký:** lịch các ngày làm việc tại DN (C → K) dạng lưới tuần; mỗi ngày: ☐ đã ghi iTNK, ghi chú nhanh (nút micro nếu trình duyệt hỗ trợ nhập giọng nói), nút “Đánh dấu ngày không xuống DN”, nút sao chép ghi chú.
- **Tài liệu & vướng mắc:** danh sách yêu cầu tài liệu (nội dung, gửi lúc, đồng hồ 06 giờ LV, nút “Đã nhận”), quá hạn → thẻ đỏ “Gợi ý lập biên bản VPHC”; danh sách vướng mắc với 3 đồng hồ 02 NLV.
- **Kết quả & nộp tiền:** ô số liệu (truy thu, phạt, chậm nộp, giảm khấu trừ, giảm lỗ, thu hồi hoàn – tự định dạng 1.234.567), “Có truy thu/xử phạt” (quyết định chế độ X1/X4), loại văn bản xử lý, số QĐ, hành vi vi phạm; bảng các lần nộp (+ “đã nhập TTR”); thanh tiến độ “Đã nộp 60% – còn 12.345.678 đ”.
- **Hồ sơ lưu trữ:** checklist thành phần hồ sơ theo Đ35.2 (hồ sơ phân tích rủi ro; QĐ kiểm tra/gia hạn/điều chỉnh/giám sát; các biên bản; báo cáo kết quả; nhật ký; KL/QĐ xử phạt; tài liệu khác), hạn bàn giao.
- **Lịch sử sửa:** audit log của riêng cuộc.

### 4.7 Nhập liệu còn thiếu (`#nhap-lieu`)
Lọc theo hệ thống (TTR/iTNK/TMS) và SLA; nhóm theo cuộc; tích trực tiếp; nút sao chép. Tiêu đề hiển thị nhắc “Chốt số liệu ngày 15 / cuối tháng: còn n ngày”.

### 4.8 Lịch (`#lich`)
Chế độ Tháng / Tuần / Ngày. Ô ngày có chấm màu theo SLA của các hạn; ngày nghỉ nền xám + tên ngày lễ; ngày làm bù có nhãn. Tuần/Ngày: cột giờ 07:00–18:00 với **khối thời gian** (tạo bằng nhấn giữ/kéo trên máy tính, nút “＋ Khối” trên điện thoại); gợi ý tự động khối “Tại DN <tên>” cho các ngày tại DN. Nút “Xuất .ics” (30 ngày tới / tất cả).

### 4.9 Việc (`#viec`)
Tab: **Hộp thu** (việc chưa có hạn) · **Đang làm** (nhóm Quá hạn / Hôm nay / Tuần này / Sau) · **Lặp lại** · **Mẫu** (bật/tắt mẫu việc thường xuyên) · **Đã xong**.
Thu nhanh: ô nhập một dòng + nút micro; gõ “trả lời văn bản 123 trước 15/12” → hiện chip “Hạn: 15/12/2026 (T3)” để xác nhận. Form chi tiết: nguồn, nhóm (danh mục đột xuất), số VB, người giao, hạn, giờ, lặp lại, liên kết cuộc, việc con, ghi chú.

### 4.10 Kế hoạch ngày (`#ke-hoach-ngay`) – theo phiếu “KẾ HOẠCH MỖI NGÀY”
```
KẾ HOẠCH MỖI NGÀY   [‹] Thứ Hai 23/11/2026 [›]   T2 T3 T4 T5 T6 T7 CN
┌ VIỆC CẦN LÀM ──────────────┐ ┌ MỤC TIÊU (tối đa 3) ─────────┐
│ ☐ (tự đổ: quá hạn, hôm nay)│ │ 1. …                         │
│ ☐ …  [＋ thêm]              │ ├ NHẮC NHỞ ────────────────────┤
│                            │ │ (tự đổ nhắc trong ngày + ghi)│
└────────────────────────────┘ └──────────────────────────────┘
┌ LỊCH TRONG NGÀY (khối) ────┐ ┌ GHI CHÚ ─────────────────────┐
└────────────────────────────┘ └──────────────────────────────┘
┌ CHO NGÀY MAI ──────────────┐ ┌ CẢM NHẬN CUỐI NGÀY 😀🙂😐🙁😣 ┐
│ [Chuyển việc chưa xong ➜]   │ │                              │
└────────────────────────────┘ └──────────────────────────────┘
```
Nút “Chuyển việc chưa xong sang ngày làm việc kế tiếp”.

### 4.11 Kế hoạch năm (`#ke-hoach-nam`)
Chọn năm, chọn kế hoạch (hoặc Tất cả). Hàng KPI: Được giao · Đã ban hành QĐ · Đã công bố · Đã kết thúc tại DN · Đã có QĐ xử lý/KL · Bãi bỏ. Hàng số tiền: Truy thu · Phạt · Chậm nộp · Giảm khấu trừ · Giảm lỗ · Đã nộp / Phải nộp. Biểu đồ **tích lũy theo tháng** (đường thực tế số cuộc có QĐ xử lý so với đường lý tưởng tuyến tính đến 31/12) + cột số cuộc theo giai đoạn. Danh sách cảnh báo: cuộc kế hoạch quá tháng dự kiến chưa có QĐ; từ tháng 10: “n cuộc chưa kiểm tra – cân nhắc chuyển sang đầu năm sau (Đ15.5.e)”; hạn công khai kế hoạch (30 ngày), báo cáo chuyên đề phát sinh (15 ngày). Quản lý danh sách kế hoạch (thêm/sửa/xóa, nhập Excel).

### 4.12 Báo cáo & tóm tắt (`#bao-cao`)
Thẻ chọn: **Bản tin sáng** · **Báo cáo tiến độ đoàn** (chọn cuộc) · **Báo cáo tuần** (chọn tuần) · **Tóm tắt một cuộc** · **Xuất Excel** (5 loại) · **In**. Mỗi văn bản: xem trước, nút Sao chép (để dán Zalo/email), nút “Soạn email” (`mailto:`), nút In. Tôn trọng chế độ ẩn danh (tùy chọn “Hiện đầy đủ MST lần này”).

### 4.13 Cài đặt (`#cai-dat`) – danh sách nhóm
Hồ sơ cán bộ · Giờ làm việc · Ngày nghỉ & làm bù (theo năm, nhập/dán danh sách, đánh dấu “đã xác nhận năm”) · Quy tắc thời hạn (bảng từng bước: số, đơn vị, đệm, căn cứ; ô sửa; “Khôi phục mặc định”; chọn bộ áp dụng mặc định) · Chế độ đếm thận trọng · Tên chức năng TTR/iTNK/TMS · Nhắc việc (bật/tắt từng loại, giờ, giờ yên lặng, âm báo, xin quyền thông báo, hướng dẫn thêm lịch điện thoại) · Bảo mật (đặt/đổi/tắt mật mã, khóa tự động, ẩn danh) · Giao diện (Sáng/Tối/Theo hệ thống, cỡ chữ) · Sao lưu & khôi phục · Dữ liệu mẫu (thêm/xóa) · Xóa toàn bộ dữ liệu (xác nhận 2 lần).

### 4.14 Căn cứ & hướng dẫn (`#can-cu`)
Tóm tắt văn bản căn cứ; bảng quy trình 6 giai đoạn với hạn và trích dẫn; bảng chuyển tiếp; danh mục biểu mẫu; mục **“Điểm chưa xác nhận”** (nhãn vàng); hướng dẫn 5 bước sử dụng; hướng dẫn cài lên màn hình chính (iPhone/Android) và thêm lịch.

### 4.15 Kiểm thử (`#kiem-thu`, ẩn – vào từ Giới thiệu)
Chạy toàn bộ `tests/kich-ban-han.json` ngay trong trình duyệt, bảng Đạt/Không đạt từng ca – để cán bộ tự đối chiếu khi đơn vị đổi tham số.

## 5. Nội dung chữ mẫu (microcopy)
- Quá hạn: “Quá hạn 2 ngày làm việc – hạn 06/11/2026 (Đ17.3.c). Ghi lý do trễ?”
- Lưu mốc trễ: “Ngày bạn nhập (09/11) sau hạn pháp lý (06/11). Vui lòng ghi lý do để giải trình khi nhập iTNK.”
- Gia hạn muộn: “Hạn chót đề nghị gia hạn là 28/10/2026 (3 ngày làm việc trước hạn kết thúc). Ngày đề nghị 30/10 đã muộn – vẫn lưu?”
- Thông báo ẩn danh: “KT …1234 – Hôm nay hạn ký biên bản”.
- Rỗng nhập liệu: “Tuyệt! Không còn việc nhập liệu nào.”

## 6. Khả năng tiếp cận
Nhãn `aria` cho nút biểu tượng; điều hướng bàn phím đầy đủ trên máy tính (Tab, Enter, Esc đóng bảng); vòng focus rõ; không truyền đạt thông tin chỉ bằng màu; hỗ trợ phóng chữ 200% không vỡ bố cục.
