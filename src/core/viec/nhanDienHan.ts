// Nhận diện hạn từ câu tiếng Việt (ARCHITECTURE §7). Không phân biệt hoa thường/dấu.
import type { NgayISO } from '../kieu';
import {
  congNLV,
  congNgayThuan,
  laNgayISO,
  ngayCuoiThang,
  ngayDauTuan,
  ngayLamViecTruoc,
  tachNgay,
  taoNgay,
  type Lich,
} from '../lich';

export interface KetQuaNhanDien {
  han?: NgayISO;
  /** Phần tiêu đề còn lại sau khi bỏ cụm chỉ hạn */
  phanConLai: string;
  /** Cụm chỉ hạn tìm được (nguyên văn) */
  cum?: string;
}

/** Bỏ dấu từng ký tự (giữ nguyên độ dài chuỗi để ánh xạ vị trí 1–1), chữ thường. */
function boDau(s: string): string {
  let kq = '';
  for (const ch of s.normalize('NFC')) {
    const c = ch === 'đ' || ch === 'Đ' ? 'd' : ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    kq += c.toLowerCase().slice(0, 1) || ch;
  }
  return kq;
}

const TIEN_TO = '(?:(?:truoc|vao|den|toi|han|trong|ngay|luc)\\s+)*';
const THU_SO: Record<string, number> = { hai: 1, ba: 2, tu: 3, nam: 4, sau: 5, bay: 6, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 };

function hopLe(y: number, m: number, d: number): NgayISO | undefined {
  const iso = taoNgay(y, m, d);
  return laNgayISO(iso) ? iso : undefined;
}

export function nhanDienHan(cau: string, ngayGoc: NgayISO, lich: Lich): KetQuaNhanDien {
  const goc = cau.normalize('NFC');
  const n = boDau(goc);
  const { nam: namGoc } = tachNgay(ngayGoc);

  const ket = (han: NgayISO | undefined, m: RegExpExecArray | null): KetQuaNhanDien => {
    if (!han || !m) return { phanConLai: goc.trim() };
    const cum = goc.slice(m.index, m.index + m[0].length);
    const con = (goc.slice(0, m.index) + ' ' + goc.slice(m.index + m[0].length))
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/^[\s,;:.\-–]+|[\s,;:.\-–]+$/g, '');
    return { han, phanConLai: con, cum: cum.trim() };
  };

  let m: RegExpExecArray | null;

  // dd/mm/yyyy
  m = new RegExp(`${TIEN_TO}(?<![\\d/])(\\d{1,2})[/.-](\\d{1,2})[/.-](\\d{4})(?!\\d)`).exec(n);
  if (m) {
    const han = hopLe(Number(m[3]), Number(m[2]), Number(m[1]));
    if (han) return ket(han, m);
  }
  // dd/mm (đã qua trong năm → năm sau)
  m = new RegExp(`${TIEN_TO}(?<![\\d/.-])(\\d{1,2})/(\\d{1,2})(?![\\d/])`).exec(n);
  if (m) {
    let han = hopLe(namGoc, Number(m[2]), Number(m[1]));
    if (han && han < ngayGoc) han = hopLe(namGoc + 1, Number(m[2]), Number(m[1]));
    if (han) return ket(han, m);
  }
  // sau n ngày làm việc / n ngày làm việc
  m = /(?:sau\s+)?(\d{1,3})\s*(?:ngay\s+lam\s+viec|nlv)\b/.exec(n);
  if (m) return ket(congNLV(lich, ngayGoc, Number(m[1])), m);
  // sau n ngày
  m = /sau\s+(\d{1,3})\s*ngay\b/.exec(n);
  if (m) return ket(congNgayThuan(ngayGoc, Number(m[1])), m);
  // thứ X [tuần sau]
  m = new RegExp(`${TIEN_TO}\\bthu\\s+(hai|ba|tu|nam|sau|bay|[2-7])\\b(?:\\s+tuan\\s+(sau|toi|nay))?`).exec(n);
  if (m) {
    const muc = THU_SO[m[1]]; // 1 = thứ Hai … 6 = thứ Bảy
    const thuHieu = muc; // 1..6
    const dauTuan = ngayDauTuan(ngayGoc);
    const trongTuan = congNgayThuan(dauTuan, thuHieu - 1);
    let han: NgayISO;
    if (m[2] === 'sau' || m[2] === 'toi') han = congNgayThuan(trongTuan, 7);
    else if (m[2] === 'nay') han = trongTuan;
    else han = trongTuan > ngayGoc ? trongTuan : congNgayThuan(trongTuan, 7); // gần nhất, không tính hôm nay
    return ket(han, m);
  }
  m = new RegExp(`${TIEN_TO}\\bchu\\s+nhat\\b(?:\\s+tuan\\s+(sau|toi|nay))?`).exec(n);
  if (m) {
    const cn = congNgayThuan(ngayDauTuan(ngayGoc), 6);
    let han = cn;
    if (m[1] === 'sau' || m[1] === 'toi') han = congNgayThuan(cn, 7);
    else if (!m[1] && cn <= ngayGoc) han = congNgayThuan(cn, 7);
    return ket(han, m);
  }
  // hôm nay / ngày kia / ngày mai / mai
  m = /\bhom\s+nay\b/.exec(n);
  if (m) return ket(ngayGoc, m);
  m = /(?:\bngay\s+)?\bkia\b/.exec(n);
  if (m) return ket(congNgayThuan(ngayGoc, 2), m);
  m = /(?:\bngay\s+)?\bmai\b/.exec(n);
  if (m) return ket(congNgayThuan(ngayGoc, 1), m);
  // cuối tuần = thứ Sáu tuần này
  m = /\bcuoi\s+tuan\b/.exec(n);
  if (m) {
    let han = congNgayThuan(ngayDauTuan(ngayGoc), 4);
    if (han < ngayGoc) han = congNgayThuan(han, 7);
    return ket(han, m);
  }
  // cuối tháng = ngày cuối tháng, lùi về ngày làm việc trước
  m = /\bcuoi\s+thang\b/.exec(n);
  if (m) {
    const { nam, thang } = tachNgay(ngayGoc);
    let han = ngayLamViecTruoc(lich, taoNgay(nam, thang, ngayCuoiThang(nam, thang)), true);
    if (han < ngayGoc) {
      const t = thang === 12 ? { nam: nam + 1, thang: 1 } : { nam, thang: thang + 1 };
      han = ngayLamViecTruoc(lich, taoNgay(t.nam, t.thang, ngayCuoiThang(t.nam, t.thang)), true);
    }
    return ket(han, m);
  }
  return { phanConLai: goc.trim() };
}
