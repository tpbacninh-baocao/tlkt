// Hỗ trợ nhập cuộc: chuẩn hóa/kiểm tra MST, sinh mã cuộc, tìm cuộc trùng.
import type { CuocKiemTra, KeHoach } from '../kieu';
import { namCuaCuoc } from '../keHoach/thongKe';

export interface KetQuaMST {
  /** Dạng chuẩn: 10 số hoặc 10 số-3 số */
  mst: string;
  hopLe: boolean;
  /** Lỗi chặn lưu (rỗng, sai độ dài) */
  loi?: string;
}

/**
 * Chuẩn hóa và kiểm tra MST: 10 số, hoặc 13 số (đơn vị phụ thuộc, dạng 0100000001-001).
 * Chỉ kiểm tra độ dài – KHÔNG kiểm tra chữ số kiểm tra (chưa có nguồn chính thức để đối chiếu thuật toán).
 */
export function kiemTraMST(nhap: string): KetQuaMST {
  const so = nhap.replace(/\D/g, '');
  if (!so) return { mst: '', hopLe: false, loi: 'Nhập mã số thuế.' };
  if (so.length !== 10 && so.length !== 13) {
    return { mst: nhap.trim(), hopLe: false, loi: `Mã số thuế gồm 10 hoặc 13 chữ số (đang có ${so.length}).` };
  }
  return { mst: so.length === 13 ? `${so.slice(0, 10)}-${so.slice(10)}` : so, hopLe: true };
}

/** Mã nội bộ tiếp theo dạng KT-2026-007 (số thứ tự lớn nhất cùng năm + 1). */
export function taoMaCuoc(ds: Pick<CuocKiemTra, 'ma'>[], nam: number): string {
  const re = new RegExp(`^KT-${nam}-(\\d+)$`);
  let max = 0;
  for (const c of ds) {
    const m = re.exec(c.ma);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `KT-${nam}-${String(max + 1).padStart(3, '0')}`;
}

/** Các cuộc (chưa xóa) cùng MST trong cùng năm – để cảnh báo trùng. */
export function timCuocTrung(ds: CuocKiemTra[], mst: string, nam: number, keHoach: KeHoach[], boQuaId?: string): CuocKiemTra[] {
  const so = mst.replace(/\D/g, '');
  return ds.filter((c) => !c.xoaLuc && c.id !== boQuaId && c.mst.replace(/\D/g, '') === so && namCuaCuoc(c, keHoach) === nam);
}
