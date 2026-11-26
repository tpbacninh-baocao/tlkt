import { caiApp, daCaiApp, suKienCai } from '../pwa';
// Hướng dẫn cài app lên màn hình chính và thêm lịch vào điện thoại (dùng ở Căn cứ & hướng dẫn).
export function HuongDanCaiDatApp() {
  return (
    <section class="the" aria-label="Cài lên màn hình chính">
      <h3>Cài app lên màn hình chính</h3>
      {daCaiApp.value && <p><b>✓ App đang chạy như ứng dụng đã cài.</b></p>}
      {suKienCai.value && (
        <p>
          <button type="button" class="nut nut-chinh" onClick={() => void caiApp()}>Cài app ngay</button>
          <span class="phu"> (trình duyệt này hỗ trợ cài trực tiếp)</span>
        </p>
      )}
      <p class="phu">Sau khi cài, app mở như ứng dụng thường và dùng được cả khi không có mạng. Dữ liệu vẫn chỉ nằm trên thiết bị này.</p>
      <details open>
        <summary class="dam">iPhone (Safari)</summary>
        <ol>
          <li>Mở địa chỉ app bằng <b>Safari</b> (không dùng Chrome trên iPhone).</li>
          <li>Bấm nút <b>Chia sẻ</b> (hình ô vuông có mũi tên) → <b>Thêm vào Màn hình chính</b> → <b>Thêm</b>.</li>
          <li>Mở app từ biểu tượng mới trên màn hình chính. Lần đầu mở cần có mạng; sau đó dùng được cả khi không có mạng.</li>
        </ol>
      </details>
      <details>
        <summary class="dam">Android (Chrome)</summary>
        <ol>
          <li>Mở địa chỉ app bằng <b>Chrome</b>.</li>
          <li>Bấm <b>⋮</b> → <b>Cài đặt ứng dụng</b> (hoặc <b>Thêm vào màn hình chính</b>) → <b>Cài đặt</b>.</li>
        </ol>
      </details>
    </section>
  );
}

/** Hướng dẫn đưa hạn vào Lịch điện thoại để có báo thức khi đã đóng app (iPhone/Android). */
export function HuongDanLich() {
  return (
    <section class="the" aria-label="Hướng dẫn thêm vào lịch điện thoại">
      <h3>Thêm hạn vào lịch điện thoại</h3>
      <p class="phu">Trình duyệt không tự báo thức khi app đã đóng. Cách chắc chắn nhất là đưa hạn vào Lịch của điện thoại – Lịch sẽ báo trước 2 ngày, 1 ngày và đúng ngày hạn.</p>
      <details open>
        <summary class="dam">iPhone</summary>
        <ol>
          <li>Bấm <b>Tải lịch .ics</b> ở trên (bằng Safari).</li>
          <li>Mở tệp vừa tải (ở mục Tải xuống) → bấm <b>Thêm tất cả</b> → chọn lịch muốn thêm.</li>
          <li>Nên tạo lịch riêng tên “TLKT” để dễ xóa/nhập lại.</li>
        </ol>
      </details>
      <details>
        <summary class="dam">Android</summary>
        <ol>
          <li>Cách nhanh: ở từng việc hoặc mốc bấm <b>Thêm Google Lịch</b> – Google Lịch mở sẵn sự kiện, bạn chỉ cần bấm <b>Lưu</b>.</li>
          <li>Cách hàng loạt: tải tệp .ics, mở <b>calendar.google.com</b> trên trình duyệt → bánh răng → <b>Cài đặt</b> → <b>Nhập & xuất</b> → <b>Nhập</b>.</li>
        </ol>
      </details>
      <details>
        <summary class="dam">Lưu ý</summary>
        <ul>
          <li>Nhập lại tệp mới không làm nhân đôi sự kiện cũ (mỗi hạn có mã riêng cố định).</li>
          <li>Lịch không tự đổi khi hạn thay đổi – xuất lại sau khi cập nhật mốc quan trọng.</li>
          <li>Bật “Ẩn danh” (Cài đặt → Bảo mật) nếu không muốn MST/tên NNT xuất hiện trong lịch.</li>
        </ul>
      </details>
    </section>
  );
}
