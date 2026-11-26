// Mẫu việc thường xuyên (rules/mau-viec-thuong-xuyen.json).
import mauJson from '../../../rules/mau-viec-thuong-xuyen.json';
import type { CongViec, Id, NgayGio, NgayISO } from '../kieu';
import { lanLapTu } from './lap';
import type { Lich } from '../lich';

export interface MauViec {
  ma: string;
  tieuDe: string;
  lap: string;
  gio?: string;
  nhom?: string;
  batMacDinh: boolean;
}

export const MAU_VIEC: MauViec[] = mauJson.thuongXuyen as MauViec[];
export const NHOM_DOT_XUAT: string[] = mauJson.nhomDotXuat;

export function layMau(ma: string): MauViec | undefined {
  return MAU_VIEC.find((m) => m.ma === ma);
}

/** Danh sách mã mẫu bật mặc định (dùng khi onboarding). */
export function mauBatMacDinh(): string[] {
  return MAU_VIEC.filter((m) => m.batMacDinh).map((m) => m.ma);
}

/** Tạo việc từ mẫu: hạn = lần lặp đầu tiên từ hôm nay trở đi. */
export function taoViecTuMau(mau: MauViec, homNay: NgayISO, lich: Lich, id: Id, bayGio: NgayGio): CongViec {
  return {
    id,
    tieuDe: mau.tieuDe,
    nguon: 'THUONG_XUYEN',
    nhom: mau.nhom,
    han: lanLapTu(lich, mau.lap, homNay),
    gio: mau.gio,
    lap: mau.lap,
    mauMa: mau.ma,
    viecCon: [],
    taoLuc: bayGio,
    suaLuc: bayGio,
  };
}

/**
 * Đồng bộ việc từ mẫu: với mỗi mẫu đang bật mà chưa có bản ghi đang mở (chưa xong, chưa xóa) → tạo mới.
 * Mẫu đã tắt: việc đang mở được giữ nguyên (người dùng tự xóa) – hàm chỉ trả về các việc CẦN THÊM.
 */
export function dongBoViecMau(
  mauDaBat: string[],
  viec: CongViec[],
  homNay: NgayISO,
  lich: Lich,
  taoId: () => Id,
  bayGio: NgayGio,
): CongViec[] {
  const moi: CongViec[] = [];
  for (const ma of mauDaBat) {
    const mau = layMau(ma);
    if (!mau) continue;
    const coMo = viec.some((v) => v.mauMa === ma && !v.xong && !v.xoaLuc);
    if (!coMo) moi.push(taoViecTuMau(mau, homNay, lich, taoId(), bayGio));
  }
  return moi;
}
