import { describe, it, expect } from 'vitest';
import { caiDatMacDinh } from '../src/core/caiDat';
import { lichTronTru } from '../src/core/lich';
import { gioHoan, nhacDenGio, TIEN_TO_BO, type DuLieuNhac } from '../src/core/nhacViec';
import type { CongViec } from '../src/core/kieu';

const lich = lichTronTru();
function viec(han: string): CongViec {
  return { id: 'v1', tieuDe: 'Nộp báo cáo', nguon: 'TU_DAT', han, viecCon: [], taoLuc: '2026-10-01T08:00', suaLuc: '2026-10-01T08:00' };
}
function du(homNay: string, v: CongViec[] = [viec('2026-11-24')]): DuLieuNhac {
  const cd = caiDatMacDinh();
  cd.nhac.banTinSang = '';
  return { homNay, lich, caiDat: cd, cuoc: [], viec: v, keHoach: [] };
}

import { nhacDenGio as nhacDenGioTho } from '../src/core/nhacViec';
/** Chỉ xét nhắc của việc thử (bỏ nhắc nhịp như Kế hoạch tuần). */
const nhacDenGioV: typeof nhacDenGioTho = (...a) => nhacDenGioTho(...a).filter((n) => n.khoa.startsWith('viec:v1'));

describe('nhacDenGio – chọn nhắc cần phát', () => {
  it('chưa đến giờ thì chưa có; đến giờ thì có và cần thông báo', () => {
    // việc hạn thứ Ba 24/11: nhắc T-1 lúc 08:00 thứ Hai 23/11; T0 lúc 07:30 thứ Ba
    expect(nhacDenGioV(du('2026-11-23'), '2026-11-23T07:59', new Set())).toEqual([]);
    const a = nhacDenGioV(du('2026-11-23'), '2026-11-23T08:00', new Set());
    expect(a).toHaveLength(1);
    expect(a[0].canThongBao).toBe(true);
    expect(a[0].khoa).toContain('viec:v1|T-1');
  });
  it('không phát trùng: đã phát thì vẫn ở chuông nhưng không cần thông báo lại', () => {
    const d = du('2026-11-23');
    const a = nhacDenGioV(d, '2026-11-23T08:30', new Set());
    const daPhat = new Set(a.map((x) => x.khoa));
    const b = nhacDenGioV(d, '2026-11-23T08:31', daPhat);
    expect(b).toHaveLength(1);
    expect(b[0].canThongBao).toBe(false);
  });
  it('“Đã làm” (khóa bo:) loại hẳn nhắc khỏi danh sách', () => {
    const d = du('2026-11-23');
    const k = nhacDenGioV(d, '2026-11-23T08:30', new Set())[0].khoa;
    expect(nhacDenGioV(d, '2026-11-23T08:30', new Set([TIEN_TO_BO + k]))).toEqual([]);
  });
  it('việc đã xong thì không nhắc', () => {
    const v = { ...viec('2026-11-24'), xong: '2026-11-23T07:00' };
    expect(nhacDenGioV(du('2026-11-23', [v]), '2026-11-23T09:00', new Set())).toEqual([]);
  });
  it('hoãn: ẩn đến giờ hoãn rồi cần thông báo lại', () => {
    const d = du('2026-11-23');
    const k = nhacDenGioV(d, '2026-11-23T08:30', new Set())[0].khoa;
    const daPhat = new Set([k]);
    expect(nhacDenGioV(d, '2026-11-23T08:40', daPhat, { [k]: '2026-11-23T08:45' })).toEqual([]);
    const lai = nhacDenGioV(d, '2026-11-23T08:46', daPhat, { [k]: '2026-11-23T08:45' });
    expect(lai).toHaveLength(1);
    expect(lai[0].canThongBao).toBe(true);
    expect(lai[0].lucPhat).toBe('2026-11-23T08:45');
    expect(lai[0].daHoan).toBe(true);
  });
  it('hoãn qua đêm sang sáng hôm sau vẫn hiện đúng giờ', () => {
    const d = du('2026-11-24');
    const k = nhacDenGioV(d, '2026-11-23T08:30', new Set())[0].khoa;
    const r = nhacDenGioV({ ...d, homNay: '2026-11-24' }, '2026-11-24T07:31', new Set([k]), { [k]: '2026-11-24T07:30' });
    expect(r.some((x) => x.khoa === k && x.canThongBao)).toBe(true);
  });
  it('mở app sau nhiều ngày: chỉ lấy trong 36 giờ gần nhất, không dồn cả đống', () => {
    const r = nhacDenGioV(du('2026-12-10'), '2026-12-10T09:00', new Set());
    expect(r.every((x) => x.lucPhat >= '2026-12-08T21:00')).toBe(true);
  });
  it('tắt nhắc trong cài đặt → không có gì', () => {
    const d = du('2026-11-23');
    d.caiDat.nhac.bat = false;
    expect(nhacDenGioV(d, '2026-11-23T09:00', new Set())).toEqual([]);
  });
});

describe('gioHoan', () => {
  it('15 phút, 1 giờ', () => {
    expect(gioHoan('15P', '2026-11-23T10:00', lich, '21:00', '06:30')).toBe('2026-11-23T10:15');
    expect(gioHoan('1G', '2026-11-23T10:00', lich, '21:00', '06:30')).toBe('2026-11-23T11:00');
  });
  it('hoãn ngắn rơi vào giờ yên lặng → dời sang cuối khung', () => {
    expect(gioHoan('1G', '2026-11-23T20:30', lich, '21:00', '06:30')).toBe('2026-11-24T06:30');
  });
  it('sáng mai = ngày làm việc kế tiếp 07:30 (thứ Sáu → thứ Hai)', () => {
    expect(gioHoan('SANG_MAI', '2026-11-27T16:00', lich, '21:00', '06:30')).toBe('2026-11-30T07:30');
    expect(gioHoan('SANG_MAI', '2026-11-23T16:00', lich, '21:00', '06:30')).toBe('2026-11-24T07:30');
  });
});
