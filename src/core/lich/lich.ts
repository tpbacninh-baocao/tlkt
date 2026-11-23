// Lịch làm việc và các hàm cộng/trừ ngày, ngày làm việc (NLV), giờ làm việc (ARCHITECTURE §4.2–4.3).
// Mọi hàm là hàm thuần; "chế độ thận trọng" nằm trong đối tượng Lich.
import type { NgayGio, NgayISO } from '../kieu';
import {
  congNgayThuan,
  congThangThuan,
  epochNgay,
  ghepNgayGio,
  gioSangPhut,
  tachNgay,
  tachNgayGio,
  thuTrongTuan,
} from './ngay';

export interface NgayNghiCoDinh {
  ngayThang: string; // 'MM-DD'
  ten: string;
}

export interface NgayNghiTheoNam {
  daXacNhan: boolean;
  ngayNghi: NgayISO[];
  ngayLamBu: NgayISO[];
}

export interface CauHinhLich {
  ngayNghiCoDinh?: NgayNghiCoDinh[];
  theoNam?: Record<string, NgayNghiTheoNam>;
  ngayNghiThem?: NgayISO[];
  ngayLamBu?: NgayISO[];
  gioLamViec?: [string, string][];
  cheDoThanTrong?: boolean;
}

export interface Lich {
  readonly nghiCoDinh: ReadonlyMap<string, string>; // 'MM-DD' → tên
  readonly nghi: ReadonlyMap<NgayISO, string>; // ngày cụ thể → tên
  readonly lamBu: ReadonlySet<NgayISO>;
  readonly khung: readonly (readonly [number, number])[]; // phút trong ngày
  readonly thanTrong: boolean;
}

export const GIO_LAM_VIEC_MAC_DINH: [string, string][] = [
  ['07:30', '11:30'],
  ['13:00', '17:00'],
];

const GIOI_HAN_VONG = 100_000;

export function taoLich(cauHinh: CauHinhLich = {}): Lich {
  const nghiCoDinh = new Map<string, string>();
  for (const n of cauHinh.ngayNghiCoDinh ?? []) nghiCoDinh.set(n.ngayThang, n.ten);
  const nghi = new Map<NgayISO, string>();
  const lamBu = new Set<NgayISO>();
  for (const nam of Object.values(cauHinh.theoNam ?? {})) {
    for (const d of nam.ngayNghi) nghi.set(d, 'Ngày nghỉ');
    for (const d of nam.ngayLamBu) lamBu.add(d);
  }
  for (const d of cauHinh.ngayNghiThem ?? []) nghi.set(d, 'Ngày nghỉ (nhập thêm)');
  for (const d of cauHinh.ngayLamBu ?? []) lamBu.add(d);
  const khung = (cauHinh.gioLamViec ?? GIO_LAM_VIEC_MAC_DINH)
    .map(([a, b]) => [gioSangPhut(a), gioSangPhut(b)] as const)
    .sort((x, y) => x[0] - y[0]);
  return { nghiCoDinh, nghi, lamBu, khung, thanTrong: cauHinh.cheDoThanTrong ?? false };
}

/** Lịch chỉ gồm thứ Hai–thứ Sáu, không ngày nghỉ (dùng trong test). */
export function lichTronTru(thanTrong = false): Lich {
  return taoLich({ cheDoThanTrong: thanTrong });
}

/** Tên ngày nghỉ (nếu là ngày nghỉ lễ), ngược lại undefined. */
export function tenNgayNghi(l: Lich, d: NgayISO): string | undefined {
  return l.nghi.get(d) ?? l.nghiCoDinh.get(d.slice(5));
}

export function laNgayLamBu(l: Lich, d: NgayISO): boolean {
  return l.lamBu.has(d);
}

export function laNgayLamViec(l: Lich, d: NgayISO): boolean {
  if (l.lamBu.has(d)) return true;
  const thu = thuTrongTuan(d);
  if (thu === 0 || thu === 6) return false;
  return tenNgayNghi(l, d) === undefined;
}

/** Lùi → ngày làm việc kế tiếp (Điều 148 BLDS). Chế độ thận trọng: không lùi. */
export function lui(l: Lich, d: NgayISO): NgayISO {
  if (l.thanTrong) return d;
  return ngayLamViecKeTiep(l, d, true);
}

/** Nếu d là ngày làm việc và baoGomD thì trả d; ngược lại tìm ngày làm việc kế tiếp. */
export function ngayLamViecKeTiep(l: Lich, d: NgayISO, baoGomD = false): NgayISO {
  let c = baoGomD ? d : congNgayThuan(d, 1);
  for (let i = 0; i < 400 && !laNgayLamViec(l, c); i++) c = congNgayThuan(c, 1);
  return c;
}

/** Ngày làm việc liền trước (baoGomD: nếu d là NLV thì trả d). */
export function ngayLamViecTruoc(l: Lich, d: NgayISO, baoGomD = false): NgayISO {
  let c = baoGomD ? d : congNgayThuan(d, -1);
  for (let i = 0; i < 400 && !laNgayLamViec(l, c); i++) c = congNgayThuan(c, -1);
  return c;
}

