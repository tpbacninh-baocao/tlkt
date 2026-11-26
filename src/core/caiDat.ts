import type { CaiDat } from './kieu';
import { GIO_LAM_VIEC_MAC_DINH } from './lich';
import { mauBatMacDinh } from './viec';

/** Cài đặt mặc định khi mở app lần đầu. */
export function caiDatMacDinh(): CaiDat {
  return {
    canBo: { hoTen: '', chucVu: '', donVi: '' },
    gioLamViec: GIO_LAM_VIEC_MAC_DINH.map(([a, b]) => [a, b]),
    ngayNghiThem: [],
    ngayLamBu: [],
    namDaXacNhanNgayNghi: [],
    cheDoThanTrong: false,
    vaQuyTac: {},
    tenChucNangHeThong: {},
    nhac: {
      bat: true,
      gioYenLangTu: '21:00',
      gioYenLangDen: '06:30',
      banTinSang: '07:15',
      nhatKy: '16:30',
      nhatKyBaoThuc: '17:15',
      amThanh: true,
    },
    anDanh: false,
    giaoDien: 'heThong',
    khoaTuDongPhut: 5,
    mauViecDaBat: mauBatMacDinh(),
  };
}
