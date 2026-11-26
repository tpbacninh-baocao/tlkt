// Đọc/ghi Excel bằng SheetJS – chỉ nạp thư viện khi dùng (dynamic import) để giữ gói chính nhẹ. Chạy hoàn toàn trên máy, không gửi dữ liệu đi đâu.
import type { BangXuat } from '../core/nhapXuat';

type XLSX = typeof import('xlsx');
let thuVien: Promise<XLSX> | null = null;
const nap = (): Promise<XLSX> => (thuVien ??= import('xlsx'));

export interface TrangTinh {
  ten: string;
  rows: string[][];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Đọc tệp .xlsx/.xls/.csv → các trang tính dạng bảng chuỗi. Ô ngày trong Excel đổi thành yyyy-mm-dd; ô số giữ nguyên chữ số. */
export async function docTepBang(buf: ArrayBuffer): Promise<TrangTinh[]> {
  const X = await nap();
  const wb = X.read(buf, { type: 'array', cellDates: false });
  return wb.SheetNames.map((ten) => {
    const ws = wb.Sheets[ten];
    const ref = ws['!ref'];
    if (!ref) return { ten, rows: [] };
    const r = X.utils.decode_range(ref);
    const rows: string[][] = [];
    for (let i = r.s.r; i <= Math.min(r.e.r, r.s.r + 5000); i++) {
      const dong: string[] = [];
      for (let j = r.s.c; j <= r.e.c; j++) {
        const o = ws[X.utils.encode_cell({ r: i, c: j })];
        if (!o) {
          dong.push('');
          continue;
        }
        if (o.t === 'n' && o.z && X.SSF.is_date(String(o.z))) {
          const dc = X.SSF.parse_date_code(o.v as number);
          dong.push(dc ? `${dc.y}-${pad(dc.m)}-${pad(dc.d)}` : String(o.w ?? o.v));
        } else if (o.t === 'n' && Number.isInteger(o.v)) dong.push(String(o.v));
        else dong.push(String(o.w ?? o.v ?? '').trim());
      }
      rows.push(dong);
    }
    return { ten, rows };
  });
}

/** Ghi các bảng thành tệp .xlsx (mỗi bảng một trang tính): độ rộng cột, ô số định dạng 1.234.567, bộ lọc ở dòng tiêu đề. */
export async function ghiTepXlsx(bang: BangXuat[]): Promise<ArrayBuffer> {
  const X = await nap();
  const wb = X.utils.book_new();
  for (const b of bang) {
    const ws = X.utils.aoa_to_sheet([b.cot.map((c) => c.tieuDe), ...b.dong]);
    ws['!cols'] = b.cot.map((c) => ({ wch: c.rong ?? 16 }));
    const soDong = b.dong.length + 1;
    ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, soDong - 1), c: b.cot.length - 1 } }) };
    b.dong.forEach((dong, i) => {
      dong.forEach((v, j) => {
        const o = ws[X.utils.encode_cell({ r: i + 1, c: j })];
        if (o && typeof v === 'number') o.z = Number.isInteger(v) && b.cot[j]?.kieu === 'so' ? '#,##0' : '#,##0.##';
      });
    });
    X.utils.book_append_sheet(wb, ws, b.ten.slice(0, 31));
  }
  return X.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/** Tệp mẫu kế hoạch (.xlsx) từ các dòng của samples/mau-ke-hoach.csv. */
export async function taoTepMauXlsx(rows: string[][]): Promise<ArrayBuffer> {
  const X = await nap();
  const ws = X.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 16 }, { wch: 30 }, { wch: 40 }, { wch: 22 }, { wch: 18 }, { wch: 18 }];
  // MST dạng chữ để Excel không làm mất số 0 đầu
  rows.forEach((r, i) => {
    const o = ws[X.utils.encode_cell({ r: i, c: 2 })];
    if (i > 0 && o) {
      o.t = 's';
      o.v = String(r[2]);
    }
  });
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Kế hoạch');
  return X.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

/** Phân tích CSV mẫu (đơn giản, có hỗ trợ ngoặc kép) để dựng tệp mẫu .xlsx. */
export function docCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let o = '';
  let ngoac = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ngoac) {
      if (ch === '"' && t[i + 1] === '"') { o += '"'; i++; }
      else if (ch === '"') ngoac = false;
      else o += ch;
    } else if (ch === '"') ngoac = true;
    else if (ch === ',') { cur.push(o); o = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      cur.push(o); o = '';
      if (cur.some((c) => c !== '')) rows.push(cur);
      cur = [];
    } else o += ch;
  }
  if (o !== '' || cur.length) { cur.push(o); if (cur.some((c) => c !== '')) rows.push(cur); }
  return rows;
}

/**
 * Đọc một tệp người dùng chọn. CSV đọc thẳng dạng chữ (SheetJS sẽ tự đoán “03/2027” hay “08/02/2027” là ngày kiểu Mỹ và làm mất số 0 đầu);
 * .xlsx/.xls đọc qua SheetJS.
 */
export async function docTep(f: File): Promise<TrangTinh[]> {
  if (/\.(csv|txt)$/i.test(f.name)) return [{ ten: 'CSV', rows: docCsv(new TextDecoder('utf-8').decode(await f.arrayBuffer())) }];
  return docTepBang(await f.arrayBuffer());
}
