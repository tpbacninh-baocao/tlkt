// Tab “Nhập hệ thống”: 3 nhóm TTR / iTNK / TMS, thanh tiến độ “7/12 việc nhập liệu”.
import { tienDoChecklist } from '../../core/checklist';
import type { PhanTichCuoc } from '../../core/tomTat';
import { TEN_HE_THONG } from '../../core/checklist';
import { MAU_HE_THONG } from '../chuoi';
import { ThanhTienDo, TrangThaiRong } from '../thanhPhan';
import { HangNhapLieu } from './hangNhapLieu';

export function TabNhapHeThong({ pt }: { pt: PhanTichCuoc }) {
  const ds = pt.checklist.filter((v) => !v.hangNgay);
  const td = tienDoChecklist(ds);
  if (!ds.length) {
    return <TrangThaiRong tieuDe="Chưa có việc nhập liệu" moTa="Việc nhập TTR/iTNK/TMS sẽ tự xuất hiện khi bạn đánh dấu xong các mốc (ban hành QĐ, công bố, kết thúc…)." />;
  }
  return (
    <div>
      <section class="the">
        <ThanhTienDo xong={td.xong} tong={td.tong} nhan={`${td.xong}/${td.tong} việc nhập liệu`} />
        <p class="phu" style={{ margin: '8px 0 0' }}>
          Ứng dụng không kết nối với TTR/iTNK/TMS. Nhấn <b>Sao chép</b> để lấy thông tin rồi tự dán vào hệ thống, sau đó tích ô xác nhận. Hạn mặc định: 1 ngày làm việc sau khi phát sinh.
        </p>
      </section>
      {(['TTR', 'ITNK', 'TMS'] as const).map((ma) => {
        const nhom = ds.filter((v) => v.heThong === ma);
        if (!nhom.length) return null;
        return (
          <section key={ma} class="the" aria-label={TEN_HE_THONG[ma]}>
            <h3 style={{ color: MAU_HE_THONG[ma] }}>
              {ma === 'ITNK' ? 'iTNK' : ma} <span class="phu">· {TEN_HE_THONG[ma]}</span>
            </h3>
            <ul class="ds-nl">
              {nhom.map((v) => (
                <HangNhapLieu key={v.khoa} pt={pt} v={v} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
