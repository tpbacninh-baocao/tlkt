// Toàn bộ kiểu dữ liệu của lõi nghiệp vụ (ARCHITECTURE §5). TypeScript thuần, không phụ thuộc trình duyệt.

export type NgayISO = string; // 'YYYY-MM-DD'
export type NgayGio = string; // 'YYYY-MM-DDTHH:MM'
export type Id = string;

export interface CanBo {
  id: Id;
  hoTen: string;
  chucVu?: string;
  email?: string;
}

export interface CaiDat {
  canBo: { hoTen: string; chucVu?: string; donVi: string; email?: string };
  gioLamViec: [string, string][];
  ngayNghiThem: NgayISO[];
  ngayLamBu: NgayISO[];
  namDaXacNhanNgayNghi: number[];
  cheDoThanTrong: boolean;
  vaQuyTac: Record<string, unknown>;
  tenChucNangHeThong: Record<string, string>;
  nhac: {
    bat: boolean;
    gioYenLangTu: string;
    gioYenLangDen: string;
    banTinSang: string;
    nhatKy: string;
    nhatKyBaoThuc: string;
    amThanh: boolean;
  };
  anDanh: boolean;
  giaoDien: 'sang' | 'toi' | 'heThong';
  khoaTuDongPhut: number;
  mauViecDaBat: string[];
  coDaOnboarding?: boolean;
  coChuLon?: boolean;
  tuNgaySaoLuuCuoi?: NgayISO;
}

export interface KeHoach {
  id: Id;
  nam: number;
  loai: 'KH_NAM' | 'CD_DAU_NAM' | 'CD_PHAT_SINH' | 'DOT_XUAT';
  ten: string;
  soQD?: string;
  ngayPheDuyet?: NgayISO;
  ngayCongKhai?: NgayISO;
  ngayBaoCaoCapTren?: NgayISO;
  ngayTongKet?: NgayISO;
  ngayBaoCaoKetThuc?: NgayISO;
  chiTieuSoCuoc?: number;
  ghiChu?: string;
  taoLuc?: NgayGio;
  suaLuc?: NgayGio;
  xoaLuc?: NgayGio;
}

export type LoaiCuoc = 'KH' | 'CD' | 'TH' | 'SH' | 'GT' | 'CDD' | 'TCS' | 'VP' | 'CĐ' | 'KN' | 'MG' | 'CQT' | 'KL';

export interface BuocThucHien {
  xong: boolean;
  ngay?: NgayISO;
  soVB?: string;
  ghiChu?: string;
  lyDoTre?: string;
}

export type LoaiSuKien =
  | 'HOAN'
  | 'TAM_DUNG'
  | 'GIA_HAN'
  | 'DIEU_CHINH'
  | 'BAI_BO'
  | 'GIAI_TRINH'
  | 'PHUC_TAP'
  | 'TOI_PHAM'
  | 'KHONG_NHAN_QD'
  | 'TAM_GIU_TL'
  | 'PHU_LUC_BB';

export interface SuKien {
  id: Id;
  loai: LoaiSuKien;
  [truong: string]: unknown;
  taoLuc: NgayGio;
}

export interface YeuCauTaiLieu {
  id: Id;
  noiDung: string;
  guiLuc: NgayGio;
  nhanLuc?: NgayGio;
  ghiChu?: string;
}

export interface VuongMac {
  id: Id;
  noiDung: string;
  ngayBaoCao: NgayISO;
  ngayLanhDaoBaoCao?: NgayISO;
  ngayNhanYKien?: NgayISO;
  ngayTongHop?: NgayISO;
  daXong: boolean;
}

export interface LanNop {
  id: Id;
  ngay: NgayISO;
  soTien: number;
  ghiChu?: string;
  daNhapTTR: boolean;
}

export interface KetQuaCuoc {
  coXuLy: boolean;
  truyThu: number;
  phat: number;
  chamNop: number;
  giamKhauTru: number;
  giamLo: number;
  thuHoiHoan: number;
  loaiVanBanXL?: 'QD_XU_PHAT' | 'KET_LUAN';
  soQDXL?: string;
  hanhViViPham?: string;
}

