// Tải tệp xuống máy (sao lưu, .ics, Excel…) – chỉ dùng API trình duyệt, không gửi dữ liệu đi đâu.
import { sinhSuKienLich, taoICS, type DuLieuNhac } from '../core/nhacViec';
import { congNgayThuan } from '../core/lich';
import { bayGio, caiDat, cuocConHieuLuc, dsKeHoach, homNay, lich, saoLuuCuoi, toast, viecConHieuLuc } from './store';

export function taiXuong(tenTep: string, noiDung: BlobPart, mime = 'application/octet-stream'): void {
  const blob = new Blob([noiDung], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = tenTep;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function duLieuNhacHienTai(): DuLieuNhac {
  return {
    homNay: homNay.value,
    lich: lich.value,
    caiDat: caiDat.value,
    cuoc: cuocConHieuLuc.value,
    viec: viecConHieuLuc.value,
    keHoach: dsKeHoach.value.filter((k) => !k.xoaLuc),
    va: caiDat.value.vaQuyTac as DuLieuNhac['va'],
    saoLuuCuoi: saoLuuCuoi.value,
  };
}

export type PhamViIcs = { loai: 'CUOC'; cuocId: string; ma: string } | { loai: 'TAT_CA' } | { loai: '30_NGAY' };

/** Xuất lịch .ics: một cuộc / tất cả hạn chưa xong / 30 ngày tới. Trả về số sự kiện. */
export function xuatIcs(p: PhamViIcs): number {
  const d = duLieuNhacHienTai();
  const tu = homNay.value;
  const den = p.loai === '30_NGAY' ? congNgayThuan(tu, 30) : '9999-12-31';
  const ds = sinhSuKienLich(d, tu, den, p.loai === 'CUOC' ? p.cuocId : undefined);
  if (!ds.length) {
    toast('Không có hạn nào để xuất.', 'thongTin');
    return 0;
  }
  const ten = p.loai === 'CUOC' ? `TLKT-${p.ma}.ics` : p.loai === '30_NGAY' ? 'TLKT-30-ngay-toi.ics' : 'TLKT-tat-ca-han.ics';
  taiXuong(ten, taoICS(ds, bayGio.value), 'text/calendar;charset=utf-8');
  toast(`Đã tải ${ds.length} hạn. Mở tệp trên điện thoại để thêm vào Lịch.`);
  return ds.length;
}
