// Việc ngoài cuộc: hoàn thành (+ tạo lần kế tiếp), trạng thái SLA, nhóm hiển thị, điểm ưu tiên.
import type { CongViec, Id, NgayGio, NgayISO, TrangThaiMoc } from '../kieu';
import { demNLV, tachNgayGio, type Lich } from '../lich';
import { trangThaiTheoHan } from '../vuViec/tinhMoc';
import { tinhDiem } from '../vuViec/viecTiepTheo';
import { lanLapKeTiep } from './lap';

export interface KetQuaHoanThanh {
  daXong: CongViec;
  /** Lần kế tiếp của chuỗi lặp (nếu có) */
  tiep?: CongViec;
}

/**
 * Đánh dấu xong. Việc có `lap` → tự tạo lần kế tiếp (một bản ghi đang mở cho mỗi chuỗi).
 * Lần kế tiếp = lần lặp đầu tiên SAU max(hạn hiện tại, ngày hoàn thành) – bỏ qua các lần đã trôi qua.
 */
export function hoanThanhViec(v: CongViec, luc: NgayGio, lich: Lich, taoId: () => Id): KetQuaHoanThanh {
  const daXong: CongViec = { ...v, xong: luc, suaLuc: luc };
  if (!v.lap) return { daXong };
  const ngayHT = tachNgayGio(luc).ngay;
  const moc = v.han && v.han > ngayHT ? v.han : ngayHT;
  const han = lanLapKeTiep(lich, v.lap, moc);
  if (!han) return { daXong };
  const tiep: CongViec = {
    ...v,
    id: taoId(),
    han,
    xong: undefined,
    viecCon: v.viecCon.map((c) => ({ ...c, id: taoId(), xong: false })),
    taoLuc: luc,
    suaLuc: luc,
  };
  return { daXong, tiep };
}

export function boHoanThanh(v: CongViec, luc: NgayGio): CongViec {
  return { ...v, xong: undefined, suaLuc: luc };
}

/** Hạn của việc dùng so sánh (chỉ có ngày). */
export function trangThaiViec(v: CongViec, lich: Lich, homNay: NgayISO): TrangThaiMoc {
  if (v.xong) {
    if (!v.han) return 'XONG_DUNG_HAN';
    return tachNgayGio(v.xong).ngay <= v.han ? 'XONG_DUNG_HAN' : 'XONG_TRE';
  }
  if (!v.han) return 'CHUA_DEN';
  return trangThaiTheoHan(lich, homNay, v.han, false);
}

export type NhomViec = 'HOP_THU' | 'QUA_HAN' | 'HOM_NAY' | 'TUAN_NAY' | 'SAU' | 'XONG';

/** Nhóm trong màn Việc → Đang làm: Quá hạn / Hôm nay / Tuần này (≤ 5 NLV) / Sau; không hạn → Hộp thu. */
export function nhomViec(v: CongViec, lich: Lich, homNay: NgayISO): NhomViec {
  if (v.xong) return 'XONG';
  if (!v.han) return 'HOP_THU';
  if (v.han < homNay) return 'QUA_HAN';
  if (v.han === homNay) return 'HOM_NAY';
  return demNLV(lich, homNay, v.han) <= 5 ? 'TUAN_NAY' : 'SAU';
}

/** Hệ số theo nguồn: lãnh đạo/văn bản/thường xuyên = hạn nội bộ-hành chính (1,5); tự đặt = 1. */
export function diemUuTienViec(v: CongViec, lich: Lich, homNay: NgayISO): number {
  const heSo = v.nguon === 'TU_DAT' ? 1 : 1.5;
  const cong = v.nguon === 'LANH_DAO' ? 2 : 0;
  return tinhDiem({
    nlvConLai: v.han ? demNLV(lich, homNay, v.han) : undefined,
    heSo,
    cong,
    quaHan: !!v.han && v.han < homNay && !v.xong,
    ghim: v.ghim,
  });
}

/** Sắp xếp việc: ghim → điểm ưu tiên giảm dần → hạn tăng dần. */
export function sapXepViec(ds: CongViec[], lich: Lich, homNay: NgayISO): CongViec[] {
  return [...ds].sort((a, b) => {
    const d = diemUuTienViec(b, lich, homNay) - diemUuTienViec(a, lich, homNay);
    if (d !== 0) return d;
    return (a.han ?? '9999') < (b.han ?? '9999') ? -1 : 1;
  });
}
