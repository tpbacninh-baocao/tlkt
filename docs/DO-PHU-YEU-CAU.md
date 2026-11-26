# Độ phủ yêu cầu – TLKT

Đối chiếu từng yêu cầu trong `docs/SPEC.md` (§2–§17) và `docs/UI.md` (§4) với phần đã làm.
Trạng thái: **Đã làm** · **Một phần** (kèm lý do) · **Chưa** (kèm lý do).
Vị trí: tệp mã (`src/...`) và tệp kiểm thử (`tests/...`). Cách xác minh trong trình duyệt xem `e2e/` và ảnh ở `docs/anh-chup/`.

## Tóm tắt
- **Chưa làm:** 2 mục – mẫu quy trình tự tạo cho bộ phận khác (SPEC §11); khóa bằng vân tay/Face ID (SPEC §14). Cả hai đều được SPEC/ARCHITECTURE xếp vào giai đoạn sau (xem lý do ở bảng).
- **Một phần:** 4 mục – vai trò cán bộ, “ẩn danh chỉ lưu 4 số cuối MST”, bản đơn vị của kế hoạch năm, tóm tắt giọng nói tùy trình duyệt.
- Còn lại: **Đã làm** và có test hoặc đã chạy thử trong Chromium.

---

## SPEC §2 – Mục tiêu
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Quản lý toàn bộ vòng đời cuộc kiểm tra (P1 → S6) | Đã làm | `src/core/vuViec/*`, `src/ui/man/chiTietCuoc.tsx`; E2E đi hết 22 bước đến “Hoàn thành” (`e2e/luong-chinh.cjs`) |
| Tự tính mọi mốc, cảnh báo, báo thức trước hạn/quá hạn | Đã làm | `src/core/vuViec/tinhMoc.ts`, `src/core/nhacViec/sinhNhac.ts`; `tests/acceptance.test.ts`, `tests/tinhmoc.test.ts`, `tests/nhacviec.test.ts` |
| Nhắc nhập liệu TTR/iTNK/TMS đúng lúc, đúng chức năng | Đã làm | `src/core/checklist/*`, `rules/checklist-he-thong.json`; `tests/checklist.test.ts` |
| Việc thường xuyên và đột xuất ngoài cuộc; lịch ngày/tuần; tóm tắt tự động | Đã làm | `src/core/viec/*`, `src/ui/man/viec.tsx`, `lich.tsx`, `keHoachNgay.tsx`; `tests/viec.test.ts`, `tests/lichngay.test.ts` |
| Theo dõi tiến độ kế hoạch năm | Đã làm | `src/core/keHoach/*`, `src/ui/man/keHoachNam.tsx`; `tests/kehoach.test.ts` |
| Ứng dụng không kết nối/đăng nhập/thu thập dữ liệu từ TTR, iTNK, TMS | Đã làm | Không có lệnh gọi mạng (E2E kiểm tra 0 yêu cầu ra ngoài); phông chữ cài sẵn |

## SPEC §3 – Căn cứ nghiệp vụ
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Hiển thị văn bản căn cứ; mỗi quy tắc gắn trích dẫn điều khoản | Đã làm | `src/ui/man/canCu.tsx`; trường `canCu` trong `rules/*.json` |
| Bảng chuyển tiếp chọn bộ quy tắc theo ngày QĐ | Đã làm | `src/core/quyTac/nap.ts` (`chonBoQuyTac`), `canCu.tsx`; nhóm “Chọn bộ quy tắc” trong `tests/kich-ban-han.json` |

