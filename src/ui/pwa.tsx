// PWA: đăng ký service worker, thanh “Có phiên bản mới”, báo “dùng được offline”, nút cài app.
import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';
import { toast } from './store';

export const coBanMoi = signal(false);
interface SuKienCaiApp extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export const suKienCai = signal<SuKienCaiApp | null>(null);
export const daCaiApp = signal(typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches);

let capNhatSW: ((taiLai?: boolean) => Promise<void>) | undefined;

export function khoiDongPwa(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    suKienCai.value = e as SuKienCaiApp;
  });
  window.addEventListener('appinstalled', () => {
    suKienCai.value = null;
    daCaiApp.value = true;
    toast('Đã cài app lên màn hình chính');
  });
  if (!('serviceWorker' in navigator)) return;
  capNhatSW = registerSW({
    onNeedRefresh: () => (coBanMoi.value = true),
    onOfflineReady: () => toast('Đã sẵn sàng dùng khi không có mạng'),
    onRegisteredSW: (_url, r) => {
      // kiểm tra bản mới mỗi giờ khi app mở lâu
      if (r) setInterval(() => void r.update().catch(() => undefined), 60 * 60 * 1000);
    },
  });
}

export async function capNhatPhienBan(): Promise<void> {
  await capNhatSW?.(true);
}

export async function caiApp(): Promise<void> {
  const e = suKienCai.value;
  if (!e) return;
  await e.prompt();
  await e.userChoice;
  suKienCai.value = null;
}

/** Thanh nhỏ đầu màn hình khi có bản mới. */
export function ThanhBanMoi() {
  if (!coBanMoi.value) return null;
  return (
    <div class="thanh-ban-moi" role="status">
      <span>Có phiên bản mới của app.</span>
      <button type="button" class="nut nut-nho nut-chinh" onClick={() => void capNhatPhienBan()}>
        Cập nhật ngay
      </button>
      <button type="button" class="nut nut-nho" onClick={() => (coBanMoi.value = false)}>
        Để sau
      </button>
    </div>
  );
}
