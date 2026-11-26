// Dựng các bảng xuất Excel (hàm thuần): mỗi bảng = tiêu đề cột + các dòng. Lớp giao diện chỉ việc ghi ra .xlsx. ARCHITECTURE §10.
import type { CongViec, MocTinh, TrangThaiMoc } from '../kieu';
import { dinhDangNgay, dinhDangNgayGio, type Lich } from '../lich';
import { nhanCuoc } from '../nhacViec/anDanh';
import { slaCuoc } from '../tomTat/danhSachCuoc';
import type { DuLieuTomTat, PhanTichCuoc } from '../tomTat/phanTich';
import { anDanhHieuLuc } from '../tomTat/phanTich';
import { TEN_GIAI_DOAN, type MucSLA } from '../vuViec';
import { viecConThieu } from '../checklist';
import { trangThaiViec } from '../viec';
import type { ThongKeKeHoach } from '../keHoach';
import { THU_TU_GIAI_DOAN } from '../vuViec/giaiDoan';

export type Gia = string | number;
export interface CotXuat {
  tieuDe: string;
  /** Độ rộng cột (số ký tự) */
  rong?: number;
  /** 'so' = ô số, định dạng 1.234.567 */
  kieu?: 'so' | 'chu';
}
export interface BangXuat {
  ten: string;
  cot: CotXuat[];
  dong: Gia[][];
}

export const TEN_MUC_SLA: Record<MucSLA, string> = {
  CON_LAU: 'Còn thời gian',
  SAP_DEN: 'Sắp đến hạn',
  HOM_NAY_NGAY_MAI: 'Hôm nay / ngày mai',
  QUA_HAN: 'Quá hạn',
  QUA_HAN_CHUA_GIAI_TRINH: 'Quá hạn – chưa ghi lý do',
  XONG_DUNG_HAN: 'Đúng hạn',
  XONG_TRE: 'Xong trễ',
  DU_KIEN: 'Dự kiến',
  KHONG_AP_DUNG: 'Không áp dụng',
};

const TEN_TRANG_THAI: Record<TrangThaiMoc, string> = {
  XONG_DUNG_HAN: 'Xong đúng hạn',
  XONG_TRE: 'Xong trễ',
  CHUA_DEN: 'Chưa đến hạn',
  SAP_DEN: 'Sắp đến hạn',
  HOM_NAY: 'Hôm nay',
  QUA_HAN: 'Quá hạn',
  KHONG_AP_DUNG: 'Không áp dụng',
};

const ngay = (n?: string): string => (n ? dinhDangNgay(n) : '');
const tenBuoc = (m: MocTinh) => m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '');
const xongNgay = (pt: PhanTichCuoc, ma: string): string => ngay(pt.cuoc.buoc[ma]?.xong ? pt.cuoc.buoc[ma].ngay : undefined);

export const TEN_TEP_EXCEL: Record<string, string> = {
  DANH_SACH_CUOC: 'danh-sach-cuoc',
  NHAP_LIEU_THIEU: 'nhap-lieu-con-thieu',
  THU_NOP: 'theo-doi-thu-nop',
  TIEN_DO_KE_HOACH: 'tien-do-ke-hoach',
  VIEC_KHAC: 'viec-khac',
};

