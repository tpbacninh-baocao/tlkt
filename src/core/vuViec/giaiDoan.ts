// Giai đoạn của cuộc (cột Kanban) – ARCHITECTURE §6.
import type { CuocKiemTra, GiaiDoan, MocTinh } from '../kieu';
import type { KetQuaTinhMoc } from './tinhMoc';

export const THU_TU_GIAI_DOAN: GiaiDoan[] = [
  'CHUAN_BI',
  'CHO_CONG_BO',
  'DANG_KIEM_TRA',
  'BIEN_BAN',
  'CHO_QD_XU_LY',
  'SAU_QD',
  'THEO_DOI_NOP_TIEN',
  'HOAN_THANH',
  'BAI_BO',
];

export const TEN_GIAI_DOAN: Record<GiaiDoan, string> = {
  CHUAN_BI: 'Chuẩn bị',
  CHO_CONG_BO: 'Chờ công bố',
  DANG_KIEM_TRA: 'Đang kiểm tra',
  BIEN_BAN: 'Biên bản',
  CHO_QD_XU_LY: 'Chờ QĐ xử lý',
  SAU_QD: 'Sau QĐ',
  THEO_DOI_NOP_TIEN: 'Theo dõi nộp tiền',
  HOAN_THANH: 'Hoàn thành',
  BAI_BO: 'Bãi bỏ',
};

export function buocXong(cuoc: CuocKiemTra, ma: string): boolean {
  return !!cuoc.buoc[ma]?.xong;
}

function moc(kq: KetQuaTinhMoc, ma: string): MocTinh | undefined {
  return kq.danhSach.find((m) => m.ma === ma);
}

/**
 * Xét theo thứ tự: BAI_BO → HOAN_THANH → THEO_DOI_NOP_TIEN → SAU_QD → CHO_QD_XU_LY → BIEN_BAN →
 * DANG_KIEM_TRA → CHO_CONG_BO → CHUAN_BI.
 */
export function tinhGiaiDoan(cuoc: CuocKiemTra, kq: KetQuaTinhMoc): GiaiDoan {
  if (kq.baiBo) return 'BAI_BO';
  const xong = (ma: string) => buocXong(cuoc, ma);
  if (xong('X')) {
    const s4 = moc(kq, 'S4');
    const s4Xong = !s4 || s4.trangThai === 'KHONG_AP_DUNG' || xong('S4');
    if (xong('S1') && xong('S5')) return s4Xong ? 'HOAN_THANH' : 'THEO_DOI_NOP_TIEN';
    return 'SAU_QD';
  }
  if (xong('B4')) return 'CHO_QD_XU_LY';
  if (xong('T7')) return 'BIEN_BAN';
  if (xong('Q5')) return 'DANG_KIEM_TRA';
  if (xong('P5')) return 'CHO_CONG_BO';
  return 'CHUAN_BI';
}

/** Số giai đoạn đã đi qua / 8 (cho thanh tiến độ “5/8 giai đoạn”). */
export function tienDoGiaiDoan(g: GiaiDoan): { daQua: number; tong: number } {
  const tuyen: GiaiDoan[] = THU_TU_GIAI_DOAN.filter((x) => x !== 'BAI_BO');
  const i = tuyen.indexOf(g);
  return { daQua: i < 0 ? 0 : i + 1, tong: tuyen.length };
}
