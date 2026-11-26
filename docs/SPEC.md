# ĐẶC TẢ NGHIỆP VỤ – ỨNG DỤNG “TRỢ LÝ ĐOÀN KIỂM TRA” (TLKT) 2026
> Tài liệu này quy định **cái gì** (nghiệp vụ). Cách xây: `docs/ARCHITECTURE.md`. Giao diện: `docs/UI.md`. Thứ tự việc: `docs/TASKS.md`. Số ngày/thời hạn: **`rules/*.json` là nguồn sự thật** – nếu bảng trong tài liệu này và JSON khác nhau thì theo JSON và ghi vào `docs/PROGRESS.md`.
> Căn cứ chính: Quy trình kiểm tra thuế ban hành kèm QĐ 1161/QĐ-CT ngày 14/8/2026 (thay QĐ 970/QĐ-TCT).

---

## 0. THÔNG SỐ ĐÃ CHỐT
- Nền tảng: **A – PWA** (Vite + TypeScript + Preact), host GitHub Pages, cài lên màn hình chính điện thoại; bản app Expo (B) để giai đoạn sau.
- Đơn vị, tên cán bộ, giờ làm việc: người dùng nhập ở màn Onboarding (mặc định giờ làm việc 07:30–11:30, 13:00–17:00, thứ Hai–thứ Sáu).
- Năm kế hoạch: theo dữ liệu nhập (hỗ trợ nhiều năm).

---

## 1. VAI TRÒ
Bạn là kiến trúc sư phần mềm kiêm lập trình viên full-stack 20 năm kinh nghiệm, chuyên ứng dụng quản lý quy trình nghiệp vụ hành chính (case management, BPM), ứng dụng di động offline-first và hệ thống nhắc việc. Bạn am hiểu nghiệp vụ kiểm tra thuế tại trụ sở người nộp thuế (NNT) của ngành Thuế Việt Nam. Viết code hoàn chỉnh, chạy được ngay, chú thích tiếng Việt, giao diện 100% tiếng Việt.

## 2. MỤC TIÊU
Xây dựng ứng dụng **“Trợ lý Đoàn kiểm tra” (TLKT)** cho công chức kiểm tra tại trụ sở NNT (Phòng Kiểm tra thuộc Thuế tỉnh/TP; Tổ Kiểm tra thuộc Thuế cơ sở), đóng vai trò trợ lý cá nhân:
1. Quản lý **toàn bộ vòng đời một cuộc kiểm tra**: từ khi được phân công làm trưởng đoàn → phân tích → liên hệ NNT → trình ban hành Quyết định (QĐ) kiểm tra → công bố → kiểm tra tại trụ sở → biên bản → báo cáo → QĐ xử phạt/Kết luận → nhập các hệ thống → theo dõi nộp tiền → hoàn thành cuộc trên iTNK → lưu trữ hồ sơ.
2. **Tự tính mọi mốc thời hạn theo quy trình**, cảnh báo, đôn đốc, báo thức trước hạn và khi quá hạn.
3. Nhắc **nhập liệu đúng lúc, đúng chức năng** trên TTR, iTNK (Nhật ký điện tử thanh tra, kiểm tra) và TMS.
4. Quản lý các **việc thường xuyên và đột xuất ngoài cuộc kiểm tra** (báo cáo định kỳ, văn bản lãnh đạo giao, kiểm tra nội bộ, KNTC…), lên lịch trình ngày/tuần, tóm tắt tự động.
5. Theo dõi **tiến độ kế hoạch năm** (kế hoạch đầu năm, chuyên đề, đột xuất) của cá nhân và của đơn vị.

Giai đoạn này phục vụ cán bộ kiểm tra; thiết kế để sau này thêm “mẫu quy trình” cho bộ phận khác mà không phải sửa lõi (xem mục 10: bộ quy tắc dạng dữ liệu).

**Nguyên tắc không đổi:** Ứng dụng KHÔNG kết nối, KHÔNG đăng nhập, KHÔNG thu thập dữ liệu từ TTR/iTNK/TMS (hệ thống nội bộ ngành). Ứng dụng chỉ nhắc việc, hướng dẫn và hỗ trợ sao chép nhanh thông tin để cán bộ tự nhập.

---

## 3. CĂN CỨ NGHIỆP VỤ (hiển thị ở mục “Căn cứ” trong app, mỗi quy tắc thời hạn phải gắn trích dẫn điều khoản)
- **QĐ 1161/QĐ-CT ngày 14/8/2026** của Cục Thuế – Quy trình kiểm tra thuế (Điều 9–18: tổ chức; Điều 22–28: hộ, cá nhân kinh doanh; Điều 32: kiểm tra bằng phương thức điện tử; Điều 33–35: nhập dữ liệu, báo cáo, lưu trữ). Biểu mẫu `xx/QTKT-TC`, `xx/QTKT-MC`.
- **Thông tư 89/2026/TT-BTC ngày 30/6/2026** – biểu mẫu `xx/KTT`; **Nghị định 252/2026/NĐ-CP**; **Luật Quản lý thuế 108/2025/QH15**.
- **Nghị định 68/2025/NĐ-CP** – mẫu QĐ xử phạt **MQĐ02**; **Luật XLVPHC** Điều 61 (giải trình).
- **Quy chế giám sát hoạt động đoàn thanh tra, kiểm tra thuế** (QĐ 1614/QĐ-TCT ngày 13/10/2020, mẫu `xx-TTKT`) – dùng đến khi có quy chế mới của Cục trưởng Cục Thuế; quy tắc giám sát để ở dạng cấu hình.
- **Hướng dẫn sử dụng TTR** (phân hệ Thanh tra kiểm tra doanh nghiệp) và **iTNK / Nhật ký điện tử** (B1.3-x).
- **Dự thảo sửa đổi QĐ 3736/QĐ-CT, 3737/QĐ-CT** – chức năng nhiệm vụ Phòng Kiểm tra, Tổ Kiểm tra (dùng để dựng danh mục việc thường xuyên ở mục 11).

**Điều khoản chuyển tiếp (QĐ 1161, Điều 2) – app phải tự chọn bộ quy tắc theo ngày ban hành QĐ kiểm tra:**
| Ngày ban hành QĐ kiểm tra | Bộ quy tắc áp dụng |
|---|---|
| Trước 01/7/2026, chưa có KL/QĐ xử lý | `QTKT-970` (Luật QLT 38/2019 + QĐ 970/QĐ-TCT) – thời hạn tại trụ sở 10 ngày làm việc, gia hạn 1 lần ≤ 10 ngày làm việc. Hiển thị nhãn “Chuyển tiếp – đề nghị xác nhận lại tham số”. |
| Từ 01/7/2026 đến trước 14/8/2026 | Luật 108/2025; các bước chưa thực hiện từ 14/8/2026 theo `QTKT-1161` |
| Từ 14/8/2026 | `QTKT-1161` |

