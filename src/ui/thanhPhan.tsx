// Thành phần dùng chung (UI §3): nhãn SLA/giai đoạn/hệ thống/loại cuộc, ThẻViệc, đồng hồ đếm ngược, chọn ngày, sao chép…
import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import type { GiaiDoan, NgayISO } from '../core/kieu';
import { dinhDangNgay, dinhDangNgayNgan, docNgayVN, laNgayISO, tenNgayNghi, tenThu, thuNgan, laNgayLamViec, laNgayLamBu, dinhDangSo } from '../core/lich';
import { TEN_GIAI_DOAN, type MucSLA } from '../core/vuViec';
import type { MucViec } from '../core/tomTat';
import { KIEU_SLA, MAU_GIAI_DOAN, MAU_HE_THONG, TEN_HE_THONG_NGAN, TEN_LOAI_CUOC } from './chuoi';
import { lich } from './store';

// ---------- Nhãn ----------
export function NhanSLA({ muc, chu }: { muc: MucSLA; chu?: string }) {
  const k = KIEU_SLA[muc];
  return (
    <span class={`sla ${k.lop}`} title={k.nhan}>
      <span aria-hidden="true">{k.bieuTuong}</span>
      <span>{chu ?? k.nhan}</span>
    </span>
  );
}

export function NhanGiaiDoan({ gd }: { gd: GiaiDoan }) {
  return (
    <span class="nhan">
      <span class="cham" style={{ background: MAU_GIAI_DOAN[gd] }} aria-hidden="true" />
      {TEN_GIAI_DOAN[gd]}
    </span>
  );
}

export function NhanLoai({ loai }: { loai: string }) {
  return (
    <abbr class="nhan" title={TEN_LOAI_CUOC[loai] ?? loai} style={{ textDecoration: 'none' }}>
      {loai}
    </abbr>
  );
}

export function NhanHeThong({ ma }: { ma: string }) {
  return (
    <span class="nhan nhan-ht" style={{ color: MAU_HE_THONG[ma] }}>
      {TEN_HE_THONG_NGAN[ma] ?? ma}
    </span>
  );
}

// ---------- Đồng hồ đếm ngược ----------
export function conLaiNLVChu(nlv: number | undefined): string {
  if (nlv === undefined) return '';
  if (nlv < 0) return `quá ${-nlv} ngày LV`;
  if (nlv === 0) return 'hôm nay';
  return `còn ${nlv} ngày LV`;
}

export function DongHoDemNguoc({ nlv }: { nlv?: number }) {
  return <span>{conLaiNLVChu(nlv)}</span>;
}

// ---------- Ngày ----------
export function chuNgay(n: NgayISO | undefined): string {
  return n ? `${dinhDangNgay(n)} (${thuNgan(n)})` : '—';
}
export function chuNgayNgan(n: NgayISO | undefined): string {
  return n ? `${dinhDangNgayNgan(n)} (${thuNgan(n)})` : '—';
}

export function ChonNgay(p: {
  gia: NgayISO | '';
  doi: (v: NgayISO | '') => void;
  nhan?: string;
  id?: string;
  batBuoc?: boolean;
  loi?: string;
  goiY?: string;
  /** Cảnh báo nếu là ngày nghỉ */
  canhBaoNghi?: boolean;
}) {
  const [chu, setChu] = useState(p.gia ? dinhDangNgay(p.gia) : '');
  const [sai, setSai] = useState(false);
  useEffect(() => {
    setChu(p.gia ? dinhDangNgay(p.gia) : '');
    setSai(false);
  }, [p.gia]);
  const id = p.id ?? `ngay-${p.nhan ?? 'x'}`;
  const xong = () => {
    if (!chu.trim()) {
      setSai(false);
      p.doi('');
      return;
    }
    const v = laNgayISO(chu.trim()) ? chu.trim() : docNgayVN(chu);
    if (v) {
      setSai(false);
      p.doi(v);
    } else setSai(true);
  };
  const nghi = p.gia && (p.canhBaoNghi ?? true) && !laNgayLamViec(lich.value, p.gia);
  const tenNghi = p.gia ? tenNgayNghi(lich.value, p.gia) : undefined;
  return (
    <div class="truong">
      {p.nhan && (
        <label for={id}>
          {p.nhan}
          {p.batBuoc ? ' *' : ''}
        </label>
      )}
      <div class="chon-ngay">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          value={chu}
          aria-invalid={sai || !!p.loi}
          onInput={(e) => setChu((e.target as HTMLInputElement).value)}
          onBlur={xong}
          onKeyDown={(e) => e.key === 'Enter' && xong()}
        />
        <span class="lich-an nut nut-nho" aria-label="Chọn ngày từ lịch" title="Chọn ngày từ lịch">
          📅
          <input
            type="date"
            tabIndex={-1}
            aria-label="Chọn ngày từ lịch"
            value={p.gia}
            onChange={(e) => p.doi((e.target as HTMLInputElement).value as NgayISO)}
          />
        </span>
      </div>
      {p.gia && !sai && (
        <span class="goi-y">
          {tenThu(p.gia)}
          {laNgayLamBu(lich.value, p.gia) ? ' · ngày làm bù' : ''}
        </span>
      )}
      {sai && <span class="loi-truong">Ngày không hợp lệ – nhập dạng dd/mm/yyyy</span>}
      {nghi && <span class="canh-bao-truong">⚠ {tenNghi ?? (tenThu(p.gia as NgayISO) === 'Chủ nhật' || tenThu(p.gia as NgayISO) === 'Thứ Bảy' ? tenThu(p.gia as NgayISO) : 'Ngày nghỉ')} – không phải ngày làm việc</span>}
      {p.goiY && <span class="goi-y">{p.goiY}</span>}
      {p.loi && <span class="loi-truong">{p.loi}</span>}
    </div>
  );
}

