// Chuỗi giao diện tập trung (ARCHITECTURE §14). Toàn bộ tiếng Việt.
import type { GiaiDoan, MocTinh, TrangThaiMoc } from '../core/kieu';
import type { MucSLA } from '../core/vuViec';

export const TEN_APP = 'Trợ lý Đoàn kiểm tra';
export const TEN_NGAN = 'TLKT';

export interface MucDieuHuong {
  hash: string;
  ten: string;
  bieuTuong: string;
  /** Hiện ở thanh dưới điện thoại */
  chinh?: boolean;
}

export const DIEU_HUONG: MucDieuHuong[] = [
  { hash: '#hom-nay', ten: 'Hôm nay', bieuTuong: '🏠', chinh: true },
  { hash: '#cuoc', ten: 'Cuộc kiểm tra', bieuTuong: '📁', chinh: true },
  { hash: '#lich', ten: 'Lịch', bieuTuong: '📅', chinh: true },
  { hash: '#viec', ten: 'Việc', bieuTuong: '✅', chinh: true },
  { hash: '#ke-hoach-ngay', ten: 'Kế hoạch ngày', bieuTuong: '📝' },
  { hash: '#ke-hoach-nam', ten: 'Kế hoạch năm', bieuTuong: '📊' },
  { hash: '#nhap-lieu', ten: 'Nhập liệu còn thiếu', bieuTuong: '⌨️' },
  { hash: '#bao-cao', ten: 'Báo cáo & tóm tắt', bieuTuong: '📄' },
  { hash: '#cai-dat', ten: 'Cài đặt', bieuTuong: '⚙️' },
  { hash: '#can-cu', ten: 'Căn cứ & hướng dẫn', bieuTuong: '📚' },
  { hash: '#thung-rac', ten: 'Thùng rác', bieuTuong: '🗑️' },
  { hash: '#gioi-thieu', ten: 'Giới thiệu', bieuTuong: 'ℹ️' },
];

export const TIEU_DE_MAN: Record<string, string> = {
  'hom-nay': 'Hôm nay',
  cuoc: 'Các cuộc kiểm tra',
  'cuoc-chi-tiet': 'Chi tiết cuộc',
  lich: 'Lịch',
  viec: 'Việc',
  'ke-hoach-ngay': 'Kế hoạch ngày',
  'ke-hoach-nam': 'Kế hoạch năm',
  'nhap-lieu': 'Nhập liệu còn thiếu',
  'bao-cao': 'Báo cáo & tóm tắt',
  'cai-dat': 'Cài đặt',
  'can-cu': 'Căn cứ & hướng dẫn',
  'thung-rac': 'Thùng rác',
  'gioi-thieu': 'Giới thiệu',
  'kiem-thu': 'Kiểm thử quy tắc',
};

// ---------- SLA ----------
export interface KieuSLA {
  bieuTuong: string;
  nhan: string;
  lop: string;
}

export const KIEU_SLA: Record<MucSLA, KieuSLA> = {
  CON_LAU: { bieuTuong: '●', nhan: 'Còn thời gian', lop: 'sla-xanh' },
  SAP_DEN: { bieuTuong: '◐', nhan: 'Sắp đến hạn', lop: 'sla-vang' },
  HOM_NAY_NGAY_MAI: { bieuTuong: '▲', nhan: 'Hôm nay / ngày mai', lop: 'sla-cam' },
  QUA_HAN: { bieuTuong: '✖', nhan: 'Quá hạn', lop: 'sla-do' },
  QUA_HAN_CHUA_GIAI_TRINH: { bieuTuong: '⚠', nhan: 'Quá hạn – chưa ghi lý do', lop: 'sla-do-dam' },
  XONG_DUNG_HAN: { bieuTuong: '✓', nhan: 'Đúng hạn', lop: 'sla-xong' },
  XONG_TRE: { bieuTuong: '☑', nhan: 'Xong trễ', lop: 'sla-tre' },
  DU_KIEN: { bieuTuong: '~', nhan: 'Dự kiến', lop: 'sla-du-kien' },
  KHONG_AP_DUNG: { bieuTuong: '–', nhan: 'Không áp dụng', lop: 'sla-khong' },
};