---

## 4. MÔ HÌNH QUẢN LÝ CÔNG VIỆC (kết hợp, áp dụng đồng thời)
1. **Quản lý vụ việc (Case Management) + máy trạng thái:** mỗi cuộc kiểm tra là một “hồ sơ vụ việc” đi qua các giai đoạn cố định; không cho nhảy bước sai logic (ví dụ không thể “Ký biên bản” khi chưa “Công bố”), nhưng cho phép ghi nhận ngày thực tế lùi lại và ghi lý do.
2. **“Việc tiếp theo” (Next Action – theo GTD):** mỗi cuộc luôn hiển thị đúng 1 việc kế tiếp + hạn + đếm ngược. Trang chủ là danh sách việc tiếp theo của tất cả các cuộc, sắp theo điểm ưu tiên.
3. **SLA đèn tín hiệu:** 🟢 còn > 3 ngày làm việc · 🟡 ≤ 3 ngày làm việc · 🟠 hôm nay/ngày mai · 🔴 quá hạn · ⚫ quá hạn chưa giải trình · ✅ hoàn thành đúng hạn · ☑️ hoàn thành trễ (lưu lý do).
4. **Điểm ưu tiên tự động** (thay ma trận Eisenhower thủ công): `Ưu tiên = Hạn (ngày làm việc còn lại, càng ít càng cao) × Hệ số pháp lý (hạn luật định 3; hạn nội bộ 1,5; tự đặt 1) + cộng điểm (lãnh đạo giao +2; hồ sơ hoàn thuế/hạn ngoài +2; có nguy cơ khiếu nại +1)`. Cho phép ghim thủ công.
5. **Kanban theo giai đoạn** (Chuẩn bị → Chờ QĐ → Chờ công bố → Đang kiểm tra → Biên bản → Chờ QĐ xử lý → Sau QĐ → Hoàn thành) – kéo thả trên máy tính.
6. **Time-blocking:** lịch tuần dạng khối thời gian; tự gợi ý khối “Tại DN X” cho ngày làm việc tại trụ sở, khối “Nhập TTR/iTNK” 30 phút sau mỗi mốc.
7. **Nhịp rà soát:** “Kế hoạch ngày” mỗi sáng, “Tổng kết ngày” cuối ngày, “Rà soát tuần” chiều thứ Sáu, “Chốt số liệu” ngày 15 và cuối tháng.
8. **Theo dõi chỉ tiêu kế hoạch năm** (kiểu OKR): số cuộc được giao / đã ban hành QĐ / đã công bố / đã kết thúc / đã có QĐ xử lý; số thuế truy thu, phạt, giảm khấu trừ, giảm lỗ; số đã nộp; đường lý tưởng theo tháng; cảnh báo cuộc kế hoạch sắp hết năm chưa kiểm tra (phải ưu tiên chuyển sang đầu năm sau – Đ15.5.e).

---

## 5. MÔ HÌNH DỮ LIỆU
- **CanBo**: họ tên, chức vụ, đơn vị, email, vai trò (`Trưởng đoàn`, `Thành viên`, `Tổ trưởng/Lãnh đạo phòng`, `Người giám sát`).
- **KeHoach**: năm, loại (`Kế hoạch năm` / `Chuyên đề đầu năm` / `Chuyên đề phát sinh` / `Đột xuất`), số + ngày QĐ phê duyệt, ngày công khai kế hoạch (hạn ≤ 30 ngày từ ngày phê duyệt – Đ14), danh sách NNT (theo mẫu 06/QTKT-TC: tên, MST, địa chỉ, nội dung, chuyên đề, thời gian dự kiến).
- **CuocKiemTra** (trung tâm):
  - Định danh: mã nội bộ, MST, tên NNT, địa chỉ, đối tượng (`Tổ chức` / `Hộ, cá nhân kinh doanh`), cơ quan quản lý trực tiếp (để biết có phải gửi bản sao QĐ/BB cho CQT, bộ phận quản lý không).
  - Phân loại: `loaiCuoc` (mục 6), `coGiaoDichLienKet` (thời hạn 40 ngày), `kiemTraDienTu` (Đ32), `kiemTraLai`, nguồn (kế hoạch/chuyên đề/đột xuất + văn bản giao), `hanNgoai` (hạn bên ngoài nếu có, ví dụ hạn giải quyết hồ sơ hoàn, hạn đóng MST – người dùng nhập).
  - Đoàn: trưởng đoàn, thành viên (phần việc phân công theo mẫu 09/QTKT-TC), người/tổ giám sát.
  - Nội dung & thời kỳ kiểm tra; số liệu kết quả: thuế truy thu theo sắc thuế, phạt, tiền chậm nộp, giảm khấu trừ, giảm lỗ, thu hồi hoàn; đã nộp/còn phải nộp, ngày nộp.
  - Danh sách **Mốc** (mục 7) và **Sự kiện** (mục 8) – mỗi mốc có: hạn pháp lý, hạn mục tiêu nội bộ, ngày thực hiện, số/ngày văn bản, trạng thái, lý do trễ, tệp đính kèm (chỉ đường dẫn/ghi chú, KHÔNG lưu nội dung văn bản).
  - **Checklist nhập hệ thống** (mục 9) – từng dòng có ô tích + ngày tích.
  - **Nhật ký** ngày (để đối chiếu đã ghi trên iTNK chưa), **Yêu cầu tài liệu** gửi NNT (đồng hồ 06 giờ làm việc), **Vướng mắc** (đồng hồ 02 ngày làm việc).
- **CongViec** (việc ngoài cuộc): tiêu đề, nguồn (lãnh đạo giao/văn bản đến/tự đặt), số văn bản, hạn, lặp lại (RRULE), ưu tiên, liên kết cuộc (nếu có), việc con.
- **NgayNghi**: danh mục ngày nghỉ lễ, Tết và **ngày làm bù** (thứ Bảy đi làm) theo năm – người dùng nhập/nhập Excel; có sẵn ngày lễ cố định dương lịch, nhắc người dùng cập nhật Tết Nguyên đán và Giỗ Tổ hằng năm.
- **BoQuyTac**: bộ quy tắc thời hạn dạng JSON có phiên bản (mục 10).
- **NhatKyHeThong** (audit log): mọi thao tác thêm/sửa/xóa, ai, lúc nào, giá trị cũ → mới.

