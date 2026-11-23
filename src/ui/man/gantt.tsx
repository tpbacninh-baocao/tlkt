// Dòng thời gian (Gantt) SVG: mỗi cuộc một hàng – Chuẩn bị · Chờ công bố · Tại DN · Sau kiểm tra; ◆ hạn pháp lý; vạch đỏ “Hôm nay”.
import { useEffect, useRef } from 'preact/hooks';
import { dinhDangNgay } from '../../core/lich';
import { congNgayThuan, soNgayGiua, tachNgay } from '../../core/lich';
import { khoangGantt, tinhGantt, type DongCuoc } from '../../core/tomTat';
import { nhanCuoc } from '../../core/nhacViec';
import { MAU_GIAI_DOAN } from '../chuoi';
import { caiDat, diDen, homNay } from '../store';

const PX_NGAY = 6;
const CAO_HANG = 44;
const CAO_DAU = 30;
const DEM = 12; // ngày đệm hai đầu

function cacThang(tu: string, den: string): { ngay: string; nhan: string }[] {
  const kq: { ngay: string; nhan: string }[] = [];
  let { nam, thang } = tachNgay(tu);
  for (let i = 0; i < 60; i++) {
    const d = `${nam}-${String(thang).padStart(2, '0')}-01`;
    if (d > den) break;
    kq.push({ ngay: d, nhan: `T${thang}/${nam}` });
    thang++;
    if (thang > 12) {
      thang = 1;
      nam++;
    }
  }
  return kq;
}

export function Gantt({ rows }: { rows: DongCuoc[] }) {
  const an = caiDat.value.anDanh;
  const cuon = useRef<HTMLDivElement>(null);
  const gs = rows.map((r) => ({ r, g: tinhGantt(r.pt) }));
  const k = khoangGantt(gs.map((x) => x.g), homNay.value);
  const goc = congNgayThuan(k.tu, -DEM);
  const tong = k.soNgay + DEM * 2;
  const rong = tong * PX_NGAY;
  const x = (ngay: string) => soNgayGiua(goc, ngay) * PX_NGAY;
  const thang = cacThang(goc, congNgayThuan(goc, tong));
  const cao = CAO_DAU + gs.length * CAO_HANG;
  const xHomNay = x(homNay.value);
  // mở ra ở vùng quanh “Hôm nay” (các cuộc đang làm), người dùng cuộn ngang để xem quá khứ/tương lai
  useEffect(() => {
    const el = cuon.current;
    if (el) el.scrollLeft = Math.max(0, xHomNay - el.clientWidth * 0.35);
  }, [rows.length, xHomNay]);

  return (
    <div class="gantt" role="group" aria-label="Dòng thời gian các cuộc kiểm tra">
      <div class="gantt-nhan">
        <div style={{ height: CAO_DAU }} />
        {gs.map(({ r }) => (
          <a key={r.cuoc.id} href={`#cuoc-${r.cuoc.id}`} style={{ height: CAO_HANG }} title={nhanCuoc(r.cuoc, an)}>
            <span class="dam">{r.cuoc.ma}</span>
            <span class="phu">{nhanCuoc(r.cuoc, an)}</span>
          </a>
        ))}
      </div>
      <div class="gantt-cuon" ref={cuon} tabIndex={0} aria-label="Cuộn ngang để xem thêm">
        <svg width={rong} height={cao} viewBox={`0 0 ${rong} ${cao}`} role="img" aria-label={`Biểu đồ dòng thời gian ${gs.length} cuộc, ${dinhDangNgay(k.tu)} đến ${dinhDangNgay(k.den)}`}>
          <defs>
            <pattern id="gach-cheo" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chu)" stroke-width="2" />
            </pattern>
          </defs>
          {thang.map((t) => (
            <g key={t.ngay}>
              <line x1={x(t.ngay)} x2={x(t.ngay)} y1={0} y2={cao} stroke="var(--vien)" />
              <text x={x(t.ngay) + 4} y={18} fontSize="12" fill="var(--chu-phu)">
                {t.nhan}
              </text>
            </g>
          ))}
          {gs.map(({ r, g }, i) => {
            const y = CAO_DAU + i * CAO_HANG;
            return (
              <g key={r.cuoc.id} class="hang-gantt" tabIndex={0} role="link" aria-label={`${r.cuoc.ma}, ${nhanCuoc(r.cuoc, an)}`} onClick={() => diDen(`#cuoc-${r.cuoc.id}`)} onKeyDown={(e) => e.key === 'Enter' && diDen(`#cuoc-${r.cuoc.id}`)} style={{ cursor: 'pointer' }}>
                <rect x={0} y={y} width={rong} height={CAO_HANG} fill="transparent" />
                <line x1={0} x2={rong} y1={y + CAO_HANG} y2={y + CAO_HANG} stroke="var(--vien)" opacity="0.5" />
                {g.doan.length === 0 && (
                  <text x={8} y={y + 26} fontSize="12" fill="var(--chu-phu)">
                    Chưa có mốc để vẽ
                  </text>
                )}
                {g.doan.map((d) => {
                  const dam = d.giaiDoan === 'DANG_KIEM_TRA';
                  const h = dam ? 18 : 12;
                  return (
                    <rect
                      key={d.giaiDoan}
                      x={x(d.tu)}
                      y={y + (CAO_HANG - h) / 2}
                      width={Math.max(3, x(d.den) - x(d.tu))}
                      height={h}
                      rx={4}
                      fill={MAU_GIAI_DOAN[d.giaiDoan]}
                      opacity={d.duKien ? 0.45 : 1}
                      stroke={d.duKien ? MAU_GIAI_DOAN[d.giaiDoan] : 'none'}
                      stroke-dasharray={d.duKien ? '4 3' : undefined}
                    >
                      <title>{`${d.nhan}: ${dinhDangNgay(d.tu)} → ${dinhDangNgay(d.den)}${d.duKien ? ' (dự kiến)' : ''}`}</title>
                    </rect>
                  );
                })}
                {g.tamDung.map((t, j) => (
                  <rect key={j} x={x(t.tu)} y={y + (CAO_HANG - 18) / 2} width={Math.max(3, x(t.den) - x(t.tu) + PX_NGAY)} height={18} fill="url(#gach-cheo)" opacity="0.55">
                    <title>{`Tạm dừng ${dinhDangNgay(t.tu)} – ${dinhDangNgay(t.den)}`}</title>
                  </rect>
                ))}
                {g.hanPhapLy.map((h) => (
                  <rect key={h.ma} x={x(h.ngay) - 4} y={y + CAO_HANG / 2 - 4} width={8} height={8} transform={`rotate(45 ${x(h.ngay)} ${y + CAO_HANG / 2})`} fill="var(--chu)" opacity={h.duKien ? 0.4 : 0.9}>
                    <title>{`${h.ten} – hạn ${dinhDangNgay(h.ngay)}${h.duKien ? ' (dự kiến)' : ''}`}</title>
                  </rect>
                ))}
              </g>
            );
          })}
          <line x1={xHomNay} x2={xHomNay} y1={0} y2={cao} stroke="var(--sla-do)" stroke-width="2" />
          <text x={xHomNay + 4} y={cao - 6} fontSize="11" fill="var(--sla-do-chu)" font-weight="700">
            Hôm nay
          </text>
        </svg>
      </div>
    </div>
  );
}
