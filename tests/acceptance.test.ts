// Kiểm thử chấp nhận: đọc TRỰC TIẾP tests/kich-ban-han.json – mỗi ca một it(). KHÔNG sửa kỳ vọng trong JSON.
// Logic tính từng ca nằm ở src/core/kiemThu (dùng chung với màn “Kiểm thử” trong app).
import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';
import { chayKichBan, tinhCa, type KichBan } from '../src/core/kiemThu';

const kb = kichBan as unknown as KichBan;

for (const nhom of kb.nhom) {
  describe(nhom.ten, () => {
    for (const ca of nhom.ca) {
      it(`${ca.id}: ${ca.moTa ?? ca.cau}`, () => {
        const r = tinhCa(kb, nhom, ca);
        expect(r.thucTe).toBe(r.kyVong);
      });
    }
  });
}

describe('Bộ chạy kịch bản dùng chung', () => {
  it('toàn bộ ca đạt khi dùng quy tắc gốc', () => {
    const ds = chayKichBan(kb);
    expect(ds.length).toBeGreaterThan(30);
    expect(ds.filter((x) => !x.dat)).toEqual([]);
  });
  it('đổi tham số quy tắc → có ca không đạt (để cán bộ phát hiện chênh lệch)', () => {
    const ds = chayKichBan(kb, { 'QTKT-1161': { buoc: { Q1: { so: 5 } } } });
    expect(ds.some((x) => !x.dat)).toBe(true);
  });
});
