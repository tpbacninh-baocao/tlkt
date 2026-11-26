// Nội dung nút “Sao chép thông tin”: khối văn bản đúng thứ tự trường của chức năng (ARCHITECTURE §5, SPEC §9).
import type { CuocKiemTra, NgayISO, SuKien } from '../kieu';
import { dinhDangNgay, dinhDangSo, laNgayISO, laNgayLamViec, congNgayThuan, type Lich } from '../lich';
import type { KetQuaTinhMoc } from '../vuViec/tinhMoc';

export const NHAN_TRUONG: Record<string, string> = {
  mst: 'Mã số thuế',
  tenNNT: 'Tên người nộp thuế',
  soQD: 'Số quyết định kiểm tra',
  ngayQD: 'Ngày quyết định',
  thoiKy: 'Thời kỳ kiểm tra',
  noiDung: 'Nội dung',
  truongDoan: 'Trưởng đoàn',
  thanhVien: 'Thành viên đoàn',
  giamSat: 'Người/tổ giám sát',
  ngayCongBo: 'Ngày công bố quyết định',
  lyDoTreCongBo: 'Lý do trễ công bố',
  soVB: 'Số văn bản',
  ngay: 'Ngày',
  denNgay: 'Đến ngày',
  tuNgay: 'Từ ngày',
  lyDo: 'Lý do',
  soQDGiaHan: 'Số QĐ gia hạn',
  ngayQDGiaHan: 'Ngày QĐ gia hạn',
  soNgay: 'Số ngày gia hạn',
  hanMoi: 'Hạn kết thúc mới',
  soQDDieuChinh: 'Số QĐ điều chỉnh',
  ngayQDDieuChinh: 'Ngày QĐ điều chỉnh',
  noiDungDieuChinh: 'Nội dung điều chỉnh',
  soQDBaiBo: 'Số QĐ bãi bỏ',
  ngayQDBaiBo: 'Ngày QĐ bãi bỏ',
  ngayKetThuc: 'Ngày kết thúc kiểm tra tại trụ sở',
  lyDoTreKetThuc: 'Lý do trễ kết thúc',
  dsNgayLamViec: 'Các ngày làm việc thực tế tại DN',
  ngayKyBB: 'Ngày ký biên bản',
  ketQua: 'Kết quả (số liệu)',
  tomTatKetQua: 'Tóm tắt kết quả',
  soQDXL: 'Số QĐ xử phạt/Kết luận',
  ngayQDXL: 'Ngày QĐ xử phạt/Kết luận',
  hanhViViPham: 'Hành vi vi phạm',
  ngayNop: 'Ngày nộp',
  soTienNop: 'Số tiền nộp',
  theoSacThue: 'Theo sắc thuế',
};

export interface DauVaoSaoChep {
  cuoc: CuocKiemTra;
  kq: KetQuaTinhMoc;
  lich: Lich;
  suKien?: SuKien;
  lanNop?: { id: string; ngay: NgayISO; soTien: number };
}

function ds(a: NgayISO[]): string {
  return a.map((d) => d.slice(8, 10) + '/' + d.slice(5, 7)).join(', ');
}

/** Các ngày làm việc tại DN thực tế (từ C đến K), loại ngày nghỉ, tạm dừng, ngày không xuống DN. */
export function cacNgayLamViecThucTe(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, den?: NgayISO): NgayISO[] {
  const c = kq.moc.C;
  if (!c || c.duKien) return [];
  const cuoi = den ?? cuoc.buoc.T7?.ngay ?? kq.moc.E?.ngay;
  if (!cuoi) return [];
  const kqNgay: NgayISO[] = [];
  for (let d = c.ngay; d <= cuoi; d = congNgayThuan(d, 1)) {
    if (!laNgayLamViec(lich, d) || cuoc.ngayKhongLamTaiDN.includes(d)) continue;
    const dung = cuoc.suKien.some((s) => s.loai === 'TAM_DUNG' && d >= (s.tuNgay as string) && d <= (s.denNgay as string));
    if (!dung) kqNgay.push(d);
  }
  return kqNgay;
}

