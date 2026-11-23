// Kiểm tra hợp lệ sự kiện và xem trước “hạn sẽ đổi từ … thành …” (SPEC §8, ARCHITECTURE §6).
import type { CuocKiemTra, LoaiSuKien, NgayISO, SuKien } from '../kieu';
import { dinhDangNgay, laNgayISO, soNgayGiua } from '../lich';
import { tinhMoc, timMoc, type KetQuaTinhMoc, type NguCanhTinhMoc } from './tinhMoc';
import type { KetQuaKiemTra } from './rangBuoc';

export const TEN_SU_KIEN: Record<LoaiSuKien, string> = {
  HOAN: 'Hoãn',
  TAM_DUNG: 'Tạm dừng',
  GIA_HAN: 'Gia hạn',
  DIEU_CHINH: 'Điều chỉnh QĐ',
  BAI_BO: 'Bãi bỏ',
  GIAI_TRINH: 'NNT giải trình',
  PHUC_TAP: 'Vụ việc phức tạp',
  TOI_PHAM: 'Dấu hiệu tội phạm',
  KHONG_NHAN_QD: 'NNT không chấp hành',
  TAM_GIU_TL: 'Tạm giữ tài liệu',
  PHU_LUC_BB: 'Phụ lục biên bản',
};

export const TRUONG_BAT_BUOC: Record<LoaiSuKien, string[]> = {
  HOAN: ['ngay', 'denNgay', 'lyDo'],
  TAM_DUNG: ['tuNgay', 'denNgay', 'lyDo'],
  GIA_HAN: ['ngayDeNghi', 'ngayQD', 'soNgay'],
  DIEU_CHINH: ['ngayQD', 'noiDung'],
  BAI_BO: ['ngayQD', 'lyDo'],
  GIAI_TRINH: ['ngay'],
  PHUC_TAP: ['ngay', 'lyDo'],
  TOI_PHAM: ['ngayPhatHien'],
  KHONG_NHAN_QD: ['ngay'],
  TAM_GIU_TL: ['ngay', 'noiDung'],
  PHU_LUC_BB: ['ngay', 'noiDung'],
};

const TRUONG_NGAY = ['ngay', 'denNgay', 'tuNgay', 'ngayDeNghi', 'ngayQD', 'ngayPhatHien', 'ngayTraDuKien'];

function ngayB(cuoc: CuocKiemTra, ma: string): NgayISO | undefined {
  const b = cuoc.buoc[ma];
  return b?.xong && b.ngay && laNgayISO(b.ngay) ? b.ngay : undefined;
}

/** Lý do nút sự kiện bị mờ ở giai đoạn hiện tại (undefined = được phép). */
export function lyDoKhongChoPhep(cuoc: CuocKiemTra, loai: LoaiSuKien, boQua?: string): string | undefined {
  const dsKhac = cuoc.suKien.filter((s) => s.id !== boQua);
  if (dsKhac.some((s) => s.loai === 'BAI_BO')) return 'Cuộc đã bị bãi bỏ';
  const d0 = ngayB(cuoc, 'P5');
  const c = ngayB(cuoc, 'Q5');
  const k = ngayB(cuoc, 'T7');
  const b = ngayB(cuoc, 'B1');
  const x = ngayB(cuoc, 'X');
  switch (loai) {
    case 'HOAN':
      if (!d0) return 'Chưa có QĐ kiểm tra';
      if (c) return 'Chỉ hoãn được trước khi công bố QĐ';
      return undefined;
    case 'TAM_DUNG':
    case 'TAM_GIU_TL':
      if (!c) return `${TEN_SU_KIEN[loai]} chỉ khi đang kiểm tra tại DN (chưa công bố QĐ)`;
      if (k) return `${TEN_SU_KIEN[loai]} chỉ khi đang kiểm tra tại DN (đã kết thúc tại trụ sở)`;
      return undefined;
    case 'GIA_HAN':
      if (!c) return 'Gia hạn chỉ khi đang kiểm tra tại DN (chưa công bố QĐ)';
      if (k) return 'Gia hạn chỉ khi đang kiểm tra tại DN (đã kết thúc tại trụ sở)';
      if (dsKhac.some((s) => s.loai === 'GIA_HAN')) return 'Chỉ được gia hạn 1 lần';
      return undefined;
    case 'GIAI_TRINH':
    case 'PHUC_TAP':
      if (!k) return 'Chỉ sau khi công khai dự thảo biên bản';
      if (x) return 'Đã có QĐ xử lý/Kết luận';
      return undefined;
    case 'PHU_LUC_BB':
      return b ? undefined : 'Chỉ sau khi ký biên bản';
    case 'BAI_BO':
      if (!d0) return 'Chưa có QĐ kiểm tra';
      if (x) return 'Đã có QĐ xử lý/Kết luận';
      return undefined;
    case 'DIEU_CHINH':
    case 'TOI_PHAM':
    case 'KHONG_NHAN_QD':
      return d0 ? undefined : 'Chưa có QĐ kiểm tra';
  }
}