/** 1) Danh sách cuộc + mốc + SLA (hai trang tính: “Cuộc kiểm tra” và “Các mốc”). */
export function bangDanhSachCuoc(d: DuLieuTomTat, pts: PhanTichCuoc[]): BangXuat[] {
  const an = anDanhHieuLuc(d);
  const cuoc: BangXuat = {
    ten: 'Cuộc kiểm tra',
    cot: [
      { tieuDe: 'Mã cuộc', rong: 14 }, { tieuDe: 'MST', rong: 15 }, { tieuDe: 'Tên người nộp thuế', rong: 34 }, { tieuDe: 'Loại', rong: 7 },
      { tieuDe: 'Giai đoạn', rong: 18 }, { tieuDe: 'Trưởng đoàn', rong: 20 }, { tieuDe: 'Ngày QĐ kiểm tra', rong: 16 }, { tieuDe: 'Ngày công bố', rong: 14 },
      { tieuDe: 'Ngày kết thúc tại DN', rong: 18 }, { tieuDe: 'Ngày có QĐ xử lý/KL', rong: 18 }, { tieuDe: 'Việc tiếp theo', rong: 44 }, { tieuDe: 'Hạn tiếp theo', rong: 14 },
      { tieuDe: 'Mức SLA', rong: 22 }, { tieuDe: 'Số bước quá hạn', rong: 12, kieu: 'so' }, { tieuDe: 'Nhập liệu còn thiếu', rong: 14, kieu: 'so' },
    ],
    dong: [],
  };
  const moc: BangXuat = {
    ten: 'Các mốc',
    cot: [
      { tieuDe: 'Mã cuộc', rong: 14 }, { tieuDe: 'Mã mốc', rong: 8 }, { tieuDe: 'Bước', rong: 52 }, { tieuDe: 'Người thực hiện', rong: 18 },
      { tieuDe: 'Hạn pháp lý', rong: 14 }, { tieuDe: 'Hạn mục tiêu/nội bộ', rong: 18 }, { tieuDe: 'Trạng thái', rong: 18 }, { tieuDe: 'Ngày xong', rong: 14 },
      { tieuDe: 'Dự kiến?', rong: 10 }, { tieuDe: 'Căn cứ', rong: 36 },
    ],
    dong: [],
  };
  for (const pt of pts) {
    const c = pt.cuoc;
    const t = pt.tiepTheo;
    const ten = an ? nhanCuoc(c, true) : c.tenNNT;
    cuoc.dong.push([
      c.ma, an ? '' : c.mst, ten, c.loai, (TEN_GIAI_DOAN as Record<string, string>)[pt.giaiDoan] ?? pt.giaiDoan, c.truongDoan,
      xongNgay(pt, 'P5'), xongNgay(pt, 'Q5'), xongNgay(pt, 'T7'), xongNgay(pt, 'X'),
      t ? tenBuoc(t) : '', ngay(t ? (t.noiBo ? t.hanMucTieu : t.hanPhapLy) : undefined), TEN_MUC_SLA[slaCuoc(pt)], pt.soBuocQuaHan, viecConThieu(pt.checklist.filter((v) => !v.hangNgay)).length,
    ]);
    for (const m of pt.kq.danhSach) {
      if (['hanTinh', 'hangNgay'].includes(m.loai) || m.trangThai === 'KHONG_AP_DUNG') continue;
      moc.dong.push([c.ma, m.ma, tenBuoc(m), m.nguoi, ngay(m.hanPhapLy), ngay(m.hanMucTieu), TEN_TRANG_THAI[m.trangThai], ngay(c.buoc[m.ma]?.xong ? c.buoc[m.ma].ngay : undefined), m.duKien ? 'Dự kiến' : '', m.canCu]);
    }
  }
  return [cuoc, moc];
}

/** 2) Nhập liệu còn thiếu (TTR/iTNK/TMS) của mọi cuộc. */
export function bangNhapLieuThieu(d: DuLieuTomTat, pts: PhanTichCuoc[]): BangXuat {
  const an = anDanhHieuLuc(d);
  const b: BangXuat = {
    ten: 'Nhập liệu còn thiếu',
    cot: [{ tieuDe: 'Mã cuộc', rong: 14 }, { tieuDe: 'Người nộp thuế', rong: 34 }, { tieuDe: 'Hệ thống', rong: 10 }, { tieuDe: 'Chức năng', rong: 56 }, { tieuDe: 'Phát sinh', rong: 13 }, { tieuDe: 'Hạn nhập', rong: 13 }, { tieuDe: 'Trạng thái', rong: 16 }, { tieuDe: 'Còn lại (ngày LV)', rong: 14, kieu: 'so' }],
    dong: [],
  };
  for (const pt of pts) {
    for (const v of viecConThieu(pt.checklist.filter((x) => !x.hangNgay))) {
      b.dong.push([pt.cuoc.ma, an ? nhanCuoc(pt.cuoc, true) : pt.cuoc.tenNNT, v.heThong === 'ITNK' ? 'iTNK' : v.heThong, v.chucNang, ngay(v.phatSinh), ngay(v.han), TEN_TRANG_THAI[v.trangThai], v.nlvConLai ?? '']);
    }
  }
  return b;
}

/** 3) Theo dõi thu nộp sau kiểm tra (số tiền là ô số). */
export function bangThuNop(d: DuLieuTomTat, pts: PhanTichCuoc[]): BangXuat {
  const an = anDanhHieuLuc(d);
  const so = (t: string): CotXuat => ({ tieuDe: t, rong: 16, kieu: 'so' });
  const b: BangXuat = {
    ten: 'Thu nộp',
    cot: [{ tieuDe: 'Mã cuộc', rong: 14 }, { tieuDe: 'Người nộp thuế', rong: 34 }, { tieuDe: 'Số QĐ/KL', rong: 16 }, { tieuDe: 'Ngày QĐ/KL', rong: 13 }, so('Truy thu'), so('Phạt'), so('Chậm nộp'), so('Giảm khấu trừ'), so('Giảm lỗ'), so('Hoàn thuế thu hồi'), so('Phải nộp'), so('Đã nộp'), so('Còn phải nộp'), { tieuDe: 'Hạn nộp', rong: 13 }],
    dong: [],
  };
  for (const pt of pts) {
    const c = pt.cuoc;
    const k = c.ketQua;
    if (!k.coXuLy && !c.nopTien.length) continue;
    const phai = k.truyThu + k.phat + k.chamNop;
    const da = c.nopTien.reduce((t, l) => t + l.soTien, 0);
    const hanNop = pt.kq.danhSach.find((m) => m.ma === 'S4');
    b.dong.push([c.ma, an ? nhanCuoc(c, true) : c.tenNNT, k.soQDXL ?? '', xongNgay(pt, 'X'), k.truyThu, k.phat, k.chamNop, k.giamKhauTru, k.giamLo, k.thuHoiHoan, phai, da, Math.max(0, phai - da), ngay(hanNop?.hanPhapLy)]);
  }
  // Dòng tổng
  if (b.dong.length) {
    const tong: Gia[] = ['TỔNG', '', '', ''];
    for (let j = 4; j < 13; j++) tong.push(b.dong.reduce((t, r) => t + (r[j] as number), 0));
    tong.push('');
    b.dong.push(tong);
  }
  return b;
}

