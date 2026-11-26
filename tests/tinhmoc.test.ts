import { describe, it, expect } from 'vitest';
import { lichTronTru, taoLich } from '../src/core/lich';
import { taoCuocRong, tinhMoc, timMoc } from '../src/core/vuViec';
import type { CuocKiemTra, SuKien } from '../src/core/kieu';

const lich = lichTronTru();
const sk = (o: Record<string, unknown>, i = 0): SuKien => ({ id: 's' + i, taoLuc: `2026-10-01T08:0${i}`, ...o }) as SuKien;

function cuoc(buoc: Record<string, string>, extra: Partial<CuocKiemTra> = {}): CuocKiemTra {
  const c = taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: '2026-01-01T00:00', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}

describe('Mốc dự kiến và thực tế', () => {
  it('chỉ có D0: C, E, K, B… đều dự kiến, hạn các bước sau tính từ mốc dự kiến', () => {
    const kq = tinhMoc(cuoc({ P5: '2026-10-05' }), { lich, homNay: '2026-10-06' });
    expect(kq.moc.D0).toEqual({ ngay: '2026-10-05', duKien: false });
    expect(kq.moc.C).toEqual({ ngay: '2026-10-19', duKien: true });
    expect(kq.moc.E?.ngay).toBe('2026-11-09'); // 19/10 + 20 = 08/11 (CN) → 09/11
    expect(kq.moc.E?.duKien).toBe(true);
    expect(timMoc(kq, 'T1')!.duKien).toBe(true);
    expect(timMoc(kq, 'B1')!.duKien).toBe(true);
    expect(timMoc(kq, 'Q1')!.duKien).toBe(false);
  });
  it('sửa ngày thực tế → tính lại: C thực tế 12/10 thay cho dự kiến', () => {
    const kq = tinhMoc(cuoc({ P5: '2026-10-05', Q5: '2026-10-12' }), { lich, homNay: '2026-10-13' });
    expect(timMoc(kq, 'T1')!.hanPhapLy).toBe('2026-11-02');
    expect(timMoc(kq, 'T1')!.duKien).toBe(false);
    expect(timMoc(kq, 'T7')!.hanPhapLy).toBe('2026-11-02');
    expect(timMoc(kq, 'B1')!.duKien).toBe(true);
    expect(timMoc(kq, 'B1')!.hanPhapLy).toBe('2026-11-09');
  });
  it('ngày công bố dự kiến do người dùng nhập; hoãn đè lên', () => {
    const c = cuoc({ P5: '2026-10-05' }, { ngayCongBoDuKien: '2026-10-14' });
    expect(tinhMoc(c, { lich, homNay: '2026-10-06' }).moc.C?.ngay).toBe('2026-10-14');
    c.suKien = [sk({ loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-27' })];
    const kq = tinhMoc(c, { lich, homNay: '2026-10-11' });
    expect(timMoc(kq, 'Q5')!.hanPhapLy).toBe('2026-10-27');
    expect(kq.moc.C?.ngay).toBe('2026-10-27');
  });
  it('thiếu P1 → hạn nội bộ chưa tính, báo thiếu mốc', () => {
    const kq = tinhMoc(cuoc({}), { lich, homNay: '2026-10-06' });
    expect(timMoc(kq, 'P2')!.hanMucTieu).toBeUndefined();
    expect(timMoc(kq, 'P2')!.thieuMoc).toBe('P1');
  });
  it('P1 → hạn nội bộ P2..P5 và D0 dự kiến', () => {
    const kq = tinhMoc(cuoc({ P1: '2026-09-01' }), { lich, homNay: '2026-09-02' });
    expect(timMoc(kq, 'P2')!.hanMucTieu).toBe('2026-09-15');
    expect(timMoc(kq, 'P2')!.noiBo).toBe(true);
    expect(timMoc(kq, 'P2')!.hanPhapLy).toBeUndefined();
    expect(kq.moc.D0).toEqual({ ngay: '2026-09-29', duKien: true });
  });
});

describe('Hạn mục tiêu và trạng thái SLA', () => {
  const c = cuoc({ P5: '2026-10-05' });
  it('hạn mục tiêu = hạn pháp lý − 1 NLV đệm', () => {
    const q1 = timMoc(tinhMoc(c, { lich, homNay: '2026-10-06' }), 'Q1')!;
    expect(q1.hanPhapLy).toBe('2026-10-08');
    expect(q1.hanMucTieu).toBe('2026-10-07');
  });
  it('chưa đến (>3 NLV), sắp đến (≤3), hôm nay, quá hạn + chưa giải trình', () => {
    const q5 = (homNay: string) => timMoc(tinhMoc(c, { lich, homNay }), 'Q5')!; // hạn 19/10
    expect(q5('2026-10-06').trangThai).toBe('CHUA_DEN');
    expect(q5('2026-10-14').trangThai).toBe('SAP_DEN'); // 14→19 = 3 NLV
    expect(q5('2026-10-19').trangThai).toBe('HOM_NAY');
    const qh = q5('2026-10-21');
    expect(qh.trangThai).toBe('QUA_HAN');
    expect(qh.quaHanChuaGiaiTrinh).toBe(true);
    expect(qh.nlvConLai).toBe(-2);
  });
  it('có lý do trễ thì không còn "chưa giải trình"', () => {
    const c2 = cuoc({ P5: '2026-10-05' });
    c2.buoc.Q5 = { xong: false, lyDoTre: 'Chờ lịch NNT' };
    expect(timMoc(tinhMoc(c2, { lich, homNay: '2026-10-21' }), 'Q5')!.quaHanChuaGiaiTrinh).toBeUndefined();
  });
  it('xong đúng hạn / xong trễ', () => {
    const dung = timMoc(tinhMoc(cuoc({ P5: '2026-10-05', Q1: '2026-10-08' }), { lich, homNay: '2026-10-09' }), 'Q1')!;
    expect(dung.trangThai).toBe('XONG_DUNG_HAN');
    const tre = timMoc(tinhMoc(cuoc({ P5: '2026-10-05', Q1: '2026-10-12' }), { lich, homNay: '2026-10-13' }), 'Q1')!;
    expect(tre.trangThai).toBe('XONG_TRE');
    expect(tre.soNgayTre).toBe(2);
  });
  it('bước dự kiến không bao giờ "quá hạn"', () => {
    const kq = tinhMoc(cuoc({ P5: '2026-10-05', Q5: '2026-10-12' }), { lich, homNay: '2026-12-31' });
    expect(timMoc(kq, 'B1')!.trangThai).not.toBe('QUA_HAN');
    expect(timMoc(kq, 'T7')!.trangThai).toBe('QUA_HAN'); // K thật sự trễ
  });
});

describe('Bước điều kiện / tùy chọn', () => {
  it('B2 chỉ áp dụng khi quá hạn B1 mà NNT chưa ký', () => {
    const base = { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' };
    expect(timMoc(tinhMoc(cuoc(base), { lich, homNay: '2026-11-05' }), 'B2')!.trangThai).toBe('KHONG_AP_DUNG');
    const kq = tinhMoc(cuoc(base), { lich, homNay: '2026-11-09' });
    expect(timMoc(kq, 'B2')!.hanPhapLy).toBe('2026-11-09'); // HAN_B1 06/11 + 1 NLV
    expect(timMoc(kq, 'B2')!.trangThai).toBe('HOM_NAY');
    expect(timMoc(tinhMoc(cuoc({ ...base, B1: '2026-11-04' }), { lich, homNay: '2026-11-09' }), 'B2')!.trangThai).toBe('KHONG_AP_DUNG');
  });
  it('S7 chỉ áp dụng khi có sự kiện dấu hiệu tội phạm', () => {
    const c = cuoc({});
    expect(timMoc(tinhMoc(c, { lich, homNay: '2026-10-21' }), 'S7')!.trangThai).toBe('KHONG_AP_DUNG');
    c.suKien = [sk({ loai: 'TOI_PHAM', ngayPhatHien: '2026-10-20' })];
    const m = timMoc(tinhMoc(c, { lich, homNay: '2026-10-21' }), 'S7')!;
    expect(m.hanPhapLy).toBe('2026-10-27');
    expect(m.trangThai).toBe('CHUA_DEN'); // còn 4 NLV
    expect(timMoc(tinhMoc(c, { lich, homNay: '2026-10-23' }), 'S7')!.trangThai).toBe('SAP_DEN'); // còn 2 NLV
  });
  it('S4 chỉ áp dụng khi có số phải nộp; hạn = giao QĐ + 10 ngày', () => {
    const c = cuoc({ B1: '2026-11-03', X: '2026-11-10', S1: '2026-11-13' });
    expect(timMoc(tinhMoc(c, { lich, homNay: '2026-11-14' }), 'S4')!.trangThai).toBe('KHONG_AP_DUNG');
    c.ketQua.truyThu = 1_000_000;
    const m = timMoc(tinhMoc(c, { lich, homNay: '2026-11-14' }), 'S4')!;
    expect(m.hanPhapLy).toBe('2026-11-23');
  });
  it('T3: hạn chót đề nghị gia hạn; quá hạn T3 thì không còn áp dụng', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    const t3 = (homNay: string) => timMoc(tinhMoc(c, { lich, homNay }), 'T3')!;
    expect(t3('2026-10-20').hanPhapLy).toBe('2026-10-28');
    expect(t3('2026-10-20').tuyChon).toBe(true);
    expect(t3('2026-10-29').trangThai).toBe('KHONG_AP_DUNG');
  });
  it('bãi bỏ: các bước chưa xong thành không áp dụng', () => {
    const c = cuoc({ P5: '2026-10-05' });
    c.suKien = [sk({ loai: 'BAI_BO', ngayQD: '2026-10-07' })];
    const kq = tinhMoc(c, { lich, homNay: '2026-10-20' });
    expect(kq.baiBo).toBe(true);
    expect(timMoc(kq, 'Q5')!.trangThai).toBe('KHONG_AP_DUNG');
    expect(timMoc(kq, 'P5')!.trangThai).toBe('XONG_DUNG_HAN');
  });
});

describe('Chọn bộ quy tắc trong tinhMoc', () => {
  it('cuộc chuyển tiếp 970: E = C + 10 NLV', () => {
    const kq = tinhMoc(cuoc({ P5: '2026-06-15', Q5: '2026-06-22' }), { lich, homNay: '2026-06-23' });
    expect(kq.bo.ma).toBe('QTKT-970');
    expect(timMoc(kq, 'T1')!.hanPhapLy).toBe('2026-07-06');
  });
  it('ghi đè bộ theo từng cuộc', () => {
    const kq = tinhMoc(cuoc({ P5: '2026-10-05' }, { boQuyTacGhiDe: 'QTKT-970' }), { lich, homNay: '2026-10-06' });
    expect(kq.bo.ma).toBe('QTKT-970');
  });
  it('chế độ thận trọng cho hạn sớm hơn', () => {
    const t = taoLich({ cheDoThanTrong: true });
    expect(timMoc(tinhMoc(cuoc({ P5: '2026-10-05' }), { lich: t, homNay: '2026-10-06' }), 'Q1')!.hanPhapLy).toBe('2026-10-07');
  });
});
