// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { docCsv, docTepBang, ghiTepXlsx, taoTepMauXlsx } from '../src/data/excel';
import { docDongKeHoach, goiYGhepCot, timDongTieuDe } from '../src/core/nhapXuat';
import { readFileSync } from 'node:fs';

describe('Đọc/ghi Excel (SheetJS)', () => {
  it('docCsv: ngoặc kép, dấu phẩy trong ô, dòng trống', () => {
    expect(docCsv('a,b\n"x, y","z ""q"""\n\n1,2\r\n')).toEqual([['a', 'b'], ['x, y', 'z "q"'], ['1', '2']]);
  });
  it('tệp mẫu CSV nhập được hết dòng, không lỗi', () => {
    const rows = docCsv(readFileSync('samples/mau-ke-hoach.csv', 'utf8'));
    const hd = timDongTieuDe(rows);
    expect(hd).toBe(0);
    const r = docDongKeHoach(rows, goiYGhepCot(rows[hd]), hd + 1, { nam: 2027, cuocDaCo: [], keHoach: [] });
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.every((x) => x.loi.length === 0 && x.thangDuKien?.startsWith('2027-'))).toBe(true);
  });
  it('tệp mẫu .xlsx: ghi rồi đọc lại đúng nội dung, MST giữ số 0 đầu', async () => {
    const rows = docCsv(readFileSync('samples/mau-ke-hoach.csv', 'utf8'));
    const tep = await taoTepMauXlsx(rows);
    const [tt] = await docTepBang(tep);
    expect(tt.rows[0]).toEqual(rows[0]);
    expect(tt.rows[1][2]).toBe('0100000001');
    expect(tt.rows).toHaveLength(rows.length);
  });
  it('ghi bảng xuất: nhiều trang, số là số, tiêu đề đúng', async () => {
    const tep = await ghiTepXlsx([
      { ten: 'A', cot: [{ tieuDe: 'Tên', rong: 10 }, { tieuDe: 'Tiền', kieu: 'so' }], dong: [['x', 1234567], ['y', '']] },
      { ten: 'B', cot: [{ tieuDe: 'C' }], dong: [] },
    ]);
    const tt = await docTepBang(tep);
    expect(tt.map((t) => t.ten)).toEqual(['A', 'B']);
    expect(tt[0].rows[0]).toEqual(['Tên', 'Tiền']);
    expect(tt[0].rows[1][0]).toBe('x');
    expect(tt[0].rows[1][1]).toBe('1234567');
  });
});