/** 4) Tiến độ kế hoạch năm: tổng hợp + tích lũy theo tháng. */
export function bangTienDoKeHoach(tk: ThongKeKeHoach, nam: number, tenPhamVi: string): BangXuat[] {
  const so = (t: string, rong = 18): CotXuat => ({ tieuDe: t, rong, kieu: 'so' });
  const tong: BangXuat = { ten: `Kế hoạch ${nam}`, cot: [{ tieuDe: 'Chỉ tiêu', rong: 46 }, so('Giá trị', 20)], dong: [] };
  tong.dong.push(['Phạm vi', tenPhamVi] as Gia[]);
  tong.dong.push(['Chỉ tiêu số cuộc', tk.chiTieu], ['Số cuộc thực tế', tk.soCuoc], ['Đã ban hành QĐ kiểm tra', tk.daBanHanhQD], ['Đã công bố', tk.daCongBo], ['Đã kết thúc tại DN', tk.daKetThucTaiDN], ['Đã có QĐ xử lý/KL', tk.daCoQDXuLy], ['Bãi bỏ', tk.baiBo], ['Tồn chuyển năm sau', tk.tonChuyenNamSau]);
  for (const g of THU_TU_GIAI_DOAN) tong.dong.push([`Giai đoạn: ${TEN_GIAI_DOAN[g]}`, tk.theoGiaiDoan[g]]);
  tong.dong.push(['Truy thu', tk.tien.truyThu], ['Phạt', tk.tien.phat], ['Chậm nộp', tk.tien.chamNop], ['Giảm khấu trừ', tk.tien.giamKhauTru], ['Giảm lỗ', tk.tien.giamLo], ['Hoàn thuế thu hồi', tk.tien.thuHoiHoan], ['Phải nộp', tk.tien.phaiNop], ['Đã nộp', tk.tien.daNop], ['Còn phải nộp', tk.tien.conPhaiNop]);
  const thang: BangXuat = { ten: 'Tích lũy theo tháng', cot: [{ tieuDe: 'Tháng', rong: 10, kieu: 'so' }, so('Đã ban hành QĐ (tích lũy)'), so('Có QĐ xử lý/KL (tích lũy)'), so('Đường lý tưởng')], dong: [] };
  for (const t of tk.tichLuyThang) thang.dong.push([t.thang, t.banHanhQD ?? '', t.thucTe ?? '', Math.round(t.lyTuong * 10) / 10]);
  const cb: BangXuat = { ten: 'Cảnh báo', cot: [{ tieuDe: 'Mức', rong: 12 }, { tieuDe: 'Nội dung', rong: 100 }], dong: tk.canhBao.map((c) => [c.muc === 'KHAN' ? 'Khẩn' : c.muc === 'CANH_BAO' ? 'Cảnh báo' : 'Thông tin', c.noiDung]) };
  return cb.dong.length ? [tong, thang, cb] : [tong, thang];
}

/** 5) Việc khác (ngoài cuộc). */
export function bangViecKhac(viec: CongViec[], lich: Lich, homNay: string): BangXuat {
  const b: BangXuat = {
    ten: 'Việc khác',
    cot: [{ tieuDe: 'Việc', rong: 56 }, { tieuDe: 'Nguồn', rong: 16 }, { tieuDe: 'Nhóm', rong: 16 }, { tieuDe: 'Số văn bản', rong: 18 }, { tieuDe: 'Người giao', rong: 20 }, { tieuDe: 'Hạn', rong: 13 }, { tieuDe: 'Trạng thái', rong: 16 }, { tieuDe: 'Hoàn thành lúc', rong: 18 }, { tieuDe: 'Lặp lại', rong: 14 }],
    dong: [],
  };
  const NGUON: Record<CongViec['nguon'], string> = { LANH_DAO: 'Lãnh đạo giao', VAN_BAN: 'Văn bản', TU_DAT: 'Tự đặt', THUONG_XUYEN: 'Thường xuyên' };
  const ds = viec.filter((v) => !v.xoaLuc).sort((a, c) => (a.xong ? 1 : 0) - (c.xong ? 1 : 0) || (a.han ?? '9999').localeCompare(c.han ?? '9999'));
  for (const v of ds) b.dong.push([v.tieuDe, NGUON[v.nguon], v.nhom ?? '', v.soVB ?? '', v.nguoiGiao ?? '', ngay(v.han), TEN_TRANG_THAI[trangThaiViec(v, lich, homNay)], v.xong ? dinhDangNgayGio(v.xong) : '', v.lap ?? '']);
  return b;
}
