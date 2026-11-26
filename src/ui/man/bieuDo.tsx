// Biểu đồ SVG tự vẽ (không dùng thư viện): đường tích lũy theo tháng và cột số cuộc theo giai đoạn.
import type { GiaiDoan } from '../../core/kieu';
import type { ThangTichLuy } from '../../core/keHoach';
import { TEN_GIAI_DOAN, THU_TU_GIAI_DOAN } from '../../core/vuViec';
import { MAU_GIAI_DOAN } from '../chuoi';

export function BieuDoTichLuy({ du, nam }: { du: ThangTichLuy[]; nam: number }) {
  const W = 640;
  const H = 280;
  const L = 44;
  const R = 16;
  const T = 24;
  const B = 36;
  const max = Math.max(1, ...du.map((d) => Math.max(d.lyTuong, d.thucTe ?? 0, d.banHanhQD ?? 0)));
  const maxTron = Math.max(1, Math.ceil(max));
  const x = (t: number) => L + ((t - 1) / 11) * (W - L - R);
  const y = (v: number) => T + (1 - v / maxTron) * (H - T - B);
  const duongThat = du.filter((d) => d.thucTe !== undefined).map((d) => `${x(d.thang)},${y(d.thucTe!)}`).join(' ');
  const duongQD = du.filter((d) => d.banHanhQD !== undefined).map((d) => `${x(d.thang)},${y(d.banHanhQD!)}`).join(' ');
  const duongLyTuong = du.map((d) => `${x(d.thang)},${y(d.lyTuong)}`).join(' ');
  const moc = Array.from({ length: Math.min(maxTron, 5) + 1 }, (_, i) => Math.round((maxTron * i) / Math.min(maxTron, 5)));
  const cuoi = [...du].reverse().find((d) => d.thucTe !== undefined);
  return (
    <figure class="bieu-do" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="bd-tl-t bd-tl-d" style={{ width: '100%', height: 'auto' }}>
        <title id="bd-tl-t">Số cuộc có QĐ xử lý/Kết luận tích lũy theo tháng, năm {nam}</title>
        <desc id="bd-tl-d">
          Đường liền xanh là thực tế, đường đứt là đường lý tưởng tuyến tính đến 31/12.
          {cuoi ? ` Đến hết tháng ${cuoi.thang}: ${cuoi.thucTe} cuộc, đường lý tưởng ${cuoi.lyTuong}.` : ''}
        </desc>
        {moc.map((m) => (
          <g key={m}>
            <line x1={L} x2={W - R} y1={y(m)} y2={y(m)} stroke="var(--vien)" />
            <text x={L - 6} y={y(m) + 4} fontSize="11" text-anchor="end" fill="var(--chu-phu)">{m}</text>
          </g>
        ))}
        {du.map((d) => (
          <text key={d.thang} x={x(d.thang)} y={H - 14} fontSize="11" text-anchor="middle" fill="var(--chu-phu)">T{d.thang}</text>
        ))}
        <polyline points={duongLyTuong} fill="none" stroke="var(--chu-phu)" stroke-width="2" stroke-dasharray="6 5" />
        {duongQD && <polyline points={duongQD} fill="none" stroke="var(--gd-cho-cong-bo)" stroke-width="2" opacity="0.8" />}
        {duongThat && <polyline points={duongThat} fill="none" stroke="var(--chinh)" stroke-width="3" stroke-linejoin="round" />}
        {du.filter((d) => d.thucTe !== undefined).map((d) => (
          <circle key={d.thang} cx={x(d.thang)} cy={y(d.thucTe!)} r="4" fill="var(--chinh)">
            <title>{`Tháng ${d.thang}: ${d.thucTe} cuộc có QĐ xử lý/KL (lý tưởng ${d.lyTuong})`}</title>
          </circle>
        ))}
      </svg>
      <figcaption class="phu" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span><span style={{ color: 'var(--chinh)' }}>━</span> Có QĐ xử lý/KL (thực tế)</span>
        <span><span style={{ color: 'var(--gd-cho-cong-bo)' }}>━</span> Đã ban hành QĐ kiểm tra</span>
        <span>┅ Đường lý tưởng tới 31/12</span>
      </figcaption>
      <details>
        <summary class="phu">Xem dạng bảng</summary>
        <table class="bang">
          <thead>
            <tr><th>Tháng</th><th class="so">Đã ban hành QĐ</th><th class="so">Có QĐ xử lý/KL</th><th class="so">Lý tưởng</th></tr>
          </thead>
          <tbody>
            {du.map((d) => (
              <tr key={d.thang}>
                <td>{d.thang}</td>
                <td class="so">{d.banHanhQD ?? '—'}</td>
                <td class="so">{d.thucTe ?? '—'}</td>
                <td class="so">{d.lyTuong}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function BieuDoGiaiDoan({ du }: { du: Record<GiaiDoan, number> }) {
  const ds = THU_TU_GIAI_DOAN.map((g) => ({ g, n: du[g] }));
  const max = Math.max(1, ...ds.map((d) => d.n));
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox="0 0 640 300" role="img" aria-label="Số cuộc theo giai đoạn" style={{ width: '100%', height: 'auto' }}>
        {ds.map((d, i) => {
          const y = 8 + i * 32;
          const w = (d.n / max) * 380;
          return (
            <g key={d.g}>
              <text x="150" y={y + 18} fontSize="13" text-anchor="end" fill="var(--chu)">{TEN_GIAI_DOAN[d.g]}</text>
              <rect x="160" y={y + 2} width={Math.max(d.n ? 4 : 0, w)} height="22" rx="4" fill={MAU_GIAI_DOAN[d.g]}>
                <title>{`${TEN_GIAI_DOAN[d.g]}: ${d.n} cuộc`}</title>
              </rect>
              <text x={165 + w} y={y + 18} fontSize="13" fill="var(--chu)" font-weight="700">{d.n}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
