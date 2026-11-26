// Cập nhật thuần (không I/O) một cuộc: đánh dấu xong/bỏ đánh dấu bước, tích checklist, nhật ký iTNK, lý do trễ.
import type { CuocKiemTra, KetQuaCuoc, LanNop, NgayISO, SuKien, VuongMac, YeuCauTaiLieu } from '../kieu';
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


/**
 * Thêm hoặc thay (theo id) một sự kiện vào cuộc. Điều chỉnh QĐ (DIEU_CHINH) cập nhật thông tin đoàn/nội dung
 * nếu có điền “…Moi”, và lưu lại giá trị cũ trong sự kiện (`truoc`) để xem lịch sử; không đổi hạn.
 */
export function ganSuKienVaoCuoc(cuoc: CuocKiemTra, sk: SuKien): CuocKiemTra {
  let moi: CuocKiemTra = { ...cuoc, suKien: cuoc.suKien };
  let skLuu: SuKien = sk;
  if (sk.loai === 'DIEU_CHINH') {
    const truoc: Record<string, unknown> = {};
    const chu = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    const td = chu(sk.truongDoanMoi);
    const nd = chu(sk.noiDungMoi);
    const tk = chu(sk.thoiKyMoi);
    // khi sửa lại một điều chỉnh đã có, giữ nguyên giá trị "trước" ban đầu
    const cu = cuoc.suKien.find((s) => s.id === sk.id);
    const truocCu = (cu?.truoc ?? {}) as Record<string, unknown>;
    if (td) {
      truoc.truongDoan = truocCu.truongDoan ?? cuoc.truongDoan;
      moi = { ...moi, truongDoan: td };
    }
    if (nd) {
      truoc.noiDung = truocCu.noiDung ?? cuoc.noiDung;
      moi = { ...moi, noiDung: nd };
    }
    if (tk) {
      truoc.thoiKy = truocCu.thoiKy ?? cuoc.thoiKy;
      moi = { ...moi, thoiKy: tk };
    }
    if (Object.keys(truoc).length) skLuu = { ...sk, truoc };
  }
  // thay tại chỗ nếu đã có (giữ vị trí), ngược lại thêm cuối; sắp ổn định theo thời gian tạo
  const i = cuoc.suKien.findIndex((s) => s.id === sk.id);
  const ds = i >= 0 ? cuoc.suKien.map((s, j) => (j === i ? skLuu : s)) : [...cuoc.suKien, skLuu];
  moi.suKien = ds.sort((a, b) => (a.taoLuc < b.taoLuc ? -1 : a.taoLuc > b.taoLuc ? 1 : 0));
  return moi;
}

export function xoaSuKienKhoiCuoc(cuoc: CuocKiemTra, id: string): CuocKiemTra {
  return { ...cuoc, suKien: cuoc.suKien.filter((s) => s.id !== id) };
}


// ---------- Yêu cầu tài liệu & vướng mắc ----------
export function themYeuCauVaoCuoc(c: CuocKiemTra, y: YeuCauTaiLieu): CuocKiemTra {
  return { ...c, yeuCauTaiLieu: [...c.yeuCauTaiLieu.filter((x) => x.id !== y.id), y] };
}
export function danhDauNhanTaiLieu(c: CuocKiemTra, id: string, nhanLuc: string | undefined): CuocKiemTra {
  return { ...c, yeuCauTaiLieu: c.yeuCauTaiLieu.map((y) => (y.id === id ? { ...y, nhanLuc } : y)) };
}
export function xoaYeuCauKhoiCuoc(c: CuocKiemTra, id: string): CuocKiemTra {
  return { ...c, yeuCauTaiLieu: c.yeuCauTaiLieu.filter((y) => y.id !== id) };
}
export function datVuongMacVaoCuoc(c: CuocKiemTra, v: VuongMac): CuocKiemTra {
  const i = c.vuongMac.findIndex((x) => x.id === v.id);
  const ds = i >= 0 ? c.vuongMac.map((x, j) => (j === i ? v : x)) : [...c.vuongMac, v];
  return { ...c, vuongMac: ds };
}
export function xoaVuongMacKhoiCuoc(c: CuocKiemTra, id: string): CuocKiemTra {
  return { ...c, vuongMac: c.vuongMac.filter((v) => v.id !== id) };
}

// ---------- Kết quả & nộp tiền ----------
export function datKetQuaVaoCuoc(c: CuocKiemTra, kq: KetQuaCuoc): CuocKiemTra {
  return { ...c, ketQua: { ...c.ketQua, ...kq } };
}
export function datLanNopVaoCuoc(c: CuocKiemTra, l: LanNop): CuocKiemTra {
  const i = c.nopTien.findIndex((x) => x.id === l.id);
  const ds = i >= 0 ? c.nopTien.map((x, j) => (j === i ? l : x)) : [...c.nopTien, l];
  return { ...c, nopTien: ds.sort((a, b) => (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : 0)) };
}
export function xoaLanNopKhoiCuoc(c: CuocKiemTra, id: string): CuocKiemTra {
  const checklist = { ...c.checklist };
  delete checklist[`TTR_NOP#${id}`];
  return { ...c, nopTien: c.nopTien.filter((l) => l.id !== id), checklist };
}

export interface TinhHinhNop {
  phaiNop: number;
  daNop: number;
  conLai: number;
  /** 0–100 */
  phanTram: number;
}
export function tinhHinhNop(c: Pick<CuocKiemTra, 'ketQua' | 'nopTien'>): TinhHinhNop {
  const phaiNop = c.ketQua.truyThu + c.ketQua.phat + c.ketQua.chamNop;
  const daNop = c.nopTien.reduce((t, l) => t + l.soTien, 0);
  return { phaiNop, daNop, conLai: Math.max(0, phaiNop - daNop), phanTram: phaiNop > 0 ? Math.min(100, Math.round((daNop / phaiNop) * 100)) : 0 };
}

// ---------- Hồ sơ lưu trữ (Đ35.2) ----------
export const THANH_PHAN_HO_SO: { ma: string; ten: string }[] = [
  { ma: 'HS_RUI_RO', ten: 'Hồ sơ phân tích, đánh giá rủi ro (Phiếu 08/QTKT-TC)' },
  { ma: 'HS_QD', ten: 'QĐ kiểm tra, QĐ gia hạn/điều chỉnh, QĐ giám sát' },
  { ma: 'HS_BB', ten: 'Các biên bản (công bố, kiểm tra, công khai dự thảo, xác nhận số liệu, phụ lục)' },
  { ma: 'HS_BC', ten: 'Báo cáo kết quả kiểm tra, báo cáo kết quả giám sát' },
  { ma: 'HS_NK', ten: 'Nhật ký kiểm tra điện tử' },
  { ma: 'HS_KL', ten: 'Kết luận kiểm tra / QĐ xử phạt vi phạm hành chính' },
  { ma: 'HS_KHAC', ten: 'Tài liệu, chứng từ khác liên quan' },
];
const KHOA_LUU_TRU = (ma: string) => `LT:${ma}`;
export function daTichHoSo(c: Pick<CuocKiemTra, 'checklist'>, ma: string): boolean {
  return !!c.checklist[KHOA_LUU_TRU(ma)];
}
export function tichHoSoVaoCuoc(c: CuocKiemTra, ma: string, ngay: NgayISO | null): CuocKiemTra {
  const checklist = { ...c.checklist };
  if (ngay) checklist[KHOA_LUU_TRU(ma)] = ngay;
  else delete checklist[KHOA_LUU_TRU(ma)];
  return { ...c, checklist };
}
