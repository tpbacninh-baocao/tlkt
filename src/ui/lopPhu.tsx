// Toast, hộp xác nhận tự xây, bảng trượt – gắn một lần ở gốc ứng dụng.
import { useEffect, useRef, useState } from 'preact/hooks';
import { bangMo, dongBang, dongToast, dsToast, hopXacNhan } from './store';

export function VungToast() {
  return (
    <div class="vung-toast" aria-live="polite" aria-atomic="false">
      {dsToast.value.map((t) => (
        <div key={t.id} class={`toast ${t.loai === 'loi' ? 'loi' : ''}`} role={t.loai === 'loi' ? 'alert' : 'status'}>
          <span>{t.noiDung}</span>
          {t.hoanTac && (
            <button
              type="button"
              onClick={async () => {
                dongToast(t.id);
                await t.hoanTac!();
              }}
            >
              Hoàn tác
            </button>
          )}
          {t.loai === 'loi' && (
            <button type="button" onClick={() => dongToast(t.id)} aria-label="Đóng thông báo">
              Đóng
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function layPhanTuTieuDiem(goc: HTMLElement): HTMLElement[] {
  return [...goc.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((e) => e.offsetParent !== null || e === document.activeElement);
}

function useBayPhim(goc: preact.RefObject<HTMLElement>, dong: () => void) {
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null;
    const ds = goc.current ? layPhanTuTieuDiem(goc.current) : [];
    (ds.find((e) => e.dataset.tuNhan !== undefined) ?? ds.find((e) => !e.classList.contains('dong-bang')) ?? ds[0])?.focus();
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        dong();
      } else if (e.key === 'Tab' && goc.current) {
        const d = layPhanTuTieuDiem(goc.current);
        if (!d.length) return;
        const dau = d[0];
        const cuoi = d[d.length - 1];
        if (e.shiftKey && document.activeElement === dau) {
          e.preventDefault();
          cuoi.focus();
        } else if (!e.shiftKey && document.activeElement === cuoi) {
          e.preventDefault();
          dau.focus();
        }
      }
    };
    document.addEventListener('keydown', phim, true);
    return () => {
      document.removeEventListener('keydown', phim, true);
      truoc?.focus?.();
    };
  }, []);
}

export function HopXacNhanHost() {
  const y = hopXacNhan.value;
  if (!y) return null;
  return <HopXacNhan y={y} />;
}

function HopXacNhan({ y }: { y: NonNullable<typeof hopXacNhan.value> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState('');
  const dong = (v: boolean) => {
    hopXacNhan.value = null;
    y.resolve(v);
  };
  useBayPhim(ref, () => dong(false));
  const duDieuKien = !y.gocXacNhan || go.trim() === y.gocXacNhan;
  return (
    <div class="lop-phu giua" onMouseDown={(e) => e.target === e.currentTarget && dong(false)}>
      <div class="hop-xac-nhan" role="alertdialog" aria-modal="true" aria-labelledby="xn-tieu-de" aria-describedby="xn-mo-ta" ref={ref}>
        <h2 id="xn-tieu-de">{y.tieuDe}</h2>
        {y.moTa && (
          <p id="xn-mo-ta" style={{ marginTop: 8 }}>
            {y.moTa}
          </p>
        )}
        {y.gocXacNhan && (
          <div class="truong">
            <label for="xn-go">Gõ “{y.gocXacNhan}” để xác nhận</label>
            <input id="xn-go" type="text" value={go} onInput={(e) => setGo((e.target as HTMLInputElement).value)} autocomplete="off" />
          </div>
        )}
        <div class="hang-nut phai" style={{ marginTop: 16 }}>
          <button type="button" class="nut" data-tu-nhan onClick={() => dong(false)}>
            {y.nutPhu ?? 'Hủy'}
          </button>
          <button type="button" class={`nut ${y.nguyHiem ? 'nut-nguy-hiem' : 'nut-chinh'}`} disabled={!duDieuKien} onClick={() => dong(true)}>
            {y.nutChinh}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BangTruotHost() {
  const ds = bangMo.value;
  return (
    <>
      {ds.map((b, i) => (
        <BangMot key={b.id} id={b.id} dau={i === ds.length - 1} />
      ))}
    </>
  );
}

function BangMot({ id, dau }: { id: string; dau: boolean }) {
  const b = bangMo.value.find((x) => x.id === id);
  const ref = useRef<HTMLDivElement>(null);
  useBayPhim(ref, () => dongBang(id));
  if (!b) return null;
  return (
    <div class="lop-phu" onMouseDown={(e) => e.target === e.currentTarget && dongBang(id)} style={{ zIndex: 50 + (dau ? 1 : 0) }}>
      <div class={`bang-truot ${b.rong ? 'bang-rong' : ''}`} role="dialog" aria-modal="true" aria-labelledby={`bang-${id}`} ref={ref}>
        <div class="dau">
          <h2 id={`bang-${id}`}>{b.tieuDe}</h2>
          <button type="button" class="nut-bieu-tuong dong-bang" aria-label="Đóng" onClick={() => dongBang(id)}>
            ✕
          </button>
        </div>
        {b.noiDung()}
      </div>
    </div>
  );
}