## SPEC §4 – Mô hình quản lý công việc
| # | Yêu cầu | Trạng thái | Vị trí |
|---|---|---|---|
| 1 | Hồ sơ vụ việc + máy trạng thái, không cho nhảy bước sai logic, cho ghi ngày lùi + lý do | Đã làm | `src/core/vuViec/rangBuoc.ts`, `giaiDoan.ts`; `tests/vuviec.test.ts` |
| 2 | “Việc tiếp theo” mỗi cuộc; trang chủ sắp theo điểm ưu tiên | Đã làm | `src/core/vuViec/viecTiepTheo.ts`, `src/ui/man/homNay.tsx` |
| 3 | SLA đèn tín hiệu (7 mức, có biểu tượng + chữ, không chỉ dùng màu) | Đã làm | `mucSLA` trong `viecTiepTheo.ts`; `src/ui/chuoi.ts` |
| 4 | Điểm ưu tiên tự động, cho ghim thủ công | Đã làm | `diemUuTienCuoc`, `diemUuTienViec`; ghim ở `viec.tsx`, `chiTietCuoc.tsx` |
| 5 | Kanban theo giai đoạn, kéo thả trên máy tính | Đã làm | `src/ui/man/kanban.tsx`; kéo thả chỉ mở form xác nhận mốc (đúng UI §4.4) |
| 6 | Time-blocking, gợi ý khối “Tại DN”, khối “Nhập TTR/iTNK” | Đã làm | `src/core/tomTat/lichNgay.ts` (`goiYKhoiThoiGian`), `src/ui/man/lich.tsx` (kéo tạo khối) |
| 7 | Nhịp rà soát: kế hoạch ngày, tổng kết ngày, rà soát tuần, chốt số liệu ngày 15/cuối tháng | Đã làm | Nhắc `TKNGAY`, `RSTUAN`, `KHTUAN` trong `sinhNhac.ts`; việc mẫu `RS_13`, `RS_CUOI` ở `rules/mau-viec-thuong-xuyen.json` |
| 8 | Theo dõi chỉ tiêu kế hoạch năm, đường lý tưởng, cảnh báo cuối năm (Đ15.5.e) | Đã làm | `src/core/keHoach/thongKe.ts`, `keHoachNam.tsx`, `bieuDo.tsx` |

## SPEC §5 – Mô hình dữ liệu
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| CanBo: họ tên, chức vụ, đơn vị, email | Đã làm | `CaiDat.canBo`, Cài đặt → Hồ sơ |
| CanBo: vai trò (Trưởng đoàn/Thành viên/Tổ trưởng/Người giám sát) | **Một phần** | Vai trò được gắn theo từng cuộc (trưởng đoàn, thành viên, giám sát); hồ sơ cá nhân không có trường “vai trò” riêng vì app dùng cho một cán bộ |
| KeHoach (4 loại, số/ngày QĐ, ngày công khai, danh sách NNT) | Đã làm | `src/core/kieu.ts`, `keHoachNam.tsx`, nhập Excel |
| CuocKiemTra: định danh, phân loại, đoàn, nội dung, kết quả, mốc, sự kiện, checklist, nhật ký, yêu cầu tài liệu, vướng mắc | Đã làm | `src/core/kieu.ts`; các tab ở `src/ui/chiTiet/*` |
| Tệp đính kèm chỉ lưu đường dẫn/ghi chú, không lưu nội dung văn bản | Đã làm | Chỉ có trường số/ngày văn bản và ghi chú |
| CongViec: nguồn, số VB, hạn, lặp lại, ưu tiên, liên kết cuộc, việc con | Đã làm | `src/core/viec/*`, `viec.tsx`; lặp lại dạng chuỗi riêng (`THANG:15`, `TUAN:1`…) thay vì RRULE đầy đủ – đủ cho các mẫu đã nêu |
| NgayNghi: lễ cố định, Tết/Giỗ Tổ nhập theo năm, ngày làm bù, nhắc cập nhật | Đã làm | `rules/ngay-nghi.json`, `ngayNghiForm.tsx`; nhập từ Excel/CSV; `tests/lich.test.ts` |
| BoQuyTac dạng JSON có phiên bản | Đã làm | `rules/*.json` |
| Audit log mọi thao tác | Đã làm | `src/data/kho.ts` (`ghiNhatKy`), tab “Lịch sử sửa”; `tests/kho.test.ts` |
| Xóa mềm 30 ngày, khôi phục; nhân bản cuộc; tìm kiếm; lọc | Đã làm | Thùng rác `thungRac.tsx`; “Nhân bản” ở menu cuộc; `timKhop`, `locCuocDS`; `tests/dscuoc.test.ts` |

## SPEC §6 – Loại cuộc kiểm tra
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| 13 loại cuộc (KH, CD, TH, SH, GT, CDD, TCS, VP, CĐ, KN, MG, CQT, KL) | Đã làm | `src/core/kieu.ts` (`LoaiCuoc`), `themCuoc.tsx` |
| Gợi ý nội dung/thời kỳ theo Đ16.1 | Đã làm | Gợi ý trong form thêm cuộc (`goiY`) |
| Thời hiệu kiểm tra lại 02 năm (KL); báo cáo chuyên đề 15 ngày | Đã làm | `src/core/keHoach/han.ts`; `tests/kehoach.test.ts` |

