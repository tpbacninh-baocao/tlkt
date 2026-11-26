// Hiển thị tên cuộc trong thông báo/tóm tắt, tôn trọng chế độ ẩn danh (SPEC §14).
import type { CuocKiemTra } from '../kieu';

export function boaCuoiMST(mst: string): string {
  return mst.replace(/\D/g, '').slice(-4);
}

/** Ẩn danh: “KT …1234”. Đầy đủ: “Công ty A (…1234)”. */
export function nhanCuoc(cuoc: Pick<CuocKiemTra, 'mst' | 'tenNNT'>, anDanh: boolean): string {
  const duoi = boaCuoiMST(cuoc.mst);
  if (anDanh || !cuoc.tenNNT.trim()) return `KT …${duoi}`;
  return `${cuoc.tenNNT} (…${duoi})`;
}

/** “KT-2026-007 · Công ty A (…1234)” hoặc “KT-2026-007 · KT …1234” */
export function nhanCuocDayDu(cuoc: Pick<CuocKiemTra, 'ma' | 'mst' | 'tenNNT'>, anDanh: boolean): string {
  return `${cuoc.ma} · ${nhanCuoc(cuoc, anDanh)}`;
}
