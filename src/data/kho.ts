// Kho dữ liệu IndexedDB (ARCHITECTURE §9): CRUD, xóa mềm/khôi phục/xóa hẳn sau 30 ngày, audit log, migrate,
// storage.persist(), mã hóa tùy chọn bằng mật mã (mỗi bản ghi lưu { id, iv, ct }; `meta` không mã hóa).
import { openDB, type IDBPDatabase } from 'idb';
import type { CaiDat, CongViec, CuocKiemTra, KeHoach, KeHoachNgay, KhoiThoiGian, NgayGio, NgayISO, NhatKyHeThong } from '../core/kieu';
import { caiDatMacDinh } from '../core/caiDat';
import { soNgayGiua } from '../core/lich';
import { chuanHoaCuoc, chuanHoaKeHoach, chuanHoaViec } from './chuanHoa';
import {
  giaiMa,
  laGoiMaHoa,
  maHoa,
  moKhoaBangMatMa,
  taoCauHinhMatMa,
  type CauHinhMatMa,
  type GoiMaHoa,
} from './mat';

export const PHIEN_BAN_SCHEMA = 1;
export const TEN_KHO_MAC_DINH = 'tlkt';
export const SO_NGAY_THUNG_RAC = 30;
export const SO_DONG_NHAT_KY_TOI_DA = 2000;

export const CAC_KHO = ['caiDat', 'keHoach', 'cuoc', 'viec', 'khoiThoiGian', 'keHoachNgay', 'nhacDaPhat', 'nhatKyHeThong', 'meta'] as const;
export type TenKho = (typeof CAC_KHO)[number];
/** Các kho dữ liệu người dùng (được mã hóa khi bật mật mã). */
const KHO_DU_LIEU = CAC_KHO.filter((k) => k !== 'meta') as Exclude<TenKho, 'meta'>[];
/** Kho có xóa mềm (có trường xoaLuc). */
export type KhoXoaMem = 'keHoach' | 'cuoc' | 'viec';

export class KhoDangKhoa extends Error {
  constructor() {
    super('Dữ liệu đang khóa – cần nhập mật mã để mở.');
    this.name = 'KhoDangKhoa';
  }
}

type BanGhi = { id: string } & Record<string, unknown>;
interface BanGhiMaHoa extends GoiMaHoa {
  id: string;
}

export interface DuLieuApp {
  caiDat: CaiDat;
  keHoach: KeHoach[];
  cuoc: CuocKiemTra[];
  viec: CongViec[];
  khoiThoiGian: KhoiThoiGian[];
  keHoachNgay: KeHoachNgay[];
  /** Khóa các nhắc đã phát */
  daPhat: Set<string>;
}

export interface BuocMigrate {
  den: number;
  chay: (kho: Kho) => Promise<void>;
}

/** Các bước nâng cấp dữ liệu theo phiên bản schema (hiện chỉ có v1). */
export const BUOC_MIGRATE: BuocMigrate[] = [];

/** Chỉ giữ các trường thay đổi giữa hai bản (bỏ suaLuc) để audit log gọn. */
export function soSanhThayDoi(truoc: unknown, sau: unknown): { truoc: Record<string, unknown>; sau: Record<string, unknown> } | undefined {
  if (typeof truoc !== 'object' || typeof sau !== 'object' || !truoc || !sau) return undefined;
  const a = truoc as Record<string, unknown>;
  const b = sau as Record<string, unknown>;
  const t: Record<string, unknown> = {};
  const s: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'suaLuc') continue;
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
      t[k] = a[k];
      s[k] = b[k];
    }
  }
  return Object.keys(t).length ? { truoc: t, sau: s } : undefined;
}

export interface TuyChonKho {
  ten?: string;
  /** Đồng hồ (tiêm vào để kiểm thử) */
  dongHo?: () => NgayGio;
}

