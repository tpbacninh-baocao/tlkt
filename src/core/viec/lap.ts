// Quy tắc lặp lại của việc ngoài cuộc (ARCHITECTURE §7).
// Cú pháp: NGAY · TUAN:<1-5> · THANG:<1-31> · THANG:CUOI · THANG:CUOI-<n> · QUY:CUOI-<n> · NAM:<MM-DD>
// Ngày rơi vào ngày nghỉ → lùi về ngày làm việc TRƯỚC (việc báo cáo nên làm sớm).
import type { NgayISO } from '../kieu';
import { congNgayThuan, ngayCuoiThang, ngayLamViecTruoc, taoNgay, tachNgay, thuTrongTuan, type Lich } from '../lich';

export type KieuLap =
  | { kieu: 'NGAY' }
  | { kieu: 'TUAN'; thu: number }
  | { kieu: 'THANG'; ngay: number }
  | { kieu: 'THANG_CUOI'; tru: number }
  | { kieu: 'QUY_CUOI'; tru: number }
  | { kieu: 'NAM'; thang: number; ngay: number };

export function docLap(lap: string | undefined): KieuLap | null {
  if (!lap) return null;
  const s = lap.trim().toUpperCase();
  if (s === 'NGAY') return { kieu: 'NGAY' };
  let m = /^TUAN:([1-5])$/.exec(s);
  if (m) return { kieu: 'TUAN', thu: Number(m[1]) };
  m = /^THANG:(\d{1,2})$/.exec(s);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 31) return { kieu: 'THANG', ngay: Number(m[1]) };
  m = /^THANG:CUOI(?:-(\d{1,2}))?$/.exec(s);
  if (m) return { kieu: 'THANG_CUOI', tru: m[1] ? Number(m[1]) : 0 };
  m = /^QUY:CUOI(?:-(\d{1,2}))?$/.exec(s);
  if (m) return { kieu: 'QUY_CUOI', tru: m[1] ? Number(m[1]) : 0 };
  m = /^NAM:(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const thang = Number(m[1]);
    const ngay = Number(m[2]);
    if (thang >= 1 && thang <= 12 && ngay >= 1 && ngay <= 31) return { kieu: 'NAM', thang, ngay };
  }
  return null;
}

export function laLapHopLe(lap: string | undefined): boolean {
  return docLap(lap) !== null;
}

/** Mô tả tiếng Việt cho giao diện. */
export function moTaLap(lap: string | undefined): string {
  const k = docLap(lap);
  if (!k) return 'Không lặp';
  switch (k.kieu) {
    case 'NGAY':
      return 'Mỗi ngày làm việc';
    case 'TUAN':
      return `${k.thu === 1 ? 'Thứ Hai' : 'Thứ ' + ['', '', 'Ba', 'Tư', 'Năm', 'Sáu'][k.thu]} hằng tuần`;
    case 'THANG':
      return `Ngày ${k.ngay} hằng tháng`;
    case 'THANG_CUOI':
      return k.tru ? `Cuối tháng (trước ${k.tru} ngày)` : 'Ngày cuối tháng';
    case 'QUY_CUOI':
      return k.tru ? `Cuối quý (trước ${k.tru} ngày)` : 'Ngày cuối quý';
    case 'NAM':
      return `Ngày ${String(k.ngay).padStart(2, '0')}/${String(k.thang).padStart(2, '0')} hằng năm`;
  }
}

function ngayHopLe(nam: number, thang: number, ngay: number): NgayISO {
  return taoNgay(nam, thang, Math.min(ngay, ngayCuoiThang(nam, thang)));
}

/** Các lần lặp (đã điều chỉnh về ngày làm việc trước) nằm trong [tu, den], tăng dần. */
export function cacLanLap(lich: Lich, lap: string, tu: NgayISO, den: NgayISO): NgayISO[] {
  const k = docLap(lap);
  if (!k) return [];
  const kq = new Set<NgayISO>();
  const dieuChinh = (d: NgayISO) => ngayLamViecTruoc(lich, d, true);
  const them = (d: NgayISO) => {
    const x = dieuChinh(d);
    if (x >= tu && x <= den) kq.add(x);
  };

  if (k.kieu === 'NGAY' || k.kieu === 'TUAN') {
    // lấy từng ngày (cộng đệm 7 ngày vì lùi có thể kéo ngày về trước)
    for (let d = congNgayThuan(tu, -7); d <= congNgayThuan(den, 7); d = congNgayThuan(d, 1)) {
      if (k.kieu === 'NGAY') {
        if (dieuChinh(d) === d) them(d);
      } else {
        if (thuTrongTuan(d) === k.thu) them(d);
      }
    }
    return [...kq].sort();
  }

  const t0 = tachNgay(tu);
  const t1 = tachNgay(den);
  let idx = t0.nam * 12 + (t0.thang - 1) - 1;
  const cuoi = t1.nam * 12 + (t1.thang - 1) + 1;
  for (; idx <= cuoi; idx++) {
    const nam = Math.floor(idx / 12);
    const thang = (idx % 12) + 1;
    const cuoiThang = ngayCuoiThang(nam, thang);
    switch (k.kieu) {
      case 'THANG':
        them(ngayHopLe(nam, thang, k.ngay));
        break;
      case 'THANG_CUOI':
        them(congNgayThuan(taoNgay(nam, thang, cuoiThang), -k.tru));
        break;
      case 'QUY_CUOI':
        if (thang % 3 === 0) them(congNgayThuan(taoNgay(nam, thang, cuoiThang), -k.tru));
        break;
      case 'NAM':
        if (thang === k.thang) them(ngayHopLe(nam, thang, k.ngay));
        break;
    }
  }
  return [...kq].sort();
}

/** Lần lặp đầu tiên SAU ngày `sau` (không tính chính ngày đó). */
export function lanLapKeTiep(lich: Lich, lap: string, sau: NgayISO): NgayISO | undefined {
  const tu = congNgayThuan(sau, 1);
  return cacLanLap(lich, lap, tu, congNgayThuan(sau, 800))[0];
}

/** Lần lặp đầu tiên từ ngày `tu` trở đi (kể cả ngày đó). */
export function lanLapTu(lich: Lich, lap: string, tu: NgayISO): NgayISO | undefined {
  return cacLanLap(lich, lap, tu, congNgayThuan(tu, 800))[0];
}