/**
 * Cộng n ngày làm việc. n > 0: ngày làm việc thứ n sau d (ngày d không tính).
 * n < 0: đi lùi tương tự. n = 0: d.
 * Chế độ thận trọng (n > 0): nếu d là ngày làm việc thì d được tính là ngày thứ 1.
 */
export function congNLV(l: Lich, d: NgayISO, n: number): NgayISO {
  if (n === 0) return d;
  const buoc = n > 0 ? 1 : -1;
  let can = Math.abs(n);
  if (n > 0 && l.thanTrong && laNgayLamViec(l, d)) can -= 1;
  let c = d;
  for (let i = 0; can > 0 && i < GIOI_HAN_VONG; i++) {
    c = congNgayThuan(c, buoc);
    if (laNgayLamViec(l, c)) can--;
  }
  return c;
}

/** Cộng ngày lịch nhưng KHÔNG lùi qua ngày nghỉ (dùng cho bước trung gian của tính E). */
export function congNgayKhongLui(l: Lich, d: NgayISO, n: number): NgayISO {
  if (l.thanTrong && n > 0) return congNgayThuan(d, n - 1);
  return congNgayThuan(d, n);
}

/** Cộng n ngày lịch rồi lùi sang ngày làm việc kế tiếp nếu rơi ngày nghỉ. */
export function congNgay(l: Lich, d: NgayISO, n: number): NgayISO {
  return lui(l, congNgayKhongLui(l, d, n));
}

/** Cộng m tháng (cùng ngày; thiếu thì ngày cuối tháng) rồi lùi. Thận trọng: lùi 1 ngày, không lùi qua ngày nghỉ. */
export function congThang(l: Lich, d: NgayISO, m: number): NgayISO {
  const c = congThangThuan(d, m);
  if (l.thanTrong && m > 0) return congNgayThuan(c, -1);
  return lui(l, c);
}

/** Số ngày làm việc trong khoảng (a, b]. Nếu b < a trả số âm = −(số NLV trong (b, a]). */
export function demNLV(l: Lich, a: NgayISO, b: NgayISO): number {
  const ea = epochNgay(a);
  const eb = epochNgay(b);
  if (ea === eb) return 0;
  const [tu, den, dau] = ea < eb ? [a, b, 1] : [b, a, -1];
  let dem = 0;
  let c = tu;
  for (let i = 0; c < den && i < GIOI_HAN_VONG; i++) {
    c = congNgayThuan(c, 1);
    if (laNgayLamViec(l, c)) dem++;
  }
  return dem * dau;
}

// ---------- Giờ làm việc ----------

/**
 * Cộng h giờ làm việc vào thời điểm t. Nếu t nằm ngoài khung giờ thì bắt đầu tính từ đầu khung kế tiếp.
 * Kết thúc đúng cuối khung thì trả về cuối khung (không nhảy sang khung sau).
 */
export function congGioLV(l: Lich, t: NgayGio, h: number): NgayGio {
  let { ngay, phut } = tachNgayGio(t);
  let con = Math.round(h * 60);
  for (let i = 0; i < 2000; i++) {
    if (laNgayLamViec(l, ngay)) {
      for (const [s, e] of l.khung) {
        if (phut >= e) continue;
        const batDau = Math.max(phut, s);
        const trong = e - batDau;
        if (con <= trong) return ghepNgayGio(ngay, batDau + con);
        con -= trong;
        phut = e;
      }
    }
    ngay = congNgayThuan(ngay, 1);
    phut = 0;
  }
  return ghepNgayGio(ngay, phut);
}

/** Số phút làm việc giữa hai thời điểm (a ≤ b); 0 nếu b ≤ a. */
export function phutLamViecGiua(l: Lich, a: NgayGio, b: NgayGio): number {
  if (b <= a) return 0;
  const A = tachNgayGio(a);
  const B = tachNgayGio(b);
  let tong = 0;
  let c = A.ngay;
  for (let i = 0; c <= B.ngay && i < 4000; i++) {
    if (laNgayLamViec(l, c)) {
      const tu = c === A.ngay ? A.phut : 0;
      const den = c === B.ngay ? B.phut : 1440;
      for (const [s, e] of l.khung) {
        const x = Math.max(s, tu);
        const y = Math.min(e, den);
        if (y > x) tong += y - x;
      }
    }
    c = congNgayThuan(c, 1);
  }
  return tong;
}

/** Danh sách ngày nghỉ lễ (cố định + theo năm + nhập thêm) của một năm, sắp theo ngày. */
export function ngayNghiCuaNam(l: Lich, nam: number): { ngay: NgayISO; ten: string }[] {
  const kq = new Map<NgayISO, string>();
  for (const [mmdd, ten] of l.nghiCoDinh) kq.set(`${nam}-${mmdd}`, ten);
  for (const [d, ten] of l.nghi) if (tachNgay(d).nam === nam) kq.set(d, ten);
  return [...kq.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([ngay, ten]) => ({ ngay, ten }));
}