Mọi thực thể: thêm mới, sửa, xóa (xóa mềm, khôi phục được 30 ngày), nhân bản cuộc, tìm kiếm, lọc.

---

## 6. DANH MỤC LOẠI CUỘC KIỂM TRA (QĐ 1161 Điều 2.2, Điều 12)
| Mã | Loại | Ghi chú cho app |
|---|---|---|
| KH | Theo kế hoạch năm | Gắn KeHoach; cảnh báo nếu quá “thời gian dự kiến” trong mẫu 06/QTKT-TC |
| CD | Chuyên đề (đầu năm / phát sinh) | Chuyên đề phát sinh: nhắc đơn vị báo cáo cấp trên ≤ 15 ngày từ ngày phê duyệt; báo cáo kết thúc ≤ 15 ngày làm việc từ ngày tổng kết (Đ11) |
| TH | Kiểm tra trước hoàn thuế | Ưu tiên cao; trường `hanNgoai` = hạn giải quyết hồ sơ hoàn (người dùng nhập) |
| SH | Kiểm tra sau hoàn thuế | Trong 05 năm từ QĐ hoàn |
| GT | Giải thể, chấm dứt hoạt động, chấm dứt hiệu lực MST | Đột xuất |
| CDD | Chuyển địa điểm kinh doanh | Đột xuất |
| TCS | Chia, tách, sáp nhập, hợp nhất, chuyển đổi loại hình, cổ phần hóa, phá sản | Đột xuất |
| VP | Có dấu hiệu vi phạm pháp luật thuế | Đột xuất |
| CĐ | Theo chỉ đạo/kiến nghị của cơ quan, người có thẩm quyền | Đột xuất |
| KN | Giải quyết khiếu nại, tố cáo | Đột xuất |
| MG | Hồ sơ miễn, giảm thuế rủi ro cao | Đột xuất |
| CQT | Chuyển từ kiểm tra tại trụ sở CQT | Đột xuất |
| KL | Kiểm tra lại | Thời hiệu 02 năm từ ngày ký KL/QĐ xử lý bị kiểm tra lại (Đ18) |

Mỗi loại có gợi ý “nội dung kiểm tra / thời kỳ kiểm tra” theo Đ16.1 hiển thị khi soạn tờ trình.

---

## 7. QUY TRÌNH CHUẨN VÀ CÔNG THỨC THỜI HẠN (lõi của app – KHÔNG được sai)
Ký hiệu: **NLV** = ngày làm việc; **N** = ngày theo lịch; **D0** = ngày ban hành QĐ kiểm tra; **C** = ngày công bố QĐ; **E** = hạn kết thúc kiểm tra tại trụ sở; **K** = ngày công khai dự thảo biên bản (kết thúc tại trụ sở); **B** = ngày ký biên bản kiểm tra; **X** = ngày ban hành QĐ xử phạt hoặc Kết luận.

### Giai đoạn 1 – Chuẩn bị (từ khi được phân công)
| Mã | Bước | Hạn | Căn cứ / biểu mẫu |
|---|---|---|---|
| P1 | Nhận phân công trưởng đoàn | ngày phân công | TTR: “Phân công trưởng đoàn” |
| P2 | Thu thập dữ liệu, phân tích rủi ro, lập Phiếu phân tích, đánh giá rủi ro | hạn nội bộ (mặc định P1 + 10 NLV, sửa được) | Phiếu 08/QTKT-TC |
| P3 | Liên hệ NNT, thống nhất lịch dự kiến | hạn nội bộ | ghi nhật ký liên hệ |
| P4 | Lập hồ sơ trình ban hành QĐ: Tờ trình; dự thảo QĐ 06/KTT; Phiếu 08/QTKT-TC; **dự thảo hồ sơ giám sát (QĐ giám sát 01-TTKT)** | hạn nội bộ; với loại KH cảnh báo nếu quá tháng dự kiến | Đ16.1.l |
| P5 | Lãnh đạo ký QĐ kiểm tra (= **D0**) và QĐ giám sát (cùng thời điểm) | – | 1614 Đ11.2 |

### Giai đoạn 2 – Sau khi có QĐ kiểm tra
| Mã | Bước | Hạn | Căn cứ |
|---|---|---|---|
| Q1 | Gửi QĐ cho NNT (và 01 bản cho CQT/bộ phận quản lý trực tiếp nếu không trực tiếp quản lý) | **D0 + 3 NLV** | Đ16.2 |
| Q2 | Người giám sát lập Kế hoạch giám sát (02-TTKT) – trưởng đoàn đôn đốc, gửi “nội dung kiểm tra đã phê duyệt” cho người giám sát | **D0 + 5 NLV** và trước C | 1614 Đ16.1, Đ7.1.a |
| Q3 | Phân công thành viên đoàn | trước C | Mẫu 09/QTKT-TC |
| Q4 | Thông báo người giám sát tham dự buổi công bố | trước C | 1614 Đ11.3 |
| Q5 | **Công bố QĐ kiểm tra** (= **C**), lập biên bản công bố 08/KTT; công bố QĐ giám sát; gửi **thư trao đổi thông tin 06-TTKT** cho NNT và báo cáo người giám sát | **D0 + 10 NLV** (trừ khi bãi bỏ/hoãn) | Đ17.1; 1614 Đ7.7 |

### Giai đoạn 3 – Kiểm tra tại trụ sở NNT
| Mã | Bước | Hạn | Căn cứ |
|---|---|---|---|
| T1 | Thời hạn kiểm tra tại trụ sở (**E**) | **C + 20 N** (giao dịch liên kết: **C + 40 N**), cộng thêm số ngày tạm dừng | Đ17.2.b |
| T2 | Ghi nhật ký kiểm tra điện tử hằng ngày (trưởng đoàn và thành viên) | mỗi NLV có làm việc tại DN | Đ17.5 |
| T3 | Đề nghị gia hạn (nếu cần) – báo cáo lãnh đạo trình ký QĐ gia hạn 07/KTT | **chậm nhất E − 3 NLV** | Đ17.2.g |
| T4 | Gia hạn (1 lần) | E mới = E + tối đa 20 N (GDLK: 40 N) | Đ17.2.b,g |
| T5 | Mỗi thành viên lập **biên bản xác nhận số liệu** phần việc được giao | trước K | Mẫu 11/QTKT-TC |
| T6 | Thống nhất kết quả trong đoàn, hoàn thiện dự thảo biên bản kiểm tra 14/KTT | trước K | Đ17.3.a |
| T7 | **Công khai dự thảo biên bản**, lập biên bản công khai và bàn giao dự thảo 15/KTT (= **K**, kết thúc kiểm tra tại trụ sở) | **K ≤ E** | Đ17.3.c |

