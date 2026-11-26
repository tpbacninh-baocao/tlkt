// Kiểm thử trong app (UI §4.15): chạy tests/kich-ban-han.json trong trình duyệt, bảng Đạt/Không đạt từng ca.
import { useMemo, useState } from 'preact/hooks';
import kichBan from '../../../tests/kich-ban-han.json';
import { chayKichBan, type KichBan } from '../../core/kiemThu';
import { dinhDangNgay } from '../../core/lich';
import { demMucDaSua } from '../../core/quyTac';
import { caiDat } from '../store';

const kb = kichBan as unknown as KichBan;

function chu(x: unknown): string {
  if (x === undefined || x === null) return '—';
  if (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)) return dinhDangNgay(x);
  if (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(x)) return `${dinhDangNgay(x.slice(0, 10))} ${x.slice(11)}`;
  return String(x);
}

export function ManKiemThu() {
  const [dungQuyTacDaChinh, setDung] = useState(false);
  const [chiLoi, setChiLoi] = useState(false);
  const va = caiDat.value.vaQuyTac as never;
  const soMucSua = Object.keys(caiDat.value.vaQuyTac).reduce((t, ma) => t + demMucDaSua(va, ma), 0);
  const kq = useMemo(() => chayKichBan(kb, dungQuyTacDaChinh ? va : {}), [dungQuyTacDaChinh, va]);
  const dat = kq.filter((x) => x.dat).length;
  const nhom = [...new Set(kq.map((x) => x.nhom))];
  return (
    <div>
      <section class="the" aria-live="polite">
        <h3>Kiểm thử thời hạn</h3>
        <p class="phu">Tính lại {kq.length} ca mẫu của quy trình ngay trên máy này và so với kết quả đã được kiểm chứng.</p>
        <p style={{ fontSize: 20 }}>
          <b id="kq-tong">{dat === kq.length ? `✅ Đạt ${dat}/${kq.length} ca` : `⚠️ Đạt ${dat}/${kq.length} ca – ${kq.length - dat} ca không đạt`}</b>
        </p>
        <label class="o-tich" style={{ display: 'flex', gap: 8 }}>
          <input type="checkbox" checked={dungQuyTacDaChinh} onChange={(e) => setDung((e.target as HTMLInputElement).checked)} />
          <span>Dùng quy tắc đã chỉnh trong Cài đặt ({soMucSua} mục đã sửa)</span>
        </label>
        {dungQuyTacDaChinh && soMucSua > 0 && <p class="phu">Ca không đạt ở chế độ này nghĩa là bạn đã đổi quy tắc khác với bản gốc – đây là chênh lệch có chủ ý, không phải lỗi.</p>}
        <label class="o-tich" style={{ display: 'flex', gap: 8 }}>
          <input type="checkbox" checked={chiLoi} onChange={(e) => setChiLoi((e.target as HTMLInputElement).checked)} />
          <span>Chỉ hiện ca không đạt</span>
        </label>
      </section>
      {nhom.map((n) => {
        const ca = kq.filter((x) => x.nhom === n && (!chiLoi || !x.dat));
        if (!ca.length) return null;
        return (
          <section key={n} class="the">
            <h3>{n}</h3>
            <div class="cuon-ngang" tabIndex={0} role="region" aria-label="Bảng (cuộn ngang bằng phím mũi tên)">
              <table class="bang">
                <thead><tr><th>Ca</th><th>Mô tả</th><th>Kết quả app</th><th>Kỳ vọng</th><th>Đạt?</th></tr></thead>
                <tbody>
                  {ca.map((x) => (
                    <tr key={x.id} class={x.dat ? '' : 'da-sua'}>
                      <td><b>{x.id}</b></td>
                      <td>{x.moTa}</td>
                      <td>{x.loi ? `Lỗi: ${x.loi}` : chu(x.thucTe)}</td>
                      <td>{chu(x.kyVong)}</td>
                      <td>{x.dat ? '✅ Đạt' : '❌ Không đạt'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
