// Cột phải của Chi tiết cuộc (máy tính): các mốc chính theo thứ tự thời gian.
import { mucSLA } from '../../core/vuViec';
import { KIEU_SLA } from '../chuoi';
import { phanTichMap } from '../store';
import { TrangThaiRong, chuNgayNgan } from '../thanhPhan';

const MOC_CHINH: { ma: string; ten: string }[] = [
  { ma: 'P5', ten: 'Ban hành QĐ kiểm tra' },
  { ma: 'Q5', ten: 'Công bố QĐ' },
  { ma: 'T1', ten: 'Hạn kết thúc tại trụ sở' },
  { ma: 'T7', ten: 'Công khai dự thảo biên bản' },
  { ma: 'B1', ten: 'Ký biên bản' },
  { ma: 'B4', ten: 'Báo cáo kết quả' },
  { ma: 'X', ten: 'QĐ xử phạt / Kết luận' },
  { ma: 'S1', ten: 'Giao QĐ cho NNT' },
  { ma: 'S6', ten: 'Bàn giao lưu trữ' },
];

export function CotPhaiChiTiet({ id }: { id: string }) {
  const pt = phanTichMap.value.get(id);
  if (!pt) return <TrangThaiRong tieuDe="Dòng thời gian mốc" moTa="Chưa có dữ liệu." />;
  return (
    <div>
      <h2>Dòng thời gian mốc</h2>
      <ol class="moc-doc">
        {MOC_CHINH.map(({ ma, ten }) => {
          const m = pt.kq.danhSach.find((x) => x.ma === ma);
          if (!m) return null;
          const xong = !!pt.cuoc.buoc[ma === 'T1' ? 'T7' : ma]?.xong;
          const muc = mucSLA(m);
          const ngay = ma === 'T1' ? m.hanPhapLy : xong ? (pt.cuoc.buoc[ma]?.ngay ?? m.hanPhapLy) : m.noiBo ? m.hanMucTieu : m.hanPhapLy;
          return (
            <li key={ma} class={m.duKien && !xong ? 'mo-dan' : ''}>
              <a href={`#cuoc-${id}`} onClick={() => document.getElementById(`buoc-${ma}`)?.scrollIntoView({ block: 'center' })}>
                <span class={KIEU_SLA[muc].lop} aria-hidden="true">{KIEU_SLA[muc].bieuTuong}</span> {ten}
                <span class="phu"> · {chuNgayNgan(ngay)}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
