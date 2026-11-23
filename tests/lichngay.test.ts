import { describe, it, expect } from 'vitest';
import { lichTronTru, taoLich } from '../src/core/lich';
import { caiDatMacDinh } from '../src/core/caiDat';
import { goiYKhoiThoiGian, gomMucTheoNgay, luoiThang, phanTichCuoc, trangThaiNangNhat, type MucViec } from '../src/core/tomTat';
import { taoCuocRong } from '../src/core/vuViec';

describe('Lưới tháng', () => {
  it('11/2026 (bắt đầu Chủ nhật): 6 tuần, từ thứ Hai 26/10 đến Chủ nhật 06/12', () => {
    const l = luoiThang(2026, 11, lichTronTru());
    expect(l).toHaveLength(6);
    expect(l[0][0].ngay).toBe('2026-10-26');
    expect(l[5][6].ngay).toBe('2026-12-06');
    expect(l.every((t) => t.length === 7)).toBe(true);
    expect(l[0][0].thuocThang).toBe(false);
    expect(l[0][6]).toMatchObject({ ngay: '2026-11-01', thuocThang: true, cuoiTuan: true, nghi: true });
    expect(l[5][0]).toMatchObject({ ngay: '2026-11-30', thuocThang: true, nghi: false });
  });
  it('số tuần theo tháng: 02/2021 (28 ngày, bắt đầu thứ Hai) 4 tuần; 02/2026 5 tuần; 08/2026 6 tuần', () => {
    expect(luoiThang(2021, 2, lichTronTru())).toHaveLength(4);
    expect(luoiThang(2026, 2, lichTronTru())).toHaveLength(5);
    expect(luoiThang(2026, 8, lichTronTru())).toHaveLength(6);
  });
  it('ngày lễ có tên, ngày làm bù đánh dấu và là ngày làm việc', () => {
    const lich = taoLich({ ngayNghiCoDinh: [{ ngayThang: '09-02', ten: 'Quốc khánh' }], ngayLamBu: ['2026-09-05'] });
    const o = luoiThang(2026, 9, lich).flat();
    expect(o.find((x) => x.ngay === '2026-09-02')).toMatchObject({ tenNghi: 'Quốc khánh', nghi: true });
    expect(o.find((x) => x.ngay === '2026-09-05')).toMatchObject({ lamBu: true, nghi: false, cuoiTuan: true });
  });
  it('năm nhuận: 29/02/2028', () => {
    expect(luoiThang(2028, 2, lichTronTru()).flat().some((x) => x.ngay === '2028-02-29' && x.thuocThang)).toBe(true);
  });
});

const muc = (khoa: string, han: string, trangThai: MucViec['trangThai'], diem = 1): MucViec => ({ khoa, loai: 'VIEC', tieuDe: khoa, han, trangThai, muc: 'CON_LAU', diem, lienKet: '#viec' });

describe('Gom việc theo ngày', () => {
  it('chỉ lấy trong khoảng; mỗi ngày sắp theo điểm giảm dần; trạng thái nặng nhất', () => {
    const m = gomMucTheoNgay([muc('a', '2026-11-10', 'CHUA_DEN', 1), muc('b', '2026-11-10', 'QUA_HAN', 9), muc('c', '2026-12-01', 'SAP_DEN'), muc('d', '2026-10-01', 'QUA_HAN')], '2026-11-01', '2026-11-30');
    expect([...m.keys()]).toEqual(['2026-11-10']);
    expect(m.get('2026-11-10')!.map((x) => x.khoa)).toEqual(['b', 'a']);
    expect(trangThaiNangNhat(m.get('2026-11-10')!)).toBe('QUA_HAN');
    expect(trangThaiNangNhat([])).toBeUndefined();
    expect(trangThaiNangNhat([muc('x', 'y', 'CHUA_DEN'), muc('z', 'y', 'HOM_NAY')])).toBe('HOM_NAY');
  });
});

