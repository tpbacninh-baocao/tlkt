// Bộ phát nhắc trong app (ARCHITECTURE §8.2): vòng 30 giây → toast nổi + Notification + âm báo; không phát trùng.
import { gioHoan, nhacDenGio, TIEN_TO_BO, type KieuHoan, type NhacDenGio } from '../core/nhacViec';
import { congPhutNgayGio } from '../core/lich';
import { signal } from '@preact/signals';
import { bayGio, capNhatDongHo, caiDat, daPhat, diDen, kho, lich, nhacHoan, soNhacChuaXem, trangThaiApp } from './store';
import { duLieuNhacHienTai } from './xuat';

/** Nhắc đến giờ, chưa bị bỏ (hiện ở chuông 🔔). */
export const dsChuong = signal<NhacDenGio[]>([]);
/** Thẻ nhắc nổi trên màn hình (tối đa vài thẻ gần nhất). */
export const theNoi = signal<NhacDenGio[]>([]);

const TOI_DA_THE_NOI = 3;
let dangChay = false;

function hienNotification(tieuDe: string, noiDung: string, khoa: string, khan: boolean): void {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const tuyChon: NotificationOptions & { renotify?: boolean } = { body: noiDung, tag: khoa, icon: 'icons/icon-192.png', requireInteraction: khan };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.getRegistration) {
      void navigator.serviceWorker.getRegistration().then((r) => {
        if (r) void r.showNotification(tieuDe, tuyChon);
        else new Notification(tieuDe, tuyChon);
      });
    } else new Notification(tieuDe, tuyChon);
  } catch {
    /* trình duyệt không cho thông báo – bỏ qua, vẫn có toast trong app */
  }
}

let ngCanh: AudioContext | null = null;
export function phatAmBao(soLan: number): void {
  try {
    const AC = (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ngCanh ??= new AC();
    const ac = ngCanh;
    void ac.resume?.();
    for (let i = 0; i < soLan; i++) {
      const dao = ac.createOscillator();
      const am = ac.createGain();
      const t0 = ac.currentTime + i * 0.35;
      dao.frequency.value = 880;
      am.gain.setValueAtTime(0.0001, t0);
      am.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      am.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
      dao.connect(am).connect(ac.destination);
      dao.start(t0);
      dao.stop(t0 + 0.3);
    }
  } catch {
    /* không có âm thanh – bỏ qua */
  }
}

async function luuHoan(): Promise<void> {
  await kho.value?.ghiMeta('nhacHoan', nhacHoan.value);
}

/** Tính lại danh sách nhắc và phát những nhắc mới đến giờ. An toàn khi gọi chồng chéo. */
export async function chayBoPhat(): Promise<void> {
  if (dangChay || trangThaiApp.value !== 'SAN_SANG' || !kho.value) return;
  dangChay = true;
  try {
    capNhatDongHo();
    const ds = nhacDenGio(duLieuNhacHienTai(), bayGio.value, daPhat.value, nhacHoan.value);
    dsChuong.value = ds;
    const moi = ds.filter((n) => n.canThongBao);
    if (!moi.length) return;

    // Đánh dấu đã phát NGAY (đồng bộ) để lần chạy sau không phát lại
    const phat = new Set(daPhat.value);
    for (const n of moi) phat.add(n.khoa);
    daPhat.value = phat;
    const hoan = { ...nhacHoan.value };
    let doiHoan = false;
    for (const n of moi) if (n.khoa in hoan) { delete hoan[n.khoa]; doiHoan = true; }
    // dọn mục hoãn quá cũ
    const han = congPhutNgayGio(bayGio.value, -3 * 24 * 60);
    for (const [k, v] of Object.entries(hoan)) if (v < han) { delete hoan[k]; doiHoan = true; }
    if (doiHoan) nhacHoan.value = hoan;
    const k = kho.value;
    for (const n of moi) await k.danhDauDaPhat(n.khoa, bayGio.value);
    if (doiHoan) await luuHoan();

    soNhacChuaXem.value += moi.length;
    const noi = moi.slice(0, TOI_DA_THE_NOI);
    theNoi.value = [...noi, ...theNoi.value.filter((t) => !noi.some((n) => n.khoa === t.khoa))].slice(0, TOI_DA_THE_NOI);
    // Thẻ nổi tự ẩn sau một lúc (vẫn còn ở chuông); báo thức và quá hạn giữ đến khi người dùng xử lý
    for (const n of noi) {
      const giay = n.mucDo === 'THONG_TIN' || n.mucDo === 'CANH_BAO' ? 20 : n.mucDo === 'KHAN' ? 60 : 0;
      if (giay && typeof setTimeout !== 'undefined') setTimeout(() => anTheNoi(n.khoa), giay * 1000);
    }

    if (moi.length > TOI_DA_THE_NOI) {
      hienNotification(`${moi.length} nhắc việc mới`, 'Mở ứng dụng để xem danh sách ở chuông 🔔.', `tlkt-tong-hop`, false);
    } else {
      for (const n of moi) hienNotification(n.tieuDe, n.noiDung, n.khoa, n.mucDo === 'BAO_THUC' || n.mucDo === 'QUA_HAN');
    }
    if (caiDat.value.nhac.amThanh) phatAmBao(moi.some((n) => n.mucDo === 'BAO_THUC') ? 3 : 1);
  } finally {
    dangChay = false;
  }
}

export function anTheNoi(khoa: string): void {
  theNoi.value = theNoi.value.filter((t) => t.khoa !== khoa);
}

export async function hoanNhac(khoa: string, kieu: KieuHoan): Promise<void> {
  const c = caiDat.value.nhac;
  const luc = gioHoan(kieu, bayGio.value, lich.value, c.gioYenLangTu, c.gioYenLangDen);
  nhacHoan.value = { ...nhacHoan.value, [khoa]: luc };
  anTheNoi(khoa);
  dsChuong.value = dsChuong.value.filter((n) => n.khoa !== khoa);
  await luuHoan();
}

export async function daLamNhac(khoa: string): Promise<void> {
  const phat = new Set(daPhat.value);
  phat.add(TIEN_TO_BO + khoa);
  daPhat.value = phat;
  anTheNoi(khoa);
  dsChuong.value = dsChuong.value.filter((n) => n.khoa !== khoa);
  await kho.value?.danhDauDaPhat(TIEN_TO_BO + khoa, bayGio.value);
}

export function moNhac(n: NhacDenGio): void {
  anTheNoi(n.khoa);
  diDen(n.lienKet);
}

/** Xin quyền thông báo (gọi khi người dùng bấm nút – có giải thích trước đó). */
export async function xinQuyenThongBao(): Promise<NotificationPermission | 'khong-ho-tro'> {
  if (typeof Notification === 'undefined') return 'khong-ho-tro';
  return Notification.requestPermission();
}

/** Nhắc thử (Cài đặt → Nhắc việc): cho người dùng nghe âm báo và xem thẻ nhắc. */
export function thuNhac(): void {
  const luc = bayGio.value;
  const n: NhacDenGio = { khoa: `thu|${luc}`, luc, lucPhat: luc, mucDo: 'KHAN', tieuDe: 'Nhắc thử', noiDung: 'Đây là nhắc thử. Nhắc thật sẽ hiện như thế này.', lienKet: '#hom-nay', canThongBao: false, daHoan: false };
  theNoi.value = [n, ...theNoi.value.filter((t) => !t.khoa.startsWith('thu|'))].slice(0, TOI_DA_THE_NOI);
  hienNotification(n.tieuDe, n.noiDung, n.khoa, false);
  if (caiDat.value.nhac.amThanh) phatAmBao(1);
}
