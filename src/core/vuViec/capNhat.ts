// Cập nhật thuần (không I/O) một cuộc: đánh dấu xong/bỏ đánh dấu bước, tích checklist, nhật ký iTNK, lý do trễ.
import type { CuocKiemTra, NgayISO } from '../kieu';
import type { ViecChecklist } from '../checklist';

export interface DuLieuXongBuoc {
  ngay: NgayISO;
  soVB?: string;
  ghiChu?: string;
  lyDoTre?: string;
  /** Riêng bước X */
  soQDXL?: string;
  loaiVanBanXL?: 'QD_XU_PHAT' | 'KET_LUAN';
  coXuLy?: boolean;
}

const co = (s?: string) => (s && s.trim() ? s.trim() : undefined);

/** Đánh dấu xong bước `ma`; bước D0 (P5) lưu số QĐ; bước X lưu số QĐ xử lý/loại văn bản. */
export function ganXongVaoCuoc(cuoc: CuocKiemTra, ma: string, f: DuLieuXongBuoc): CuocKiemTra {
  const moi: CuocKiemTra = { ...cuoc, buoc: { ...cuoc.buoc }, ketQua: { ...cuoc.ketQua } };
  const buoc: CuocKiemTra['buoc'][string] = { xong: true, ngay: f.ngay };
  if (co(f.soVB)) buoc.soVB = co(f.soVB);
  if (co(f.ghiChu)) buoc.ghiChu = co(f.ghiChu);
  if (co(f.lyDoTre)) buoc.lyDoTre = co(f.lyDoTre);
  moi.buoc[ma] = buoc;
  if (ma === 'P5' && co(f.soVB)) moi.soQD = co(f.soVB);
  if (ma === 'X') {
    const so = co(f.soQDXL) ?? co(f.soVB);
    if (so) moi.ketQua.soQDXL = so;
    if (f.loaiVanBanXL) moi.ketQua.loaiVanBanXL = f.loaiVanBanXL;
    if (f.coXuLy !== undefined) moi.ketQua.coXuLy = f.coXuLy;
  }
  return moi;
}

/** Bỏ đánh dấu xong; giữ lại lý do trễ đã ghi (nếu có). */
export function boXongKhoiCuoc(cuoc: CuocKiemTra, ma: string): CuocKiemTra {
  const buoc = { ...cuoc.buoc };
  const cu = buoc[ma];
  if (cu?.lyDoTre) buoc[ma] = { xong: false, lyDoTre: cu.lyDoTre };
  else delete buoc[ma];
  return { ...cuoc, buoc };
}

/** Ghi (hoặc xóa) lý do trễ cho một bước chưa xong. */
export function ghiLyDoTreVaoCuoc(cuoc: CuocKiemTra, ma: string, lyDo: string): CuocKiemTra {
  const buoc = { ...cuoc.buoc };
  const cu = buoc[ma];
  const l = co(lyDo);
  if (cu?.xong) buoc[ma] = { ...cu, lyDoTre: l };
  else if (l) buoc[ma] = { xong: false, lyDoTre: l };
  else delete buoc[ma];
  if (buoc[ma]?.lyDoTre === undefined && buoc[ma] && !buoc[ma].xong) delete buoc[ma];
  return { ...cuoc, buoc };
}

/** Tích một việc nhập liệu (hoặc nhật ký hằng ngày). */
export function tickVaoCuoc(cuoc: CuocKiemTra, v: Pick<ViecChecklist, 'khoa' | 'hangNgay' | 'phatSinh' | 'lanNopId'>, ngay: NgayISO): CuocKiemTra {
  if (v.hangNgay) {
    return { ...cuoc, nhatKy: { ...cuoc.nhatKy, [v.phatSinh]: { ...cuoc.nhatKy[v.phatSinh], daGhiITNK: true } } };
  }
  const moi: CuocKiemTra = { ...cuoc, checklist: { ...cuoc.checklist, [v.khoa]: ngay } };
  if (v.lanNopId) moi.nopTien = cuoc.nopTien.map((l) => (l.id === v.lanNopId ? { ...l, daNhapTTR: true } : l));
  return moi;
}

export function boTickKhoiCuoc(cuoc: CuocKiemTra, v: Pick<ViecChecklist, 'khoa' | 'hangNgay' | 'phatSinh' | 'lanNopId'>): CuocKiemTra {
  if (v.hangNgay) {
    return { ...cuoc, nhatKy: { ...cuoc.nhatKy, [v.phatSinh]: { ...cuoc.nhatKy[v.phatSinh], daGhiITNK: false } } };
  }
  const checklist = { ...cuoc.checklist };
  delete checklist[v.khoa];
  const moi: CuocKiemTra = { ...cuoc, checklist };
  if (v.lanNopId) moi.nopTien = cuoc.nopTien.map((l) => (l.id === v.lanNopId ? { ...l, daNhapTTR: false } : l));
  return moi;
}

/** Ghi nhật ký iTNK của một ngày (đã ghi/chưa) kèm ghi chú nhanh. */
export function datNhatKyVaoCuoc(cuoc: CuocKiemTra, ngay: NgayISO, daGhi: boolean, ghiChu?: string): CuocKiemTra {
  const cu = cuoc.nhatKy[ngay] ?? { daGhiITNK: false };
  return { ...cuoc, nhatKy: { ...cuoc.nhatKy, [ngay]: { daGhiITNK: daGhi, ghiChu: ghiChu !== undefined ? ghiChu : cu.ghiChu } } };
}

/** Đánh dấu một ngày làm việc đoàn KHÔNG xuống doanh nghiệp (hoặc bỏ đánh dấu). */
export function datNgayKhongLamTaiDN(cuoc: CuocKiemTra, ngay: NgayISO, khong: boolean): CuocKiemTra {
  const ds = cuoc.ngayKhongLamTaiDN.filter((d) => d !== ngay);
  if (khong) ds.push(ngay);
  return { ...cuoc, ngayKhongLamTaiDN: ds.sort() };
}

/** Nhân bản một cuộc: giữ thông tin NNT/phân loại/đoàn, xóa toàn bộ tiến trình, sự kiện, kết quả, checklist, nhật ký. */
export function nhanBanCuocTho(c: CuocKiemTra, id: string, ma: string, bayGio: string): CuocKiemTra {
  return {
    id,
    ma,
    mst: c.mst,
    tenNNT: c.tenNNT,
    diaChi: c.diaChi,
    doiTuong: c.doiTuong,
    coQuanQuanLyKhac: c.coQuanQuanLyKhac,
    loai: c.loai,
    keHoachId: c.keHoachId,
    thangDuKien: c.thangDuKien,
    coGDLK: c.coGDLK,
    kiemTraDienTu: c.kiemTraDienTu,
    kiemTraLai: false,
    truongDoan: c.truongDoan,
    thanhVien: c.thanhVien.map((t) => ({ ...t })),
    giamSat: [...c.giamSat],
    noiDung: c.noiDung,
    thoiKy: c.thoiKy,
    buoc: {},
    suKien: [],
    ketQua: { coXuLy: false, truyThu: 0, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 },
    nopTien: [],
    checklist: {},
    nhatKy: {},
    ngayKhongLamTaiDN: [],
    yeuCauTaiLieu: [],
    vuongMac: [],
    taoLuc: bayGio,
    suaLuc: bayGio,
  };
}