### Giai đoạn 4 – Biên bản, báo cáo
| Mã | Bước | Hạn | Căn cứ |
|---|---|---|---|
| B1 | NNT giải trình, hoàn thiện và **ký biên bản kiểm tra** (= **B**); 04 bản (NNT, trưởng đoàn, bộ phận quản lý, lưu) | **K + 5 NLV** | Đ17.3.c,g |
| B2 | Nếu hết hạn B1 NNT không ký: lập biên bản vi phạm hành chính, có chữ ký đại diện chính quyền cấp xã hoặc ≥ 1 người chứng kiến (hoặc ghi rõ lý do) | ngay sau K + 5 NLV | Đ17.3.đ |
| B3 | Theo dõi quyền giải trình sau biên bản: bằng văn bản/đề nghị gia hạn giải trình **B + 5 NLV**; yêu cầu giải trình trực tiếp **B + 2 NLV** | – | Đ17.3.e; Điều 61 Luật XLVPHC |
| B4 | **Báo cáo kết quả kiểm tra** (12/QTKT-TC) + dự thảo QĐ xử phạt (MQĐ02) hoặc dự thảo Kết luận (17/KTT); đồng thời gửi người giám sát số liệu chi tiết theo từng nội dung rủi ro | **B + 3 NLV** | Đ17.4.a; 1614 Đ7.6 |
| B5 | Người giám sát gửi **Báo cáo kết quả giám sát** (05-TTKT) | **≤ 5 NLV từ ngày đoàn có báo cáo kết quả (B4)** và **trước X** | 1614 Đ17.1 |

### Giai đoạn 5 – Quyết định xử lý / Kết luận
| Mã | Trường hợp | Hạn ban hành X | Căn cứ |
|---|---|---|---|
| X1 | Có truy thu/xử phạt, NNT không giải trình (hoặc đã ghi không thực hiện quyền giải trình) | **B + 7 NLV** | Đ17.4.c.1 |
| X2 | Có giải trình trong thời hạn luật định hoặc phải xác minh tình tiết | **B + 01 tháng** | Đ17.4.c.2 |
| X3 | Tình tiết đặc biệt nghiêm trọng, nhiều tình tiết phức tạp | **B + 02 tháng** | Đ17.4.c.3 |
| X4 | Không phải truy thu, không xử phạt → Kết luận kiểm tra 17/KTT | **B + 7 NLV** | Đ17.4.d |

App tự chọn X1/X4 mặc định; chuyển sang X2 khi ghi nhận sự kiện “NNT giải trình”, sang X3 khi người dùng chọn “Vụ việc phức tạp” (bắt buộc ghi lý do). Chặn mềm: cảnh báo nếu trình ký X khi chưa có B5.

### Giai đoạn 6 – Sau quyết định
| Mã | Bước | Hạn | Căn cứ |
|---|---|---|---|
| S1 | Giao QĐ xử phạt cho NNT (trực tiếp có biên bản giao, hoặc bưu điện bảo đảm); gửi đủ các bản (NNT, lưu hồ sơ, trưởng đoàn, bộ phận quản lý, bộ phận kiểm tra; CQT quản lý trực tiếp nếu khác) | **X + 3 NLV** | Đ17.4.e,g |
| S2 | Nếu gửi bưu điện bị trả lại: theo dõi lần gửi 1–2–3; sau 10 N kể từ lần 3 bị trả lại → coi như đã giao | – | Đ17.4.g |
| S3 | Cung cấp thông tin điều chỉnh nghĩa vụ thuế cho bộ phận quản lý | hạn nội bộ X + 3 NLV | NV Phòng Kiểm tra (dự thảo sửa 3736) |
| S4 | Theo dõi, đôn đốc NNT nộp tiền truy thu, phạt, chậm nộp | hạn nộp theo QĐ (mặc định nhận QĐ + 10 N, sửa được); nhắc hằng tuần đến khi nộp đủ | Đ17.7 |
| S5 | Nhập đủ dữ liệu hệ thống và **Hoàn thành cuộc trên iTNK** | hạn nội bộ X + 2 NLV | mục 9 |
| S6 | Lập hồ sơ, bàn giao lưu trữ (biên bản bàn giao 06/QTKT-MC); checklist thành phần hồ sơ theo Đ35.2 | **X + 01 năm** (nhắc trước 30 N) | Đ35.2.e |
| S7 | Dấu hiệu tội phạm (nếu có, phát sinh bất kỳ lúc nào): báo cáo đề xuất chuyển cơ quan điều tra | **ngày phát hiện + 5 NLV** | Đ17.4.h |

**Điều kiện “Cuộc kiểm tra hoàn tất”:** có X; S1 xong; checklist hệ thống (mục 9) tích đủ; iTNK đã “Hoàn thành cuộc”; nếu còn nợ thì cuộc chuyển trạng thái “Hoàn tất – đang theo dõi nộp tiền” (vẫn nhắc S4 và nhắc nhập TTR số nộp khi NNT nộp).

---

