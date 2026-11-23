// Thao tác trên một cuộc từ giao diện: đánh dấu xong bước, tích nhập liệu, nhật ký iTNK… (logic thuần nằm ở core/vuViec/capNhat).
import type { CuocKiemTra, NgayISO } from '../core/kieu';
import { tinhMoc, kiemTraDanhDauBuoc, kiemTraBoDanhDau, ganXongVaoCuoc, boXongKhoiCuoc, ghiLyDoTreVaoCuoc, tickVaoCuoc, boTickKhoiCuoc, datNhatKyVaoCuoc, datNgayKhongLamTaiDN, type DuLieuXongBuoc, type KetQuaKiemTra } from '../core/vuViec';
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
