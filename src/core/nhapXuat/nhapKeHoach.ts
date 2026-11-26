// Nhập kế hoạch từ bảng (Excel/CSV đã đọc thành mảng chuỗi): nhận diện cột, chuẩn hóa dòng, báo lỗi/trùng. ARCHITECTURE §10.
import type { CuocKiemTra, KeHoach } from '../kieu';
import { kiemTraMST, timCuocTrung } from '../vuViec/nhapCuoc';

export type TruongKH = 'stt' | 'ten' | 'mst' | 'diaChi' | 'noiDung' | 'chuyenDe' | 'thoiGian' | 'truongDoan';

export const TEN_TRUONG_KH: Record<TruongKH, string> = {
  stt: 'STT (bỏ qua)',
  ten: 'Tên người nộp thuế',
  mst: 'Mã số thuế',
  diaChi: 'Địa chỉ',
  noiDung: 'Nội dung kiểm tra',
  chuyenDe: 'Chuyên đề',
  thoiGian: 'Thời gian dự kiến',
  truongDoan: 'Trưởng đoàn',
};

export function boDauChu(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Thứ tự kiểm tra quan trọng: trường đặc thù trước, “tên” (rộng nhất) sau cùng.
const MAU_NHAN_DIEN: [TruongKH, RegExp][] = [
  ['mst', /\bma so thue\b|\bmst\b|^ma so$/],
  ['stt', /^stt$|^tt$|^so tt$|^so thu tu$/],
  ['truongDoan', /truong doan|can bo (thuc hien|phu trach)|nguoi (thuc hien|phu trach)|^phu trach$/],
  ['thoiGian', /thoi gian|thang du kien|du kien|^thang$|^quy$/],
  ['chuyenDe', /chuyen de|linh vuc|nganh nghe/],
  ['diaChi', /dia chi|dia diem|tru so/],
  ['noiDung', /noi dung|pham vi|thoi ky/],
  ['ten', /^ten\b|nguoi nop thue|\bnnt\b|doanh nghiep|cong ty|^don vi$|to chuc|ho kinh doanh/],
];

export function nhanDienCot(tieuDe: string): TruongKH | null {
  const t = boDauChu(tieuDe);
  if (!t) return null;
  for (const [truong, re] of MAU_NHAN_DIEN) if (re.test(t)) return truong;
  return null;
}

/** Gợi ý ghép cột theo dòng tiêu đề; mỗi trường chỉ gán cho MỘT cột (cột đầu tiên khớp). */
export function goiYGhepCot(tieuDe: string[]): (TruongKH | null)[] {
  const da = new Set<TruongKH>();
  return tieuDe.map((t) => {
    const k = nhanDienCot(t);
    if (!k || da.has(k)) return null;
    da.add(k);
    return k;
  });
}

/** Tìm dòng tiêu đề trong 10 dòng đầu: dòng nhận diện được nhiều cột nhất (≥ 2). Không thấy → -1. */
export function timDongTieuDe(rows: string[][]): number {
  let tot = -1;
  let diem = 1;
  rows.slice(0, 10).forEach((r, i) => {
    const d = new Set(r.map(nhanDienCot).filter(Boolean)).size;
    if (d > diem) {
      diem = d;
      tot = i;
    }
  });
  return tot;
}

const THANG_EN: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** “03/2027”, “3/2027”, “tháng 3/2027”, “2027-03”, “15/03/2027”, “Mar-27”, “3” (theo năm kế hoạch) → 'YYYY-MM'. */
export function chuanHoaThang(s: string, namMacDinh: number): string | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const ok = (y: number, m: number) => (m >= 1 && m <= 12 && y >= 2000 && y <= 2100 ? `${y}-${String(m).padStart(2, '0')}` : undefined);
  let m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(t);
  if (m) return ok(Number(m[1]), Number(m[2]));
  m = /(\d{1,2})\s*[/.-]\s*(\d{4})\s*$/.exec(t);
  if (m) return ok(Number(m[2]), Number(m[1]));
  m = /^(?:th[aá]ng\s*)?(\d{1,2})$/i.exec(t);
  if (m) return ok(namMacDinh, Number(m[1]));
  m = /^([a-z]{3})[a-z]*[\s-]+(\d{2,4})$/i.exec(t);
  if (m && THANG_EN[m[1].toLowerCase()]) {
    const y = Number(m[2]);
    return ok(y < 100 ? 2000 + y : y, THANG_EN[m[1].toLowerCase()]);
  }
  return undefined;
}