## 8. SỰ KIỆN LÀM THAY ĐỔI TIẾN TRÌNH (mỗi sự kiện: nút riêng, form riêng, tự tính lại hạn, tự sinh việc nhập hệ thống)
| Sự kiện | Xử lý trong app | Biểu mẫu | Nhập hệ thống |
|---|---|---|---|
| **Hoãn** trước khi công bố (NNT đề nghị có lý do chính đáng, hoặc CQT bất khả kháng/nhiệm vụ cấp thiết) | Nhập thời gian hoãn → hạn công bố = hết hoãn (người dùng xác nhận) | 10/KTT | TTR: Nhập thông báo hoãn |
| **Tạm dừng** trong khi kiểm tra | Nhập từ ngày–đến ngày; đồng hồ T1 đứng lại; E cộng số ngày tạm dừng | 10/QTKT-TC | TTR: Tạm dừng TTKT; iTNK: Tạm dừng |
| **Gia hạn** | Kiểm tra còn ≥ 3 NLV trước E; chỉ 1 lần; E mới | 07/KTT | TTR: Nhập QĐ bổ sung thời hạn; iTNK: Gia hạn |
| **Điều chỉnh QĐ** (đổi trưởng đoàn, thành viên, nội dung, thời kỳ) | Cập nhật đoàn/nội dung, lưu lịch sử | 11/KTT, 12/KTT, 13/KTT | TTR: Nhập QĐ TTKT bổ sung; iTNK: Danh sách thành viên đoàn |
| **Bãi bỏ QĐ** | Đóng cuộc, trạng thái “Bãi bỏ”, giữ lịch sử | 09/KTT | TTR: Nhập QĐ hủy; iTNK: Bãi bỏ |
| **Vướng mắc** cần xin ý kiến | Lãnh đạo bộ phận trả lời/xin ý kiến người ra QĐ ≤ 2 NLV; văn bản lấy ý kiến ≤ 2 NLV; khi có ý kiến, đoàn tổng hợp báo cáo ≤ 2 NLV. Nội dung còn vướng ghi mục riêng trong biên bản → khi có trả lời lập phụ lục 16/KTT | 16/KTT | TTR: Nhập phụ lục biên bản |
| **Yêu cầu NNT cung cấp tài liệu** | Đồng hồ **06 giờ làm việc** (tính theo giờ làm việc trong Cài đặt); quá hạn → gợi ý lập biên bản VPHC (Điều 15 NĐ 125/2020 sửa đổi) | – | – |
| **NNT không nhận QĐ / không ký biên bản công bố / trốn tránh** | Gợi ý quy trình lập biên bản VPHC, xử phạt, cưỡng chế, ấn định (Đ16.5) | – | – |
| **Tạm giữ tài liệu** liên quan hành vi trốn thuế | Ghi nhận, nhắc trả lại | – | – |
| **Phát hiện dấu hiệu tội phạm** | Sinh mốc S7 | – | – |
| **NNT giải trình** sau biên bản | Chuyển X1 → X2 | – | – |

---

## 9. MA TRẬN NHẬP LIỆU HỆ THỐNG (checklist tự sinh theo mốc – mỗi dòng có nút “Sao chép thông tin” để dán vào hệ thống)
| Thời điểm | TTR | iTNK (Nhật ký điện tử) | TMS |
|---|---|---|---|
| Được phân công | (Lãnh đạo) Phân công trưởng đoàn – kiểm tra đã có | Kế hoạch TTKT (năm/đột xuất) đã có cuộc | – |
| Ban hành QĐ kiểm tra (D0) | **Nhập Quyết định TTKT** | **Nhập thông tin quyết định**; Danh sách thành viên đoàn; Danh sách tổ giám sát; Phân công nhiệm vụ | – |
| Công bố (C) | **Lịch trình TTKT** – ngày công bố | **Công bố quyết định** (nếu trễ phải nhập lý do giải trình) | **1.4.1 – Nhập công bố quyết định kiểm tra tại trụ sở NNT** |
| Mỗi ngày tại DN | Lịch trình TTKT – ngày làm việc thực tế (cập nhật định kỳ) | **Cập nhật nhật ký đoàn / tiến độ công việc** (trưởng đoàn + thành viên); trưởng đoàn phê duyệt kết quả công việc | – |
| Tạm dừng / gia hạn / điều chỉnh / bãi bỏ | Tạm dừng; QĐ bổ sung thời hạn; QĐ TTKT bổ sung; QĐ hủy | Tạm dừng, gia hạn, bãi bỏ | – |
| Kết thúc tại DN (K) | – | **Kết thúc** cuộc (nếu muộn nhập lý do) | – |
| Ký biên bản (B) | **Nhập số liệu biên bản**; Phụ lục biên bản (nếu có) | **Báo cáo kết quả TTKT** (sau khi đã Kết thúc) | – |
| Ban hành QĐ xử phạt / KL (X) | **Nhập kết luận** / **Nhập Quyết định xử lý** (+ hành vi vi phạm); nếu NNT đã nộp: **Nhập số thu nộp sau TTKT** | Lãnh đạo phê duyệt báo cáo kết quả → **Hoàn thành cuộc** | **4.1 – Nhập quyết định (xử lý)**; **1.4.1 – nhập ngày kết luận** |
| NNT nộp tiền sau đó | **Nhập số thu nộp sau TTKT** (mỗi lần nộp) | – | – |
| Ngày 14 và ngày cuối tháng | Rà soát đủ dữ liệu trước chốt số liệu ngày 15 và cuối tháng | – | – |
| Trước ngày 01 tháng sau / trước 05/01 năm sau | Nhập báo cáo tháng / năm (03, 04, 05/QTKT-MC) trên hệ thống hỗ trợ kiểm tra (Đ34) | – | – |

Yêu cầu:
- Tên chức năng trên các hệ thống để trong **danh mục cấu hình** (người dùng sửa được khi phiên bản TTR/iTNK/TMS thay đổi).
- Mỗi dòng checklist có hạn mục tiêu (mặc định: trong ngày phát sinh mốc, chậm nhất 1 NLV sau) và đèn SLA riêng.
- “Sao chép thông tin”: copy một khối gồm MST, tên NNT, số QĐ, ngày QĐ, ngày công bố, thời kỳ, các số liệu – theo đúng thứ tự trường của chức năng đó.
- Màn hình “Nhập liệu còn thiếu” gom toàn bộ dòng chưa tích của mọi cuộc.

---