## SPEC §7 – Quy trình chuẩn và công thức hạn
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| 6 giai đoạn, toàn bộ mốc và công thức hạn | Đã làm | `rules/quy-tac-QTKT-1161.json`, `tinhMoc.ts`; **`tests/kich-ban-han.json` đạt 100%** (`tests/acceptance.test.ts`, và chạy lại trong app ở `#kiem-thu`) |
| Mốc dự kiến vs thực tế; hạn đổi “từ … thành …” | Đã làm | `tinhMoc.ts` (`duKien`), form sự kiện hiển thị hạn trước/sau |

## SPEC §8 – Sự kiện
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| 11 sự kiện: hoãn, tạm dừng, gia hạn, điều chỉnh QĐ, bãi bỏ, giải trình, vướng mắc/phức tạp, dấu hiệu tội phạm, không nhận QĐ/trốn tránh, tạm giữ tài liệu, phụ lục biên bản | Đã làm | `src/core/vuViec/suKien.ts`, `src/ui/chiTiet/formSuKien.tsx`, `tabSuKien.tsx`; `tests/vuviec.test.ts`, `tests/capnhat.test.ts` |
| Tự tính lại hạn, tự sinh việc nhập hệ thống, kiểm tra điều kiện (ví dụ gia hạn chỉ 1 lần, còn ≥ 3 NLV) | Đã làm | `rangBuoc.ts`, `checklist/sinh.ts` |
| Yêu cầu tài liệu 06 giờ làm việc; vướng mắc 3 đồng hồ 02 NLV | Đã làm | `src/core/vuViec/dongHo.ts`; `tests/dongho.test.ts`; nhóm W (giờ làm việc) trong kịch bản |

## SPEC §9 – Ma trận nhập liệu hệ thống
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Checklist TTR/iTNK/TMS tự sinh theo mốc, sự kiện, điều kiện, lần nộp tiền | Đã làm | `src/core/checklist/sinh.ts`; `tests/checklist.test.ts` |
| Nút “Sao chép thông tin” đúng thứ tự trường | Đã làm | `saoChep.ts`, `hangNhapLieu.tsx` |
| Tên chức năng là cấu hình (sửa được theo phiên bản đơn vị) | Đã làm | Cài đặt → Quy tắc thời hạn → Tên chức năng |

## SPEC §10 – Bộ máy tính hạn
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Lịch làm việc, ngày làm bù | Đã làm | `src/core/lich/*`; `tests/lich.test.ts` |
| Cách đếm “kể từ” theo Điều 147, 148 BLDS; ngày lịch/tháng lùi nếu rơi ngày nghỉ | Đã làm | `lich.ts`; nhóm “Có ngày nghỉ” trong kịch bản |
| Hạn pháp lý + hạn mục tiêu (đệm) | Đã làm | `tinhMoc.ts`; đệm sửa được từng bước |
| Chế độ thận trọng (mặc định tắt) | Đã làm | `lichTronTru(true)`, Cài đặt → Quy tắc thời hạn |
| Quy tắc là dữ liệu; Cài đặt sửa tham số, xem trích dẫn, khôi phục mặc định, ghi audit | Đã làm | `src/ui/man/caiDatQuyTac.tsx`; `tests/quytac.test.ts` |
| Đơn vị NLV, N, THANG, GIO_LV | Đã làm | `tinhHan.ts`, `lich.ts` |
| Sửa ngày thực tế → mốc phụ thuộc tính lại ngay | Đã làm | Tính lại mỗi lần vẽ (hàm thuần); `tests/capnhat.test.ts` |

