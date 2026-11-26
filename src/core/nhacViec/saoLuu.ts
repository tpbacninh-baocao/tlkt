import type { NgayISO } from '../kieu';
import { soNgayGiua, thuTrongTuan } from '../lich';

/** Nhắc sao lưu mỗi thứ Sáu nếu đã quá 7 ngày chưa sao lưu (hoặc chưa từng sao lưu). */
export function canNhacSaoLuu(homNay: NgayISO, saoLuuCuoi: NgayISO | null | undefined): boolean {
  if (thuTrongTuan(homNay) !== 5) return false;
  return !saoLuuCuoi || soNgayGiua(saoLuuCuoi, homNay) > 7;
}
