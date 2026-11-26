// Nạp bộ quy tắc từ rules/*.json, gộp kế thừa (keThua + ghiDe), áp bản vá của người dùng, chọn bộ theo ngày QĐ.
// ARCHITECTURE §4.7, §4.8.
import quyTac1161 from '../../../rules/quy-tac-QTKT-1161.json';
import quyTac970 from '../../../rules/quy-tac-QTKT-970.json';
import type { BoQuyTac, BuocQuyTac, CheDoX, HanDacTa, NgayISO } from '../kieu';

/** Dữ liệu thô của một bộ quy tắc (có thể chỉ có keThua + ghiDe). */
export interface BoQuyTacGoc {
  ma: string;
  ten: string;
  keThua?: string;
  apDung: { ngayQDTu: NgayISO | null; ngayQDDen: NgayISO | null };
  ghiDe?: Record<string, Record<string, unknown>>;
  [khac: string]: unknown;
}

/** Danh sách bộ quy tắc gốc, theo thứ tự ưu tiên khi chọn (bộ mới đứng trước). */
export const DANH_SACH_BO_GOC: BoQuyTacGoc[] = [
  quyTac1161 as unknown as BoQuyTacGoc,
  quyTac970 as unknown as BoQuyTacGoc,
];

export const BO_MAC_DINH = 'QTKT-1161';

// ---------- Bản vá người dùng ----------
export interface VaBuoc {
  so?: number;
  soNeuGDLK?: number;
  donVi?: 'NLV' | 'N' | 'THANG';
  dem?: number;
}
export interface VaBoQuyTac {
  buoc?: Record<string, VaBuoc>;
  thamSo?: Record<string, number>;
  cheDoX?: Record<string, { so?: number; donVi?: 'NLV' | 'N' | 'THANG' }>;
}
/** Khóa = mã bộ quy tắc (ví dụ 'QTKT-1161'). Bản vá của bộ cha cũng đè xuống bộ con kế thừa. */
export type VaQuyTac = Record<string, VaBoQuyTac>;

const TRUONG_RIENG = new Set(['thamSo', 'cheDoX', 'suKien', 'dongHo', 'keHoach']);

function nhanBan<T>(x: T): T {
  return structuredClone(x);
}

function goc(ma: string, danhSach: BoQuyTacGoc[] = DANH_SACH_BO_GOC): BoQuyTacGoc {
  const g = danhSach.find((b) => b.ma === ma);
  if (!g) throw new Error(`Không có bộ quy tắc ${ma}`);
  return g;
}

function apVaVaoBo(bo: BoQuyTac, va: VaBoQuyTac | undefined): BoQuyTac {
  if (!va) return bo;
  for (const [maBuoc, v] of Object.entries(va.buoc ?? {})) {
    const b = bo.buoc.find((x) => x.ma === maBuoc);
    if (!b) continue;
    if (v.dem !== undefined) b.dem = v.dem;
    if (b.han) {
      if (v.so !== undefined) b.han.so = v.so;
      if (v.soNeuGDLK !== undefined) b.han.soNeuGDLK = v.soNeuGDLK;
      if (v.donVi !== undefined) b.han.donVi = v.donVi;
    }
  }
  for (const [k, v] of Object.entries(va.thamSo ?? {})) bo.thamSo[k] = v;
  for (const [k, v] of Object.entries(va.cheDoX ?? {})) {
    const c = bo.cheDoX[k];
    if (c && typeof c === 'object') {
      if (v.so !== undefined) c.han.so = v.so;
      if (v.donVi !== undefined) c.han.donVi = v.donVi;
    }
  }
  return bo;
}

