// Giới thiệu: phiên bản, ngày build, cam kết dữ liệu, lối vào Kiểm thử.
import { TEN_APP } from '../chuoi';
import { DANH_SACH_BO_GOC } from '../../core/quyTac';
import { dinhDangNgay } from '../../core/lich';

export function ManGioiThieu() {
  return (
    <div>
      <section class="the">
        <h2 style={{ marginTop: 0 }}>{TEN_APP}</h2>
        <p>Công cụ cá nhân giúp công chức kiểm tra thuế theo dõi thời hạn từng cuộc kiểm tra, nhắc việc đúng lúc và nhắc nhập liệu TTR/iTNK/TMS.</p>
        <dl class="luoi-thong-tin">
          <dt>Phiên bản</dt><dd>{__PHIEN_BAN__}</dd>
          <dt>Ngày build</dt><dd>{dinhDangNgay(__NGAY_BUILD__)}</dd>
          <dt>Bộ quy tắc</dt><dd>{DANH_SACH_BO_GOC.map((b) => b.ma).join(', ')}</dd>
        </dl>
      </section>
      <section class="the">
        <h3>Về dữ liệu của bạn</h3>
        <ul>
          <li>Dữ liệu chỉ lưu trong trình duyệt của thiết bị này; app không gửi gì ra mạng, không có thống kê hay theo dõi.</li>
          <li>App không lưu nội dung văn bản của người nộp thuế – chỉ lưu mốc ngày, số tiền và ghi chú bạn nhập.</li>
          <li>Hãy đặt mật mã (Cài đặt → Bảo mật) nếu dùng máy chung và sao lưu mỗi tuần.</li>
        </ul>
      </section>
      <section class="the">
        <h3>Công cụ</h3>
        <div class="hang-nut">
          <a class="nut" href="#kiem-thu">Chạy kiểm thử thời hạn</a>
          <a class="nut" href="#can-cu">Căn cứ & hướng dẫn</a>
          <a class="nut" href="#thung-rac">Thùng rác</a>
        </div>
        <p class="phu">“Chạy kiểm thử thời hạn” tính lại các ca mẫu của quy trình ngay trên máy bạn, để đối chiếu khi đơn vị đổi tham số.</p>
      </section>
    </div>
  );
}