/** Kiểm tra dữ liệu một sự kiện trước khi lưu. `suaId`: id sự kiện đang sửa (bỏ qua khi kiểm tra trùng/1 lần). */
export function kiemTraSuKien(
  cuoc: CuocKiemTra,
  kq: KetQuaTinhMoc,
  sk: { loai: LoaiSuKien; [k: string]: unknown },
  nc: NguCanhTinhMoc,
  suaId?: string,
): KetQuaKiemTra {
  const loi: string[] = [];
  const canhBao: string[] = [];
  const chan = lyDoKhongChoPhep(cuoc, sk.loai, suaId);
  if (chan) loi.push(chan);

  for (const t of TRUONG_BAT_BUOC[sk.loai]) {
    const v = sk[t];
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) loi.push(`Thiếu thông tin bắt buộc: ${t}.`);
  }
  for (const t of TRUONG_NGAY) {
    if (sk[t] !== undefined && sk[t] !== '' && !laNgayISO(sk[t])) loi.push(`Ngày không hợp lệ: ${t}.`);
  }
  if (loi.length) return { hopLe: false, loi, canhBao, canLyDoTre: false };

  const c = ngayB(cuoc, 'Q5');
  const khac = cuoc.suKien.filter((s) => s.id !== suaId);
  const T1 = kq.bo.buoc.find((b) => b.ma === 'T1');

  switch (sk.loai) {
    case 'HOAN': {
      if ((sk.denNgay as string) <= (sk.ngay as string)) loi.push('Ngày hết hoãn phải sau ngày bắt đầu hoãn.');
      break;
    }
    case 'TAM_DUNG': {
      const tu = sk.tuNgay as NgayISO;
      const den = sk.denNgay as NgayISO;
      if (den < tu) loi.push('Ngày kết thúc tạm dừng phải từ ngày bắt đầu trở đi.');
      if (c && tu < c) loi.push(`Tạm dừng phải từ ngày công bố (${dinhDangNgay(c)}) trở đi.`);
      const k = ngayB(cuoc, 'T7');
      if (k && den > k) loi.push(`Tạm dừng không được quá ngày kết thúc tại trụ sở (${dinhDangNgay(k)}).`);
      for (const s of khac) {
        if (s.loai !== 'TAM_DUNG') continue;
        if (!(den < (s.tuNgay as string) || tu > (s.denNgay as string))) {
          loi.push(`Trùng với đợt tạm dừng ${dinhDangNgay(s.tuNgay as string)}–${dinhDangNgay(s.denNgay as string)}.`);
        }
      }
      break;
    }
    case 'GIA_HAN': {
      const so = Number(sk.soNgay);
      const gh = T1?.han?.giaHan;
      const toiDa = kq.bo && cuoc.coGDLK ? gh?.toiDaGDLK ?? gh?.toiDa : gh?.toiDa;
      const donVi = gh?.donVi === 'NLV' ? 'ngày làm việc' : 'ngày';
      if (!Number.isInteger(so) || so <= 0) loi.push('Số ngày gia hạn phải là số nguyên dương.');
      else if (toiDa !== undefined && so > toiDa) loi.push(`Gia hạn tối đa ${toiDa} ${donVi}${cuoc.coGDLK ? ' (có giao dịch liên kết)' : ''}.`);
      const deNghi = sk.ngayDeNghi as NgayISO;
      if (c && deNghi < c) loi.push(`Ngày đề nghị phải từ ngày công bố (${dinhDangNgay(c)}) trở đi.`);
      if ((sk.ngayQD as NgayISO) < deNghi) loi.push('Ngày QĐ gia hạn phải từ ngày đề nghị trở đi.');
      // Cảnh báo muộn so với hạn chót T3 (tính lại khi chưa có chính sự kiện này)
      const truocKhi = tinhMoc({ ...cuoc, suKien: khac }, { lich: nc.lich, homNay: deNghi, bo: kq.bo });
      const t3 = timMoc(truocKhi, 'T3');
      const e = timMoc(truocKhi, 'T1')?.hanPhapLy;
      if (t3?.hanPhapLy && deNghi > t3.hanPhapLy) {
        canhBao.push(
          `Hạn chót đề nghị gia hạn là ${dinhDangNgay(t3.hanPhapLy)} (3 ngày làm việc trước hạn kết thúc). Ngày đề nghị ${dinhDangNgay(deNghi)} đã muộn – vẫn lưu?`,
        );
      }
      if (e && deNghi > e) loi.push(`Ngày đề nghị (${dinhDangNgay(deNghi)}) sau hạn kết thúc kiểm tra (${dinhDangNgay(e)}).`);
      break;
    }
    case 'PHUC_TAP':
      if (typeof sk.lyDo !== 'string' || !sk.lyDo.trim()) loi.push('Bắt buộc ghi lý do vụ việc phức tạp.');
      break;
    case 'TAM_GIU_TL':
      if (sk.ngayTraDuKien && (sk.ngayTraDuKien as string) < (sk.ngay as string)) loi.push('Ngày trả dự kiến phải từ ngày tạm giữ trở đi.');
      break;
    default:
      break;
  }
  return { hopLe: loi.length === 0, loi, canhBao, canLyDoTre: false };
}