/** Gộp bộ quy tắc: kế thừa cha → ghi đè → áp bản vá của chính bộ đó. */
export function giaiBoQuyTac(
  ma: string,
  va: VaQuyTac = {},
  danhSach: BoQuyTacGoc[] = DANH_SACH_BO_GOC,
): BoQuyTac {
  const g = goc(ma, danhSach);
  let bo: BoQuyTac;
  if (g.keThua) {
    bo = giaiBoQuyTac(g.keThua, va, danhSach);
    bo.ma = g.ma;
    bo.ten = g.ten;
    bo.keThua = g.keThua;
    bo.apDung = nhanBan(g.apDung);
    if (typeof g.ghiChuApDung === 'string') bo.ghiChuApDung = g.ghiChuApDung;
    if (Array.isArray(g.chuaXacNhan)) bo.chuaXacNhan = nhanBan(g.chuaXacNhan as string[]);
    for (const [khoa, giaTri] of Object.entries(g.ghiDe ?? {})) {
      if (TRUONG_RIENG.has(khoa)) {
        const dich = (bo as unknown as Record<string, Record<string, unknown>>)[khoa];
        Object.assign(dich, nhanBan(giaTri));
        continue;
      }
      const b = bo.buoc.find((x) => x.ma === khoa);
      if (!b) continue;
      const moi = nhanBan(giaTri) as Partial<BuocQuyTac>;
      // `han` được thay nguyên khối (không gộp sâu) để không dính tham số của bộ cha (ví dụ soNeuGDLK).
      Object.assign(b, moi);
    }
  } else {
    bo = nhanBan(g) as unknown as BoQuyTac;
  }
  return apVaVaoBo(bo, va[ma]);
}

export function danhSachMaBo(danhSach: BoQuyTacGoc[] = DANH_SACH_BO_GOC): string[] {
  return danhSach.map((b) => b.ma);
}

/** Bộ có `keThua` là bộ chuyển tiếp (hiển thị nhãn “Chuyển tiếp – chưa xác nhận”). */
export function laBoChuyenTiep(bo: BoQuyTac): boolean {
  return !!bo.keThua;
}

/**
 * Chọn bộ quy tắc theo ngày ban hành QĐ kiểm tra (D0 thực tế hoặc dự kiến; chưa có thì ngày hôm nay).
 * `ghiDe`: mã bộ do người dùng chọn riêng cho cuộc.
 */
export function chonBoQuyTac(
  d0: NgayISO | undefined,
  homNay: NgayISO,
  ghiDe?: string,
  va: VaQuyTac = {},
  danhSach: BoQuyTacGoc[] = DANH_SACH_BO_GOC,
): BoQuyTac {
  if (ghiDe && danhSach.some((b) => b.ma === ghiDe)) return giaiBoQuyTac(ghiDe, va, danhSach);
  const ngay = d0 ?? homNay;
  const trung = danhSach.find((b) => {
    const { ngayQDTu, ngayQDDen } = b.apDung;
    return (ngayQDTu === null || ngayQDTu <= ngay) && (ngayQDDen === null || ngay <= ngayQDDen);
  });
  return giaiBoQuyTac((trung ?? danhSach[0]).ma, va, danhSach);
}

/** Đặt lại về mặc định: bỏ toàn bộ bản vá của một bộ (hoặc của một bước nếu có maBuoc). */
export function khoiPhucMacDinh(va: VaQuyTac, maBo: string, maBuoc?: string): VaQuyTac {
  const moi = nhanBan(va);
  if (!maBuoc) {
    delete moi[maBo];
    return moi;
  }
  if (moi[maBo]?.buoc) delete moi[maBo].buoc![maBuoc];
  return moi;
}

/** Đặt một tham số bước trong bản vá (trả về bản vá mới, không sửa bản cũ). */
export function datVaBuoc(va: VaQuyTac, maBo: string, maBuoc: string, thayDoi: VaBuoc): VaQuyTac {
  const moi = nhanBan(va);
  const bo = (moi[maBo] ??= {});
  const buoc = (bo.buoc ??= {});
  buoc[maBuoc] = { ...(buoc[maBuoc] ?? {}), ...thayDoi };
  return moi;
}