export function nhanSLAChiTiet(m: Pick<MocTinh, 'trangThai' | 'nlvConLai' | 'soNgayTre' | 'duKien' | 'quaHanChuaGiaiTrinh'>, muc: MucSLA): string {
  switch (muc) {
    case 'XONG_DUNG_HAN':
      return 'Đúng hạn';
    case 'XONG_TRE':
      return `Trễ ${m.soNgayTre ?? 1} ngày`;
    case 'DU_KIEN':
      return 'Dự kiến';
    case 'KHONG_AP_DUNG':
      return 'Không áp dụng';
    case 'QUA_HAN':
    case 'QUA_HAN_CHUA_GIAI_TRINH':
      return muc === 'QUA_HAN_CHUA_GIAI_TRINH' ? 'Quá hạn – chưa ghi lý do' : `Quá hạn ${-(m.nlvConLai ?? 0)} ngày LV`;
    case 'HOM_NAY_NGAY_MAI':
      return m.trangThai === 'HOM_NAY' || m.nlvConLai === 0 ? 'Hôm nay' : 'Ngày mai';
    case 'SAP_DEN':
      return 'Sắp đến hạn';
    default:
      return m.nlvConLai !== undefined ? `Còn ${m.nlvConLai} ngày LV` : 'Còn thời gian';
  }
}

export function nhanTheoTrangThai(t: TrangThaiMoc): MucSLA {
  switch (t) {
    case 'XONG_DUNG_HAN':
      return 'XONG_DUNG_HAN';
    case 'XONG_TRE':
      return 'XONG_TRE';
    case 'QUA_HAN':
      return 'QUA_HAN';
    case 'HOM_NAY':
      return 'HOM_NAY_NGAY_MAI';
    case 'SAP_DEN':
      return 'SAP_DEN';
    case 'KHONG_AP_DUNG':
      return 'KHONG_AP_DUNG';
    default:
      return 'CON_LAU';
  }
}

// ---------- Giai đoạn ----------
export const MAU_GIAI_DOAN: Record<GiaiDoan, string> = {
  CHUAN_BI: 'var(--gd-chuan-bi)',
  CHO_CONG_BO: 'var(--gd-cho-cong-bo)',
  DANG_KIEM_TRA: 'var(--gd-dang-kiem-tra)',
  BIEN_BAN: 'var(--gd-bien-ban)',
  CHO_QD_XU_LY: 'var(--gd-cho-qd)',
  SAU_QD: 'var(--gd-sau-qd)',
  THEO_DOI_NOP_TIEN: 'var(--gd-theo-doi)',
  HOAN_THANH: 'var(--gd-hoan-thanh)',
  BAI_BO: 'var(--gd-bai-bo)',
};

export const TEN_LOAI_CUOC: Record<string, string> = {
  KH: 'Theo kế hoạch năm',
  CD: 'Chuyên đề',
  TH: 'Kiểm tra trước hoàn thuế',
  SH: 'Kiểm tra sau hoàn thuế',
  GT: 'Giải thể, chấm dứt hoạt động, chấm dứt hiệu lực MST',
  CDD: 'Chuyển địa điểm kinh doanh',
  TCS: 'Chia, tách, sáp nhập, hợp nhất, chuyển đổi, cổ phần hóa, phá sản',
  VP: 'Có dấu hiệu vi phạm pháp luật thuế',
  'CĐ': 'Theo chỉ đạo/kiến nghị của cơ quan, người có thẩm quyền',
  KN: 'Giải quyết khiếu nại, tố cáo',
  MG: 'Hồ sơ miễn, giảm thuế rủi ro cao',
  CQT: 'Chuyển từ kiểm tra tại trụ sở CQT',
  KL: 'Kiểm tra lại',
};

