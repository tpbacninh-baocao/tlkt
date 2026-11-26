import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { caiDatMacDinh } from '../src/core/caiDat';
import { taoCuocRong } from '../src/core/vuViec';
import { phanTichCuoc, type DuLieuTomTat } from '../src/core/tomTat';
import { thongKeKeHoach } from '../src/core/keHoach';
import { bangDanhSachCuoc, bangNhapLieuThieu, bangThuNop, bangTienDoKeHoach, bangViecKhac, type BangXuat } from '../src/core/nhapXuat';
import type { CongViec, CuocKiemTra } from '../src/core/kieu';

const lich = lichTronTru();
function cuoc(extra: Partial<CuocKiemTra>, buoc: Record<string, string>): CuocKiemTra {
  const c = taoCuocRong({ id: 'c1', ma: 'KT-2026-001', taoLuc: '2026-01-01T00:00', mst: '0100000001', tenNNT: 'Công ty A', truongDoan: 'Nguyễn A', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}
function dl(cs: CuocKiemTra[], homNay: string, anDanh = false, viec: CongViec[] = []): DuLieuTomTat {
  const caiDat = caiDatMacDinh();
  caiDat.anDanh = anDanh;
  return { homNay, bayGio: `${homNay}T10:00`, lich, caiDat, cuoc: cs, viec, keHoach: [] };
}
const kiemTraHinhDang = (b: BangXuat) => b.dong.forEach((r) => expect(r.length).toBe(b.cot.length));

describe('Bảng xuất Excel', () => {
  const c = cuoc({ ketQua: { coXuLy: true, truyThu: 1000000, phat: 200000, chamNop: 50000, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0, soQDXL: '99/QĐ-XPVPHC' } }, { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-11-02', X: '2026-11-20' });
  c.nopTien = [{ id: 'n1', ngay: '2026-11-25', soTien: 600000, daNhapTTR: false }];
  const d = dl([c], '2026-11-26');
  const pts = d.cuoc.map((x) => phanTichCuoc(x, d));

  it('Danh sách cuộc: 2 trang, số cột khớp từng dòng, có ngày dd/mm/yyyy', () => {
    const [bc, bm] = bangDanhSachCuoc(d, pts);
    kiemTraHinhDang(bc);
    kiemTraHinhDang(bm);
    expect(bc.dong).toHaveLength(1);
    expect(bc.dong[0][0]).toBe('KT-2026-001');
    expect(bc.dong[0]).toContain('05/10/2026');
    expect(bm.dong.length).toBeGreaterThan(5);
    expect(bm.dong.some((r) => r[1] === 'Q5' && r[7] === '12/10/2026')).toBe(true);
  });
  it('Ẩn danh: không lộ MST và tên', () => {
    const da = dl([c], '2026-11-26', true);
    const [bc] = bangDanhSachCuoc(da, da.cuoc.map((x) => phanTichCuoc(x, da)));
    const text = JSON.stringify(bc.dong);
    expect(text).not.toContain('0100000001');
    expect(text).not.toContain('Công ty A');
    expect(text).toContain('0001');
  });
  it('Thu nộp: số tiền là số, còn phải nộp = phải nộp − đã nộp, có dòng tổng', () => {
    const b = bangThuNop(d, pts);
    kiemTraHinhDang(b);
    expect(b.dong[0].slice(4, 13)).toEqual([1000000, 200000, 50000, 0, 0, 0, 1250000, 600000, 650000]);
    expect(b.dong.at(-1)![0]).toBe('TỔNG');
    expect(b.dong.at(-1)![10]).toBe(1250000);
  });
  it('Thu nộp: cuộc chưa có kết quả thì không có dòng', () => {
    const k = cuoc({}, { P5: '2026-10-05' });
    const dk = dl([k], '2026-11-26');
    expect(bangThuNop(dk, dk.cuoc.map((x) => phanTichCuoc(x, dk))).dong).toEqual([]);
  });
  it('Nhập liệu thiếu: mỗi dòng ứng với một việc chưa tích', () => {
    const b = bangNhapLieuThieu(d, pts);
    kiemTraHinhDang(b);
    expect(b.dong.length).toBeGreaterThan(0);
    expect(b.dong.every((r) => ['TTR', 'iTNK', 'TMS'].includes(r[2] as string))).toBe(true);
  });
  it('Tiến độ kế hoạch', () => {
    const tk = thongKeKeHoach({ homNay: '2026-11-26', lich, cuoc: [c], keHoach: [] }, { nam: 2026 });
    const bs = bangTienDoKeHoach(tk, 2026, 'Tất cả');
    bs.forEach(kiemTraHinhDang);
    expect(bs[1].dong).toHaveLength(12);
    expect(bs[0].dong.find((r) => r[0] === 'Phải nộp')![1]).toBe(1250000);
  });
  it('Việc khác: chưa xong lên trước, theo hạn', () => {
    const v = (id: string, han: string, xong?: string): CongViec => ({ id, tieuDe: id, nguon: 'TU_DAT', han, viecCon: [], xong, taoLuc: '2026-11-01T08:00', suaLuc: '2026-11-01T08:00' });
    const b = bangViecKhac([v('b', '2026-12-01'), v('a', '2026-11-30'), v('c', '2026-11-10', '2026-11-10T09:00')], lich, '2026-11-26');
    kiemTraHinhDang(b);
    expect(b.dong.map((r) => r[0])).toEqual(['a', 'b', 'c']);
    expect(b.dong[2][6]).toBe('Xong đúng hạn');
  });
});
