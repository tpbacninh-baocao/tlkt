// Tính hạn của MỘT bước theo đặc tả `han` trong rules/*.json (ARCHITECTURE §4.4, §4.5).
import type { BoQuyTac, HanDacTa, NgayISO, SuKien } from '../kieu';
import {
  congNLV,
  congNgay,
  congNgayKhongLui,
  congNgayThuan,
  congThang,
  lui,
  ngayLamViecTruoc,
  soNgayGiua,
  type Lich,
} from '../lich';
import { laCheDoX } from './nap';

export interface MocDaBiet {
  ngay: NgayISO;
  /** true = ngày dự kiến (chưa có ngày thực tế) */
  duKien: boolean;
}

export type BangMoc = Partial<Record<string, MocDaBiet>>;

export interface NguCanhHan {
  lich: Lich;
  bo: BoQuyTac;
  coGDLK: boolean;
  suKien: SuKien[];
  /** X1..X4 đã được chọn (dùng cho bước X: `theoCheDo`) */
  cheDoX?: string;
}

export interface KetQuaHan {
  han?: NgayISO;
  duKien: boolean;
  /** Mã mốc còn thiếu nên chưa tính được hạn */
  thieuMoc?: string;
  ghiChu?: string;
}

function chuoiSo(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
}

/** Tổng số ngày lịch của các sự kiện TAM_DUNG (denNgay − tuNgay + 1). */
export function tongNgayTamDung(suKien: SuKien[]): number {
  let tong = 0;
  for (const s of suKien) {
    if (s.loai !== 'TAM_DUNG') continue;
    const tu = s.tuNgay as NgayISO | undefined;
    const den = s.denNgay as NgayISO | undefined;
    if (!tu || !den || den < tu) continue;
    tong += soNgayGiua(tu, den) + 1;
  }
  return tong;
}

/** Sự kiện gia hạn (chỉ tính 1 lần – lấy sự kiện đầu tiên theo thời gian tạo). */
export function suKienGiaHan(suKien: SuKien[]): SuKien | undefined {
  return suKien.filter((s) => s.loai === 'GIA_HAN' && chuoiSo(s.soNgay)).sort((a, b) => (a.taoLuc < b.taoLuc ? -1 : 1))[0];
}

/**
 * Thuật toán E (bước T1) – bắt buộc (ARCHITECTURE §4.5):
 * gốc = C + so (ngày lịch, không lùi | NLV) → cộng ngày tạm dừng → cộng gia hạn → lùi MỘT lần ở cuối.
 */
export function tinhE(dacTa: HanDacTa, C: NgayISO, nc: Pick<NguCanhHan, 'lich' | 'coGDLK' | 'suKien'>): NgayISO {
  const so = (nc.coGDLK && dacTa.soNeuGDLK !== undefined ? dacTa.soNeuGDLK : dacTa.so) ?? 0;
  let g = dacTa.donVi === 'N' ? congNgayKhongLui(nc.lich, C, so) : congNLV(nc.lich, C, so);
  if (dacTa.congTamDung) {
    const td = tongNgayTamDung(nc.suKien);
    if (td > 0) g = congNgayThuan(g, td);
  }
  const gh = suKienGiaHan(nc.suKien);
  if (gh) {
    const soNgay = gh.soNgay as number;
    const donVi = dacTa.giaHan?.donVi ?? dacTa.donVi ?? 'N';
    g = donVi === 'NLV' ? congNLV(nc.lich, g, soNgay) : congNgayThuan(g, soNgay);
  }
  return lui(nc.lich, g);
}

/** Cộng/trừ `so` đơn vị `donVi` vào mốc `tu`. */
function congTheoDonVi(lich: Lich, tu: NgayISO, so: number, donVi: string, huong: '+' | '-'): NgayISO {
  const n = huong === '-' ? -so : so;
  switch (donVi) {
    case 'NLV':
      return congNLV(lich, tu, n);
    case 'THANG':
      return congThang(lich, tu, n);
    case 'N':
    default:
      return n >= 0 ? congNgay(lich, tu, n) : ngayLamViecTruoc(lich, congNgayThuan(tu, n), true);
  }
}