describe('Gợi ý khối thời gian', () => {
  const lich = lichTronTru();
  const c = taoCuocRong({ id: 'c1', ma: 'KT-1', taoLuc: 'x', mst: '0100000001', tenNNT: 'Công ty A' });
  c.buoc.P5 = { xong: true, ngay: '2026-10-05' };
  c.buoc.Q5 = { xong: true, ngay: '2026-10-12' };
  const d = { homNay: '2026-10-14', lich, caiDat: caiDatMacDinh(), cuoc: [c], viec: [], keHoach: [] };
  const pt = phanTichCuoc(c, d);
  it('mỗi ngày làm việc tại DN có 2 khối (sáng, chiều); cuối tuần không có', () => {
    const g = goiYKhoiThoiGian([pt], lich, '2026-10-12', '2026-10-18', [], false).filter((x) => x.loai === 'TAI_DN');
    expect(g.map((x) => `${x.ngay} ${x.tu}-${x.den}`)).toEqual([
      '2026-10-12 07:30-11:30', '2026-10-12 13:00-17:00', '2026-10-13 07:30-11:30', '2026-10-13 13:00-17:00',
      '2026-10-14 07:30-11:30', '2026-10-14 13:00-17:00', '2026-10-15 07:30-11:30', '2026-10-15 13:00-17:00',
      '2026-10-16 07:30-11:30', '2026-10-16 13:00-17:00',
    ]);
    expect(g[0].tieuDe).toBe('Tại DN Công ty A (…0001)');
  });
  it('ẩn danh; bỏ gợi ý trùng khối đã tạo', () => {
    const daCo = [{ id: 'b', ngay: '2026-10-12', tu: '07:30', den: '11:30', tieuDe: 'x', cuocId: 'c1' }];
    const g = goiYKhoiThoiGian([pt], lich, '2026-10-12', '2026-10-12', daCo, true);
    expect(g.filter((x) => x.loai === 'TAI_DN').map((x) => x.tu)).toEqual(['13:00']);
    expect(g[0].tieuDe).toContain('KT …0001');
    expect(g[0].tieuDe).not.toContain('Công ty A');
  });
  it('ngày có việc nhập liệu đến hạn → gợi ý 30 phút cuối ngày', () => {
    // ITNK_CB phát sinh 12/10 → hạn 13/10
    const g = goiYKhoiThoiGian([pt], lich, '2026-10-13', '2026-10-13', [], false).filter((x) => x.loai === 'NHAP_HE_THONG');
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ tu: '16:30', den: '17:00' });
    expect(g[0].tieuDe).toMatch(/Nhập TTR\/iTNK \(3 việc\)/);
  });
});

import { xepLanKhoi } from '../src/core/tomTat';

describe('Xếp làn khối chồng giờ', () => {
  const k = (tu: string, den: string, id = tu) => ({ tu, den, id });
  it('không chồng → 1 làn; chồng → chia làn; cụm sau không bị ảnh hưởng', () => {
    const r = xepLanKhoi([k('07:30', '11:30', 'a'), k('13:00', '17:00', 'b'), k('16:30', '17:00', 'c'), k('09:00', '10:00', 'd')]);
    const m = Object.fromEntries(r.map((x) => [x.id, [x.lan, x.soLan]]));
    expect(m).toEqual({ a: [0, 2], d: [1, 2], b: [0, 2], c: [1, 2] });
  });
  it('khối liền kề (kết thúc = bắt đầu) không chồng', () => {
    const r = xepLanKhoi([k('09:00', '10:00', 'x'), k('10:00', '11:00', 'y')]);
    expect(r.every((x) => x.lan === 0 && x.soLan === 1)).toBe(true);
  });
  it('ba khối chồng nhau → 3 làn', () => {
    const r = xepLanKhoi([k('09:00', '12:00', 'x'), k('09:30', '11:00', 'y'), k('10:00', '10:30', 'z')]);
    expect(r.map((x) => x.soLan)).toEqual([3, 3, 3]);
    expect(new Set(r.map((x) => x.lan)).size).toBe(3);
  });
  it('rỗng', () => expect(xepLanKhoi([])).toEqual([]));
});