export interface CuocKiemTra {
  id: Id;
  ma: string;
  mst: string;
  tenNNT: string;
  diaChi?: string;
  doiTuong: 'TO_CHUC' | 'HKD';
  coQuanQuanLyKhac: boolean;
  loai: LoaiCuoc;
  keHoachId?: Id;
  thangDuKien?: string;
  coGDLK: boolean;
  kiemTraDienTu: boolean;
  kiemTraLai: boolean;
  ngayKLBiKiemTraLai?: NgayISO;
  hanNgoai?: NgayISO;
  hanNgoaiGhiChu?: string;
  vanBanGiao?: string;
  truongDoan: string;
  thanhVien: { hoTen: string; phanViec?: string }[];
  giamSat: string[];
  noiDung?: string;
  thoiKy?: string;
  ngayCongBoDuKien?: NgayISO;
  buoc: Record<string, BuocThucHien>;
  suKien: SuKien[];
  ketQua: KetQuaCuoc;
  nopTien: LanNop[];
  checklist: Record<string, NgayISO>;
  nhatKy: Record<NgayISO, { daGhiITNK: boolean; ghiChu?: string }>;
  ngayKhongLamTaiDN: NgayISO[];
  yeuCauTaiLieu: YeuCauTaiLieu[];
  vuongMac: VuongMac[];
  boQuyTacGhiDe?: string;
  ghim?: boolean;
  nhan?: string[];
  soQD?: string;
  laDuLieuMau?: boolean;
  taoLuc: NgayGio;
  suaLuc: NgayGio;
  xoaLuc?: NgayGio;
}

export interface CongViec {
  id: Id;
  tieuDe: string;
  nguon: 'LANH_DAO' | 'VAN_BAN' | 'TU_DAT' | 'THUONG_XUYEN';
  nhom?: string;
  soVB?: string;
  nguoiGiao?: string;
  han?: NgayISO;
  gio?: string;
  lap?: string;
  mauMa?: string;
  cuocId?: Id;
  viecCon: { id: Id; tieuDe: string; xong: boolean }[];
  xong?: NgayGio;
  ghim?: boolean;
  ghiChu?: string;
  laDuLieuMau?: boolean;
  taoLuc: NgayGio;
  suaLuc: NgayGio;
  xoaLuc?: NgayGio;
}

export interface KhoiThoiGian {
  id: Id;
  ngay: NgayISO;
  tu: string;
  den: string;
  tieuDe: string;
  cuocId?: Id;
  viecId?: Id;
  laDuLieuMau?: boolean;
}

export interface KeHoachNgay {
  ngay: NgayISO;
  mucTieu: string[];
  nhacNho: string;
  ghiChu: string;
  choNgayMai: string;
  camNhan?: 1 | 2 | 3 | 4 | 5;
  viecTick?: string[];
}

export interface NhatKyHeThong {
  luc: NgayGio;
  hanhDong: 'THEM' | 'SUA' | 'XOA' | 'KHOI_PHUC' | 'CAI_DAT' | 'NHAP' | 'XUAT';
  doiTuong: string;
  id?: Id;
  truoc?: unknown;
  sau?: unknown;
}

// ---------- Kết quả tính (không lưu) ----------

export type TrangThaiMoc =
  | 'XONG_DUNG_HAN'
  | 'XONG_TRE'
  | 'CHUA_DEN'
  | 'SAP_DEN'
  | 'HOM_NAY'
  | 'QUA_HAN'
  | 'KHONG_AP_DUNG';

export type GiaiDoan =
  | 'CHUAN_BI'
  | 'CHO_CONG_BO'
  | 'DANG_KIEM_TRA'
  | 'BIEN_BAN'
  | 'CHO_QD_XU_LY'
  | 'SAU_QD'
  | 'THEO_DOI_NOP_TIEN'
  | 'HOAN_THANH'
  | 'BAI_BO';

