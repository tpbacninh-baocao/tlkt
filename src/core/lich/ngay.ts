// Biểu diễn ngày: chuỗi 'YYYY-MM-DD'. Tính toán nội bộ bằng "số ngày kể từ 1970-01-01" (epoch day)
// qua Date.UTC – tuyệt đối không dùng new Date('YYYY-MM-DD') rồi đọc giờ địa phương.
import type { NgayGio, NgayISO } from '../kieu';

const MS_NGAY = 86_400_000;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function laNgayISO(s: unknown): s is NgayISO {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const e = Date.UTC(y, m - 1, d);
  const t = new Date(e);
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function taoNgay(y: number, m: number, d: number): NgayISO {
  return `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;
}

export function tachNgay(n: NgayISO): { nam: number; thang: number; ngay: number } {
  const [nam, thang, ngay] = n.slice(0, 10).split('-').map(Number);
  return { nam, thang, ngay };
}

/** ISO → số ngày kể từ 1970-01-01 */
export function epochNgay(n: NgayISO): number {
  const { nam, thang, ngay } = tachNgay(n);
  return Math.round(Date.UTC(nam, thang - 1, ngay) / MS_NGAY);
}

/** số ngày kể từ 1970-01-01 → ISO */
export function ngayTuEpoch(e: number): NgayISO {
  const t = new Date(e * MS_NGAY);
  return taoNgay(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Cộng n ngày lịch (n âm = lùi), không xét ngày nghỉ. */
export function congNgayThuan(n: NgayISO, soNgay: number): NgayISO {
  return ngayTuEpoch(epochNgay(n) + soNgay);
}

/** 0 = Chủ nhật, 1 = thứ Hai … 6 = thứ Bảy */
export function thuTrongTuan(n: NgayISO): number {
  // 1970-01-01 là thứ Năm (4)
  return (((epochNgay(n) + 4) % 7) + 7) % 7;
}

export function soNgayGiua(a: NgayISO, b: NgayISO): number {
  return epochNgay(b) - epochNgay(a);
}

export function soSanhNgay(a: NgayISO, b: NgayISO): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function ngayCuoiThang(nam: number, thang: number): number {
  return new Date(Date.UTC(nam, thang, 0)).getUTCDate();
}

/** Cộng m tháng; nếu tháng đích không có ngày đó thì lấy ngày cuối tháng. */
export function congThangThuan(n: NgayISO, m: number): NgayISO {
  const { nam, thang, ngay } = tachNgay(n);
  const idx = nam * 12 + (thang - 1) + m;
  const y = Math.floor(idx / 12);
  const mo = (idx % 12 + 12) % 12 + 1;
  return taoNgay(y, mo, Math.min(ngay, ngayCuoiThang(y, mo)));
}

export function ngayDauTuan(n: NgayISO): NgayISO {
  const t = thuTrongTuan(n);
  return congNgayThuan(n, t === 0 ? -6 : 1 - t);
}

// ---------- Ngày giờ ----------
export function tachNgayGio(t: NgayGio): { ngay: NgayISO; phut: number } {
  const [n, g = '00:00'] = t.split('T');
  const [h, m] = g.split(':').map(Number);
  return { ngay: n, phut: h * 60 + (m || 0) };
}

export function ghepNgayGio(ngay: NgayISO, phut: number): NgayGio {
  return `${ngay}T${pad2(Math.floor(phut / 60))}:${pad2(phut % 60)}`;
}

export function gioSangPhut(g: string): number {
  const [h, m] = g.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function phutSangGio(p: number): string {
  return `${pad2(Math.floor(p / 60))}:${pad2(p % 60)}`;
}

/** Ngày giờ + n ngày/phút (dùng cho lịch nhắc). */
export function congPhutNgayGio(t: NgayGio, phut: number): NgayGio {
  const { ngay, phut: p } = tachNgayGio(t);
  const tong = p + phut;
  const soNgay = Math.floor(tong / 1440);
  return ghepNgayGio(congNgayThuan(ngay, soNgay), ((tong % 1440) + 1440) % 1440);
}

// ---------- Hiển thị tiếng Việt ----------
const TEN_THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function tenThu(n: NgayISO): string {
  return TEN_THU[thuTrongTuan(n)];
}

export function thuNgan(n: NgayISO): string {
  return THU_NGAN[thuTrongTuan(n)];
}

/** dd/mm/yyyy */
export function dinhDangNgay(n: NgayISO): string {
  const { nam, thang, ngay } = tachNgay(n);
  return `${pad2(ngay)}/${pad2(thang)}/${nam}`;
}

/** dd/mm */
export function dinhDangNgayNgan(n: NgayISO): string {
  const { thang, ngay } = tachNgay(n);
  return `${pad2(ngay)}/${pad2(thang)}`;
}

/** "Thứ Hai 23/11/2026" */
export function dinhDangNgayThu(n: NgayISO): string {
  return `${tenThu(n)} ${dinhDangNgay(n)}`;
}

/** "dd/mm/yyyy HH:MM" */
export function dinhDangNgayGio(t: NgayGio): string {
  const { ngay, phut } = tachNgayGio(t);
  return `${dinhDangNgay(ngay)} ${phutSangGio(phut)}`;
}

/** 1234567 → "1.234.567" */
export function dinhDangSo(n: number): string {
  const lam = Math.round(n);
  const dau = lam < 0 ? '-' : '';
  return dau + String(Math.abs(lam)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "dd/mm/yyyy" → ISO (hoặc null nếu không hợp lệ). Chấp nhận d/m/yyyy. */
export function docNgayVN(s: string): NgayISO | null {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(s);
  if (!m) return null;
  const iso = taoNgay(Number(m[3]), Number(m[2]), Number(m[1]));
  return laNgayISO(iso) ? iso : null;
}

/** Ngày hôm nay (giờ địa phương) – chỉ dùng ở lớp giao diện/dữ liệu, không dùng trong core. */
export function homNayTuDate(d: Date = new Date()): NgayISO {
  return taoNgay(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function bayGioTuDate(d: Date = new Date()): NgayGio {
  return `${homNayTuDate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 135 → "2 giờ 15 phút"; 45 → "45 phút"; 120 → "2 giờ" */
export function dinhDangThoiLuong(phut: number): string {
  const p = Math.abs(Math.round(phut));
  const h = Math.floor(p / 60);
  const m = p % 60;
  if (h && m) return `${h} giờ ${m} phút`;
  if (h) return `${h} giờ`;
  return `${m} phút`;
}
