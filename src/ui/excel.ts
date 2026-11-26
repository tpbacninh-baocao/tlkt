import { toast } from './store';

export type LoaiExcel = 'DANH_SACH_CUOC' | 'NHAP_LIEU_THIEU' | 'THU_NOP' | 'TIEN_DO_KE_HOACH' | 'VIEC_KHAC';

/** Xuất Excel – hoàn thiện ở T35. */
export async function xuatExcel(_loai: LoaiExcel): Promise<void> {
  toast('Xuất Excel sẽ có ở bước T35', 'thongTin');
}

export const TEN_EXCEL: Record<LoaiExcel, string> = {
  DANH_SACH_CUOC: 'Danh sách cuộc + mốc + SLA',
  NHAP_LIEU_THIEU: 'Nhập liệu còn thiếu',
  THU_NOP: 'Theo dõi thu nộp sau kiểm tra',
  TIEN_DO_KE_HOACH: 'Tiến độ kế hoạch năm',
  VIEC_KHAC: 'Việc khác',
};