export interface MocTinh {
  ma: string;
  ten: string;
  giaiDoan: string;
  loai: string;
  hanPhapLy?: NgayISO;
  hanMucTieu?: NgayISO;
  duKien: boolean;
  noiBo: boolean;
  trangThai: TrangThaiMoc;
  ngayXong?: NgayISO;
  canCu: string;
  bieuMau: string[];
  nguoi: string;
  /** Mốc gốc (D0, C, E, K, B, R, X) mà bước này tạo ra, nếu có. */
  moc?: string;
  /** Bước tùy chọn / có điều kiện (viền đứt trên giao diện) */
  tuyChon?: boolean;
  dieuKien?: boolean;
  /** Ghi chú giải thích cách tính (ví dụ chế độ X). */
  ghiChu?: string;
  /** Mã mốc còn thiếu nên chưa tính được hạn */
  thieuMoc?: string;
  /** Số NLV còn lại tới hạn pháp lý (âm = quá hạn). */
  nlvConLai?: number;
  quaHanChuaGiaiTrinh?: boolean;
  soNgayTre?: number;
}

// ---------- Bộ quy tắc (rules/*.json) ----------

export interface HanDacTa {
  tu?: string;
  so?: number;
  soNeuGDLK?: number;
  donVi?: 'NLV' | 'N' | 'THANG' | 'GIO_LV';
  huong?: '+' | '-';
  congTamDung?: boolean;
  giaHan?: { toiDa: number; toiDaGDLK?: number; soLan: number; donVi: 'N' | 'NLV' };
  truoc?: string;
  vaTruoc?: string;
  macDinhNeuChuaCoK?: string;
  theoCheDo?: string;
  thamSo?: string;
  noiBo?: boolean;
  suKienThayThe?: string;
}

export interface BuocQuyTac {
  ma: string;
  giaiDoan: string;
  ten: string;
  nguoi: string;
  loai: 'moc' | 'buoc' | 'hanTinh' | 'hangNgay' | 'tuyChon' | 'dieuKien' | 'theoDoi' | 'theoDoiNopTien';
  moc?: string;
  han?: HanDacTa | null;
  dem?: number;
  dieuKien?: string;
  canCu: string;
  bieuMau: string[];
  nhapThem?: string[];
  canhBaoKeHoach?: string;
  hoanThanhKhi?: string;
  nhacTruocNgay?: number;
}

export interface CheDoX {
  ten: string;
  han: HanDacTa;
  canCu: string;
  batBuocLyDo?: boolean;
}

export interface SuKienQuyTac {
  ten: string;
  chiTruoc?: string;
  chiTrongKhoang?: string[];
  truong: string[];
  batBuoc?: string[];
  tacDong: string;
  rangBuoc?: string[];
  bieuMau?: string[];
  canCu: string;
}

export interface DongHoQuyTac {
  ten: string;
  tu?: string;
  so: number;
  donVi: 'NLV' | 'GIO_LV';
  nhacTruocPhut?: number;
  quaHan?: string;
  canCu: string;
}

export interface KeHoachQuyTac {
  ten: string;
  tu: string;
  so: number;
  donVi: 'N' | 'NLV' | 'THANG';
  canCu: string;
}

export interface BoQuyTac {
  ma: string;
  ten: string;
  keThua?: string;
  apDung: { ngayQDTu: NgayISO | null; ngayQDDen: NgayISO | null };
  ghiChuApDung?: string;
  chuaXacNhan?: string[];
  thamSo: Record<string, number>;
  buoc: BuocQuyTac[];
  /** X1..X4 là CheDoX; khóa `chonCheDo` là chuỗi mô tả cách chọn (chỉ để đọc). */
  cheDoX: Record<string, CheDoX | string>;
  suKien: Record<string, SuKienQuyTac>;
  dongHo: Record<string, DongHoQuyTac>;
  keHoach: Record<string, KeHoachQuyTac>;
  baoCaoDinhKy: { ma: string; ten: string; lich: string; canCu: string }[];
}