## 10. BỘ MÁY TÍNH HẠN (rules engine)
1. **Lịch làm việc:** thứ Hai–thứ Sáu, trừ ngày nghỉ trong `NgayNghi`, cộng ngày làm bù.
2. **Cách đếm “kể từ”** (mặc định theo Điều 147, 148 Bộ luật Dân sự): ngày xảy ra sự kiện không tính, bắt đầu đếm từ ngày tiếp theo. Với hạn tính theo **ngày lịch/tháng**, nếu ngày cuối rơi vào ngày nghỉ thì hạn là ngày làm việc kế tiếp. Với “chậm nhất n NLV **trước** E”: đếm lùi n NLV từ E.
3. **Hai lớp hạn:** `Hạn pháp lý` (theo quy tắc) và `Hạn mục tiêu` = hạn pháp lý − đệm an toàn (mặc định 1 NLV, cấu hình được từng quy tắc). Nhắc việc bám theo hạn mục tiêu; cảnh báo vi phạm bám theo hạn pháp lý.
4. **Chế độ thận trọng** (tùy chọn, mặc định TẮT): tính cả ngày sự kiện và không lùi hạn qua ngày nghỉ – cho người muốn an toàn tối đa.
5. **Quy tắc là dữ liệu, không phải code.** Ví dụ:
```json
{
  "boQuyTac": "QTKT-1161",
  "apDungTuNgayQD": "2026-08-14",
  "doiTuong": ["TO_CHUC", "HKD"],
  "quyTac": [
    {"ma":"Q1","ten":"Gửi QĐ cho NNT","moc":"D0","so":3,"donVi":"NLV","huong":"+","canCu":"Đ16.2 QĐ 1161/QĐ-CT"},
    {"ma":"Q5","ten":"Công bố QĐ kiểm tra","moc":"D0","so":10,"donVi":"NLV","huong":"+","canCu":"Đ17.1"},
    {"ma":"T1","ten":"Kết thúc KT tại trụ sở","moc":"C","so":20,"soNeuGDLK":40,"donVi":"N","huong":"+","congTamDung":true,"canCu":"Đ17.2.b"},
    {"ma":"T3","ten":"Đề nghị gia hạn","moc":"E","so":3,"donVi":"NLV","huong":"-","canCu":"Đ17.2.g"},
    {"ma":"B1","ten":"Ký biên bản kiểm tra","moc":"K","so":5,"donVi":"NLV","huong":"+","canCu":"Đ17.3.c"},
    {"ma":"B4","ten":"Báo cáo kết quả kiểm tra","moc":"B","so":3,"donVi":"NLV","huong":"+","canCu":"Đ17.4.a"},
    {"ma":"X1","ten":"QĐ xử phạt (không giải trình)","moc":"B","so":7,"donVi":"NLV","huong":"+","canCu":"Đ17.4.c.1"},
    {"ma":"X2","ten":"QĐ xử phạt (có giải trình)","moc":"B","so":1,"donVi":"THANG","huong":"+","canCu":"Đ17.4.c.2"},
    {"ma":"S1","ten":"Giao QĐ xử phạt","moc":"X","so":3,"donVi":"NLV","huong":"+","canCu":"Đ17.4.g"},
    {"ma":"REQ","ten":"NNT cung cấp tài liệu","moc":"YEU_CAU","so":6,"donVi":"GIO_LV","huong":"+","canCu":"Đ17.2.d"}
  ]
}
```
   (Viết đủ tất cả quy tắc ở mục 7–8; tạo thêm bộ `QTKT-970` cho cuộc chuyển tiếp.) Màn hình Cài đặt cho sửa tham số, xem trích dẫn, khôi phục mặc định; mọi thay đổi ghi audit log.
6. Đơn vị hỗ trợ: `NLV`, `N`, `THANG`, `GIO_LV`. Khi sửa ngày thực tế của một mốc, mọi mốc phụ thuộc tính lại ngay và hiển thị “hạn thay đổi từ … thành …”.

---

## 11. CÔNG VIỆC NGOÀI CUỘC KIỂM TRA
- **Hộp thu nhanh (Inbox):** nút “+” nổi, nhập bằng giọng nói tiếng Việt, tự nhận diện hạn từ câu (“thứ Sáu tuần sau”, “trước 15/12”, “sau 3 ngày làm việc”).
- **Việc thường xuyên** (mẫu có sẵn, lặp lại): chốt số liệu kiểm tra ngày 15 và cuối tháng; báo cáo tháng trước ngày 01 tháng sau; báo cáo năm trước 05/01; rà soát kế hoạch quý; giao ban tuần; tổng hợp báo cáo đôn đốc thu nộp sau kiểm tra.
- **Việc đột xuất từ văn bản:** số/ngày văn bản, người giao, hạn, việc con; nhóm theo nhiệm vụ của Phòng/Tổ Kiểm tra (dự thảo sửa 3736/3737): kiểm tra nội bộ, tiếp công dân, giải quyết khiếu nại/tố cáo/phản ánh kiến nghị, phòng chống tham nhũng – lãng phí – tiêu cực, xác minh tài sản thu nhập, cung cấp số liệu cho Kiểm toán Nhà nước/Thanh tra/Công an, kiểm tra lại kết quả của Thuế cơ sở, tham gia ý kiến chính sách, đào tạo.
- **Mẫu quy trình cho bộ phận khác:** người dùng tạo “mẫu quy trình” mới (danh sách bước + quy tắc thời hạn JSON) để áp dụng cho nghiệp vụ khác.

---

## 12. MÀN HÌNH (mobile-first, có bản máy tính rộng)
1. **Hôm nay** (trang chủ): lời chào + tóm tắt 3 dòng; thẻ “Quá hạn” (đỏ); “Đến hạn hôm nay”; “3 ngày làm việc tới”; “Nhập liệu còn thiếu”; lịch trong ngày (time-block); nút “Đã ghi nhật ký iTNK hôm nay”.
2. **Kế hoạch ngày** (lấy cảm hứng từ phiếu “Kế hoạch mỗi ngày”): Việc cần làm (tự đổ từ hạn + kéo từ Inbox), Mục tiêu trong ngày (tối đa 3), Nhắc nhở, Ghi chú, “Cho ngày mai” (chuyển tiếp việc chưa xong), cảm nhận cuối ngày (tùy chọn).
3. **Các cuộc kiểm tra:** 3 chế độ xem – Danh sách (lọc theo trạng thái, loại cuộc, kế hoạch, trưởng đoàn, SLA), Kanban, Dòng thời gian (Gantt) cho tất cả cuộc của đơn vị.
4. **Chi tiết cuộc:** đầu trang (NNT, loại, đoàn, đếm ngược đến hạn gần nhất); tab **Dòng thời gian mốc** (dự kiến vs thực tế, đèn SLA); tab **Việc tiếp theo & Sự kiện** (các nút ở mục 8); tab **Nhập hệ thống** (mục 9); tab **Nhật ký** (ghi nhanh trong ngày, sao chép sang iTNK); tab **Tài liệu yêu cầu & vướng mắc** (đồng hồ); tab **Kết quả & nộp tiền**; tab **Hồ sơ lưu trữ** (checklist Đ35.2).
5. **Lịch:** ngày/tuần/tháng, gộp mốc của mọi cuộc + việc khác; kéo để time-block; xuất `.ics`.
6. **Kế hoạch năm (Dashboard):** chỉ tiêu được giao vs thực hiện theo từng giai đoạn, biểu đồ tích lũy theo tháng so với đường lý tưởng, số cuộc tồn chuyển năm sau, số thu sau kiểm tra; bản cá nhân và bản đơn vị (khi nhập dữ liệu nhiều cán bộ hoặc đồng bộ).
7. **Tóm tắt & báo cáo:** sinh văn bản tiếng Việt tự động – (a) “Bản tin sáng” cá nhân; (b) “Báo cáo tiến độ đoàn” gửi lãnh đạo (dán Zalo/email); (c) “Báo cáo tuần” của cá nhân; (d) tóm tắt một cuộc (1 đoạn). Ví dụ: “Đến 14/10/2026, đoàn kiểm tra Công ty A (MST …1234) đang kiểm tra tại trụ sở ngày thứ 3/20; hạn đề nghị gia hạn 28/10/2026; còn 2 yêu cầu tài liệu chưa nhận (quá 06 giờ làm việc: 1); nhật ký iTNK đã ghi đủ.”
8. **Cài đặt:** hồ sơ cán bộ; giờ làm việc; ngày nghỉ (nhập Excel); bộ quy tắc; danh mục chức năng TTR/iTNK/TMS; kênh và khung giờ thông báo; bảo mật; sao lưu/khôi phục; giao diện Sáng (pastel kiểu planner) / Tối (nền xanh navy, điểm nhấn cyan kiểu dashboard).

