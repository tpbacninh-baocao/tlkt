// Các thao tác ghi dữ liệu từ giao diện: lưu vào kho rồi cập nhật bộ nhớ (signals).
import type { CaiDat, CongViec, CuocKiemTra, KeHoach, KeHoachNgay, KhoiThoiGian } from '../core/kieu';
import { chuanHoaCuoc, chuanHoaKeHoach, chuanHoaViec } from '../data/chuanHoa';
import type { KhoXoaMem } from '../data/kho';
import { boHoanThanh, dongBoViecMau, hoanThanhViec } from '../core/viec';
import { dinhDangNgay } from '../core/lich';
import { bayGio, caiDat, dsCuoc, dsKeHoach, dsKeHoachNgay, dsKhoiThoiGian, dsViec, homNay, kho_, lich, toast } from './store';

function thayTheTheoId<T extends { id: string }>(ds: T[], moi: T): T[] {
  const i = ds.findIndex((x) => x.id === moi.id);
  if (i < 0) return [...ds, moi];
  const kq = ds.slice();
  kq[i] = moi;
  return kq;
}

export async function luuCuoc(c: CuocKiemTra): Promise<CuocKiemTra> {
  const luu = await kho_().luuCuoc(c);
  dsCuoc.value = thayTheTheoId(dsCuoc.value, luu);
  return luu;
}

export async function luuViec(v: CongViec): Promise<CongViec> {
  const luu = await kho_().luuViec(v);
  dsViec.value = thayTheTheoId(dsViec.value, luu);
  return luu;
}

export async function luuKeHoach(k: KeHoach): Promise<KeHoach> {
  const luu = await kho_().luuKeHoach(k);
  dsKeHoach.value = thayTheTheoId(dsKeHoach.value, luu);
  return luu;
}

export async function luuKhoiThoiGian(k: KhoiThoiGian): Promise<KhoiThoiGian> {
  const luu = await kho_().luuKhoiThoiGian(k);
  dsKhoiThoiGian.value = thayTheTheoId(dsKhoiThoiGian.value, luu);
  return luu;
}

export async function xoaKhoiThoiGian(id: string): Promise<void> {
  await kho_().xoaKhoiThoiGian(id);
  dsKhoiThoiGian.value = dsKhoiThoiGian.value.filter((k) => k.id !== id);
}

export async function luuKeHoachNgay(k: KeHoachNgay): Promise<void> {
  await kho_().luuKeHoachNgay(k);
  const i = dsKeHoachNgay.value.findIndex((x) => x.ngay === k.ngay);
  dsKeHoachNgay.value = i < 0 ? [...dsKeHoachNgay.value, k] : dsKeHoachNgay.value.map((x, j) => (j === i ? k : x));
}

export async function luuCaiDat(cd: CaiDat): Promise<void> {
  await kho_().luuCaiDat(cd);
  caiDat.value = cd;
}

/** Sửa một phần cài đặt. */
export async function suaCaiDat(thayDoi: (cu: CaiDat) => CaiDat): Promise<void> {
  await luuCaiDat(thayDoi(caiDat.value));
}

/** Xóa mềm kèm toast “Hoàn tác”. */
export async function xoaMem(loai: KhoXoaMem, id: string, ten: string): Promise<void> {
  const k = kho_();
  if (!(await k.xoaMem(loai, id))) return;
  await lamMoi(loai);
  toast(`Đã xóa ${ten}`, 'thanhCong', async () => {
    await k.khoiPhuc(loai, id);
    await lamMoi(loai);
    toast('Đã khôi phục');
  });
}

export async function khoiPhucThungRac(loai: KhoXoaMem, id: string): Promise<void> {
  await kho_().khoiPhuc(loai, id);
  await lamMoi(loai);
}

export async function xoaVinhVien(loai: KhoXoaMem, id: string): Promise<void> {
  await kho_().xoaVinhVien(loai, id);
  await lamMoi(loai);
}

async function lamMoi(loai: KhoXoaMem): Promise<void> {
  const k = kho_();
  if (loai === 'cuoc') dsCuoc.value = (await k.tatCa<CuocKiemTra>('cuoc')).map(chuanHoaCuoc);
  else if (loai === 'viec') dsViec.value = (await k.tatCa<CongViec>('viec')).map(chuanHoaViec);
  else dsKeHoach.value = (await k.tatCa<KeHoach>('keHoach')).map(chuanHoaKeHoach);
}

/** Ghi lịch nghỉ/làm bù của một năm (thay thế mục cùng năm đã nhập trước đó) và đánh dấu năm đã xác nhận. */
export async function luuNgayNghiNam(nam: number, nghi: string[], lamBu: string[]): Promise<void> {
  const khac = (d: string) => !d.startsWith(`${nam}-`);
  await suaCaiDat((cu) => ({
    ...cu,
    ngayNghiThem: [...cu.ngayNghiThem.filter(khac), ...nghi].sort(),
    ngayLamBu: [...cu.ngayLamBu.filter(khac), ...lamBu].sort(),
    namDaXacNhanNgayNghi: [...new Set([...cu.namDaXacNhanNgayNghi, nam])].sort(),
  }));
}

/** Tạo các việc từ mẫu đang bật mà chưa có bản ghi đang mở. */
export async function dongBoViecMauUI(): Promise<number> {
  const moi = dongBoViecMau(caiDat.value.mauViecDaBat, dsViec.value, homNay.value, lich.value, () => crypto.randomUUID(), bayGio.value);
  for (const v of moi) await luuViec(v);
  return moi.length;
}

/** Hoàn thành một việc ngoài cuộc (+ tạo lần kế tiếp nếu lặp lại) kèm toast Hoàn tác. */
export async function hoanThanhViecUI(id: string): Promise<void> {
  const v = dsViec.value.find((x) => x.id === id);
  if (!v) return;
  const { daXong, tiep } = hoanThanhViec(v, bayGio.value, lich.value, () => crypto.randomUUID());
  await luuViec(daXong);
  if (tiep) await luuViec(tiep);
  toast(tiep ? `Đã xong. Lần sau: ${dinhDangNgay(tiep.han!)}` : 'Đã xong việc', 'thanhCong', async () => {
    await luuViec(boHoanThanh(daXong, bayGio.value));
    if (tiep) await xoaVinhVien('viec', tiep.id);
  });
}

export async function boHoanThanhViecUI(id: string): Promise<void> {
  const v = dsViec.value.find((x) => x.id === id);
  if (v) await luuViec(boHoanThanh(v, bayGio.value));
}