function giaTriTruong(truong: string, v: DauVaoSaoChep): string | undefined {
  const { cuoc, kq, suKien: sk, lanNop } = v;
  const k = cuoc.ketQua;
  const ev = (t: string): string | undefined => {
    const x = sk?.[t];
    return x === undefined || x === null || x === '' ? undefined : String(x);
  };
  const ngayVN = (x: string | undefined) => (x && laNgayISO(x) ? dinhDangNgay(x) : x);
  // Trường lấy từ sự kiện (nếu việc phát sinh từ sự kiện)
  if (sk) {
    const map: Record<string, string> = {
      soVB: 'soVB',
      ngay: 'ngay',
      denNgay: 'denNgay',
      tuNgay: 'tuNgay',
      lyDo: 'lyDo',
      soQDGiaHan: 'soQD',
      ngayQDGiaHan: 'ngayQD',
      soNgay: 'soNgay',
      soQDDieuChinh: 'soQD',
      ngayQDDieuChinh: 'ngayQD',
      noiDungDieuChinh: 'noiDung',
      soQDBaiBo: 'soQD',
      ngayQDBaiBo: 'ngayQD',
      noiDung: 'noiDung',
    };
    if (truong in map) {
      const g = ev(map[truong]);
      if (g !== undefined) return ngayVN(g);
      if (truong !== 'noiDung') return undefined;
    }
  }
  switch (truong) {
    case 'mst':
      return cuoc.mst;
    case 'tenNNT':
      return cuoc.tenNNT;
    case 'soQD':
      return cuoc.soQD ?? cuoc.buoc.P5?.soVB;
    case 'ngayQD':
      return kq.moc.D0 && !kq.moc.D0.duKien ? dinhDangNgay(kq.moc.D0.ngay) : undefined;
    case 'thoiKy':
      return cuoc.thoiKy;
    case 'noiDung':
      return cuoc.noiDung;
    case 'truongDoan':
      return cuoc.truongDoan;
    case 'thanhVien':
      return cuoc.thanhVien.map((t) => (t.phanViec ? `${t.hoTen} (${t.phanViec})` : t.hoTen)).join('; ') || undefined;
    case 'giamSat':
      return cuoc.giamSat.join('; ') || undefined;
    case 'ngayCongBo':
      return kq.moc.C && !kq.moc.C.duKien ? dinhDangNgay(kq.moc.C.ngay) : undefined;
    case 'lyDoTreCongBo':
      return cuoc.buoc.Q5?.lyDoTre;
    case 'hanMoi':
      return kq.moc.E ? dinhDangNgay(kq.moc.E.ngay) : undefined;
    case 'ngayKetThuc':
      return cuoc.buoc.T7?.ngay ? dinhDangNgay(cuoc.buoc.T7.ngay) : undefined;
    case 'lyDoTreKetThuc':
      return cuoc.buoc.T7?.lyDoTre;
    case 'dsNgayLamViec': {
      const d = cacNgayLamViecThucTe(cuoc, kq, v.lich);
      return d.length ? `${d.length} ngày: ${ds(d)}` : undefined;
    }
    case 'ngayKyBB':
      return cuoc.buoc.B1?.ngay ? dinhDangNgay(cuoc.buoc.B1.ngay) : undefined;
    case 'ketQua':
      return [
        `Truy thu ${dinhDangSo(k.truyThu)}`,
        `Phạt ${dinhDangSo(k.phat)}`,
        `Chậm nộp ${dinhDangSo(k.chamNop)}`,
        `Giảm khấu trừ ${dinhDangSo(k.giamKhauTru)}`,
        `Giảm lỗ ${dinhDangSo(k.giamLo)}`,
      ].join('; ');
    case 'tomTatKetQua':
      return `Truy thu ${dinhDangSo(k.truyThu)}; phạt ${dinhDangSo(k.phat)}; chậm nộp ${dinhDangSo(k.chamNop)} (đồng)`;
    case 'soQDXL':
      return k.soQDXL ?? cuoc.buoc.X?.soVB;
    case 'ngayQDXL':
      return cuoc.buoc.X?.ngay ? dinhDangNgay(cuoc.buoc.X.ngay) : undefined;
    case 'hanhViViPham':
      return k.hanhViViPham;
    case 'ngayNop':
      return lanNop ? dinhDangNgay(lanNop.ngay) : undefined;
    case 'soTienNop':
      return lanNop ? dinhDangSo(lanNop.soTien) : undefined;
    case 'theoSacThue':
      return '(nhập theo từng sắc thuế)';
    default:
      return undefined;
  }
}

/** Khối văn bản “Nhãn: giá trị” theo đúng thứ tự trường; trường chưa có hiển thị “(chưa có)”. */
export function noiDungSaoChep(truongs: string[], v: DauVaoSaoChep): string {
  return truongs.map((t) => `${NHAN_TRUONG[t] ?? t}: ${giaTriTruong(t, v) ?? '(chưa có)'}`).join('\n');
}
