// Màn “Nhập liệu còn thiếu” (UI §4.7): gom mọi việc chưa tích của mọi cuộc; lọc theo hệ thống và SLA; nhóm theo cuộc.
import { signal } from '@preact/signals';
import { cacMocChot } from '../../core/viec';
import { dinhDangNgay } from '../../core/lich';
import { nhanCuoc } from '../../core/nhacViec';
import { viecConThieu } from '../../core/checklist';
import type { TrangThaiMoc } from '../../core/kieu';
import { HangNhapLieu } from '../chiTiet/hangNhapLieu';
import { caiDat, cuocConHieuLuc, homNay, lich, phanTichMap } from '../store';
import { TrangThaiRong } from '../thanhPhan';

type HeThong = 'TAT_CA' | 'TTR' | 'ITNK' | 'TMS';
type Muc = 'TAT_CA' | 'QUA_HAN' | 'HOM_NAY' | 'SAP_DEN';
const heThong = signal<HeThong>('TAT_CA');
const muc = signal<Muc>('TAT_CA');

export function ManNhapLieu() {
  const an = caiDat.value.anDanh;
  const moc = cacMocChot(lich.value, homNay.value);
  const nhom = cuocConHieuLuc.value
    .map((c) => {
      const pt = phanTichMap.value.get(c.id);
      if (!pt) return undefined;
      const ds = viecConThieu(pt.checklist.filter((v) => !v.hangNgay))
        .filter((v) => heThong.value === 'TAT_CA' || v.heThong === heThong.value)
        .filter((v) => muc.value === 'TAT_CA' || (v.trangThai as TrangThaiMoc) === muc.value);
      return ds.length ? { c, pt, ds } : undefined;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const tong = nhom.reduce((t, n) => t + n.ds.length, 0);

  return (
    <div>
      <p class="the" style={{ padding: 12 }}>
        {moc.map((m) => `${m.ten}: ${m.conLaiNLV === 0 ? 'hôm nay' : `còn ${m.conLaiNLV} ngày LV`} (${dinhDangNgay(m.ngay)})`).join(' · ')}
        <span class="phu"> – rà soát đủ dữ liệu trên TTR trước các mốc này.</span>
      </p>
      <div class="thanh-loc">
        <div class="doi-che-do" role="group" aria-label="Hệ thống">
          {(['TAT_CA', 'TTR', 'ITNK', 'TMS'] as const).map((h) => (
            <button key={h} type="button" aria-pressed={heThong.value === h} onClick={() => (heThong.value = h)}>
              {h === 'TAT_CA' ? 'Tất cả' : h === 'ITNK' ? 'iTNK' : h}
            </button>
          ))}
        </div>
        <div class="doi-che-do" role="group" aria-label="Mức khẩn">
          {([['TAT_CA', 'Mọi hạn'], ['QUA_HAN', 'Quá hạn'], ['HOM_NAY', 'Hôm nay'], ['SAP_DEN', 'Sắp đến']] as const).map(([m, ten]) => (
            <button key={m} type="button" aria-pressed={muc.value === m} onClick={() => (muc.value = m)}>
              {ten}
            </button>
          ))}
        </div>
      </div>
      <p class="phu" aria-live="polite">{tong} việc chưa nhập</p>
      {nhom.length === 0 ? (
        <TrangThaiRong tieuDe="Tuyệt! Không còn việc nhập liệu nào." moTa={heThong.value !== 'TAT_CA' || muc.value !== 'TAT_CA' ? 'Thử bỏ bớt bộ lọc để xem toàn bộ.' : undefined} xanh />
      ) : (
        nhom.map(({ c, pt, ds }) => (
          <section key={c.id} class="the" aria-label={c.ma}>
            <h3>
              <a href={`#cuoc-${c.id}/nhap-he-thong`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {c.ma} · {nhanCuoc(c, an)}
              </a>
            </h3>
            <ul class="ds-nl">
              {ds.map((v) => (
                <HangNhapLieu key={v.khoa} pt={pt} v={v} hienHeThong />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
