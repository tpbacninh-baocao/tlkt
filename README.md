# TLKT – Trợ lý Đoàn kiểm tra

Ứng dụng hỗ trợ công chức kiểm tra thuế tại trụ sở NNT: quản lý vòng đời cuộc kiểm tra, tự tính thời hạn theo QĐ 1161/QĐ-CT, nhắc việc, nhắc nhập TTR/iTNK/TMS, quản lý việc thường xuyên/đột xuất, kế hoạch ngày/năm.

Thư mục này là **gói bàn giao cho Claude Code**: Claude Code đọc các tài liệu ở đây và tự xây dựng, kiểm thử, đưa app lên mạng. Bạn **không cần cài gì trên máy** và không cần biết lập trình.

---

## CÁCH TRIỂN KHAI (khoảng 15 phút thao tác, phần còn lại Claude tự làm)

### Bước 1 – Tạo kho chứa trên GitHub (làm 1 lần)
1. Vào **github.com** → đăng ký/đăng nhập.
2. Bấm **New repository** (nút “+” góc trên phải → New repository).
   - Repository name: `tlkt`
   - Chọn **Public** (để dùng GitHub Pages miễn phí – kho chỉ chứa mã nguồn và tóm tắt quy trình đã công bố, **không chứa dữ liệu NNT**; dữ liệu nằm trên điện thoại/máy tính của từng người).
   - Tích **Add a README file** → **Create repository**.
3. Trong kho vừa tạo: **Add file → Upload files** → kéo thả tệp **`tlkt-goi-ban-giao.zip`** (nguyên tệp zip, không cần giải nén) → **Commit changes**.
4. Vào **Settings → Pages** → mục *Build and deployment* → *Source*: chọn **GitHub Actions**.

### Bước 2 – Giao việc cho Claude Code trên web
1. Mở **claude.ai/code** (trên máy tính hoặc tab Code trong app Claude trên điện thoại).
2. Lần đầu: làm theo hướng dẫn **kết nối GitHub** (cho phép Claude truy cập kho `tlkt`).
3. Chọn kho **tlkt**. Ở ô chọn chế độ quyền, chọn chế độ **tự động chấp nhận chỉnh sửa** (để Claude không phải hỏi từng bước).
4. Dán nguyên câu lệnh sau rồi gửi:

```
Trong repo có tệp tlkt-goi-ban-giao.zip. Hãy giải nén toàn bộ nội dung vào thư mục gốc của repo (giữ nguyên các thư mục ẩn .claude và .github), xóa tệp zip, commit "Nạp gói bàn giao".
Sau đó đọc .claude/skills/trien-khai/SKILL.md và thực hiện đúng toàn bộ các bước trong đó: xây dựng app TLKT từ T01 đến T40 theo docs/TASKS.md, tự kiểm thử, không cần chờ tôi duyệt từng bước.
Nếu được phép thì push thẳng lên nhánh main sau mỗi phase để GitHub Pages tự triển khai; nếu không được push main thì tạo Pull Request và nhắn tôi merge.
Báo cáo cho tôi bằng tiếng Việt ngắn gọn sau mỗi phase.
```

5. Bạn có thể đóng trình duyệt; Claude vẫn chạy trên máy chủ. Quay lại claude.ai/code (hoặc app Claude trên điện thoại) để xem tiến độ, hoặc mở tệp `docs/PROGRESS.md` trên GitHub.

### Bước 3 – Khi Claude báo xong
1. Nếu Claude nhắn tạo/merge Pull Request: trên GitHub mở tab **Pull requests** → mở PR → **Merge pull request** → **Confirm merge**.
2. Chờ 2–3 phút, mở tab **Actions** thấy dấu ✓ xanh là app đã lên mạng.
3. Link app: **`https://<tên-tài-khoản-GitHub>.github.io/tlkt/`**
4. Trên điện thoại mở link → **Thêm vào màn hình chính** (iPhone: Safari → nút Chia sẻ → Thêm vào MH chính; Android: Chrome → ⋮ → Cài đặt ứng dụng/Thêm vào MH chính).

### Nếu phiên bị dừng giữa chừng
Mở lại phiên trên claude.ai/code (hoặc tạo phiên mới chọn kho `tlkt`) và gõ: **`/tiep-tuc`**

---

## SAU KHI DÙNG THỬ – SỬA LỖI, ĐIỀU CHỈNH
Mở phiên Claude Code trên kho `tlkt`, gõ `/sua-loi` kèm mô tả **cụ thể**, ví dụ:

```
/sua-loi Cuộc QĐ ngày 05/10/2026, công bố 12/10/2026, app báo hạn kết thúc tại DN là 01/11, đúng phải 02/11 vì 01/11 là Chủ nhật
```

Hoặc ghi nhiều góp ý vào mục “Góp ý của người dùng” trong `docs/PROGRESS.md` (sửa trực tiếp trên GitHub) rồi gõ `/tiep-tuc`.
Muốn kiểm tra tổng thể: gõ `/kiem-tra`.

---

## NỘI DUNG GÓI
| Tệp/thư mục | Dùng để |
|---|---|
| `CLAUDE.md` | Quy tắc làm việc Claude Code đọc mỗi phiên |
| `docs/SPEC.md` | Đặc tả nghiệp vụ đầy đủ (quy trình, mốc, sự kiện, nhập liệu TTR/iTNK/TMS, nhắc việc…) |
| `docs/ARCHITECTURE.md` | Kiến trúc kỹ thuật, thuật toán tính hạn, mô hình dữ liệu, lưu trữ, bảo mật |
| `docs/UI.md` | Thiết kế giao diện: màu, chữ, bố cục, khung từng màn hình |
| `docs/TASKS.md` | 40 nhiệm vụ có tiêu chí chấp nhận, Claude làm tuần tự |
| `docs/PROGRESS.md` | Tiến độ, giả định, điểm cần bạn xác nhận, góp ý của bạn |
| `rules/*.json` | Quy tắc thời hạn (QĐ 1161 và chuyển tiếp 970), danh mục nhập liệu hệ thống, ngày nghỉ, mẫu việc thường xuyên – **sửa được, không cần sửa code** |
| `tests/kich-ban-han.json` | Các ca kiểm thử thời hạn bắt buộc phải đúng |
| `samples/mau-ke-hoach.csv` | Mẫu nhập kế hoạch từ Excel |
| `.claude/skills/` | Lệnh tắt: `/trien-khai`, `/tiep-tuc`, `/kiem-tra`, `/sua-loi` |
| `.github/workflows/deploy.yml` | Tự kiểm thử và đưa app lên GitHub Pages mỗi khi có cập nhật |

## LƯU Ý
- **Dữ liệu** lưu trong trình duyệt của từng thiết bị (có thể đặt mật mã để mã hóa). Điện thoại và máy tính **không tự đồng bộ**; dùng **Sao lưu → Khôi phục** để chuyển. Nên sao lưu hằng tuần.
- **Báo thức khi app đóng** đi qua Lịch của điện thoại: trong app dùng “Xuất lịch (.ics)” hoặc nút “Thêm vào Google Lịch”.
- Nếu đơn vị yêu cầu không để mã nguồn công khai: để kho **Private** và triển khai bằng Cloudflare Pages/máy chủ nội bộ – nhắn Claude Code “chuyển cách triển khai sang …”.
- Trước khi dùng cho cuộc thật, xem mục **“Cần người dùng xác nhận”** trong `docs/PROGRESS.md` (nhất là cách tính 20 ngày và lịch nghỉ Tết).
