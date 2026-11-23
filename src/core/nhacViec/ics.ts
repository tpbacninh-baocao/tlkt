// Xuất lịch .ics (RFC 5545) và link “Thêm vào Google Lịch” (ARCHITECTURE §8.2).
// Giờ dùng dạng “floating” (không múi giờ) để hiện đúng giờ địa phương trên mọi thiết bị.
import type { NgayGio, NgayISO } from '../kieu';
import { congPhutNgayGio, dinhDangNgay, thuNgan } from '../lich';
import { chonBoQuyTac } from '../quyTac';
import { tinhMoc } from '../vuViec/tinhMoc';
import { nhanCuoc } from './anDanh';
import type { DuLieuNhac } from './sinhNhac';

export interface SuKienLich {
  uid: string; // đã gồm @tlkt
  ngay: NgayISO;
  gioTu: string; // HH:MM
  gioDen: string;
  tieuDe: string;
  moTa: string;
  /** Các mốc báo trước: '-P2D', '-P1D', 'PT0M' */
  canhBao: string[];
}

export const CANH_BAO_MAC_DINH = ['-P2D', '-P1D', 'PT0M'];

// ---------- Chuỗi iCalendar ----------
export function thoatICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Gập dòng ≤ 75 octet (UTF-8), nối tiếp bằng CRLF + dấu cách; không cắt giữa ký tự. */
export function gapDong(dong: string): string {
  const enc = new TextEncoder();
  if (enc.encode(dong).length <= 75) return dong;
  const phan: string[] = [];
  let hienTai = '';
  let byte = 0;
  let gioiHan = 75;
  for (const ch of dong) {
    const b = enc.encode(ch).length;
    if (byte + b > gioiHan) {
      phan.push(hienTai);
      hienTai = '';
      byte = 0;
      gioiHan = 74; // dòng tiếp bắt đầu bằng 1 dấu cách
    }
    hienTai += ch;
    byte += b;
  }
  phan.push(hienTai);
  return phan.join('\r\n ');
}

function ngayGioICS(ngay: NgayISO, gio: string): string {
  return `${ngay.replace(/-/g, '')}T${gio.replace(':', '')}00`;
}

/** DTSTAMP phải là UTC: giờ địa phương Việt Nam (UTC+7) − 7 giờ. */
function dauThoiGianUTC(bayGio: NgayGio): string {
  const utc = congPhutNgayGio(bayGio, -7 * 60);
  return `${utc.slice(0, 10).replace(/-/g, '')}T${utc.slice(11, 13)}${utc.slice(14, 16)}00Z`;
}

export function taoICS(ds: SuKienLich[], bayGio: NgayGio, tenLich = 'TLKT – Hạn kiểm tra'): string {
  const dong: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TLKT//Tro ly Doan kiem tra//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${thoatICS(tenLich)}`, 'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'];
  const dtstamp = dauThoiGianUTC(bayGio);
  for (const e of ds) {
    dong.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${dtstamp}`, `DTSTART:${ngayGioICS(e.ngay, e.gioTu)}`, `DTEND:${ngayGioICS(e.ngay, e.gioDen)}`, `SUMMARY:${thoatICS(e.tieuDe)}`, `DESCRIPTION:${thoatICS(e.moTa)}`, 'TRANSP:TRANSPARENT');
    for (const t of e.canhBao) {
      dong.push('BEGIN:VALARM', `TRIGGER:${t}`, 'ACTION:DISPLAY', `DESCRIPTION:${thoatICS(e.tieuDe)}`, 'END:VALARM');
    }
    dong.push('END:VEVENT');
  }
  dong.push('END:VCALENDAR');
  return dong.map(gapDong).join('\r\n') + '\r\n';
}

// ---------- Google Lịch ----------
export function linkGoogleLich(e: { ngay: NgayISO; gioTu?: string; gioDen?: string; tieuDe: string; moTa?: string }): string {
  const tu = ngayGioICS(e.ngay, e.gioTu ?? '07:30');
  const den = ngayGioICS(e.ngay, e.gioDen ?? '08:00');
  const q = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(e.tieuDe)}`,
    `dates=${tu}/${den}`,
    'ctz=Asia%2FHo_Chi_Minh',
    `details=${encodeURIComponent(e.moTa ?? '')}`,
  ];
  return `https://calendar.google.com/calendar/render?${q.join('&')}`;
}