/**
 * Tính hạn pháp lý (hoặc hạn nội bộ nếu `noiBo`) của một bước.
 * @param dacTa  đặc tả `han` trong JSON
 * @param moc    các mốc đã biết (thực tế hoặc dự kiến)
 */
export function tinhHan(dacTa: HanDacTa | null | undefined, moc: BangMoc, nc: NguCanhHan): KetQuaHan {
  if (!dacTa) return { duKien: false };

  // Hạn thay thế bởi sự kiện (HOAN → hạn = denNgay của sự kiện)
  if (dacTa.suKienThayThe) {
    const sk = nc.suKien
      .filter((s) => s.loai === dacTa.suKienThayThe && typeof s.denNgay === 'string')
      .sort((a, b) => (a.taoLuc < b.taoLuc ? 1 : -1))[0];
    if (sk) return { han: sk.denNgay as NgayISO, duKien: false, ghiChu: `Hạn theo sự kiện ${sk.loai}` };
  }

  // Bước X: lấy hạn của chế độ đã chọn
  if (dacTa.theoCheDo) {
    const che = nc.cheDoX ?? 'X1';
    const c = nc.bo.cheDoX[che];
    if (!laCheDoX(c)) return { duKien: false };
    const kq = tinhHan(c.han, moc, nc);
    return { ...kq, ghiChu: `Chế độ ${che}: ${c.ten}` };
  }

  // Hạn = chính mốc đó (thực tế, hoặc dự kiến); mặc định theo mốc khác nếu chưa có
  if (dacTa.truoc) {
    let m = moc[dacTa.truoc];
    if (!m && dacTa.macDinhNeuChuaCoK) m = moc[dacTa.macDinhNeuChuaCoK];
    if (!m) return { duKien: true, thieuMoc: dacTa.truoc };
    return { han: m.ngay, duKien: m.duKien };
  }

  if (!dacTa.tu) return { duKien: false };
  const mocGoc = moc[dacTa.tu];
  if (!mocGoc) return { duKien: true, thieuMoc: dacTa.tu };

  const huong = dacTa.huong ?? '+';
  const soThamSo = dacTa.thamSo ? nc.bo.thamSo[dacTa.thamSo] : undefined;
  const so = (nc.coGDLK && dacTa.soNeuGDLK !== undefined ? dacTa.soNeuGDLK : soThamSo ?? dacTa.so) ?? 0;
  const donVi = dacTa.donVi ?? 'NLV';

  let han: NgayISO;
  if (dacTa.congTamDung || dacTa.giaHan) {
    han = tinhE({ ...dacTa, so }, mocGoc.ngay, nc);
  } else {
    han = congTheoDonVi(nc.lich, mocGoc.ngay, so, donVi, huong);
  }
  let duKien = mocGoc.duKien;

  if (dacTa.vaTruoc) {
    const gioiHan = moc[dacTa.vaTruoc];
    if (gioiHan && gioiHan.ngay < han) {
      han = gioiHan.ngay;
      duKien = gioiHan.duKien;
    }
  }
  return { han, duKien };
}

/** Hạn mục tiêu = hạn pháp lý lùi `dem` NLV (dùng để nhắc việc). */
export function tinhHanMucTieu(lich: Lich, hanPhapLy: NgayISO, dem: number): NgayISO {
  if (!dem) return hanPhapLy;
  return congNLV(lich, hanPhapLy, -dem);
}

/** Chọn chế độ X: X3 nếu có PHUC_TAP; X2 nếu có GIAI_TRINH; X1 nếu có xử lý; ngược lại X4. */
export function chonCheDoX(suKien: SuKien[], coXuLy: boolean): 'X1' | 'X2' | 'X3' | 'X4' {
  if (suKien.some((s) => s.loai === 'PHUC_TAP')) return 'X3';
  if (suKien.some((s) => s.loai === 'GIAI_TRINH')) return 'X2';
  return coXuLy ? 'X1' : 'X4';
}
