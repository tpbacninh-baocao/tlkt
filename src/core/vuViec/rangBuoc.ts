// Ràng buộc khi đánh dấu xong / bỏ đánh dấu một bước (ARCHITECTURE §6).
import type { CuocKiemTra, NgayISO } from '../kieu';
import { dinhDangNgay, laNgayISO } from '../lich';
import type { KetQuaTinhMoc } from './tinhMoc';

export interface KetQuaKiemTra {
  hopLe: boolean;
  loi: string[];
  canhBao: string[];
  /** Ngày nhập sau hạn pháp lý → bắt buộc nhập lý do trễ */
  canLyDoTre: boolean;
  hanPhapLy?: NgayISO;
}

/** Bước phải xong trước khi đánh dấu bước này. */
export const BUOC_TRUOC: Record<string, { can: string; ten: string }> = {
  Q1: { can: 'P5', ten: 'QĐ kiểm tra (D0)' },
  Q2: { can: 'P5', ten: 'QĐ kiểm tra (D0)' },
  Q3: { can: 'P5', ten: 'QĐ kiểm tra (D0)' },
  Q4: { can: 'P5', ten: 'QĐ kiểm tra (D0)' },
  Q5: { can: 'P5', ten: 'QĐ kiểm tra (D0)' },
  T5: { can: 'Q5', ten: 'công bố QĐ (C)' },
  T6: { can: 'Q5', ten: 'công bố QĐ (C)' },
  T7: { can: 'Q5', ten: 'công bố QĐ (C)' },
  B1: { can: 'T7', ten: 'công khai dự thảo biên bản (K)' },
  B2: { can: 'T7', ten: 'công khai dự thảo biên bản (K)' },
  B4: { can: 'B1', ten: 'ký biên bản (B)' },
  X: { can: 'B1', ten: 'ký biên bản (B)' },
  B5: { can: 'B4', ten: 'báo cáo kết quả kiểm tra (R)' },
  S1: { can: 'X', ten: 'QĐ xử phạt/Kết luận (X)' },
  S3: { can: 'X', ten: 'QĐ xử phạt/Kết luận (X)' },
  S4: { can: 'X', ten: 'QĐ xử phạt/Kết luận (X)' },
  S5: { can: 'X', ten: 'QĐ xử phạt/Kết luận (X)' },
  S6: { can: 'X', ten: 'QĐ xử phạt/Kết luận (X)' },
};

/** Chuỗi mốc chính theo thứ tự thời gian: mã bước sinh ra mốc. */
export const CHUOI_MOC: { moc: string; buoc: string; ten: string }[] = [
  { moc: 'D0', buoc: 'P5', ten: 'ngày ban hành QĐ (D0)' },
  { moc: 'C', buoc: 'Q5', ten: 'ngày công bố (C)' },
  { moc: 'K', buoc: 'T7', ten: 'ngày công khai dự thảo (K)' },
  { moc: 'B', buoc: 'B1', ten: 'ngày ký biên bản (B)' },
  { moc: 'R', buoc: 'B4', ten: 'ngày báo cáo kết quả (R)' },
  { moc: 'X', buoc: 'X', ten: 'ngày ban hành QĐ xử lý (X)' },
];

function ngayBuoc(cuoc: CuocKiemTra, ma: string): NgayISO | undefined {
  const b = cuoc.buoc[ma];
  return b?.xong && b.ngay && laNgayISO(b.ngay) ? b.ngay : undefined;
}

/**
 * Kiểm tra hợp lệ khi đánh dấu xong bước `ma` vào `ngay`.
 * `kq` là kết quả tinhMoc của cuộc TRƯỚC khi đánh dấu.
 */
export function kiemTraDanhDauBuoc(
  cuoc: CuocKiemTra,
  kq: KetQuaTinhMoc,
  ma: string,
  ngay: NgayISO,
  homNay: NgayISO,
  lyDoTre?: string,
): KetQuaKiemTra {
  const loi: string[] = [];
  const canhBao: string[] = [];
  const m = kq.danhSach.find((x) => x.ma === ma);
  if (!m) return { hopLe: false, loi: [`Không có bước ${ma} trong bộ quy tắc`], canhBao, canLyDoTre: false };
  if (!laNgayISO(ngay)) loi.push('Ngày không hợp lệ (nhập dd/mm/yyyy).');
  if (kq.baiBo) loi.push('Cuộc đã bị bãi bỏ – không thể đánh dấu thêm bước.');

  const truoc = BUOC_TRUOC[ma];
  if (truoc && !ngayBuoc(cuoc, truoc.can)) loi.push(`Chưa thể đánh dấu: cần xong bước “${truoc.ten}” trước.`);

  if (laNgayISO(ngay)) {
    // Ngày phải đúng thứ tự chuỗi mốc chính
    const viTri = CHUOI_MOC.findIndex((c) => c.buoc === ma);
    if (viTri >= 0) {
      for (let i = 0; i < CHUOI_MOC.length; i++) {
        if (i === viTri) continue;
        const d = ngayBuoc(cuoc, CHUOI_MOC[i].buoc);
        if (!d) continue;
        if (i < viTri && ngay < d) loi.push(`Ngày phải từ ${dinhDangNgay(d)} (${CHUOI_MOC[i].ten}) trở đi.`);
        if (i > viTri && ngay > d) loi.push(`Ngày không được sau ${dinhDangNgay(d)} (${CHUOI_MOC[i].ten}).`);
      }
    } else if (truoc) {
      const d = ngayBuoc(cuoc, truoc.can);
      if (d && ngay < d) loi.push(`Ngày phải từ ${dinhDangNgay(d)} (${truoc.ten}) trở đi.`);
    }
    if (ngay > homNay) canhBao.push(`Ngày ${dinhDangNgay(ngay)} ở tương lai – bước này chưa diễn ra?`);
  }

  if (ma === 'X' && !ngayBuoc(cuoc, 'B5')) {
    canhBao.push('Chưa có Báo cáo kết quả giám sát (B5) – nên có trước khi ban hành QĐ xử lý/Kết luận.');
  }

  const hanPhapLy = m.noiBo ? undefined : m.hanPhapLy;
  const canLyDoTre = !!hanPhapLy && laNgayISO(ngay) && ngay > hanPhapLy;
  if (canLyDoTre) {
    canhBao.push(
      `Ngày bạn nhập (${dinhDangNgay(ngay)}) sau hạn pháp lý (${dinhDangNgay(hanPhapLy!)}). Vui lòng ghi lý do để giải trình khi nhập iTNK.`,
    );
    if (!lyDoTre?.trim()) loi.push('Bắt buộc ghi lý do trễ.');
  }
  return { hopLe: loi.length === 0, loi, canhBao, canLyDoTre, hanPhapLy };
}

/** Kiểm tra khi bỏ đánh dấu: không cho bỏ nếu còn bước sau phụ thuộc đã xong. */
export function kiemTraBoDanhDau(cuoc: CuocKiemTra, ma: string): KetQuaKiemTra {
  const phuThuoc = Object.entries(BUOC_TRUOC)
    .filter(([, t]) => t.can === ma)
    .map(([k]) => k)
    .filter((k) => cuoc.buoc[k]?.xong);
  const loi = phuThuoc.length ? [`Hãy bỏ đánh dấu các bước sau trước: ${phuThuoc.join(', ')}.`] : [];
  return { hopLe: loi.length === 0, loi, canhBao: [], canLyDoTre: false };
}
