// Phân tích một cuộc: gom các thông tin dùng chung cho tóm tắt, báo cáo, màn Hôm nay.
import type { CaiDat, CongViec, CuocKiemTra, GiaiDoan, KeHoach, MocTinh, NgayGio, NgayISO } from '../kieu';
import {
  demNLV,
  laNgayLamViec,
  soNgayGiua,
  type Lich,
} from '../lich';
import { sinhChecklist, viecConThieu, type ViecChecklist } from '../checklist';
import { chonBoQuyTac, layBuoc, suKienGiaHan, tongNgayTamDung, type VaQuyTac } from '../quyTac';
import { dongHoYeuCau } from '../vuViec/dongHo';
import { tinhGiaiDoan } from '../vuViec/giaiDoan';
import { laBuocNoiBoDaQua, tinhMoc, type KetQuaTinhMoc } from '../vuViec/tinhMoc';
import { laNgayTaiDN, viecTiepTheo } from '../vuViec/viecTiepTheo';
import type { BoQuyTac } from '../kieu';

export interface DuLieuTomTat {
  homNay: NgayISO;
  bayGio?: NgayGio;
  lich: Lich;
  caiDat: CaiDat;
  cuoc: CuocKiemTra[];
  viec: CongViec[];
  keHoach: KeHoach[];
  va?: VaQuyTac;
  /** Hiện đầy đủ MST/tên lần này dù đang bật chế độ ẩn danh */
  hienDayDu?: boolean;
}

export interface PhanTichCuoc {
  cuoc: CuocKiemTra;
  bo: BoQuyTac;
  kq: KetQuaTinhMoc;
  giaiDoan: GiaiDoan;
  tiepTheo?: MocTinh;
  checklist: ViecChecklist[];
  ycChuaNhan: number;
  ycQuaHan: number;
  /** Ngày thứ n / tổng ngày được kiểm tra tại trụ sở (khi đang kiểm tra) */
  ngayThu?: { n: number; tong: number; donVi: 'N' | 'NLV' };
  taiDNHomNay: boolean;
  nhatKyDaGhiHomNay: boolean;
  /** Số ngày tại DN đã qua mà chưa ghi nhật ký iTNK */
  nhatKyThieu: number;
  soBuocQuaHan: number;
}

export function anDanhHieuLuc(d: DuLieuTomTat): boolean {
  return d.caiDat.anDanh && !d.hienDayDu;
}

export function bayGioCua(d: DuLieuTomTat): NgayGio {
  return d.bayGio ?? `${d.homNay}T17:00`;
}

export function phanTichCuoc(c: CuocKiemTra, d: DuLieuTomTat): PhanTichCuoc {
  const { lich, homNay } = d;
  const bo = chonBoQuyTac(c.buoc.P5?.xong ? c.buoc.P5.ngay : undefined, homNay, c.boQuyTacGhiDe, d.va);
  const kq = tinhMoc(c, { lich, homNay, bo });
  const checklist = sinhChecklist(c, kq, lich, homNay, { tenChucNang: d.caiDat.tenChucNangHeThong });
  const giaiDoan = tinhGiaiDoan(c, kq);
  const bayGio = bayGioCua(d);
  const yc = c.yeuCauTaiLieu.filter((y) => !y.nhanLuc);
  const ycQuaHan = yc.filter((y) => dongHoYeuCau(lich, bo, y, bayGio).trangThai === 'QUA_HAN').length;

  let ngayThu: PhanTichCuoc['ngayThu'];
  const C = kq.moc.C;
  if (giaiDoan === 'DANG_KIEM_TRA' && C && !C.duKien) {
    const t1 = layBuoc(bo, 'T1')?.han;
    const donVi: 'N' | 'NLV' = t1?.donVi === 'NLV' ? 'NLV' : 'N';
    const so = (c.coGDLK && t1?.soNeuGDLK !== undefined ? t1.soNeuGDLK : t1?.so) ?? 0;
    const gh = suKienGiaHan(c.suKien);
    const giaHan = gh ? (gh.soNgay as number) : 0;
    const tong = so + giaHan + (donVi === 'N' ? tongNgayTamDung(c.suKien) : 0);
    const n = donVi === 'N' ? soNgayGiua(C.ngay, homNay) + 1 : demNLV(lich, C.ngay, homNay) + (laNgayLamViec(lich, C.ngay) ? 1 : 0);
    ngayThu = { n: Math.max(1, n), tong, donVi };
  }

  let nhatKyThieu = 0;
  if (C && !C.duKien && giaiDoan === 'DANG_KIEM_TRA') {
    nhatKyThieu = checklist.filter((v) => v.hangNgay && !v.xong && v.phatSinh < homNay).length;
  }
  return {
    cuoc: c,
    bo,
    kq,
    giaiDoan,
    tiepTheo: viecTiepTheo(c, kq),
    checklist,
    ycChuaNhan: yc.length,
    ycQuaHan,
    ngayThu,
    taiDNHomNay: laNgayTaiDN(c, kq, lich, homNay),
    nhatKyDaGhiHomNay: !!c.nhatKy[homNay]?.daGhiITNK,
    nhatKyThieu,
    soBuocQuaHan: kq.danhSach.filter((m) => m.trangThai === 'QUA_HAN' && !m.duKien && !laBuocNoiBoDaQua(c, m)).length,
  };
}

/** Số việc nhập liệu còn thiếu của cuộc (không tính nhật ký hằng ngày). */
export function soNhapLieuThieu(p: PhanTichCuoc): number {
  return viecConThieu(p.checklist.filter((v) => !v.hangNgay)).length;
}

/** Tên bước rút gọn để hiển thị trong danh sách: bỏ “(= X)”, cắt tại dấu hai chấm/chấm phẩy, bỏ ngoặc phụ nếu còn dài. */
export function tenNgan(ten: string): string {
  let t = ten.replace(/\s*\(= [A-Z0-9]+\)/g, '');
  const i = t.search(/[:;]/);
  if (i > 0) t = t.slice(0, i);
  if (t.length > 60) t = t.replace(/\s*\([^)]*\)/g, '');
  if (t.length > 90) t = t.slice(0, 89).trimEnd() + '…';
  return t.trim();
}
