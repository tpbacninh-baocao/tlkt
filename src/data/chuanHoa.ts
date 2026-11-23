// Chuẩn hóa bản ghi đọc từ kho/tệp sao lưu: điền giá trị mặc định cho trường còn thiếu (dữ liệu cũ, nhập từ tệp).
import type { CongViec, CuocKiemTra, KeHoach } from '../core/kieu';
import { taoCuocRong } from '../core/vuViec';

export function chuanHoaCuoc(raw: Partial<CuocKiemTra> & { id: string }): CuocKiemTra {
  const goc = taoCuocRong({ id: raw.id, ma: raw.ma ?? raw.id, taoLuc: raw.taoLuc ?? '1970-01-01T00:00' });
  const c: CuocKiemTra = { ...goc, ...raw } as CuocKiemTra;
  c.ketQua = { ...goc.ketQua, ...(raw.ketQua ?? {}) };
  for (const k of ['thanhVien', 'giamSat', 'suKien', 'nopTien', 'ngayKhongLamTaiDN', 'yeuCauTaiLieu', 'vuongMac'] as const) {
    if (!Array.isArray(c[k])) (c as unknown as Record<string, unknown>)[k] = [];
  }
  for (const k of ['buoc', 'checklist', 'nhatKy'] as const) {
    if (typeof c[k] !== 'object' || c[k] === null) (c as unknown as Record<string, unknown>)[k] = {};
  }
  return c;
}

export function chuanHoaViec(raw: Partial<CongViec> & { id: string }): CongViec {
  const v = {
    tieuDe: '',
    nguon: 'TU_DAT',
    taoLuc: '1970-01-01T00:00',
    suaLuc: raw.taoLuc ?? '1970-01-01T00:00',
    ...raw,
  } as CongViec;
  if (!Array.isArray(v.viecCon)) v.viecCon = [];
  return v;
}

export function chuanHoaKeHoach(raw: Partial<KeHoach> & { id: string }): KeHoach {
  return { nam: new Date().getFullYear(), loai: 'KH_NAM', ten: '', ...raw } as KeHoach;
}
