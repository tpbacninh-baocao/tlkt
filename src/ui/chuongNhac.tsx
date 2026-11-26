// Chuông 🔔: danh sách nhắc đã đến giờ + thẻ nhắc nổi (Mở · Hoãn 15 phút/1 giờ/sáng mai · Đã làm).
import { useState } from 'preact/hooks';
import { TEN_KIEU_HOAN, type KieuHoan, type MucDoNhac, type NhacDenGio } from '../core/nhacViec';
import { dinhDangNgay } from '../core/lich';
import { anTheNoi, daLamNhac, dsChuong, hoanNhac, moNhac, theNoi, xinQuyenThongBao } from './boPhatNhac';
import { dongBang, homNay, moBang, soNhacChuaXem } from './store';
import { TrangThaiRong } from './thanhPhan';

const NHAN_MUC: Record<MucDoNhac, { bieuTuong: string; ten: string }> = {
  BAO_THUC: { bieuTuong: '🚨', ten: 'Báo thức' },
  KHAN: { bieuTuong: '🔴', ten: 'Khẩn' },
  QUA_HAN: { bieuTuong: '⛔', ten: 'Quá hạn' },
  CANH_BAO: { bieuTuong: '🟠', ten: 'Cảnh báo' },
  THONG_TIN: { bieuTuong: 'ℹ️', ten: 'Thông tin' },
};

function gioHienThi(luc: string): string {
  const ngay = luc.slice(0, 10);
  return ngay === homNay.value ? luc.slice(11) : `${dinhDangNgay(ngay).slice(0, 5)} ${luc.slice(11)}`;
}

function NutHoan({ khoa }: { khoa: string }) {
  const [mo, setMo] = useState(false);
  if (!mo)
    return (
      <button type="button" class="nut nut-nho" aria-expanded="false" onClick={() => setMo(true)}>
        Hoãn…
      </button>
    );
  return (
    <span class="hang-nut" role="group" aria-label="Hoãn nhắc">
      {(['15P', '1G', 'SANG_MAI'] as KieuHoan[]).map((k) => (
        <button key={k} type="button" class="nut nut-nho" onClick={() => void hoanNhac(khoa, k)}>
          {TEN_KIEU_HOAN[k]}
        </button>
      ))}
    </span>
  );
}

export function TheNhac({ n, trongBang }: { n: NhacDenGio; trongBang?: boolean }) {
  const m = NHAN_MUC[n.mucDo];
  return (
    <div class={`the-nhac muc-${n.mucDo.toLowerCase()}`} role="group" aria-label={`${m.ten}: ${n.tieuDe}`}>
      <div class="the-nhac-dau">
        <span aria-hidden="true">{m.bieuTuong}</span> <b>{n.tieuDe}</b>
      </div>
      <div class="phu">
        {m.ten} · {gioHienThi(n.lucPhat)}{n.daHoan ? ' (đã hoãn)' : ''} — {n.noiDung}
      </div>
      <div class="hang-nut">
        <button type="button" class="nut nut-nho nut-chinh" onClick={() => { if (trongBang) dongBang('chuong-nhac'); moNhac(n); }}>
          Mở
        </button>
        <NutHoan khoa={n.khoa} />
        <button type="button" class="nut nut-nho" onClick={() => void daLamNhac(n.khoa)}>
          Đã làm
        </button>
        {!trongBang && (
          <button type="button" class="nut nut-nho" aria-label="Ẩn thẻ này" onClick={() => anTheNoi(n.khoa)}>
            Ẩn
          </button>
        )}
      </div>
    </div>
  );
}

/** Các thẻ nhắc nổi ở góc màn hình khi có nhắc mới. */
export function VungNhacNoi() {
  const ds = theNoi.value;
  if (!ds.length) return null;
  return (
    <div class="vung-nhac-noi" aria-live="assertive">
      {ds.map((n) => (
        <TheNhac key={n.khoa} n={n} />
      ))}
    </div>
  );
}

function NoiDungChuong() {
  const ds = dsChuong.value;
  const [quyen, setQuyen] = useState<string>(typeof Notification === 'undefined' ? 'khong-ho-tro' : Notification.permission);
  return (
    <div>
      {quyen === 'default' && (
        <div class="the" style={{ marginBottom: 12 }}>
          <b>Bật thông báo trên màn hình?</b>
          <p class="phu">Khi cho phép, trình duyệt sẽ hiện thông báo lúc đến hạn dù bạn đang xem trang khác. App chỉ nhắc được khi đang mở; muốn có báo thức lúc đóng app, hãy xuất lịch .ics.</p>
          <button type="button" class="nut nut-chinh nut-nho" onClick={async () => setQuyen(await xinQuyenThongBao())}>
            Cho phép thông báo
          </button>
        </div>
      )}
      {ds.length === 0 ? (
        <TrangThaiRong tieuDe="Chưa có nhắc nào" moTa="Các nhắc đến giờ sẽ hiện ở đây (36 giờ gần nhất)." />
      ) : (
        <div class="danh-sach-nhac">
          {ds.map((n) => (
            <TheNhac key={n.khoa} n={n} trongBang />
          ))}
        </div>
      )}
    </div>
  );
}

export function moChuongNhac(): void {
  soNhacChuaXem.value = 0;
  moBang({ id: 'chuong-nhac', tieuDe: 'Nhắc việc', noiDung: () => <NoiDungChuong /> });
}