---

## 13. NHẮC VIỆC – THÔNG BÁO – BÁO THỨC
**Lịch nhắc mặc định cho hạn pháp lý** (sửa được từng quy tắc): T−5 NLV (thông tin) · T−2 NLV 08:00 (cảnh báo) · T−1 NLV 08:00 và 14:00 (khẩn) · ngày T 07:30 **báo thức** + 13:30 nhắc lại · quá hạn: 08:00 mỗi NLV + đánh dấu cần giải trình.
**Nhắc theo nhịp:**
- 07:15 mỗi NLV: Bản tin sáng (quá hạn, đến hạn, ngày thứ mấy tại DN, nhập liệu thiếu).
- 16:30 mỗi ngày làm việc tại DN: “Ghi nhật ký iTNK hôm nay”; 17:15 chưa tích → báo thức; 07:45 hôm sau vẫn chưa → cảnh báo đỏ.
- Đồng hồ 06 giờ làm việc yêu cầu tài liệu: nhắc khi còn 1 giờ và khi hết.
- Thứ Sáu 15:30: Rà soát tuần; thứ Hai 07:30: Kế hoạch tuần.
- Ngày 13 và 2 ngày trước cuối tháng: rà soát dữ liệu TTR trước chốt số liệu; 28 hằng tháng: báo cáo tháng; 02/01: báo cáo năm.
- Tháng 10–12: cảnh báo cuộc kế hoạch năm chưa ban hành QĐ.
**Khung giờ yên lặng** 21:00–06:30 (trừ báo thức hạn pháp lý hôm sau, cấu hình được). Nút “Hoãn 15 phút / 1 giờ / sáng mai”, “Đã làm”, “Mở cuộc”.
**Kênh:**
- Khi app đang mở (tab hoặc đã cài PWA): thông báo trong app + Notification của trình duyệt + âm báo.
- Khi app đóng: trình duyệt không cho web tự hẹn giờ thông báo nếu không có máy chủ → **báo thức đi qua Lịch của điện thoại**: (1) xuất tệp `.ics` có VALARM (iPhone mở tệp là thêm được; Android nhập qua Google Lịch trên web); (2) nút **“Thêm vào Google Lịch”** ở từng hạn (mở link tạo sự kiện – cách dễ nhất trên Android).
- Email: nút “Soạn email” (mailto) cho bản tin sáng/báo cáo tuần; không gửi tự động.
- Bản app di động (giai đoạn B) mới có thông báo/báo thức hẹn giờ thật ngay trong app (xem ARCHITECTURE §13).
- Leo thang (tùy chọn): việc quá hạn > 1 NLV → gợi ý soạn tin báo cáo tổ trưởng/lãnh đạo phòng (app soạn sẵn, người dùng tự gửi).

---

## 14. BẢO MẬT VÀ DỮ LIỆU
- **Local-first:** dữ liệu lưu trên thiết bị (IndexedDB), mã hóa AES-GCM qua Web Crypto với khóa sinh từ mật mã bằng PBKDF2 (bản app sau này: SQLCipher).
- Khóa app bằng PIN/vân tay/Face ID; tự khóa sau 5 phút; ẩn nội dung ở màn hình đa nhiệm.
- **Tối thiểu hóa:** không lưu nội dung văn bản, không lưu tài liệu của NNT; tùy chọn “chế độ ẩn danh” chỉ lưu 4 số cuối MST + tên viết tắt; thông báo trên màn hình khóa chỉ hiển thị “Cuộc KT …1234 – đến hạn ký biên bản”.
- Sao lưu/khôi phục bằng tệp `.tlkt.json` (mã hóa nếu bật mật mã); dùng để chuyển máy hoặc đồng bộ thủ công giữa điện thoại và máy tính.
- Không dùng dịch vụ đám mây công cộng để lưu dữ liệu NNT; không gửi dữ liệu cho bên thứ ba; không có analytics.
- Nhắc người dùng tuân thủ quy định bảo mật thông tin NNT và quy chế công nghệ thông tin của đơn vị.

---

## 15. KIẾN TRÚC KỸ THUẬT
Xem `docs/ARCHITECTURE.md` (đã chốt: PWA Vite + TypeScript + Preact, IndexedDB + mã hóa Web Crypto, GitHub Pages; lõi `src/core` thuần TypeScript để tái dùng cho app Expo sau này).

---

## 16. NHẬP/XUẤT
- **Nhập kế hoạch từ Excel** theo cấu trúc mẫu 06/QTKT-TC (Tên NNT, MST, địa chỉ, nội dung kiểm tra, chuyên đề, thời gian dự kiến, trưởng đoàn); có nút tải file mẫu; màn hình ghép cột tự nhận diện gần đúng; bảng xác nhận trước khi nhập; báo trùng MST.
- **Xuất Excel:** danh sách cuộc + mốc + SLA; nhập liệu còn thiếu; theo dõi thu nộp sau kiểm tra; tiến độ kế hoạch năm.
- **Xuất `.ics`** toàn bộ mốc tương lai (có VALARM theo mục 13) và nút “Thêm vào Google Lịch” từng hạn.
- **Xuất PDF/in** báo cáo tiến độ đoàn, báo cáo tuần.
- Sao lưu `.tlkt.json` (mã hóa nếu bật mật mã).

---