// ---------- Ô nhập số có dấu chấm ngăn cách (1.234.567) ----------
export function OSo(p: { gia: number; doi: (n: number) => void; nhan?: string; id?: string; hauTo?: string }) {
  const [chu, setChu] = useState(p.gia ? dinhDangSo(p.gia) : '');
  useEffect(() => setChu(p.gia ? dinhDangSo(p.gia) : ''), [p.gia]);
  const id = p.id ?? `so-${p.nhan ?? 'x'}`;
  return (
    <div class="truong">
      {p.nhan && <label for={id}>{p.nhan}</label>}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={chu}
        onInput={(e) => {
          const so = Number((e.target as HTMLInputElement).value.replace(/\D/g, '')) || 0;
          setChu(so ? dinhDangSo(so) : '');
          p.doi(so);
        }}
      />
      {p.hauTo && <span class="goi-y">{p.hauTo}</span>}
    </div>
  );
}

export function Truong(p: { nhan: string; id?: string; loi?: string; goiY?: string; children: ComponentChildren; batBuoc?: boolean }) {
  return (
    <div class="truong">
      <label for={p.id}>
        {p.nhan}
        {p.batBuoc ? ' *' : ''}
      </label>
      {p.children}
      {p.goiY && <span class="goi-y">{p.goiY}</span>}
      {p.loi && <span class="loi-truong">{p.loi}</span>}
    </div>
  );
}

