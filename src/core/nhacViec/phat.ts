// Quyết định nhắc nào cần phát/hiện ở chuông tại một thời điểm (hàm thuần) – ARCHITECTURE §8.2.
// Không phát trùng: dựa vào tập `daPhat` (khóa nhắc đã thông báo) và `daBo` (khóa người dùng đã bấm “Đã làm”).
import type { NgayGio } from '../kieu';
import { congNLV, congPhutNgayGio, ghepNgayGio, gioSangPhut, type Lich } from '../lich';
import { ganGioYenLang, sinhLichNhac, type DuLieuNhac, type Nhac } from './sinhNhac';

/** Khóa đánh dấu “đã làm/bỏ qua” trong tập đã phát (tiền tố để dùng chung một kho). */
export const TIEN_TO_BO = 'bo:';

export interface NhacDenGio extends Nhac {
  /** Thời điểm hiệu lực (sau khi hoãn thì là giờ hoãn tới) */
  lucPhat: NgayGio;
  /** true = chưa từng thông báo (hoặc vừa hết hạn hoãn) → cần bật toast/Notification/âm báo */
  canThongBao: boolean;
  daHoan: boolean;
}

export type KieuHoan = '15P' | '1G' | 'SANG_MAI';

export const TEN_KIEU_HOAN: Record<KieuHoan, string> = { '15P': '15 phút', '1G': '1 giờ', SANG_MAI: 'sáng mai' };

/**
 * Các nhắc đã đến giờ trong `soGio` giờ gần nhất (mặc định 36), chưa bị bỏ.
 * `hoan`: khóa → giờ nhắc lại (đặt khi bấm Hoãn).
 */
export function nhacDenGio(
  d: DuLieuNhac,
  bayGio: NgayGio,
  daPhat: ReadonlySet<string>,
  hoan: Readonly<Record<string, NgayGio>> = {},
  soGio = 36,
): NhacDenGio[] {
  const tu = congPhutNgayGio(bayGio, -soGio * 60);
  const tuNgay = tu.slice(0, 10);
  const ra: NhacDenGio[] = [];
  const them = (n: Nhac, lucPhat: NgayGio, daHoan: boolean) => {
    if (lucPhat > bayGio || lucPhat < tu) return;
    ra.push({ ...n, lucPhat, daHoan, canThongBao: daHoan || !daPhat.has(n.khoa) });
  };
  const thay = new Set<string>();
  for (const n of sinhLichNhac(d, tuNgay, d.homNay)) {
    if (daPhat.has(TIEN_TO_BO + n.khoa)) continue;
    thay.add(n.khoa);
    const h = hoan[n.khoa];
    them(n, h ?? n.luc, h !== undefined);
  }
  // Nhắc đã hoãn sang ngày khác nhưng khóa gốc không còn trong cửa sổ sinh (ví dụ hoãn qua đêm)
  for (const [khoa, luc] of Object.entries(hoan)) {
    if (thay.has(khoa) || daPhat.has(TIEN_TO_BO + khoa)) continue;
    const goc = sinhLichNhac(d, luc.slice(0, 10) < tuNgay ? luc.slice(0, 10) : tuNgay, d.homNay).find((n) => n.khoa === khoa);
    if (goc) them(goc, luc, true);
  }
  return ra.sort((a, b) => (a.lucPhat < b.lucPhat ? 1 : a.lucPhat > b.lucPhat ? -1 : a.khoa < b.khoa ? -1 : 1));
}

/** Giờ nhắc lại khi bấm Hoãn. “Sáng mai” = ngày làm việc kế tiếp lúc 07:30. Hoãn ngắn vẫn tôn trọng giờ yên lặng. */
export function gioHoan(kieu: KieuHoan, bayGio: NgayGio, lich: Lich, yenLangTu: string, yenLangDen: string): NgayGio {
  if (kieu === 'SANG_MAI') return ghepNgayGio(congNLV(lich, bayGio.slice(0, 10), 1), gioSangPhut('07:30'));
  const luc = congPhutNgayGio(bayGio, kieu === '15P' ? 15 : 60);
  return ganGioYenLang(luc, yenLangTu, yenLangDen);
}