## 17. DỮ LIỆU MẪU VÀ KIỂM THỬ CHẤP NHẬN (bắt buộc tự chạy trước khi trả kết quả)
Nút “Dùng dữ liệu mẫu” tạo 6 cuộc ở các giai đoạn khác nhau (1 KH, 1 trước hoàn, 1 giải thể, 1 có GDLK, 1 bãi bỏ, 1 chuyển tiếp QTKT-970) và 10 việc khác.

**Kịch bản kiểm thử** – bản đầy đủ, máy đọc được: `tests/kich-ban-han.json` (bắt buộc đạt 100%). Bảng tóm tắt (bộ quy tắc QTKT-1161, Tổ chức, không GDLK, không ngày nghỉ trong tháng 10–11/2026, cách đếm mặc định):
| Đầu vào | Kết quả phải ra |
|---|---|
| D0 = 05/10/2026 (thứ Hai) | Hạn gửi QĐ cho NNT: **08/10/2026**; hạn KH giám sát: **12/10/2026**; hạn công bố: **19/10/2026** |
| C = 12/10/2026 | C + 20 N = 01/11/2026 (Chủ nhật) → E = **02/11/2026**; hạn đề nghị gia hạn: **28/10/2026** |
| Gia hạn 20 N | E mới = 21/11/2026 (thứ Bảy) → **23/11/2026** |
| Thay vì gia hạn: tạm dừng 19/10–23/10 (5 N) | E = **06/11/2026** |
| K = 30/10/2026 | Hạn ký biên bản: **06/11/2026** |
| B = 03/11/2026 | Báo cáo kết quả: **06/11/2026**; giải trình trực tiếp: **05/11/2026**; giải trình văn bản: **10/11/2026**; X1/X4: **12/11/2026**; X2: **03/12/2026**; X3: **04/01/2027** (03/01/2027 là Chủ nhật) |
| X = 10/11/2026 | Hạn giao QĐ: **13/11/2026** |
| Thêm 01/01/2027 vào ngày nghỉ, B = 30/12/2026 | X1 = **11/01/2027** (đếm 31/12, 04/01…08/01, 11/01) |

Ngoài ra: không có lỗi console; xóa/sửa mốc tính lại đúng; tắt mạng vẫn dùng được; đổi tham số quy tắc trong Cài đặt thì hạn thay đổi theo; checklist mục 9 sinh đúng khi đi qua từng mốc; thông báo được lập lịch đúng số lượng (nền tảng B: không vượt 64 trên iOS).

---

## 18. ĐẦU RA YÊU CẦU
Thực hiện theo `docs/TASKS.md` (T01 → T40), ghi tiến độ vào `docs/PROGRESS.md`, bàn giao theo T40 (app chạy trên GitHub Pages, hướng dẫn sử dụng, bảng độ phủ yêu cầu `docs/DO-PHU-YEU-CAU.md`).

---

## PHỤ LỤC – DANH MỤC BIỂU MẪU DÙNG TRONG APP
| Mẫu | Tên | Nguồn |
|---|---|---|
| 06/QTKT-TC | Danh sách NNT được lựa chọn kiểm tra theo kế hoạch, chuyên đề | QĐ 1161 |
| 07/QTKT-TC | Thông báo kế hoạch, chuyên đề kiểm tra | QĐ 1161 |
| 08/QTKT-TC | Phiếu phân tích, đánh giá rủi ro xác định nội dung, thời kỳ | QĐ 1161 |
| 09/QTKT-TC | Phân công công việc thành viên đoàn | QĐ 1161 |
| 10/QTKT-TC | Thông báo tạm dừng kiểm tra tại trụ sở | QĐ 1161 |
| 11/QTKT-TC | Biên bản xác nhận số liệu kiểm tra | QĐ 1161 |
| 12/QTKT-TC | Báo cáo kết quả kiểm tra | QĐ 1161 |
| 03, 04, 05/QTKT-MC | Báo cáo định kỳ kết quả công tác kiểm tra | QĐ 1161 |
| 06/QTKT-MC | Biên bản bàn giao hồ sơ lưu trữ | QĐ 1161 |
| 06/KTT | Quyết định kiểm tra thuế | TT 89/2026 |
| 07/KTT | Quyết định gia hạn kiểm tra | TT 89/2026 |
| 08/KTT | Biên bản công bố Quyết định kiểm tra | TT 89/2026 |
| 09/KTT | Quyết định bãi bỏ Quyết định kiểm tra | TT 89/2026 |
| 10/KTT | Thông báo hoãn thời gian tiến hành kiểm tra | TT 89/2026 |
| 11, 12, 13/KTT | Quyết định điều chỉnh Quyết định kiểm tra | TT 89/2026 |
| 14/KTT | Biên bản kiểm tra thuế | TT 89/2026 |
| 15/KTT | Biên bản công khai và bàn giao dự thảo biên bản kiểm tra | TT 89/2026 |
| 16/KTT | Phụ lục biên bản kiểm tra | TT 89/2026 |
| 17/KTT | Kết luận kiểm tra thuế | TT 89/2026 |
| MQĐ02 | Quyết định xử phạt vi phạm hành chính | NĐ 68/2025 |
| 01-TTKT | Quyết định giám sát hoạt động đoàn | QĐ 1614 |
| 02-TTKT | Kế hoạch giám sát | QĐ 1614 |
| 04-TTKT | Biên bản làm việc của người giám sát | QĐ 1614 |
| 05-TTKT | Báo cáo kết quả giám sát | QĐ 1614 |
| 06-TTKT | Thư trao đổi thông tin gửi NNT | QĐ 1614 |

## CÁC ĐIỂM CẦN XÁC NHẬN TẠI ĐƠN VỊ (hiển thị trong app ở mục “Căn cứ”, gắn nhãn “Chưa xác nhận”)
1. Thời hạn 20 ngày tại trụ sở (Đ17.2.b) được ghi là “ngày”, không ghi “ngày làm việc” → app mặc định tính ngày theo lịch; nếu đơn vị/TTR tính khác thì đổi đơn vị trong Cài đặt.
2. Quy chế giám sát mới của Cục trưởng Cục Thuế (nếu đã ban hành) thay cho QĐ 1614/QĐ-TCT.
3. Mã chức năng TMS (4.1; 1.4.1) và tên chức năng TTR/iTNK theo phiên bản đang dùng tại đơn vị.
4. Hạn giải quyết hồ sơ hoàn thuế (loại TH) và hạn nộp tiền theo QĐ xử phạt – người dùng nhập theo văn bản hiện hành.
5. Tham số bộ quy tắc chuyển tiếp QTKT-970.