export interface DongKeHoach {
  /** Số dòng trong tệp (bắt đầu từ 1) – để người dùng đối chiếu */
  dong: number;
  ten: string;
  mst: string;
  diaChi: string;
  noiDung: string;
  chuyenDe: string;
  thangDuKien?: string;
  truongDoan: string;
  /** Lỗi chặn nhập dòng này */
  loi: string[];
  /** Cảnh báo, vẫn nhập được */
  canhBao: string[];
  /** Trùng MST với cuộc đã có cùng năm hoặc với dòng trước trong tệp */
  trung: boolean;
}

export interface NguCanhNhap {
  nam: number;
  cuocDaCo: CuocKiemTra[];
  keHoach: KeHoach[];
}

/** Chuyển các dòng dữ liệu thành dòng kế hoạch đã kiểm tra. `ghep[i]` = trường của cột i. `dongDau` = chỉ số (0-based) dòng dữ liệu đầu tiên. */
export function docDongKeHoach(rows: string[][], ghep: (TruongKH | null)[], dongDau: number, ng: NguCanhNhap): DongKeHoach[] {
  const ra: DongKeHoach[] = [];
  const mstTrongTep = new Map<string, number>();
  for (let i = dongDau; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => !String(c ?? '').trim())) continue;
    const lay = (k: TruongKH) => {
      const j = ghep.indexOf(k);
      return j >= 0 ? String(r[j] ?? '').trim() : '';
    };
    const d: DongKeHoach = { dong: i + 1, ten: lay('ten'), mst: '', diaChi: lay('diaChi'), noiDung: lay('noiDung'), chuyenDe: lay('chuyenDe'), truongDoan: lay('truongDoan'), loi: [], canhBao: [], trung: false };
    if (!d.ten) d.loi.push('Thiếu tên người nộp thuế.');

    let mstTho = lay('mst').replace(/[\s.]/g, '');
    const so = mstTho.replace(/\D/g, '');
    if ((so.length === 9 || so.length === 12) && /^\d[\d-]*$/.test(mstTho)) {
      mstTho = '0' + so;
      d.canhBao.push('MST thiếu số 0 đầu (Excel hay làm mất) – đã tự thêm.');
    }
    const kt = kiemTraMST(mstTho);
    if (kt.hopLe) d.mst = kt.mst;
    else {
      d.mst = mstTho;
      d.loi.push(kt.loi ?? 'Mã số thuế không hợp lệ.');
    }

    const tg = lay('thoiGian');
    if (tg) {
      d.thangDuKien = chuanHoaThang(tg, ng.nam);
      if (!d.thangDuKien) d.canhBao.push(`Không đọc được thời gian dự kiến “${tg}” – để trống.`);
      else if (!d.thangDuKien.startsWith(`${ng.nam}-`)) d.canhBao.push(`Thời gian dự kiến ${d.thangDuKien.slice(5)}/${d.thangDuKien.slice(0, 4)} không thuộc năm kế hoạch ${ng.nam}.`);
    }

    if (kt.hopLe) {
      const truoc = mstTrongTep.get(kt.mst);
      if (truoc) {
        d.trung = true;
        d.canhBao.push(`Trùng MST với dòng ${truoc} trong tệp.`);
      } else mstTrongTep.set(kt.mst, d.dong);
      const co = timCuocTrung(ng.cuocDaCo, kt.mst, ng.nam, ng.keHoach);
      if (co.length) {
        d.trung = true;
        d.canhBao.push(`Đã có cuộc ${co.map((c) => c.ma).join(', ')} cùng MST trong năm ${ng.nam}.`);
      }
    }
    ra.push(d);
  }
  return ra;
}
