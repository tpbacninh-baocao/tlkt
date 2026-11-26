import type { CuocKiemTra, Id, KetQuaCuoc, NgayGio } from '../kieu';

export function ketQuaRong(): KetQuaCuoc {
  return { coXuLy: false, truyThu: 0, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 };
}

/** Tạo một cuộc kiểm tra rỗng với giá trị mặc định hợp lý; các trường truyền vào ghi đè mặc định. */
export function taoCuocRong(p: Partial<CuocKiemTra> & { id: Id; ma: string; taoLuc: NgayGio }): CuocKiemTra {
  return {
    mst: '',
    tenNNT: '',
    doiTuong: 'TO_CHUC',
    coQuanQuanLyKhac: false,
    loai: 'KH',
    coGDLK: false,
    kiemTraDienTu: false,
    kiemTraLai: false,
    truongDoan: '',
    thanhVien: [],
    giamSat: [],
    buoc: {},
    suKien: [],
    ketQua: ketQuaRong(),
    nopTien: [],
    checklist: {},
    nhatKy: {},
    ngayKhongLamTaiDN: [],
    yeuCauTaiLieu: [],
    vuongMac: [],
    suaLuc: p.taoLuc,
    ...p,
  };
}