## SPEC §11 – Công việc ngoài cuộc
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Hộp thu nhanh: nút “＋”, nhập giọng nói, nhận diện hạn từ câu tiếng Việt | Đã làm | `src/ui/thuNhanh.tsx`, `giongNoi.ts`, `src/core/viec/nhanDienHan.ts` (nhóm N01–N08). **Giọng nói** chỉ hoạt động trên trình duyệt có hỗ trợ (Chrome/Edge/Safari mới); nơi không hỗ trợ thì ẩn nút micro |
| Việc thường xuyên (mẫu có sẵn, lặp lại) | Đã làm | `rules/mau-viec-thuong-xuyen.json`, `viec.tsx` (tab Mẫu) |
| Việc đột xuất từ văn bản: số/ngày VB, người giao, hạn, việc con, nhóm nhiệm vụ | Đã làm | `viec.tsx`, `NHOM_DOT_XUAT` |
| **Mẫu quy trình cho bộ phận khác** (người dùng tự tạo danh sách bước + quy tắc JSON) | **Chưa** | SPEC §2 ghi đây là hướng mở rộng “sau này”; lõi đã sẵn sàng vì quy tắc là dữ liệu và có cơ chế kế thừa (QTKT-970 kế thừa QTKT-1161), nhưng chưa có màn tạo mẫu mới. Đề nghị làm ở giai đoạn sau khi đơn vị chốt nhu cầu |

## SPEC §12 – Màn hình
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Hôm nay | Đã làm | `homNay.tsx` |
| Kế hoạch ngày (việc cần làm, mục tiêu ≤ 3, nhắc nhở, ghi chú, cho ngày mai, cảm nhận) | Đã làm | `keHoachNgay.tsx` |
| Các cuộc: Danh sách/Kanban/Gantt, lọc theo trạng thái, loại, kế hoạch, trưởng đoàn, SLA | Đã làm | `dsCuoc.tsx`, `kanban.tsx`, `gantt.tsx` |
| Chi tiết cuộc: đầu trang, 8 tab | Đã làm | `chiTietCuoc.tsx`, `src/ui/chiTiet/*` |
| Lịch ngày/tuần/tháng, kéo time-block, xuất .ics | Đã làm | `lich.tsx` |
| Kế hoạch năm: chỉ tiêu, tích lũy theo tháng, tồn chuyển, thu sau kiểm tra | Đã làm | `keHoachNam.tsx` |
| Kế hoạch năm: **bản đơn vị** (nhiều cán bộ) | **Một phần** | App dùng cho một cán bộ: có bản cá nhân (ô “Chỉ cuộc của tôi”, lọc theo trưởng đoàn = họ tên trong Cài đặt) và bản tổng hợp mọi cuộc đang nhập. Việc gộp dữ liệu nhiều người cần nhập bằng Excel/tệp sao lưu, chưa có gộp tự động |
| Tóm tắt & báo cáo: bản tin sáng, báo cáo tiến độ đoàn, báo cáo tuần, tóm tắt một cuộc | Đã làm | `src/core/tomTat/vanBan.ts`, `baoCao.tsx`; `tests/tomtat.test.ts` (có snapshot) |
| Cài đặt (hồ sơ, giờ, ngày nghỉ, quy tắc, tên chức năng, thông báo, bảo mật, sao lưu, giao diện sáng/tối) | Đã làm | `src/ui/man/caiDat*.tsx` |

## SPEC §13 – Nhắc việc, thông báo, báo thức
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Lịch nhắc hạn pháp lý T−5/T−2/T−1/T/quá hạn | Đã làm | `sinhNhac.ts`; `tests/nhacviec.test.ts` |
| Nhịp: bản tin 07:15, nhật ký iTNK 16:30/17:15/07:45, rà soát tuần, kế hoạch tuần, tổng kết ngày, chốt số liệu, báo cáo tháng/năm, kế hoạch năm tháng 10–12 | Đã làm | `sinhNhac.ts`, `rules/mau-viec-thuong-xuyen.json` |
| Yêu cầu tài liệu: nhắc khi còn 1 giờ và khi hết | Đã làm | `sinhNhac.ts` (khóa `YC`) |
| Khung giờ yên lặng (trừ báo thức) | Đã làm | `ganGioYenLang` |
| Nút Hoãn 15 phút/1 giờ/sáng mai, “Đã làm”, “Mở cuộc” | Đã làm | `src/core/nhacViec/phat.ts`, `src/ui/chuongNhac.tsx`; `tests/phatnhac.test.ts` |
| Khi app mở: thông báo trong app + Notification + âm báo, không phát trùng | Đã làm | `src/ui/boPhatNhac.ts` |
| Khi app đóng: báo thức qua lịch điện thoại (.ics có VALARM; Google Lịch từng hạn) + hướng dẫn | Đã làm | `ics.ts`, `huongDan.tsx`; `tests/nhacviec.test.ts` |
| Email: nút “Soạn email” (mailto), không gửi tự động | Đã làm | `baoCao.tsx` |
| Leo thang: việc quá hạn > 1 NLV → gợi ý soạn tin báo lãnh đạo | Đã làm | `tinBaoLanhDao` (`vanBan.ts`), nút ở mục Quá hạn của Hôm nay |
| Thông báo trên màn hình khóa chỉ hiện “KT …1234” khi bật ẩn danh | Đã làm | `src/core/nhacViec/anDanh.ts` |
| Bản app di động (báo thức hẹn giờ thật) | Chưa (ngoài phạm vi) | SPEC ghi là giai đoạn B; `src/core` đã giữ thuần TypeScript để tái dùng |