// ---------- Sinh sự kiện lịch từ dữ liệu ----------
function gioiHan(s: string, n = 110): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

/**
 * Mỗi hạn pháp lý/nội bộ chưa xong = 1 sự kiện 07:30–08:00 ngày HẠN MỤC TIÊU;
 * hạn pháp lý (nếu khác) có thêm sự kiện “HẠN PHÁP LÝ”. UID ổn định để nhập lại không nhân đôi.
 * `cuocId`: chỉ xuất một cuộc.
 */
export function sinhSuKienLich(d: DuLieuNhac, tuNgay: NgayISO, denNgay: NgayISO, cuocId?: string): SuKienLich[] {
  const ra: SuKienLich[] = [];
  const trong = (n: NgayISO) => n >= tuNgay && n <= denNgay;
  for (const c of d.cuoc) {
    if (c.xoaLuc || (cuocId && c.id !== cuocId)) continue;
    const bo = chonBoQuyTac(c.buoc.P5?.xong ? c.buoc.P5.ngay : undefined, d.homNay, c.boQuyTacGhiDe, d.va);
    const kq = tinhMoc(c, { lich: d.lich, homNay: d.homNay, bo });
    const ten = nhanCuoc(c, d.caiDat.anDanh);
    for (const m of kq.danhSach) {
      if (c.buoc[m.ma]?.xong || m.trangThai === 'KHONG_AP_DUNG' || m.duKien) continue;
      if (['hanTinh', 'hangNgay', 'theoDoi'].includes(m.loai)) continue;
      const ten2 = m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '');
      const moTa = `${ten2}\nCăn cứ: ${m.canCu}${m.bieuMau.length ? '\nBiểu mẫu: ' + m.bieuMau.join(', ') : ''}`;
      if (m.hanMucTieu && trong(m.hanMucTieu)) {
        ra.push({ uid: `cuoc-${c.id}-${m.ma}-MT@tlkt`, ngay: m.hanMucTieu, gioTu: '07:30', gioDen: '08:00', tieuDe: gioiHan(`${ten} – ${ten2}`), moTa: `Hạn mục tiêu ${dinhDangNgay(m.hanMucTieu)}.\n${moTa}`, canhBao: CANH_BAO_MAC_DINH });
      }
      if (!m.noiBo && m.hanPhapLy && m.hanPhapLy !== m.hanMucTieu && trong(m.hanPhapLy)) {
        ra.push({ uid: `cuoc-${c.id}-${m.ma}-PL@tlkt`, ngay: m.hanPhapLy, gioTu: '07:30', gioDen: '08:00', tieuDe: gioiHan(`HẠN PHÁP LÝ – ${ten} – ${ten2}`), moTa: `Hạn pháp lý ${dinhDangNgay(m.hanPhapLy)} (${thuNgan(m.hanPhapLy)}).\n${moTa}`, canhBao: CANH_BAO_MAC_DINH });
      }
    }
  }
  if (!cuocId) {
    for (const v of d.viec) {
      if (v.xong || v.xoaLuc || !v.han || !trong(v.han)) continue;
      ra.push({ uid: `viec-${v.id}@tlkt`, ngay: v.han, gioTu: v.gio ?? '07:30', gioDen: v.gio ? congPhutNgayGio(`${v.han}T${v.gio}`, 30).slice(11) : '08:00', tieuDe: gioiHan(v.tieuDe), moTa: [v.soVB && `Văn bản: ${v.soVB}`, v.nguoiGiao && `Người giao: ${v.nguoiGiao}`, v.ghiChu].filter(Boolean).join('\n'), canhBao: ['-P1D', 'PT0M'] });
    }
  }
  return ra.sort((a, b) => (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : a.uid < b.uid ? -1 : 1));
}
