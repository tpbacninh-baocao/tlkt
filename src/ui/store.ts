// Trạng thái toàn cục của ứng dụng (signals): kho dữ liệu, dữ liệu trong bộ nhớ, ngày giờ, định tuyến, toast, hộp thoại.
import { computed, signal } from '@preact/signals';
import type { CaiDat, CongViec, CuocKiemTra, KeHoach, KeHoachNgay, KhoiThoiGian, NgayGio, NgayISO } from '../core/kieu';
import { bayGioTuDate, homNayTuDate, lichTuCaiDat, type Lich } from '../core/lich';
import { phanTichCuoc, tongHopHomNay, type DuLieuTomTat, type PhanTichCuoc, type TongHopHomNay } from '../core/tomTat';
import { caiDatMacDinh } from '../core/caiDat';
import { Kho, moKho, yeuCauLuuBen, type DuLieuApp } from '../data/kho';
import { dongBoViecMau } from '../core/viec';

export type TrangThaiApp = 'DANG_TAI' | 'KHOA' | 'ONBOARD' | 'SAN_SANG' | 'LOI';

export const trangThaiApp = signal<TrangThaiApp>('DANG_TAI');
export const loiKhoiDong = signal<string>('');
export const kho = signal<Kho | null>(null);

// ---------- Dữ liệu trong bộ nhớ ----------
export const caiDat = signal<CaiDat>(caiDatMacDinh());
export const dsCuoc = signal<CuocKiemTra[]>([]);
export const dsViec = signal<CongViec[]>([]);
export const dsKeHoach = signal<KeHoach[]>([]);
export const dsKhoiThoiGian = signal<KhoiThoiGian[]>([]);
export const dsKeHoachNgay = signal<KeHoachNgay[]>([]);
export const daPhat = signal<Set<string>>(new Set());
export const saoLuuCuoi = signal<NgayISO | null>(null);

// ---------- Thời gian ----------
export const homNay = signal<NgayISO>(homNayTuDate());
export const bayGio = signal<NgayGio>(bayGioTuDate());

export function capNhatDongHo(d: Date = new Date()): void {
  const h = homNayTuDate(d);
  const g = bayGioTuDate(d);
  if (homNay.value !== h) homNay.value = h;
  if (bayGio.value !== g) bayGio.value = g;
}

// ---------- Dẫn xuất ----------
export const lich = computed<Lich>(() => lichTuCaiDat(caiDat.value));

export const cuocConHieuLuc = computed(() => dsCuoc.value.filter((c) => !c.xoaLuc));
export const viecConHieuLuc = computed(() => dsViec.value.filter((v) => !v.xoaLuc));

export const duLieuTomTat = computed<DuLieuTomTat>(() => ({
  homNay: homNay.value,
  bayGio: bayGio.value,
  lich: lich.value,
  caiDat: caiDat.value,
  cuoc: cuocConHieuLuc.value,
  viec: viecConHieuLuc.value,
  keHoach: dsKeHoach.value.filter((k) => !k.xoaLuc),
  va: caiDat.value.vaQuyTac as DuLieuTomTat['va'],
}));

export const phanTichMap = computed<Map<string, PhanTichCuoc>>(() => {
  const d = duLieuTomTat.value;
  return new Map(d.cuoc.map((c) => [c.id, phanTichCuoc(c, d)]));
});

export const tongHop = computed<TongHopHomNay>(() => tongHopHomNay(duLieuTomTat.value));

// ---------- Nạp / lưu ----------
export function ganDuLieu(du: DuLieuApp): void {
  caiDat.value = du.caiDat;
  dsCuoc.value = du.cuoc;
  dsViec.value = du.viec;
  dsKeHoach.value = du.keHoach;
  dsKhoiThoiGian.value = du.khoiThoiGian;
  dsKeHoachNgay.value = du.keHoachNgay;
  daPhat.value = du.daPhat;
}

export async function napDuLieu(): Promise<void> {
  const k = kho.value;
  if (!k) return;
  ganDuLieu(await k.docTatCa());
  saoLuuCuoi.value = (await k.docMeta<NgayISO>('saoLuuCuoi')) ?? null;
}

export function kho_(): Kho {
  const k = kho.value;
  if (!k) throw new Error('Kho dữ liệu chưa sẵn sàng');
  return k;
}

/** Sau khi đã mở khóa: nạp dữ liệu, dọn thùng rác, đồng bộ việc mẫu, chọn màn hình đầu. */
export async function hoanTatMoKhoa(): Promise<void> {
  const k = kho_();
  await napDuLieu();
  capNhatDongHo();
  await k.donThungRac(homNay.value);
  await k.donNhacDaPhat(homNay.value);
  const moi = dongBoViecMau(caiDat.value.mauViecDaBat, dsViec.value, homNay.value, lich.value, () => crypto.randomUUID(), bayGio.value);
  for (const v of moi) await k.luuViec(v);
  if (moi.length) await napDuLieu();
  trangThaiApp.value = caiDat.value.coDaOnboarding ? 'SAN_SANG' : 'ONBOARD';
}

