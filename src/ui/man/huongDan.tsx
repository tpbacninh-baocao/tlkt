// Hướng dẫn cài app lên màn hình chính và thêm lịch vào điện thoại (dùng ở Căn cứ & hướng dẫn).
export function HuongDanCaiDatApp() {
  return (
    <section class="the" aria-label="Cài lên màn hình chính">
      <h3>Cài app lên màn hình chính</h3>
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
      <details>
        <summary class="dam">Thêm hạn vào lịch điện thoại để có báo thức</summary>
        <ol>
          <li>Trong app, vào <b>Lịch</b> → <b>Xuất lịch (.ics)</b>, chọn một cuộc / tất cả / 30 ngày tới.</li>
          <li><b>iPhone:</b> mở tệp .ics vừa tải → <b>Thêm tất cả</b> vào lịch. <b>Android:</b> mở tệp bằng Google Lịch → <b>Nhập</b>.</li>
          <li>Hoặc ở từng việc/mốc bấm <b>Thêm vào Google Lịch</b> để thêm riêng lẻ.</li>
        </ol>
        <p class="phu">Lịch đã thêm không tự cập nhật khi hạn thay đổi – xuất lại khi cần. App chỉ nhắc được khi đang mở; báo thức lúc đóng app nhờ lịch điện thoại.</p>
      </details>
    </section>
  );
}
