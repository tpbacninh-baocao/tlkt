// Hạn của kế hoạch/chuyên đề và thời hiệu kiểm tra lại (rules.keHoach; QĐ 1161 Đ11, Đ14, Đ18).
import type { BoQuyTac, KeHoach, NgayISO, TrangThaiMoc } from '../kieu';
import { congNLV, congNgay, congThangThuan, type Lich } from '../lich';
import { trangThaiTheoHan } from '../vuViec/tinhMoc';

export interface HanKeHoach {
  ma: string;
  ten: string;
  han?: NgayISO;
  ngayXong?: NgayISO;
  trangThai: TrangThaiMoc;
  canCu: string;
}

function dung(han: NgayISO | undefined, xong: NgayISO | undefined, lich: Lich, homNay: NgayISO): TrangThaiMoc {
  if (!han) return 'CHUA_DEN';
  if (xong) return xong <= han ? 'XONG_DUNG_HAN' : 'XONG_TRE';
  return trangThaiTheoHan(lich, homNay, han, false);
}

/** Các hạn áp dụng cho một kế hoạch/chuyên đề. */
export function hanCuaKeHoach(lich: Lich, bo: BoQuyTac, kh: KeHoach, homNay: NgayISO): HanKeHoach[] {
  const kq: HanKeHoach[] = [];
  const them = (ma: string, tu: NgayISO | undefined, xong: NgayISO | undefined) => {
    const c = bo.keHoach[ma];
    const han = tu ? (c.donVi === 'NLV' ? congNLV(lich, tu, c.so) : congNgay(lich, tu, c.so)) : undefined;
    kq.push({ ma, ten: c.ten, han, ngayXong: xong, trangThai: dung(han, xong, lich, homNay), canCu: c.canCu });
  };
  them('CONG_KHAI_KE_HOACH', kh.ngayPheDuyet, kh.ngayCongKhai);
  if (kh.loai === 'CD_PHAT_SINH') {
    them('BAO_CAO_CHUYEN_DE_PHAT_SINH', kh.ngayPheDuyet, kh.ngayBaoCaoCapTren);
    them('BAO_CAO_KET_THUC_CHUYEN_DE', kh.ngayTongKet, kh.ngayBaoCaoKetThuc);
  }
  return kq;
}

export interface ThoiHieu {
  han: NgayISO;
  conHieuLuc: boolean;
  nhan: string;
  canCu: string;
}

/**
 * Thời hiệu kiểm tra lại = ngày ký KL/QĐ xử phạt bị kiểm tra lại + 24 tháng.
 * Giả định an toàn: lấy đúng ngày kỷ niệm (KHÔNG lùi sang ngày làm việc kế tiếp) để hạn không muộn hơn.
 */
export function thoiHieuKiemTraLai(bo: BoQuyTac, ngayKL: NgayISO, homNay: NgayISO): ThoiHieu {
  const c = bo.keHoach.THOI_HIEU_KIEM_TRA_LAI;
  const han = congThangThuan(ngayKL, c.so);
  const con = homNay <= han;
  return { han, conHieuLuc: con, nhan: con ? 'Còn thời hiệu kiểm tra lại' : 'Đã hết thời hiệu kiểm tra lại', canCu: c.canCu };
}