export async function khoiDong(tenKho?: string): Promise<void> {
  try {
    const k = await moKho({ ten: tenKho });
    kho.value = k;
    void yeuCauLuuBen();
    if (k.dangKhoa()) {
      trangThaiApp.value = 'KHOA';
      return;
    }
    await hoanTatMoKhoa();
  } catch (e) {
    loiKhoiDong.value = e instanceof Error ? e.message : String(e);
    trangThaiApp.value = 'LOI';
  }
}

/** Khóa lại: xóa khóa và dữ liệu khỏi bộ nhớ. */
export function khoaApp(): void {
  const k = kho.value;
  if (!k?.daMaHoa()) return;
  k.khoaLai();
  ganDuLieu({ caiDat: caiDatMacDinh(), keHoach: [], cuoc: [], viec: [], khoiThoiGian: [], keHoachNgay: [], daPhat: new Set() });
  trangThaiApp.value = 'KHOA';
}

// ---------- Định tuyến theo hash (UI §2) ----------
export const diaChi = signal<string>(typeof location !== 'undefined' ? location.hash : '');

export type Route =
  | { man: 'hom-nay' }
  | { man: 'cuoc' }
  | { man: 'cuoc-chi-tiet'; id: string; tab?: string }
  | { man: 'lich' }
  | { man: 'viec' }
  | { man: 'ke-hoach-ngay' }
  | { man: 'ke-hoach-nam' }
  | { man: 'nhap-lieu' }
  | { man: 'bao-cao' }
  | { man: 'cai-dat'; muc?: string }
  | { man: 'can-cu' }
  | { man: 'thung-rac' }
  | { man: 'gioi-thieu' }
  | { man: 'kiem-thu' };

export function docRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const [phan, ...con] = h.split('/');
  if (phan.startsWith('cuoc-')) return { man: 'cuoc-chi-tiet', id: phan.slice(5), tab: con[0] };
  switch (phan) {
    case 'cuoc':
    case 'lich':
    case 'viec':
    case 'ke-hoach-ngay':
    case 'ke-hoach-nam':
    case 'nhap-lieu':
    case 'bao-cao':
    case 'can-cu':
    case 'thung-rac':
    case 'gioi-thieu':
    case 'kiem-thu':
      return { man: phan };
    case 'cai-dat':
      return { man: 'cai-dat', muc: con[0] };
    default:
      return { man: 'hom-nay' };
  }
}

export const route = computed<Route>(() => docRoute(diaChi.value));

export function diDen(hash: string): void {
  const h = hash.startsWith('#') ? hash : '#' + hash;
  if (typeof location !== 'undefined') location.hash = h;
  else diaChi.value = h;
}

// ---------- Toast ----------
export interface Toast {
  id: number;
  loai: 'thanhCong' | 'loi' | 'thongTin';
  noiDung: string;
  hoanTac?: () => void | Promise<void>;
}
export const dsToast = signal<Toast[]>([]);
let demToast = 0;

export function toast(noiDung: string, loai: Toast['loai'] = 'thanhCong', hoanTac?: Toast['hoanTac']): number {
  const id = ++demToast;
  dsToast.value = [...dsToast.value, { id, loai, noiDung, hoanTac }];
  if (loai !== 'loi' && typeof setTimeout !== 'undefined') setTimeout(() => dongToast(id), hoanTac ? 6000 : 3000);
  return id;
}
export function dongToast(id: number): void {
  dsToast.value = dsToast.value.filter((t) => t.id !== id);
}

// ---------- Hộp xác nhận tự xây (không dùng alert/confirm) ----------
export interface YeuCauXacNhan {
  tieuDe: string;
  moTa?: string;
  nutChinh: string;
  nutPhu?: string;
  nguyHiem?: boolean;
  /** Bắt người dùng gõ chữ này mới cho xác nhận (xóa toàn bộ dữ liệu…) */
  gocXacNhan?: string;
  resolve: (dongY: boolean) => void;
}
export const hopXacNhan = signal<YeuCauXacNhan | null>(null);

export function xacNhan(y: Omit<YeuCauXacNhan, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    hopXacNhan.value = { ...y, resolve };
  });
}

// ---------- Bảng trượt (sheet) ----------
export interface BangTruot {
  id: string;
  tieuDe: string;
  noiDung: () => preact.ComponentChild;
  rong?: boolean;
  /** Gọi khi đóng bằng nút X/Esc/nền */
  khiDong?: () => void;
}
export const bangMo = signal<BangTruot[]>([]);

export function moBang(b: BangTruot): void {
  bangMo.value = [...bangMo.value.filter((x) => x.id !== b.id), b];
}
export function dongBang(id?: string): void {
  const ds = bangMo.value;
  if (!ds.length) return;
  const dich = id ? ds.find((b) => b.id === id) : ds[ds.length - 1];
  bangMo.value = ds.filter((b) => b !== dich);
  dich?.khiDong?.();
}

// ---------- Nhắc việc trong app (T33 dùng) ----------
export const soNhacChuaXem = signal(0);