## SPEC §14 – Bảo mật và dữ liệu
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Local-first, IndexedDB, mã hóa AES-GCM với khóa PBKDF2 | Đã làm | `src/data/mat.ts`, `kho.ts`; `tests/matma.test.ts` |
| Khóa bằng mật mã; tự khóa sau 5 phút (đổi được); sai 5 lần chờ 30 giây | Đã làm | `KhoaTuDong`, `BoChanSai`, `manKhoa.tsx` |
| **Khóa bằng vân tay/Face ID (WebAuthn)** | **Chưa** | Cần WebAuthn gắn với khóa mã hóa, hỗ trợ khác nhau giữa trình duyệt/hệ điều hành và dễ làm mất dữ liệu nếu sai; để giai đoạn app di động (SPEC ghi “bản app sau này”). Hiện bảo vệ bằng mật mã |
| Ẩn nội dung ở màn hình đa nhiệm | Đã làm (tốt nhất có thể) | Làm mờ giao diện khi tab/app ra nền nếu đã đặt mật mã hoặc bật ẩn danh (`app.tsx`, `data-che`). Hệ điều hành tự quyết hình xem trước nên không bảo đảm tuyệt đối |
| Chế độ ẩn danh: “chỉ lưu 4 số cuối MST + tên viết tắt” | **Một phần** | Ẩn danh che MST/tên ở mọi nơi hiển thị, thông báo, báo cáo, .ics, Excel. Dữ liệu vẫn lưu đầy đủ trên thiết bị (cần để tính hạn, tìm kiếm, nhập liệu); có thể mã hóa bằng mật mã |
| Sao lưu `.tlkt.json`, mã hóa nếu có mật mã; Gộp/Thay thế | Đã làm | `src/data/saoLuu.ts`, Cài đặt → Sao lưu; `tests/saoluu.test.ts` |
| Không đám mây, không bên thứ ba, không analytics | Đã làm | Kiểm tra E2E: 0 yêu cầu ra ngoài |
| Nhắc tuân thủ quy định bảo mật thông tin NNT | Đã làm | Màn Giới thiệu, hướng dẫn sử dụng |

## SPEC §16 – Nhập/xuất
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Nhập kế hoạch Excel/CSV: tải mẫu, ghép cột, xem trước, báo trùng MST | Đã làm | `nhapExcel.tsx`, `src/core/nhapXuat/nhapKeHoach.ts`, `src/data/excel.ts`; `tests/nhapkehoach.test.ts`, `tests/excel.test.ts` |
| Xuất Excel 4 loại bắt buộc (+ “Việc khác”) | Đã làm | `src/ui/excel.ts`, `src/core/nhapXuat/xuatBang.ts`; `tests/xuatbang.test.ts`. Ghi chú: thư viện miễn phí không in đậm/cố định dòng đầu; có lọc cột, độ rộng, số 1.234.567 |
| Xuất .ics + nút “Thêm vào Google Lịch” từng hạn | Đã làm | `xuat.ts`, `muc.tsx`, `dongThoiGian.tsx` |
| In/PDF báo cáo tiến độ đoàn, báo cáo tuần | Đã làm | `window.print()` + `@media print` ở `app.css` (dùng In → Lưu PDF) |

