// Thao tác trên một cuộc từ giao diện: đánh dấu xong bước, tích nhập liệu, nhật ký iTNK… (logic thuần nằm ở core/vuViec/capNhat).
import type { CuocKiemTra, NgayISO, SuKien } from '../core/kieu';
import { tinhMoc, kiemTraDanhDauBuoc, kiemTraBoDanhDau, ganXongVaoCuoc, boXongKhoiCuoc, ghiLyDoTreVaoCuoc, tickVaoCuoc, boTickKhoiCuoc, datNhatKyVaoCuoc, datNgayKhongLamTaiDN, ganSuKienVaoCuoc, xoaSuKienKhoiCuoc, type DuLieuXongBuoc, type KetQuaKiemTra } from '../core/vuViec';
import { chonBoQuyTac } from '../core/quyTac';
import type { ViecChecklist } from '../core/checklist';
import { luuCuoc } from './hanhDong';
import { bayGio, caiDat, dsCuoc, homNay, lich, toast } from './store';

export function layCuoc(id: string): CuocKiemTra | undefined {
  return dsCuoc.value.find((c) => c.id === id);
}

/** Kiểm tra (thuần) việc đánh dấu xong bước – dùng cho form để hiện lỗi/cảnh báo ngay khi nhập. */
export function kiemTraXong(cuoc: CuocKiemTra, ma: string, f: Pick<DuLieuXongBuoc, 'ngay' | 'lyDoTre'>): KetQuaKiemTra {
  const bo = chonBoQuyTac(cuoc.buoc.P5?.xong ? cuoc.buoc.P5.ngay : undefined, homNay.value, cuoc.boQuyTacGhiDe, caiDat.value.vaQuyTac as never);
  const kq = tinhMoc(cuoc, { lich: lich.value, homNay: homNay.value, bo });
  return kiemTraDanhDauBuoc(cuoc, kq, ma, f.ngay, homNay.value, f.lyDoTre);
}

export async function danhDauXong(cuocId: string, ma: string, f: DuLieuXongBuoc): Promise<KetQuaKiemTra> {
  const c = layCuoc(cuocId);
  if (!c) throw new Error('Không tìm thấy cuộc');
  const kt = kiemTraXong(c, ma, f);
  if (!kt.hopLe) return kt;
  await luuCuoc(ganXongVaoCuoc(c, ma, f));
  return kt;
}

export async function boDanhDau(cuocId: string, ma: string): Promise<KetQuaKiemTra> {
  const c = layCuoc(cuocId);
  if (!c) throw new Error('Không tìm thấy cuộc');
  const kt = kiemTraBoDanhDau(c, ma);
  if (!kt.hopLe) return kt;
  await luuCuoc(boXongKhoiCuoc(c, ma));
  return kt;
}

export async function ghiLyDoTre(cuocId: string, ma: string, lyDo: string): Promise<void> {
  const c = layCuoc(cuocId);
  if (c) await luuCuoc(ghiLyDoTreVaoCuoc(c, ma, lyDo));
}

/** Tích một việc nhập liệu; trả về hàm hoàn tác. */
export async function tickViec(cuocId: string, v: ViecChecklist, ngay: NgayISO = homNay.value): Promise<void> {
  const c = layCuoc(cuocId);
  if (!c) return;
  await luuCuoc(tickVaoCuoc(c, v, ngay));
  toast(v.hangNgay ? 'Đã ghi nhật ký iTNK' : `Đã tích: ${v.chucNang.slice(0, 50)}`, 'thanhCong', () => boTickViec(cuocId, v));
}

export async function boTickViec(cuocId: string, v: ViecChecklist): Promise<void> {
  const c = layCuoc(cuocId);
  if (c) await luuCuoc(boTickKhoiCuoc(c, v));
}

export async function datNhatKy(cuocId: string, ngay: NgayISO, daGhi: boolean, ghiChu?: string): Promise<void> {
  const c = layCuoc(cuocId);
  if (c) await luuCuoc(datNhatKyVaoCuoc(c, ngay, daGhi, ghiChu));
}

export async function datKhongXuongDN(cuocId: string, ngay: NgayISO, khong: boolean): Promise<void> {
  const c = layCuoc(cuocId);
  if (c) await luuCuoc(datNgayKhongLamTaiDN(c, ngay, khong));
}

export function bayGioHienTai(): string {
  return bayGio.value;
}

/** Lưu (thêm hoặc thay theo id) một sự kiện vào cuộc. */
export async function luuSuKien(cuocId: string, sk: SuKien): Promise<void> {
  const c = layCuoc(cuocId);
  if (c) await luuCuoc(ganSuKienVaoCuoc(c, sk));
}

export async function xoaSuKien(cuocId: string, id: string): Promise<SuKien | undefined> {
  const c = layCuoc(cuocId);
  const sk = c?.suKien.find((s) => s.id === id);
  if (c && sk) await luuCuoc(xoaSuKienKhoiCuoc(c, id));
  return sk;
}

/** Áp một thay đổi thuần lên cuộc rồi lưu. */
export async function capNhatCuoc(cuocId: string, fn: (c: CuocKiemTra) => CuocKiemTra): Promise<CuocKiemTra | undefined> {
  const c = layCuoc(cuocId);
  return c ? luuCuoc(fn(c)) : undefined;
}
