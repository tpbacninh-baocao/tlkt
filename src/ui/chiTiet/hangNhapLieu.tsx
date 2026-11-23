// Một dòng việc nhập liệu hệ thống: ô tích, tên chức năng, hạn + SLA, nút Sao chép (dùng ở tab Nhập hệ thống và màn Nhập liệu).
import { saoChepViec, type ViecChecklist } from '../../core/checklist';
import type { PhanTichCuoc } from '../../core/tomTat';
import { KIEU_SLA } from '../chuoi';
import { boTickViec, tickViec } from '../hanhDongCuoc';
import { lich } from '../store';
import { NhanHeThong, NutSaoChep, chuNgay, conLaiNLVChu } from '../thanhPhan';
import { nhanTheoTrangThai } from '../chuoi';

export function HangNhapLieu({ pt, v, hienHeThong = false }: { pt: PhanTichCuoc; v: ViecChecklist; hienHeThong?: boolean }) {
  const muc = v.xong ? (v.trangThai === 'XONG_TRE' ? 'XONG_TRE' : 'XONG_DUNG_HAN') : nhanTheoTrangThai(v.trangThai);
  const k = KIEU_SLA[muc];
  return (
    <li class={`hang-nl ${v.xong ? 'da-xong' : ''}`}>
      <input
        type="checkbox"
        id={`nl-${pt.cuoc.id}-${v.khoa}`}
        checked={v.xong}
        disabled={!v.xong && !!v.chanTick}
        title={v.chanTick}
        aria-label={`${v.chucNang}`}
        onChange={(e) => ((e.target as HTMLInputElement).checked ? void tickViec(pt.cuoc.id, v) : void boTickViec(pt.cuoc.id, v))}
      />
      <label for={`nl-${pt.cuoc.id}-${v.khoa}`} class="noi-dung-nl">
        <span class="dam">
          {hienHeThong && <NhanHeThong ma={v.heThong} />} {v.chucNang}
        </span>
        <span class="phu-dong">
          {v.xong ? (
            <span>Đã tích {chuNgay(v.ngayTick)}</span>
          ) : (
            <span>
              Hạn {chuNgay(v.han)} {v.nlvConLai !== undefined ? `· ${conLaiNLVChu(v.nlvConLai)}` : ''}
            </span>
          )}
          <span class={`sla ${k.lop}`}>
            <span aria-hidden="true">{k.bieuTuong}</span> {v.xong ? (v.trangThai === 'XONG_TRE' ? 'Trễ' : 'Đúng hạn') : k.nhan}
          </span>
          {v.chanTick && !v.xong && <span class="phu">{v.chanTick}</span>}
        </span>
      </label>
      {!v.hangNgay && <NutSaoChep lay={() => saoChepViec(v, pt.cuoc, pt.kq, lich.value)} />}
    </li>
  );
}