function bayGioMacDinh(): NgayGio {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function moKho(tuyChon: TuyChonKho = {}): Promise<Kho> {
  const db = await openDB(tuyChon.ten ?? TEN_KHO_MAC_DINH, PHIEN_BAN_SCHEMA, {
    upgrade(d) {
      for (const k of CAC_KHO) if (!d.objectStoreNames.contains(k)) d.createObjectStore(k, { keyPath: 'id' });
    },
  });
  const kho = new Kho(db, tuyChon.dongHo ?? bayGioMacDinh);
  await kho.khoiTao();
  return kho;
}

/** Xin trình duyệt giữ dữ liệu lâu dài (hạn chế tự xóa). */
export async function yeuCauLuuBen(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export class Kho {
  private khoaMa: CryptoKey | null = null;
  private maHoaBat = false;
  /** Số dòng nhật ký hệ thống giữ lại (mặc định 2.000) */
  gioiHanNhatKy = SO_DONG_NHAT_KY_TOI_DA;
  private soThuTu = 0;

  constructor(
    readonly db: IDBPDatabase,
    private dongHo: () => NgayGio,
  ) {}

  async khoiTao(): Promise<void> {
    this.maHoaBat = !!(await this.db.get('meta', 'matMa'));
    await this.migrate();
  }

  dong(): void {
    this.khoaMa = null;
    this.db.close();
  }

  // ---------- Meta ----------
  async docMeta<T>(id: string): Promise<T | undefined> {
    const r = (await this.db.get('meta', id)) as ({ id: string; gia: T }) | undefined;
    return r?.gia;
  }

  async ghiMeta(id: string, gia: unknown): Promise<void> {
    await this.db.put('meta', { id, gia });
  }

  async migrate(buoc: BuocMigrate[] = BUOC_MIGRATE): Promise<number> {
    const hienTai = (await this.docMeta<number>('phienBan')) ?? 0;
    let v = hienTai;
    for (const b of [...buoc].sort((x, y) => x.den - y.den)) {
      if (b.den > v) {
        await b.chay(this);
        v = b.den;
      }
    }
    v = Math.max(v, PHIEN_BAN_SCHEMA);
    if (v !== hienTai) await this.ghiMeta('phienBan', v);
    return v;
  }

  // ---------- Trạng thái mật mã ----------
  daMaHoa(): boolean {
    return this.maHoaBat;
  }

  dangKhoa(): boolean {
    return this.maHoaBat && !this.khoaMa;
  }

  private baoVe(): void {
    if (this.dangKhoa()) throw new KhoDangKhoa();
  }

  private async maHoaBanGhi(doc: BanGhi): Promise<BanGhi | BanGhiMaHoa> {
    if (!this.khoaMa) return doc;
    return { id: doc.id, ...(await maHoa(this.khoaMa, doc)) };
  }

  private async giaiMaBanGhi(r: BanGhi | BanGhiMaHoa): Promise<BanGhi> {
    if (laGoiMaHoa(r)) {
      if (!this.khoaMa) throw new KhoDangKhoa();
      return giaiMa<BanGhi>(this.khoaMa, r);
    }
    return r as BanGhi;
  }

  // ---------- CRUD chung ----------
  async tatCa<T>(kho: Exclude<TenKho, 'meta'>): Promise<T[]> {
    this.baoVe();
    const raw = (await this.db.getAll(kho)) as (BanGhi | BanGhiMaHoa)[];
    const kq: T[] = [];
    for (const r of raw) kq.push((await this.giaiMaBanGhi(r)) as unknown as T);
    return kq;
  }

  async lay<T>(kho: Exclude<TenKho, 'meta'>, id: string): Promise<T | undefined> {
    this.baoVe();
    const r = (await this.db.get(kho, id)) as BanGhi | BanGhiMaHoa | undefined;
    return r ? ((await this.giaiMaBanGhi(r)) as unknown as T) : undefined;
  }

  async ghiTho(kho: Exclude<TenKho, 'meta'>, doc: BanGhi): Promise<void> {
    this.baoVe();
    await this.db.put(kho, await this.maHoaBanGhi(doc));
  }

  async xoaVinhVien(kho: Exclude<TenKho, 'meta'>, id: string, ghiLog = true): Promise<void> {
    this.baoVe();
    await this.db.delete(kho, id);
    if (ghiLog) await this.ghiNhatKy({ luc: this.dongHo(), hanhDong: 'XOA', doiTuong: kho, id });
  }

  // ---------- Nhật ký hệ thống (audit) ----------
  /** `e.id` là id của thực thể bị tác động; khóa bản ghi nhật ký được sinh riêng (theo thời gian). */
  async ghiNhatKy(e: NhatKyHeThong): Promise<void> {
    this.baoVe();
    const { id: idDoiTuong, ...con } = e;
    // luc (phút) → mili-giây thực → số thứ tự trong phiên: đảm bảo thứ tự ổn định kể cả khi nhiều dòng cùng phút
    this.soThuTu = (this.soThuTu + 1) % 100000;
    const khoaBanGhi = `${e.luc}~${String(Date.now()).padStart(15, '0')}~${String(this.soThuTu).padStart(5, '0')}`;
    await this.ghiTho('nhatKyHeThong', { id: khoaBanGhi, idDoiTuong, ...con });
    const tong = await this.db.count('nhatKyHeThong');
    if (tong > this.gioiHanNhatKy) {
      const khoa = (await this.db.getAllKeys('nhatKyHeThong')) as string[];
      khoa.sort();
      const bo = khoa.slice(0, tong - this.gioiHanNhatKy);
      const tx = this.db.transaction('nhatKyHeThong', 'readwrite');
      for (const k of bo) void tx.store.delete(k);
      await tx.done;
    }
  }

  /** Nhật ký, mới nhất trước; có thể lọc theo đối tượng/id (lịch sử sửa riêng của một cuộc). */
  async docNhatKy(loc: { doiTuong?: string; id?: string; gioiHan?: number } = {}): Promise<(NhatKyHeThong & { khoaBanGhi: string })[]> {
    const ds = await this.tatCa<BanGhi & NhatKyHeThong & { idDoiTuong?: string }>('nhatKyHeThong');
    return ds
      .filter((e) => (!loc.doiTuong || e.doiTuong === loc.doiTuong) && (!loc.id || e.idDoiTuong === loc.id))
      .sort((a, b) => (a.id < b.id ? 1 : -1))
      .slice(0, loc.gioiHan ?? SO_DONG_NHAT_KY_TOI_DA)
      .map(({ id: khoaBanGhi, idDoiTuong, ...con }) => ({ ...(con as NhatKyHeThong), id: idDoiTuong, khoaBanGhi }));
  }

  /** Ghi một thao tác trên một thực thể, kèm id thực thể để lọc lịch sử riêng của cuộc. */
  private async ghiThaoTac(hanhDong: NhatKyHeThong['hanhDong'], doiTuong: string, idDoiTuong: string, truoc?: unknown, sau?: unknown): Promise<void> {
    await this.ghiNhatKy({ luc: this.dongHo(), hanhDong, doiTuong, id: idDoiTuong, truoc, sau });
  }

  // ---------- Thực thể ----------
  private async luuThucThe<T extends { id: string; suaLuc?: NgayGio; taoLuc?: NgayGio }>(kho: KhoXoaMem | 'khoiThoiGian', doc: T): Promise<T> {
    const bayGio = this.dongHo();
    const cu = await this.lay<T>(kho, doc.id);
    const moi = { ...doc, taoLuc: doc.taoLuc ?? cu?.taoLuc ?? bayGio, suaLuc: bayGio } as T;
    await this.ghiTho(kho, moi as unknown as BanGhi);
    if (!cu) await this.ghiThaoTac('THEM', kho, doc.id);
    else {
      const dt = soSanhThayDoi(cu, moi);
      if (dt) await this.ghiThaoTac('SUA', kho, doc.id, dt.truoc, dt.sau);
    }
    return moi;
  }

  async luuCuoc(c: CuocKiemTra): Promise<CuocKiemTra> {
    return this.luuThucThe('cuoc', c);
  }
  async luuViec(v: CongViec): Promise<CongViec> {
    return this.luuThucThe('viec', v);
  }
  async luuKeHoach(k: KeHoach): Promise<KeHoach> {
    return this.luuThucThe('keHoach', k as KeHoach & { id: string });
  }
  async luuKhoiThoiGian(k: KhoiThoiGian): Promise<KhoiThoiGian> {
    const cu = await this.lay<KhoiThoiGian>('khoiThoiGian', k.id);
    await this.ghiTho('khoiThoiGian', k as unknown as BanGhi);
    await this.ghiThaoTac(cu ? 'SUA' : 'THEM', 'khoiThoiGian', k.id);
    return k;
  }
  async xoaKhoiThoiGian(id: string): Promise<void> {
    await this.xoaVinhVien('khoiThoiGian', id);
  }

  async docCaiDat(): Promise<CaiDat> {
    const r = await this.lay<CaiDat & { id: string }>('caiDat', 'caiDat');
    const mac = caiDatMacDinh();
    if (!r) return mac;
    const { id: _id, ...con } = r;
    void _id;
    return { ...mac, ...con, nhac: { ...mac.nhac, ...(con.nhac ?? {}) } };
  }

  async luuCaiDat(cd: CaiDat): Promise<void> {
    const cu = await this.lay<CaiDat & { id: string }>('caiDat', 'caiDat');
    await this.ghiTho('caiDat', { id: 'caiDat', ...cd } as unknown as BanGhi);
    const dt = cu ? soSanhThayDoi(cu, { id: 'caiDat', ...cd }) : undefined;
    await this.ghiThaoTac('CAI_DAT', 'caiDat', 'caiDat', dt?.truoc, dt?.sau);
  }

  async luuKeHoachNgay(k: KeHoachNgay): Promise<void> {
    await this.ghiTho('keHoachNgay', { id: k.ngay, ...k } as unknown as BanGhi);
  }

  async layKeHoachNgay(ngay: NgayISO): Promise<KeHoachNgay | undefined> {
    const r = await this.lay<KeHoachNgay & { id: string }>('keHoachNgay', ngay);
    if (!r) return undefined;
    const { id: _id, ...con } = r;
    void _id;
    return con;
  }

  // ---------- Nhắc đã phát ----------
  async danhDauDaPhat(khoa: string, luc: NgayGio): Promise<void> {
    await this.ghiTho('nhacDaPhat', { id: khoa, luc });
  }

  async daPhatChua(khoa: string): Promise<boolean> {
    return !!(await this.lay('nhacDaPhat', khoa));
  }

  /** Xóa các dấu “đã phát” cũ hơn `soNgay` để kho không phình ra. */
  async donNhacDaPhat(homNay: NgayISO, soNgay = 45): Promise<number> {
    const ds = await this.tatCa<{ id: string; luc: NgayGio }>('nhacDaPhat');
    const cu = ds.filter((d) => soNgayGiua(d.luc.slice(0, 10), homNay) > soNgay);
    for (const d of cu) await this.db.delete('nhacDaPhat', d.id);
    return cu.length;
  }

  // ---------- Đọc toàn bộ ----------
  async docTatCa(): Promise<DuLieuApp> {
    const [caiDat, keHoach, cuoc, viec, khoi, khn, daPhat] = await Promise.all([
      this.docCaiDat(),
      this.tatCa<KeHoach>('keHoach'),
      this.tatCa<CuocKiemTra>('cuoc'),
      this.tatCa<CongViec>('viec'),
      this.tatCa<KhoiThoiGian>('khoiThoiGian'),
      this.tatCa<KeHoachNgay & { id: string }>('keHoachNgay'),
      this.tatCa<{ id: string }>('nhacDaPhat'),
    ]);
    return {
      caiDat,
      keHoach: keHoach.map(chuanHoaKeHoach),
      cuoc: cuoc.map(chuanHoaCuoc),
      viec: viec.map(chuanHoaViec),
      khoiThoiGian: khoi,
      keHoachNgay: khn.map(({ id: _id, ...con }) => (void _id, con)),
      daPhat: new Set(daPhat.map((d) => d.id)),
    };
  }

  // ---------- Xóa mềm / Thùng rác ----------
  async xoaMem(kho: KhoXoaMem, id: string): Promise<boolean> {
    const doc = await this.lay<{ id: string; xoaLuc?: NgayGio; suaLuc?: NgayGio }>(kho, id);
    if (!doc || doc.xoaLuc) return false;
    const bayGio = this.dongHo();
    await this.ghiTho(kho, { ...doc, xoaLuc: bayGio, suaLuc: bayGio } as unknown as BanGhi);
    await this.ghiThaoTac('XOA', kho, id);
    return true;
  }

  async khoiPhuc(kho: KhoXoaMem, id: string): Promise<boolean> {
    const doc = await this.lay<{ id: string; xoaLuc?: NgayGio; suaLuc?: NgayGio }>(kho, id);
    if (!doc || !doc.xoaLuc) return false;
    const { xoaLuc: _x, ...con } = doc;
    void _x;
    await this.ghiTho(kho, { ...con, suaLuc: this.dongHo() } as unknown as BanGhi);
    await this.ghiThaoTac('KHOI_PHUC', kho, id);
    return true;
  }

  async thungRac(): Promise<{ kho: KhoXoaMem; doc: { id: string; xoaLuc: NgayGio } & Record<string, unknown> }[]> {
    const kq: { kho: KhoXoaMem; doc: { id: string; xoaLuc: NgayGio } & Record<string, unknown> }[] = [];
    for (const kho of ['cuoc', 'viec', 'keHoach'] as KhoXoaMem[]) {
      for (const d of await this.tatCa<{ id: string; xoaLuc?: NgayGio } & Record<string, unknown>>(kho)) {
        if (d.xoaLuc) kq.push({ kho, doc: d as { id: string; xoaLuc: NgayGio } & Record<string, unknown> });
      }
    }
    return kq.sort((a, b) => (a.doc.xoaLuc < b.doc.xoaLuc ? 1 : -1));
  }

  /** Tự xóa hẳn các mục đã xóa mềm quá 30 ngày. Trả về số mục đã xóa. */
  async donThungRac(homNay: NgayISO): Promise<number> {
    let n = 0;
    for (const { kho, doc } of await this.thungRac()) {
      if (soNgayGiua(doc.xoaLuc.slice(0, 10), homNay) > SO_NGAY_THUNG_RAC) {
        await this.xoaVinhVien(kho, doc.id);
        n++;
      }
    }
    return n;
  }

  /** Xóa toàn bộ dữ liệu (kể cả mật mã) – giao diện phải xác nhận 2 lần. */
  async xoaToanBo(): Promise<void> {
    const tx = this.db.transaction([...CAC_KHO], 'readwrite');
    for (const k of CAC_KHO) void tx.objectStore(k).clear();
    await tx.done;
    this.khoaMa = null;
    this.maHoaBat = false;
    await this.ghiMeta('phienBan', PHIEN_BAN_SCHEMA);
  }

  // ---------- Mã hóa bằng mật mã (T14) ----------
  /** Đọc toàn bộ bản ghi (đã giải mã) của mọi kho dữ liệu. */
  private async docThoTatCa(): Promise<Map<Exclude<TenKho, 'meta'>, BanGhi[]>> {
    const m = new Map<Exclude<TenKho, 'meta'>, BanGhi[]>();
    for (const k of KHO_DU_LIEU) m.set(k, await this.tatCa<BanGhi>(k));
    return m;
  }

  /** Ghi lại toàn bộ (thay thế) trong MỘT giao dịch, mã hóa bằng khóa hiện tại (nếu có). */
  private async ghiThoTatCa(du: Map<Exclude<TenKho, 'meta'>, BanGhi[]>, meta?: { datMatMa?: CauHinhMatMa; xoaMatMa?: boolean }): Promise<void> {
    const moi = new Map<Exclude<TenKho, 'meta'>, (BanGhi | BanGhiMaHoa)[]>();
    for (const [k, ds] of du) {
      const out: (BanGhi | BanGhiMaHoa)[] = [];
      for (const d of ds) out.push(await this.maHoaBanGhi(d));
      moi.set(k, out);
    }
    const tx = this.db.transaction([...KHO_DU_LIEU, 'meta'], 'readwrite');
    for (const [k, ds] of moi) {
      const s = tx.objectStore(k);
      void s.clear();
      for (const d of ds) void s.put(d);
    }
    // cập nhật cấu hình mật mã CÙNG giao dịch để không bao giờ lệch giữa dữ liệu và khóa
    if (meta?.datMatMa) void tx.objectStore('meta').put({ id: 'matMa', gia: meta.datMatMa });
    if (meta?.xoaMatMa) void tx.objectStore('meta').delete('matMa');
    await tx.done;
  }

  /** Bật mã hóa: mã hóa toàn bộ dữ liệu hiện có bằng mật mã mới. */
  async datMatMa(matMa: string, soVong?: number): Promise<void> {
    if (this.maHoaBat) throw new Error('Đã có mật mã – hãy dùng đổi mật mã.');
    const du = await this.docThoTatCa();
    const { cauHinh, khoa } = await taoCauHinhMatMa(matMa, soVong);
    this.khoaMa = khoa;
    this.maHoaBat = true;
    try {
      await this.ghiThoTatCa(du, { datMatMa: cauHinh });
    } catch (e) {
      this.khoaMa = null;
      this.maHoaBat = false;
      throw e;
    }
    await this.ghiNhatKy({ luc: this.dongHo(), hanhDong: 'CAI_DAT', doiTuong: 'matMa', sau: 'bật' });
  }

  async layCauHinhMatMa(): Promise<CauHinhMatMa | undefined> {
    return this.docMeta<CauHinhMatMa>('matMa');
  }

  /** Mở khóa bằng mật mã: đúng → true. */
  async moKhoa(matMa: string): Promise<boolean> {
    const ch = await this.layCauHinhMatMa();
    if (!ch) return true;
    const khoa = await moKhoaBangMatMa(matMa, ch);
    if (!khoa) return false;
    this.khoaMa = khoa;
    return true;
  }

  /** Xóa khóa khỏi bộ nhớ → quay lại màn khóa. */
  khoaLai(): void {
    this.khoaMa = null;
  }

  /** Kiểm tra mật mã hiện tại mà không đổi trạng thái khóa. */
  async xacNhanMatMa(matMa: string): Promise<boolean> {
    const ch = await this.layCauHinhMatMa();
    return ch ? !!(await moKhoaBangMatMa(matMa, ch)) : true;
  }

  /** Đổi mật mã: giải mã bằng khóa cũ, mã hóa lại toàn bộ bằng mật mã mới (salt mới). Dữ liệu giữ nguyên. */
  async doiMatMa(matMaCu: string, matMaMoi: string, soVong?: number): Promise<boolean> {
    if (!this.maHoaBat) throw new Error('Chưa bật mật mã.');
    if (!(await this.xacNhanMatMa(matMaCu))) return false;
    if (this.dangKhoa()) await this.moKhoa(matMaCu);
    const du = await this.docThoTatCa();
    const { cauHinh, khoa } = await taoCauHinhMatMa(matMaMoi, soVong);
    const khoaCu = this.khoaMa;
    this.khoaMa = khoa;
    try {
      await this.ghiThoTatCa(du, { datMatMa: cauHinh });
    } catch (e) {
      this.khoaMa = khoaCu;
      throw e;
    }
    await this.ghiNhatKy({ luc: this.dongHo(), hanhDong: 'CAI_DAT', doiTuong: 'matMa', sau: 'đổi' });
    return true;
  }

  /** Tắt mã hóa: giải mã toàn bộ và lưu lại dạng thường. */
  async tatMatMa(matMa: string): Promise<boolean> {
    if (!this.maHoaBat) return true;
    if (!(await this.xacNhanMatMa(matMa))) return false;
    if (this.dangKhoa()) await this.moKhoa(matMa);
    const du = await this.docThoTatCa();
    this.khoaMa = null;
    this.maHoaBat = false;
    try {
      await this.ghiThoTatCa(du, { xoaMatMa: true });
    } catch (e) {
      this.maHoaBat = true;
      await this.moKhoa(matMa);
      throw e;
    }
    await this.ghiNhatKy({ luc: this.dongHo(), hanhDong: 'CAI_DAT', doiTuong: 'matMa', sau: 'tắt' });
    return true;
  }

  // ---------- Dùng cho sao lưu ----------
  /** Mã hóa một giá trị bất kỳ bằng khóa hiện tại (null nếu chưa bật mật mã). */
  async maHoaGoi(giaTri: unknown): Promise<GoiMaHoa | null> {
    this.baoVe();
    return this.khoaMa ? maHoa(this.khoaMa, giaTri) : null;
  }

  /** Thay thế TOÀN BỘ dữ liệu người dùng (caiDat, keHoach, cuoc, viec, khoiThoiGian, keHoachNgay); giữ nhắc đã phát và nhật ký. */
  async thayTheDuLieu(du: Partial<Record<'caiDat' | 'keHoach' | 'cuoc' | 'viec' | 'khoiThoiGian' | 'keHoachNgay', BanGhi[]>>): Promise<void> {
    this.baoVe();
    const tatCa = await this.docThoTatCa();
    for (const k of ['caiDat', 'keHoach', 'cuoc', 'viec', 'khoiThoiGian', 'keHoachNgay'] as const) tatCa.set(k, du[k] ?? []);
    await this.ghiThoTatCa(tatCa);
  }
}