## SPEC §17 – Dữ liệu mẫu và kiểm thử chấp nhận
| Yêu cầu | Trạng thái | Vị trí |
|---|---|---|
| Dữ liệu mẫu: 6 cuộc ở các giai đoạn (KH, trước hoàn, giải thể, GDLK, bãi bỏ, chuyển tiếp 970) + việc khác | Đã làm | `src/data/mau.ts`; thêm/xóa riêng ở Cài đặt → Sao lưu & dữ liệu. 10 việc mẫu, trong đó những việc trùng việc thường xuyên đã bật sẽ không nhân đôi |
| Kịch bản chấp nhận 100% | Đã làm | `tests/acceptance.test.ts` (41 test), `#kiem-thu` chạy lại 39 ca trong app |
| Không lỗi console; xóa/sửa mốc tính lại đúng; offline; đổi quy tắc → hạn đổi; checklist đúng; số nhắc đúng | Đã làm | `e2e/luong-chinh.cjs`; kiểm tra offline ở T36; `tests/capnhat.test.ts`, `tests/quytac.test.ts`, `tests/checklist.test.ts`, `tests/nhacviec.test.ts` |

---

## UI §4 – Màn hình
| Mục | Trạng thái | Ghi chú / vị trí |
|---|---|---|
| 4.1 Onboarding 4 bước, bỏ qua được | Đã làm | `onboarding.tsx` |
| 4.2 Màn khóa, sai 5 lần chờ 30 giây, “Quên mật mã?” | Đã làm | `manKhoa.tsx` |
| 4.3 Hôm nay (tóm tắt, KPI, các nhóm, tại DN, nhập liệu thiếu, lịch hôm nay, dải xanh khi hết việc gấp) | Đã làm | `homNay.tsx` |
| 4.4 Danh sách cuộc (tìm, lọc, 3 chế độ, sắp xếp) | Đã làm | `dsCuoc.tsx`, `kanban.tsx`, `gantt.tsx` |
| 4.5 Thêm/sửa cuộc 3 bước + xem trước dòng thời gian | Đã làm | `themCuoc.tsx` |
| 4.6 Chi tiết cuộc: đầu trang, 8 tab, cột phải dòng thời gian mốc | Đã làm | `chiTietCuoc.tsx`, `chiTiet/*`, `cotPhai.tsx` |
| 4.7 Nhập liệu còn thiếu (lọc hệ thống/SLA, nhóm theo cuộc, nhắc chốt số liệu) | Đã làm | `nhapLieu.tsx` |
| 4.8 Lịch tháng/tuần/ngày, ngày nghỉ, làm bù, khối thời gian | Đã làm | `lich.tsx` |
| 4.9 Việc (5 tab, thu nhanh, chip hạn) | Đã làm | `viec.tsx`, `thuNhanh.tsx` |
| 4.10 Kế hoạch ngày theo phiếu “Kế hoạch mỗi ngày” | Đã làm | `keHoachNgay.tsx` |
| 4.11 Kế hoạch năm | Đã làm (bản đơn vị: một phần, xem trên) | `keHoachNam.tsx` |
| 4.12 Báo cáo & tóm tắt (xem trước, sao chép, mailto, in, 5 loại Excel) | Đã làm | `baoCao.tsx`. Tùy chọn “Hiện đầy đủ MST lần này” có |
| 4.13 Cài đặt đủ các nhóm | Đã làm | `caiDat*.tsx` |
| 4.14 Căn cứ & hướng dẫn | Đã làm | `canCu.tsx`, `huongDan.tsx` |
| 4.15 Kiểm thử trong app | Đã làm | `kiemThu.tsx`, `src/core/kiemThu` |
| §3 Thành phần dùng chung (ThẻViệc, nhãn, đồng hồ đếm ngược, chọn ngày, hộp xác nhận tự xây, toast + Hoàn tác, trạng thái rỗng, nút Sao chép) | Đã làm | `thanhPhan.tsx`, `lopPhu.tsx` |
| §6 Khả năng tiếp cận (nhãn aria, bàn phím, vòng focus, không chỉ dùng màu, phóng chữ) | Đã làm – rà soát chi tiết ở T39 | Xem mục T39 trong `docs/PROGRESS.md` |

## Ghi chú cuối
- Mọi mục “Chưa/Một phần” đều đã được liệt kê ở mục “Cần người dùng xác nhận” của `docs/PROGRESS.md`.
- Bảng này được kiểm tra lại một lần nữa khi bàn giao (T40).
