// Danh mục việc nhập liệu hệ thống – nạp từ rules/checklist-he-thong.json. Tên chức năng là CẤU HÌNH.
import danhMucJson from '../../../rules/checklist-he-thong.json';

export type MaHeThong = 'TTR' | 'ITNK' | 'TMS';

export interface MucChecklist {
  ma: string;
  heThong: MaHeThong;
  chucNang: string;
  khi: string; // 'D0' | 'Q3' | 'C' | 'K' | 'B' | 'R' | 'X' | 'NOP_TIEN' | 'SK:<LOAI>'
  dieuKien?: 'X_LA_KET_LUAN' | 'X_LA_QD_XU_PHAT';
  sau?: string[];
  lapLai?: string;
  saoChep: string[];
}

export const TEN_HE_THONG: Record<MaHeThong, string> = danhMucJson.heThong as Record<MaHeThong, string>;
export const DANH_MUC_CHECKLIST: MucChecklist[] = danhMucJson.viec as MucChecklist[];
export const DANH_MUC_HANG_NGAY = danhMucJson.hangNgay as { ma: string; heThong: MaHeThong; chucNang: string; khi: string }[];

export function layMuc(ma: string): MucChecklist | undefined {
  return DANH_MUC_CHECKLIST.find((m) => m.ma === ma);
}
