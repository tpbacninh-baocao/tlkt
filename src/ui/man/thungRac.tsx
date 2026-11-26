// Thùng rác (UI §4.x): khôi phục hoặc xóa vĩnh viễn cuộc/việc/kế hoạch đã xóa (tự dọn sau 30 ngày).
import { useEffect, useState } from 'preact/hooks';
import { soNgayGiua } from '../../core/lich';
import { khoiPhucThungRac, xoaVinhVien } from '../hanhDong';
import { homNay, kho_, toast, xacNhan } from '../store';
import { TrangThaiRong } from '../thanhPhan';
import { chuNgay } from '../thanhPhan';

type Muc = Awaited<ReturnType<ReturnType<typeof kho_>['thungRac']>>[number];
const TEN_LOAI = { cuoc: 'Cuộc kiểm tra', viec: 'Việc', keHoach: 'Kế hoạch' } as const;
const SO_NGAY_GIU = 30;

function tenMuc(m: Muc): string {
  const d = m.doc as Record<string, unknown>;
  if (m.kho === 'cuoc') return `${d.ma ?? ''} – ${d.tenNNT ?? ''}`.replace(/^ – | – $/g, '');
  if (m.kho === 'viec') return String(d.tieuDe ?? '');
  return String(d.ten ?? '');
}

export function ManThungRac() {
  const [ds, setDs] = useState<Muc[] | null>(null);
  const tai = () => void kho_().thungRac().then(setDs);
  useEffect(tai, []);
  if (!ds) return <p class="phu">Đang tải…</p>;
  if (!ds.length) return <TrangThaiRong tieuDe="Thùng rác trống" moTa={`Mục đã xóa được giữ ${SO_NGAY_GIU} ngày ở đây trước khi xóa hẳn.`} />;
  return (
    <div>
      <p class="phu">Mục đã xóa được giữ {SO_NGAY_GIU} ngày rồi tự xóa hẳn.</p>
      <ul class="danh-sach-the" style={{ listStyle: 'none', padding: 0 }}>
        {ds.map((m) => {
          const con = Math.max(0, SO_NGAY_GIU - soNgayGiua(m.doc.xoaLuc.slice(0, 10), homNay.value));
          return (
            <li key={`${m.kho}-${m.doc.id}`} class="the">
              <div><span class="nhan">{TEN_LOAI[m.kho]}</span> <b>{tenMuc(m)}</b></div>
              <div class="phu">Đã xóa {chuNgay(m.doc.xoaLuc.slice(0, 10))} – còn {con} ngày trước khi xóa hẳn</div>
              <div class="hang-nut">
                <button type="button" class="nut" onClick={async () => { await khoiPhucThungRac(m.kho, m.doc.id); toast('Đã khôi phục'); tai(); }}>Khôi phục</button>
                <button type="button" class="nut nut-nguy-hiem" onClick={async () => {
                  if (!(await xacNhan({ tieuDe: 'Xóa vĩnh viễn?', moTa: `“${tenMuc(m)}” sẽ bị xóa hẳn, không khôi phục được.`, nutChinh: 'Xóa vĩnh viễn', nguyHiem: true }))) return;
                  await xoaVinhVien(m.kho, m.doc.id);
                  toast('Đã xóa vĩnh viễn');
                  tai();
                }}>Xóa vĩnh viễn</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