export const MAU_HE_THONG: Record<string, string> = { TTR: 'var(--ht-ttr)', ITNK: 'var(--ht-itnk)', TMS: 'var(--ht-tms)' };
export const TEN_HE_THONG_NGAN: Record<string, string> = { TTR: 'TTR', ITNK: 'iTNK', TMS: 'TMS' };

export const VAN_BAN = {
  rongHomNay: 'Không có việc gấp – xem kế hoạch tuần.',
  rongNhapLieu: 'Tuyệt! Không còn việc nhập liệu nào.',
  rongCuoc: 'Chưa có cuộc kiểm tra nào',
  khoa: 'Dữ liệu đang khóa',
};

export function nhanTuoiLoai(loai: string): string {
  return TEN_LOAI_CUOC[loai] ?? loai;
}

/** Gợi ý khi chọn loại cuộc (SPEC §6) – chỉ là nhắc nhở, đối chiếu Điều 16.1 QĐ 1161 khi soạn tờ trình. */
export const GOI_Y_LOAI: Record<string, { ghiChu: string; noiDung: string }> = {
  KH: { ghiChu: 'Theo kế hoạch năm. Cảnh báo nếu quá “thời gian dự kiến” trong mẫu 06/QTKT-TC.', noiDung: 'Các sắc thuế/khoản thu theo Phiếu phân tích rủi ro' },
  CD: { ghiChu: 'Chuyên đề (đầu năm/phát sinh). Chuyên đề phát sinh: báo cáo cấp trên ≤ 15 ngày từ ngày phê duyệt.', noiDung: 'Nội dung theo quyết định phê duyệt chuyên đề' },
  TH: { ghiChu: 'Kiểm tra trước hoàn thuế – ưu tiên cao. Nhập hạn giải quyết hồ sơ hoàn vào ô “Hạn ngoài”.', noiDung: 'Hồ sơ đề nghị hoàn thuế' },
  SH: { ghiChu: 'Kiểm tra sau hoàn thuế – trong 05 năm từ ngày có quyết định hoàn.', noiDung: 'Số thuế đã được hoàn' },
  GT: { ghiChu: 'Giải thể, chấm dứt hoạt động, chấm dứt hiệu lực MST – đột xuất.', noiDung: 'Nghĩa vụ thuế đến thời điểm giải thể/chấm dứt hoạt động' },
  CDD: { ghiChu: 'Chuyển địa điểm kinh doanh – đột xuất.', noiDung: 'Nghĩa vụ thuế trước khi chuyển địa điểm' },
  TCS: { ghiChu: 'Chia, tách, sáp nhập, hợp nhất, chuyển đổi loại hình, cổ phần hóa, phá sản – đột xuất.', noiDung: 'Nghĩa vụ thuế đến thời điểm chia/tách/sáp nhập…' },
  VP: { ghiChu: 'Có dấu hiệu vi phạm pháp luật thuế – đột xuất.', noiDung: 'Nội dung có dấu hiệu vi phạm' },
  'CĐ': { ghiChu: 'Theo chỉ đạo/kiến nghị của cơ quan, người có thẩm quyền – đột xuất. Ghi văn bản giao ở ô bên dưới.', noiDung: 'Nội dung theo văn bản chỉ đạo' },
  KN: { ghiChu: 'Giải quyết khiếu nại, tố cáo – đột xuất.', noiDung: 'Nội dung khiếu nại, tố cáo cần xác minh' },
  MG: { ghiChu: 'Hồ sơ miễn, giảm thuế rủi ro cao – đột xuất.', noiDung: 'Hồ sơ đề nghị miễn, giảm thuế' },
  CQT: { ghiChu: 'Chuyển từ kiểm tra tại trụ sở cơ quan thuế – đột xuất.', noiDung: 'Nội dung chuyển từ kiểm tra tại trụ sở CQT' },
  KL: { ghiChu: 'Kiểm tra lại – thời hiệu 02 năm từ ngày ký KL/QĐ xử phạt bị kiểm tra lại (Đ18).', noiDung: 'Nội dung của cuộc kiểm tra bị kiểm tra lại' },
};
