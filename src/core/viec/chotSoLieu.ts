// “Chốt số liệu ngày 15 / cuối tháng”: còn bao nhiêu ngày làm việc (UI §4.7, rules.baoCaoDinhKy).
import type { NgayISO } from '../kieu';
import { demNLV, type Lich } from '../lich';
import { lanLapTu } from './lap';

export interface MocChot {
  ma: 'CHOT_15' | 'CHOT_CUOI_THANG';
  ten: string;
  ngay: NgayISO;
  /** Số ngày làm việc từ hôm nay đến ngày chốt (0 = hôm nay) */
  conLaiNLV: number;
}

/** Hai mốc chốt gần nhất sắp tới, sắp theo ngày. Ngày chốt rơi ngày nghỉ → lùi về ngày làm việc trước. */
export function cacMocChot(lich: Lich, homNay: NgayISO): MocChot[] {
  const kq: MocChot[] = [];
  const a = lanLapTu(lich, 'THANG:15', homNay);
  const b = lanLapTu(lich, 'THANG:CUOI', homNay);
  if (a) kq.push({ ma: 'CHOT_15', ten: 'Chốt số liệu ngày 15', ngay: a, conLaiNLV: demNLV(lich, homNay, a) });
  if (b) kq.push({ ma: 'CHOT_CUOI_THANG', ten: 'Chốt số liệu cuối tháng', ngay: b, conLaiNLV: demNLV(lich, homNay, b) });
  return kq.sort((x, y) => (x.ngay < y.ngay ? -1 : 1));
}

export function mocChotGanNhat(lich: Lich, homNay: NgayISO): MocChot | undefined {
  return cacMocChot(lich, homNay)[0];
}
