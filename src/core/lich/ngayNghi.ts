// Dựng Lich từ cài đặt người dùng + rules/ngay-nghi.json (ngày lễ dương lịch cố định; Tết/Giỗ Tổ/nghỉ bù do người dùng nhập).
import ngayNghiJson from '../../../rules/ngay-nghi.json';
import type { CaiDat } from '../kieu';
import { taoLich, type Lich, type NgayNghiCoDinh, type NgayNghiTheoNam } from './lich';

export const NGAY_NGHI_CO_DINH = ngayNghiJson.codinh as NgayNghiCoDinh[];
export const NGAY_NGHI_THEO_NAM = ngayNghiJson.theoNam as Record<string, NgayNghiTheoNam>;

export function lichTuCaiDat(cd: Pick<CaiDat, 'ngayNghiThem' | 'ngayLamBu' | 'gioLamViec' | 'cheDoThanTrong'>): Lich {
  return taoLich({
    ngayNghiCoDinh: NGAY_NGHI_CO_DINH,
    theoNam: NGAY_NGHI_THEO_NAM,
    ngayNghiThem: cd.ngayNghiThem,
    ngayLamBu: cd.ngayLamBu,
    gioLamViec: cd.gioLamViec,
    cheDoThanTrong: cd.cheDoThanTrong,
  });
}

/** Năm cần nhắc nhập lịch nghỉ Tết: năm nay và năm sau chưa được xác nhận. */
export function namChuaXacNhanNgayNghi(cd: Pick<CaiDat, 'namDaXacNhanNgayNghi'>, namHienTai: number): number[] {
  return [namHienTai, namHienTai + 1].filter((n) => !cd.namDaXacNhanNgayNghi.includes(n));
}
