// Việc tiếp theo, SLA, điểm ưu tiên (ARCHITECTURE §6, SPEC §4).
import type { CuocKiemTra, MocTinh, NgayISO } from '../kieu';
import { congNgayThuan, demNLV, laNgayLamViec, type Lich } from '../lich';
import { tongNgayTamDung } from '../quyTac';
import { laBuocNoiBoDaQua, type KetQuaTinhMoc } from './tinhMoc';

// ---------- Mức SLA hiển thị ----------
export type MucSLA =
  | 'CON_LAU' // 🟢 > 3 NLV
  | 'SAP_DEN' // 🟡 ≤ 3 NLV
  | 'HOM_NAY_NGAY_MAI' // 🟠
  | 'QUA_HAN' // 🔴
  | 'QUA_HAN_CHUA_GIAI_TRINH' // ⚫
  | 'XONG_DUNG_HAN' // ✅
  | 'XONG_TRE' // ☑️
  | 'DU_KIEN'
  | 'KHONG_AP_DUNG';

export function mucSLA(m: MocTinh): MucSLA {
  switch (m.trangThai) {
    case 'XONG_DUNG_HAN':
      return 'XONG_DUNG_HAN';
    case 'XONG_TRE':
      return 'XONG_TRE';
    case 'KHONG_AP_DUNG':
      return 'KHONG_AP_DUNG';
    case 'QUA_HAN':
      return m.quaHanChuaGiaiTrinh ? 'QUA_HAN_CHUA_GIAI_TRINH' : 'QUA_HAN';
    case 'HOM_NAY':
      return 'HOM_NAY_NGAY_MAI';
    case 'SAP_DEN':
      if (m.duKien) return 'DU_KIEN';
      return m.nlvConLai !== undefined && m.nlvConLai <= 1 ? 'HOM_NAY_NGAY_MAI' : 'SAP_DEN';
    default:
      return m.duKien ? 'DU_KIEN' : 'CON_LAU';
  }
}

// ---------- Việc tiếp theo ----------
/**
 * Việc tiếp theo = bước đầu tiên theo thứ tự có loại {bước, mốc, điều kiện (thỏa), theo dõi nộp tiền},
 * chưa xong và áp dụng được. Bước NỘI BỘ (hoặc không có hạn pháp lý) của giai đoạn đã qua bị bỏ qua
 * để không nhắc P1–P4 khi QĐ kiểm tra đã ban hành.
 */
export function viecTiepTheo(cuoc: CuocKiemTra, kq: KetQuaTinhMoc): MocTinh | undefined {
  return kq.danhSach.find((m) => {
    if (!['buoc', 'moc', 'dieuKien', 'theoDoiNopTien'].includes(m.loai)) return false;
    if (cuoc.buoc[m.ma]?.xong || m.trangThai === 'KHONG_AP_DUNG') return false;
    return !laBuocNoiBoDaQua(cuoc, m);
  });
}

export interface VietSongSong {
  loai: 'YEU_CAU_TAI_LIEU' | 'VUONG_MAC' | 'NHAT_KY' | 'CHECKLIST_QUA_HAN';
  tieuDe: string;
  id?: string;
}

/** Ngày làm việc tại DN: từ C đến K (hoặc E nếu chưa có K), trừ ngày nghỉ, ngày tạm dừng, ngày đoàn không xuống DN. */
export function laNgayTaiDN(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, ngay: NgayISO): boolean {
  const c = kq.moc.C;
  if (!c || c.duKien) return false;
  const k = cuoc.buoc.T7?.xong ? cuoc.buoc.T7.ngay : undefined;
  const cuoi = k ?? kq.moc.E?.ngay;
  if (!cuoi || ngay < c.ngay || ngay > cuoi) return false;
  if (kq.baiBo || !laNgayLamViec(lich, ngay)) return false;
  if (cuoc.ngayKhongLamTaiDN.includes(ngay)) return false;
  if (tongNgayTamDung(cuoc.suKien) > 0) {
    for (const s of cuoc.suKien) {
      if (s.loai === 'TAM_DUNG' && ngay >= (s.tuNgay as string) && ngay <= (s.denNgay as string)) return false;
    }
  }
  return true;
}

/** Ngày thứ mấy tại DN (đếm các ngày làm việc tại DN từ C đến `ngay`). */
export function ngayThuMayTaiDN(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, ngay: NgayISO): number {
  const c = kq.moc.C;
  if (!c) return 0;
  let dem = 0;
  for (let d = c.ngay; d <= ngay; d = congNgayThuan(d, 1)) {
    if (laNgayTaiDN(cuoc, kq, lich, d)) dem++;
  }
  return dem;
}

/** Các mục song song đang mở: yêu cầu tài liệu chưa nhận, vướng mắc chưa xong, nhật ký hôm nay chưa ghi. */
export function viecSongSong(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, homNay: NgayISO): VietSongSong[] {
  const ds: VietSongSong[] = [];
  for (const y of cuoc.yeuCauTaiLieu) if (!y.nhanLuc) ds.push({ loai: 'YEU_CAU_TAI_LIEU', tieuDe: y.noiDung, id: y.id });
  for (const v of cuoc.vuongMac) if (!v.daXong) ds.push({ loai: 'VUONG_MAC', tieuDe: v.noiDung, id: v.id });
  if (laNgayTaiDN(cuoc, kq, lich, homNay) && !cuoc.nhatKy[homNay]?.daGhiITNK) {
    ds.push({ loai: 'NHAT_KY', tieuDe: 'Ghi nhật ký iTNK hôm nay' });
  }
  return ds;
}

// ---------- Điểm ưu tiên ----------
export interface DauVaoDiem {
  /** NLV còn lại tới hạn (âm = quá hạn); undefined = không có hạn */
  nlvConLai?: number;
  heSo: 3 | 1.5 | 1;
  cong?: number;
  quaHan?: boolean;
  ghim?: boolean;
}

export function tinhDiem(d: DauVaoDiem): number {
  if (d.nlvConLai === undefined) return (d.cong ?? 0) + (d.ghim ? 1000 : 0);
  const diem = (10 - Math.min(10, d.nlvConLai)) * d.heSo + (d.cong ?? 0) + (d.quaHan ? 20 : 0);
  return diem + (d.ghim ? 1000 : 0);
}

/** Điểm ưu tiên của một mốc thuộc cuộc. */
export function diemUuTienMoc(m: MocTinh, cuoc: CuocKiemTra, lich: Lich, homNay: NgayISO): number {
  const hanDeDem = m.noiBo ? m.hanMucTieu : m.hanPhapLy;
  let cong = 0;
  if (cuoc.vanBanGiao) cong += 2;
  const hanNgoaiGan = !!cuoc.hanNgoai && demNLV(lich, homNay, cuoc.hanNgoai) <= 10;
  if (cuoc.loai === 'TH' || hanNgoaiGan) cong += 2;
  if (cuoc.vuongMac.some((v) => !v.daXong)) cong += 1;
  return tinhDiem({
    nlvConLai: hanDeDem ? demNLV(lich, homNay, hanDeDem) : undefined,
    heSo: m.noiBo ? 1.5 : 3,
    cong,
    quaHan: m.trangThai === 'QUA_HAN',
    ghim: cuoc.ghim,
  });
}

/** Điểm ưu tiên của cả cuộc = điểm của việc tiếp theo (0 nếu không còn việc). */
export function diemUuTienCuoc(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, homNay: NgayISO): number {
  const v = viecTiepTheo(cuoc, kq);
  return v ? diemUuTienMoc(v, cuoc, lich, homNay) : cuoc.ghim ? 1000 : 0;
}