// ---------- Sao chép ----------
export async function saoChepVaoBangTam(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function NutSaoChep({ lay, nhan = 'Sao chép', nho = true }: { lay: () => string; nhan?: string; nho?: boolean }) {
  const [da, setDa] = useState(false);
  const tm = useRef<number>();
  useEffect(() => () => clearTimeout(tm.current), []);
  return (
    <button
      type="button"
      class={`nut ${nho ? 'nut-nho' : ''}`}
      onClick={async () => {
        if (await saoChepVaoBangTam(lay())) {
          setDa(true);
          clearTimeout(tm.current);
          tm.current = window.setTimeout(() => setDa(false), 2000);
        }
      }}
    >
      {da ? 'Đã chép ✓' : `📋 ${nhan}`}
    </button>
  );
}

// ---------- Trạng thái rỗng ----------
export function MinhHoaRong() {
  return (
    <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="16" y="14" width="64" height="68" rx="10" />
      <path d="M32 34h32M32 48h32M32 62h18" />
      <circle cx="70" cy="70" r="14" fill="var(--be-mat)" />
      <path d="M64 70l4 4 8-8" />
    </svg>
  );
}

export function TrangThaiRong(p: { tieuDe: string; moTa?: string; children?: ComponentChildren; xanh?: boolean }) {
  return (
    <div class={`rong ${p.xanh ? 'xanh' : ''}`}>
      <MinhHoaRong />
      <h3>{p.tieuDe}</h3>
      {p.moTa && <p>{p.moTa}</p>}
      {p.children && <div class="hang-nut">{p.children}</div>}
    </div>
  );
}

// ---------- KPI, tiến độ, tab ----------
export function Kpi(p: { so: number | string; nhan: string; mau?: 'do' | 'cam' | 'vang' | 'xanh'; href?: string }) {
  const noiDung = (
    <>
      <div class="so-lon">{p.so}</div>
      <div class="phu">{p.nhan}</div>
    </>
  );
  return p.href ? (
    <a class={`kpi ${p.mau ?? ''}`} href={p.href}>
      {noiDung}
    </a>
  ) : (
    <div class={`kpi ${p.mau ?? ''}`}>{noiDung}</div>
  );
}

export function ThanhTienDo({ xong, tong, nhan }: { xong: number; tong: number; nhan?: string }) {
  const pt = tong > 0 ? Math.round((xong / tong) * 100) : 0;
  return (
    <div class="thanh-tien" role="progressbar" aria-valuemin={0} aria-valuemax={tong} aria-valuenow={xong} aria-label={nhan}>
      <div class="tien-do">
        <div style={{ width: `${pt}%` }} />
      </div>
      <span class="phu so">{nhan ?? `${xong}/${tong}`}</span>
    </div>
  );
}

export function Tabs<T extends string>(p: { cac: { ma: T; ten: string; dem?: number }[]; dang: T; doi: (m: T) => void; nhan?: string }) {
  return (
    <div class="tabs" role="tablist" aria-label={p.nhan}>
      {p.cac.map((t) => (
        <button key={t.ma} type="button" role="tab" aria-selected={p.dang === t.ma} onClick={() => p.doi(t.ma)}>
          {t.ten}
          {t.dem ? ` (${t.dem})` : ''}
        </button>
      ))}
    </div>
  );
}

// ---------- ThẻViệc ----------
export interface HanhDongThe {
  nhan: string;
  chay: () => void;
  href?: string;
}

export function MenuNoi({ hanhDong, nhan = 'Thêm hành động' }: { hanhDong: HanhDongThe[]; nhan?: string }) {
  const [mo, setMo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mo) return;
    const dong = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMo(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMo(false);
    document.addEventListener('pointerdown', dong);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', dong);
      document.removeEventListener('keydown', esc);
    };
  }, [mo]);
  if (!hanhDong.length) return null;
  return (
    <div class="menu-noi" ref={ref}>
      <button type="button" class="nut-bieu-tuong" aria-label={nhan} aria-haspopup="menu" aria-expanded={mo} onClick={() => setMo(!mo)}>
        ⋯
      </button>
      {mo && (
        <div class="hop" role="menu">
          {hanhDong.map((h) =>
            h.href ? (
              <a key={h.nhan} role="menuitem" href={h.href} target={h.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => { setMo(false); h.chay(); }}>
                {h.nhan}
              </a>
            ) : (
              <button
                key={h.nhan}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMo(false);
                  h.chay();
                }}
              >
                {h.nhan}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function TheViec(p: { m: MucViec; onXong?: (m: MucViec) => void; menu?: HanhDongThe[]; tieuDeLienKet?: boolean }) {
  const { m } = p;
  const k = KIEU_SLA[m.muc];
  const lop = m.trangThai === 'QUA_HAN' ? 'qua-han' : m.trangThai === 'HOM_NAY' ? 'hom-nay' : '';
  return (
    <div class={`the-viec ${lop}`}>
      <span class={`bt-sla ${k.lop}`} aria-label={k.nhan} title={k.nhan}>
        {k.bieuTuong}
      </span>
      <div style={{ minWidth: 0 }}>
        <a class="ten" href={m.lienKet}>
          {m.tieuDe}
          {m.nhanCuoc ? ` · ${m.maCuoc ? m.maCuoc + ' ' : ''}${m.nhanCuoc}` : ''}
        </a>
        <div class="phu-dong">
          {m.han && (
            <span>
              Hạn {dinhDangNgayNgan(m.han)} ({thuNgan(m.han)})
            </span>
          )}
          {m.nlvConLai !== undefined && <span>· {conLaiNLVChu(m.nlvConLai)}</span>}
          {m.heThong && <NhanHeThong ma={m.heThong} />}
          {m.canCu && <span>· {m.canCu}</span>}
          {m.noiBo && m.loai === 'BUOC' && <span>· hạn nội bộ</span>}
          {m.quaHanChuaGiaiTrinh && <span class="sla sla-do-dam">⚠ chưa ghi lý do</span>}
        </div>
      </div>
      <div class="hanh-dong">
        {p.onXong && (
          <button type="button" class="nut nut-nho nut-chinh" onClick={() => p.onXong!(m)} aria-label={`Đánh dấu xong: ${m.tieuDe}`}>
            ✓ Xong
          </button>
        )}
        <MenuNoi hanhDong={p.menu ?? []} />
      </div>
    </div>
  );
}

export function NhomViec(p: { tieuDe: string; dem: number; mo?: boolean; kieu?: 'do'; children: ComponentChildren }) {
  return (
    <details class={`nhom-viec ${p.kieu ?? ''}`} open={p.mo ?? true}>
      <summary>
        {p.tieuDe} <span class="so-dem">({p.dem})</span>
      </summary>
      {p.children}
    </details>
  );
}

// ---------- Hộp văn bản cuộn ----------
export function KhoiVanBan({ text }: { text: string }) {
  return (
    <pre class="khoi-van-ban" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
      {text}
    </pre>
  );
}

export type SuKienForm = JSX.TargetedEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, Event>;
