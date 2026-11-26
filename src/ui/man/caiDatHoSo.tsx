// Cài đặt → Hồ sơ cán bộ, giờ làm việc, ngày nghỉ, việc thường xuyên.
import { MAU_VIEC } from '../../core/viec';
import { dinhDangNgay } from '../../core/lich';
import { dongBoViecMauUI, suaCaiDat } from '../hanhDong';
import { caiDat, homNay, moBang, toast } from '../store';
import { Truong } from '../thanhPhan';
import { FormNgayNghiNam } from '../ngayNghiForm';

export function CaiDatHoSo() {
  const cd = caiDat.value;
  const nam = Number(homNay.value.slice(0, 4));
  const sua = (f: (c: typeof cd) => typeof cd) => void suaCaiDat(f);
  const doiKhung = (i: number, j: 0 | 1, v: string) =>
    sua((c) => {
      const g = c.gioLamViec.map((k) => [...k] as [string, string]);
      g[i][j] = v;
      return { ...c, gioLamViec: g };
    });
  const moNghi = (n: number) =>
    moBang({ id: `nghi-${n}`, tieuDe: `Ngày nghỉ & làm bù năm ${n}`, noiDung: () => <FormNgayNghiNam nam={n} idBang={`nghi-${n}`} /> });
  return (
    <div>
      <section class="the">
        <h3>Hồ sơ cán bộ</h3>
        <Truong nhan="Họ và tên" id="hs-ten"><input id="hs-ten" type="text" value={cd.canBo.hoTen} onChange={(e) => sua((c) => ({ ...c, canBo: { ...c.canBo, hoTen: (e.target as HTMLInputElement).value.trim() } }))} /></Truong>
        <Truong nhan="Chức vụ" id="hs-cv"><input id="hs-cv" type="text" value={cd.canBo.chucVu ?? ''} onChange={(e) => sua((c) => ({ ...c, canBo: { ...c.canBo, chucVu: (e.target as HTMLInputElement).value.trim() } }))} /></Truong>
        <Truong nhan="Đơn vị" id="hs-dv"><input id="hs-dv" type="text" value={cd.canBo.donVi} onChange={(e) => sua((c) => ({ ...c, canBo: { ...c.canBo, donVi: (e.target as HTMLInputElement).value.trim() } }))} /></Truong>
        <Truong nhan="Email (để ghi vào lịch, không gửi đi đâu)" id="hs-mail"><input id="hs-mail" type="email" value={cd.canBo.email ?? ''} onChange={(e) => sua((c) => ({ ...c, canBo: { ...c.canBo, email: (e.target as HTMLInputElement).value.trim() } }))} /></Truong>
      </section>

      <section class="the">
        <h3>Giờ làm việc</h3>
        <p class="phu">Dùng để tính đồng hồ theo giờ (ví dụ giải trình trong 4 giờ làm việc) và đặt báo thức.</p>
        {cd.gioLamViec.map((k, i) => (
          <div class="hang-nut" key={i} style={{ marginBottom: 6 }}>
            <span>Khung {i + 1}:</span>
            <input type="time" aria-label={`Khung ${i + 1} từ`} value={k[0]} onChange={(e) => doiKhung(i, 0, (e.target as HTMLInputElement).value)} />
            <span>đến</span>
            <input type="time" aria-label={`Khung ${i + 1} đến`} value={k[1]} onChange={(e) => doiKhung(i, 1, (e.target as HTMLInputElement).value)} />
          </div>
        ))}
      </section>

      <section class="the">
        <h3>Ngày nghỉ & ngày làm bù</h3>
        <p class="phu">Nhập lịch nghỉ Tết, Giỗ Tổ, nghỉ bù… mỗi năm một lần thì mọi hạn tự tính lại.</p>
        {[nam, nam + 1].map((n) => {
          const nghi = cd.ngayNghiThem.filter((d) => d.startsWith(`${n}-`));
          const bu = cd.ngayLamBu.filter((d) => d.startsWith(`${n}-`));
          return (
            <div key={n} class="hang-nut" style={{ marginBottom: 6 }}>
              <button type="button" class="nut" onClick={() => moNghi(n)}>Năm {n}: nhập / sửa</button>
              <span class="phu">
                {nghi.length} ngày nghỉ, {bu.length} ngày làm bù{cd.namDaXacNhanNgayNghi.includes(n) ? ' – đã xác nhận' : ' – chưa xác nhận'}
                {nghi.length ? ` (${dinhDangNgay(nghi[0]).slice(0, 5)} …)` : ''}
              </span>
            </div>
          );
        })}
      </section>

      <section class="the">
        <h3>Việc thường xuyên</h3>
        <p class="phu">Bật loại việc nào thì app tự tạo việc lặp lại đúng chu kỳ.</p>
        {MAU_VIEC.map((m) => (
          <label key={m.ma} class="o-tich" style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={cd.mauViecDaBat.includes(m.ma)}
              onChange={async (e) => {
                const bat = (e.target as HTMLInputElement).checked;
                await suaCaiDat((c) => ({ ...c, mauViecDaBat: bat ? [...new Set([...c.mauViecDaBat, m.ma])] : c.mauViecDaBat.filter((x) => x !== m.ma) }));
                if (bat) {
                  const n = await dongBoViecMauUI();
                  if (n) toast(`Đã tạo ${n} việc từ mẫu`);
                }
              }}
            />
            <span>{m.tieuDe} <span class="phu">({m.lap})</span></span>
          </label>
        ))}
      </section>
    </div>
  );
}