export function datVaThamSo(va: VaQuyTac, maBo: string, ten: string, giaTri: number): VaQuyTac {
  const moi = nhanBan(va);
  const bo = (moi[maBo] ??= {});
  (bo.thamSo ??= {})[ten] = giaTri;
  return moi;
}

export function laCheDoX(x: CheDoX | string | undefined): x is CheDoX {
  return typeof x === 'object' && x !== null;
}

export function layBuoc(bo: BoQuyTac, ma: string): BuocQuyTac | undefined {
  return bo.buoc.find((b) => b.ma === ma);
}

/** Giá trị hạn đang dùng của bước (dùng cho màn Cài đặt: hiển thị bản gốc vs bản đã vá). */
export function hanCuaBuoc(bo: BoQuyTac, ma: string): HanDacTa | null | undefined {
  return layBuoc(bo, ma)?.han;
}

// ---------- Chỉnh bản vá theo từng trường (chỉ lưu phần KHÁC mặc định; bản vá rỗng tự bị xóa) ----------
function donDep(va: VaQuyTac, maBo: string): VaQuyTac {
  const bo = va[maBo];
  if (!bo) return va;
  for (const [k, v] of Object.entries(bo.buoc ?? {})) if (!Object.keys(v).length) delete bo.buoc![k];
  for (const [k, v] of Object.entries(bo.cheDoX ?? {})) if (!Object.keys(v).length) delete bo.cheDoX![k];
  if (bo.buoc && !Object.keys(bo.buoc).length) delete bo.buoc;
  if (bo.cheDoX && !Object.keys(bo.cheDoX).length) delete bo.cheDoX;
  if (bo.thamSo && !Object.keys(bo.thamSo).length) delete bo.thamSo;
  if (!Object.keys(bo).length) delete va[maBo];
  return va;
}

export function datVaBuocTruong<K extends keyof VaBuoc>(va: VaQuyTac, maBo: string, maBuoc: string, truong: K, giaTri: VaBuoc[K], goc: VaBuoc[K]): VaQuyTac {
  const moi = nhanBan(va);
  const b = ((moi[maBo] ??= {}).buoc ??= {});
  const p = (b[maBuoc] ??= {});
  if (giaTri === goc || giaTri === undefined) delete p[truong];
  else p[truong] = giaTri;
  return donDep(moi, maBo);
}

export function datVaThamSoTruong(va: VaQuyTac, maBo: string, ten: string, giaTri: number | undefined, goc: number | undefined): VaQuyTac {
  const moi = nhanBan(va);
  const t = ((moi[maBo] ??= {}).thamSo ??= {});
  if (giaTri === goc || giaTri === undefined) delete t[ten];
  else t[ten] = giaTri;
  return donDep(moi, maBo);
}

export function datVaCheDoX(va: VaQuyTac, maBo: string, che: string, truong: 'so' | 'donVi', giaTri: number | 'NLV' | 'N' | 'THANG' | undefined, goc: number | 'NLV' | 'N' | 'THANG' | undefined): VaQuyTac {
  const moi = nhanBan(va);
  const c = ((moi[maBo] ??= {}).cheDoX ??= {});
  const p = (c[che] ??= {}) as Record<string, unknown>;
  if (giaTri === goc || giaTri === undefined) delete p[truong];
  else p[truong] = giaTri;
  return donDep(moi, maBo);
}

/** Số mục đã sửa của một bộ (bước + tham số + chế độ X). */
export function demMucDaSua(va: VaQuyTac, maBo: string): number {
  const b = va[maBo];
  if (!b) return 0;
  const dem = (o?: Record<string, object>) => Object.values(o ?? {}).reduce((t, p) => t + Object.keys(p).length, 0);
  return dem(b.buoc as Record<string, object>) + dem(b.cheDoX as Record<string, object>) + Object.keys(b.thamSo ?? {}).length;
}