export interface DoiHan {
  ma: string;
  ten: string;
  truoc?: NgayISO;
  sau?: NgayISO;
}

/** Xem trước tác động của một sự kiện mới/sửa: các hạn pháp lý (hoặc nội bộ) đổi từ … thành … */
export function xemTruocSuKien(cuoc: CuocKiemTra, suKienMoi: SuKien, nc: NguCanhTinhMoc, suaId?: string): DoiHan[] {
  const truoc = tinhMoc(cuoc, nc);
  const ds = cuoc.suKien.filter((s) => s.id !== suaId).concat(suKienMoi);
  const sau = tinhMoc({ ...cuoc, suKien: ds }, { ...nc, bo: truoc.bo });
  const kq: DoiHan[] = [];
  for (const m of sau.danhSach) {
    const t = truoc.danhSach.find((x) => x.ma === m.ma);
    const a = m.noiBo ? m.hanMucTieu : m.hanPhapLy;
    const b = t ? (t.noiBo ? t.hanMucTieu : t.hanPhapLy) : undefined;
    if (a !== b && !(m.trangThai === 'KHONG_AP_DUNG' && t?.trangThai === 'KHONG_AP_DUNG')) kq.push({ ma: m.ma, ten: m.ten, truoc: b, sau: a });
  }
  return kq;
}

const ngayVN = (v: unknown): string => (typeof v === 'string' && laNgayISO(v) ? dinhDangNgay(v) : String(v ?? ''));
const chuoi = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Mô tả ngắn một sự kiện cho danh sách/lịch sử. */
export function moTaSuKien(s: SuKien): string {
  const them = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' · ');
  switch (s.loai) {
    case 'HOAN':
      return them(`Hoãn từ ${ngayVN(s.ngay)} đến ${ngayVN(s.denNgay)}`, chuoi(s.soVB) && `TB số ${chuoi(s.soVB)}`, chuoi(s.lyDo));
    case 'TAM_DUNG': {
      const tu = s.tuNgay as string;
      const den = s.denNgay as string;
      const so = laNgayISO(tu) && laNgayISO(den) ? ` (${soNgayGiua(tu, den) + 1} ngày)` : '';
      return them(`Tạm dừng ${ngayVN(tu)} – ${ngayVN(den)}${so}`, chuoi(s.soVB) && `TB số ${chuoi(s.soVB)}`, chuoi(s.lyDo));
    }
    case 'GIA_HAN':
      return them(`Gia hạn ${String(s.soNgay)} ngày`, `đề nghị ${ngayVN(s.ngayDeNghi)}`, `QĐ ${chuoi(s.soQD) ? 'số ' + chuoi(s.soQD) + ' ' : ''}ngày ${ngayVN(s.ngayQD)}`);
    case 'DIEU_CHINH':
      return them(`Điều chỉnh QĐ ${chuoi(s.soQD) ? 'số ' + chuoi(s.soQD) + ' ' : ''}ngày ${ngayVN(s.ngayQD)}`, chuoi(s.noiDung));
    case 'BAI_BO':
      return them(`Bãi bỏ QĐ ${chuoi(s.soQD) ? 'số ' + chuoi(s.soQD) + ' ' : ''}ngày ${ngayVN(s.ngayQD)}`, chuoi(s.lyDo));
    case 'GIAI_TRINH':
      return them(`NNT giải trình ngày ${ngayVN(s.ngay)}`, chuoi(s.hinhThuc), chuoi(s.ghiChu));
    case 'PHUC_TAP':
      return them(`Vụ việc phức tạp (${ngayVN(s.ngay)})`, chuoi(s.lyDo));
    case 'TOI_PHAM':
      return them(`Dấu hiệu tội phạm phát hiện ${ngayVN(s.ngayPhatHien)}`, chuoi(s.noiDung));
    case 'KHONG_NHAN_QD':
      return them(`NNT không chấp hành (${ngayVN(s.ngay)})`, chuoi(s.ghiChu));
    case 'TAM_GIU_TL':
      return them(`Tạm giữ tài liệu ${ngayVN(s.ngay)}`, chuoi(s.noiDung), s.ngayTraDuKien ? `trả dự kiến ${ngayVN(s.ngayTraDuKien)}` : undefined);
    case 'PHU_LUC_BB':
      return them(`Phụ lục biên bản ${ngayVN(s.ngay)}`, chuoi(s.noiDung));
  }
}
