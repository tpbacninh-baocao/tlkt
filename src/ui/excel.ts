// Xuất Excel (5 loại) – dựng bảng bằng core/nhapXuat, ghi .xlsx bằng SheetJS (nạp khi dùng).
import { bangDanhSachCuoc, bangNhapLieuThieu, bangThuNop, bangTienDoKeHoach, bangViecKhac, TEN_TEP_EXCEL, type BangXuat } from '../core/nhapXuat';
import { thongKeKeHoach } from '../core/keHoach';
import { ghiTepXlsx } from '../data/excel';
import { caiDat, cuocConHieuLuc, dsKeHoach, duLieuTomTat, homNay, lich, phanTichMap, toast, viecConHieuLuc } from './store';
import { taiXuong } from './xuat';

export type LoaiExcel = 'DANH_SACH_CUOC' | 'NHAP_LIEU_THIEU' | 'THU_NOP' | 'TIEN_DO_KE_HOACH' | 'VIEC_KHAC';

export const TEN_EXCEL: Record<LoaiExcel, string> = {
  DANH_SACH_CUOC: 'Danh sách cuộc + mốc + SLA',
  NHAP_LIEU_THIEU: 'Nhập liệu còn thiếu',
  THU_NOP: 'Theo dõi thu nộp sau kiểm tra',
  TIEN_DO_KE_HOACH: 'Tiến độ kế hoạch năm',
  VIEC_KHAC: 'Việc khác',
};

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function dungBang(loai: LoaiExcel): BangXuat[] {
  const d = duLieuTomTat.value;
  const pts = cuocConHieuLuc.value.map((c) => phanTichMap.value.get(c.id)).filter((x): x is NonNullable<typeof x> => !!x);
  switch (loai) {
    case 'DANH_SACH_CUOC':
      return bangDanhSachCuoc(d, pts);
    case 'NHAP_LIEU_THIEU':
      return [bangNhapLieuThieu(d, pts)];
    case 'THU_NOP':
      return [bangThuNop(d, pts)];
    case 'TIEN_DO_KE_HOACH': {
      const nam = Number(homNay.value.slice(0, 4));
      const tk = thongKeKeHoach({ homNay: homNay.value, lich: lich.value, cuoc: cuocConHieuLuc.value, keHoach: dsKeHoach.value.filter((k) => !k.xoaLuc), va: caiDat.value.vaQuyTac as never }, { nam });
      return bangTienDoKeHoach(tk, nam, 'Tất cả kế hoạch của năm');
    }
    case 'VIEC_KHAC':
      return [bangViecKhac(viecConHieuLuc.value, lich.value, homNay.value)];
  }
}

export async function xuatExcel(loai: LoaiExcel): Promise<void> {
  try {
    const bang = dungBang(loai);
    if (bang.every((b) => b.dong.length === 0)) {
      toast('Chưa có dữ liệu để xuất.', 'thongTin');
      return;
    }
    const tep = await ghiTepXlsx(bang);
    taiXuong(`TLKT-${TEN_TEP_EXCEL[loai]}-${homNay.value.replaceAll('-', '')}.xlsx`, tep, MIME_XLSX);
    toast(`Đã tải tệp Excel “${TEN_EXCEL[loai]}”${caiDat.value.anDanh ? ' (đã ẩn MST/tên theo chế độ ẩn danh)' : ''}.`);
  } catch (e) {
    toast(e instanceof Error ? `Không xuất được Excel: ${e.message}` : 'Không xuất được Excel.', 'loi');
  }
}
