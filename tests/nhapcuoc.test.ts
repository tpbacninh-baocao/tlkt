import { describe, it, expect } from 'vitest';
import { kiemTraMST, taoCuocRong, taoMaCuoc, timCuocTrung } from '../src/core/vuViec';

describe('MST', () => {
  it('10 số hợp lệ; 13 số được định dạng 10-3; bỏ ký tự thừa', () => {
    expect(kiemTraMST('0100109106')).toEqual({ mst: '0100109106', hopLe: true });
    expect(kiemTraMST('0100109106 001').mst).toBe('0100109106-001');
    expect(kiemTraMST('0100109106-001').hopLe).toBe(true);
    expect(kiemTraMST(' 0100 109 106 ').mst).toBe('0100109106');
  });
  it('sai độ dài / rỗng → lỗi chặn', () => {
    expect(kiemTraMST('12345').loi).toMatch(/10 hoặc 13/);
    expect(kiemTraMST('12345678901').hopLe).toBe(false);
    expect(kiemTraMST('').loi).toMatch(/Nhập/);
  });
});

describe('Mã cuộc & trùng', () => {
  it('KT-năm-số tăng dần theo từng năm', () => {
    expect(taoMaCuoc([], 2026)).toBe('KT-2026-001');
    expect(taoMaCuoc([{ ma: 'KT-2026-001' }, { ma: 'KT-2026-009' }, { ma: 'KT-2025-050' }, { ma: 'khac' }], 2026)).toBe('KT-2026-010');
    expect(taoMaCuoc([{ ma: 'KT-2026-001' }], 2027)).toBe('KT-2027-001');
    expect(taoMaCuoc([{ ma: 'KT-2026-999' }], 2026)).toBe('KT-2026-1000');
  });
  it('tìm cuộc trùng: cùng MST, cùng năm, chưa xóa, trừ chính nó', () => {
    const c = (id: string, mst: string, o = {}) => taoCuocRong({ id, ma: id, mst, taoLuc: '2026-03-01T00:00', ...o });
    const ds = [c('a', '0100109106'), c('b', '0100109106', { xoaLuc: 'x' }), c('c', '0100109106', { taoLuc: '2025-03-01T00:00' }), c('d', '0100109106-001')];
    expect(timCuocTrung(ds, '0100109106', 2026, []).map((x) => x.id)).toEqual(['a']);
    expect(timCuocTrung(ds, '0100109106', 2026, [], 'a')).toEqual([]);
    expect(timCuocTrung(ds, '0100 109 106', 2025, []).map((x) => x.id)).toEqual(['c']);
  });
});
