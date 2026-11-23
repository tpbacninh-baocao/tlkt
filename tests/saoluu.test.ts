import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { moKho, type Kho } from '../src/data/kho';
import { DINH_DANG_SAO_LUU, LoiSaoLuu, docNgaySaoLuuCuoi, docTepSaoLuu, nhapSaoLuu, taoSaoLuu, tenTepSaoLuu, xuatSaoLuu } from '../src/data/saoLuu';
import { taoCuocRong } from '../src/core/vuViec';
import { caiDatMacDinh } from '../src/core/caiDat';
import { canNhacSaoLuu, sinhLichNhac } from '../src/core/nhacViec';
import { lichTronTru } from '../src/core/lich';
import type { CongViec } from '../src/core/kieu';

let dem = 0;
let gio = '2026-11-23T08:00';
const moMoi = () => moKho({ ten: `sl-${++dem}`, dongHo: () => gio });
const viec = (id: string, tieuDe = 'Việc'): CongViec => ({ id, tieuDe, nguon: 'TU_DAT', viecCon: [], taoLuc: gio, suaLuc: gio });

async function nap(k: Kho) {
  const c = taoCuocRong({ id: 'c1', ma: 'KT-1', taoLuc: gio, mst: '0100000001', tenNNT: 'Công ty Bí Mật' });
  c.buoc.P5 = { xong: true, ngay: '2026-11-02' };
  await k.luuCuoc(c);
  await k.luuViec(viec('v1', 'Việc nhạy cảm'));
  await k.luuKeHoach({ id: 'k1', nam: 2026, loai: 'KH_NAM', ten: 'KH 2026' });
  await k.luuKhoiThoiGian({ id: 'b1', ngay: '2026-11-23', tu: '07:30', den: '11:30', tieuDe: 'Tại DN' });
  await k.luuKeHoachNgay({ ngay: '2026-11-23', mucTieu: ['a'], nhacNho: '', ghiChu: '', choNgayMai: '' });
  const cd = caiDatMacDinh();
  cd.canBo.hoTen = 'Nguyễn Văn A';
  await k.luuCaiDat(cd);
}

describe('Xuất sao lưu', () => {
  it('tên tệp theo ngày; ghi nhận ngày sao lưu; không chứa nhật ký/nhắc đã phát', async () => {
    const k = await moMoi();
    await nap(k);
    await k.danhDauDaPhat('x|y', gio);
    const { tenTep, noiDung } = await xuatSaoLuu(k, '2026-11-23', gio);
    expect(tenTep).toBe('TLKT-sao-luu-20261123.tlkt.json');
    expect(tenTepSaoLuu('2027-01-05')).toBe('TLKT-sao-luu-20270105.tlkt.json');
    expect(await docNgaySaoLuuCuoi(k)).toBe('2026-11-23');
    const goi = JSON.parse(noiDung);
    expect(goi).toMatchObject({ dinhDang: DINH_DANG_SAO_LUU, phienBan: 1, daMaHoa: false });
    expect(Object.keys(goi.duLieu).sort()).toEqual(['caiDat', 'cuoc', 'keHoach', 'keHoachNgay', 'khoiThoiGian', 'viec']);
    expect(noiDung).not.toContain('x|y');
    expect((await k.docNhatKy({ doiTuong: 'saoLuu' }))[0].hanhDong).toBe('XUAT');
  });
  it('đã bật mật mã → tệp được mã hóa, không lộ nội dung', async () => {
    const k = await moMoi();
    await nap(k);
    await k.datMatMa('mat-ma-123');
    const { noiDung } = await xuatSaoLuu(k, '2026-11-23', gio);
    const goi = JSON.parse(noiDung);
    expect(goi.daMaHoa).toBe(true);
    expect(goi.duLieu).toBeUndefined();
    expect(goi.matMa.soVong).toBeGreaterThanOrEqual(210_000);
    for (const bi of ['Bí Mật', 'nhạy cảm', 'Nguyễn Văn A', '0100000001']) expect(noiDung).not.toContain(bi);
  });
});

describe('Khôi phục – Thay thế', () => {
  it('chuyển máy: nạp vào kho trống cho kết quả giống hệt', async () => {
    const a = await moMoi();
    await nap(a);
    const { noiDung } = await taoSaoLuu(a, gio);
    const b = await moMoi();
    const bc = await nhapSaoLuu(b, noiDung, 'THAY_THE', gio);
    expect(bc.them).toBe(5);
    const [da, db] = [await a.docTatCa(), await b.docTatCa()];
    expect(db.cuoc).toEqual(da.cuoc);
    expect(db.viec).toEqual(da.viec);
    expect(db.keHoach).toEqual(da.keHoach);
    expect(db.khoiThoiGian).toEqual(da.khoiThoiGian);
    expect(db.keHoachNgay).toEqual(da.keHoachNgay);
    expect(db.caiDat.canBo.hoTen).toBe('Nguyễn Văn A');
  });
  it('xóa dữ liệu hiện có không còn trong tệp; giữ nhật ký hệ thống', async () => {
    const a = await moMoi();
    await nap(a);
    const { noiDung } = await taoSaoLuu(a, gio);
    const b = await moMoi();
    await b.luuViec(viec('chi-co-o-b'));
    await nhapSaoLuu(b, noiDung, 'THAY_THE', gio);
    expect((await b.docTatCa()).viec.map((v) => v.id)).toEqual(['v1']);
    expect((await b.docNhatKy({ doiTuong: 'saoLuu' }))[0].hanhDong).toBe('NHAP');
    expect((await b.docNhatKy({ id: 'chi-co-o-b' })).length).toBeGreaterThan(0);
  });
  it('tệp thiếu cài đặt → giữ cài đặt hiện tại', async () => {
    const a = await moMoi();
    await a.luuViec(viec('v1'));
    const { noiDung } = await taoSaoLuu(a, gio); // a chưa lưu cài đặt
    const b = await moMoi();
    const cd = caiDatMacDinh();
    cd.canBo.hoTen = 'Giữ lại';
    await b.luuCaiDat(cd);
    await nhapSaoLuu(b, noiDung, 'THAY_THE', gio);
    expect((await b.docCaiDat()).canBo.hoTen).toBe('Giữ lại');
  });
});

describe('Khôi phục – Gộp theo suaLuc', () => {
  it('thêm mục mới, thay bản cũ bằng bản mới hơn, giữ bản hiện tại nếu mới hơn', async () => {
    const a = await moMoi();
    gio = '2026-11-23T08:00';
    await a.luuViec(viec('chung-1', 'A cũ'));
    await a.luuViec(viec('chung-2', 'A mới'));
    await a.luuViec(viec('chi-a', 'Chỉ có ở A'));
    const b = await moMoi();
    await b.luuViec(viec('chung-1', 'B mới hơn'));
    gio = '2026-11-23T07:00';
    await b.luuViec(viec('chung-2', 'B cũ hơn'));
    // chung-1: A (08:00) vs B... đặt lại để B mới hơn thật sự
    gio = '2026-11-23T09:00';
    await b.luuViec(viec('chung-1', 'B mới hơn'));
    gio = '2026-11-23T10:00';
    const { noiDung } = await taoSaoLuu(a, gio);
    const bc = await nhapSaoLuu(b, noiDung, 'GOP', gio);
    expect(bc).toMatchObject({ them: 1, capNhat: 1, giuNguyen: 1, boQua: 0 });
    const ten = Object.fromEntries((await b.docTatCa()).viec.map((v) => [v.id, v.tieuDe]));
    expect(ten).toEqual({ 'chung-1': 'B mới hơn', 'chung-2': 'A mới', 'chi-a': 'Chỉ có ở A' });
  });
  it('mục xóa mềm ở bản mới hơn được lan sang', async () => {
    const a = await moMoi();
    gio = '2026-11-23T08:00';
    await a.luuViec(viec('v1'));
    const b = await moMoi();
    await b.luuViec(viec('v1'));
    gio = '2026-11-23T09:00';
    await a.xoaMem('viec', 'v1');
    const { noiDung } = await taoSaoLuu(a, gio);
    await nhapSaoLuu(b, noiDung, 'GOP', gio);
    expect((await b.docTatCa()).viec[0].xoaLuc).toBe('2026-11-23T09:00');
  });
  it('khối thời gian/kế hoạch ngày đã có thì giữ; cài đặt đã có thì giữ', async () => {
    const a = await moMoi();
    await nap(a);
    const { noiDung } = await taoSaoLuu(a, gio);
    const b = await moMoi();
    await b.luuKhoiThoiGian({ id: 'b1', ngay: '2026-11-23', tu: '09:00', den: '10:00', tieuDe: 'Của B' });
    const cd = caiDatMacDinh();
    cd.canBo.hoTen = 'Người B';
    await b.luuCaiDat(cd);
    await nhapSaoLuu(b, noiDung, 'GOP', gio);
    const du = await b.docTatCa();
    expect(du.khoiThoiGian[0].tieuDe).toBe('Của B');
    expect(du.caiDat.canBo.hoTen).toBe('Người B');
    expect(du.cuoc).toHaveLength(1);
    expect(du.keHoachNgay).toHaveLength(1);
  });
});

describe('Sao lưu đã mã hóa', () => {
  it('nhập bằng mật mã đúng vào kho thường; sai/thiếu mật mã bị từ chối', async () => {
    const a = await moMoi();
    await nap(a);
    await a.datMatMa('mat-ma-123');
    const { noiDung } = await taoSaoLuu(a, gio);
    const b = await moMoi();
    await expect(nhapSaoLuu(b, noiDung, 'THAY_THE', gio)).rejects.toMatchObject({ ma: 'CAN_MAT_MA' });
    await expect(nhapSaoLuu(b, noiDung, 'THAY_THE', gio, 'sai-sai-sai')).rejects.toMatchObject({ ma: 'MAT_MA_SAI' });
    expect((await b.docTatCa()).cuoc).toHaveLength(0); // chưa bị đổi gì
    await nhapSaoLuu(b, noiDung, 'THAY_THE', gio, 'mat-ma-123');
    expect((await b.docTatCa()).cuoc[0].tenNNT).toBe('Công ty Bí Mật');
    expect(b.daMaHoa()).toBe(false);
  });
  it('nhập vào kho đang mã hóa bằng mật mã khác: dữ liệu được mã hóa lại theo khóa của kho đích', async () => {
    const a = await moMoi();
    await nap(a);
    await a.datMatMa('mat-ma-aaa');
    const { noiDung } = await taoSaoLuu(a, gio);
    const b = await moMoi();
    await b.datMatMa('mat-ma-bbb');
    await nhapSaoLuu(b, noiDung, 'THAY_THE', gio, 'mat-ma-aaa');
    expect(JSON.stringify(await b.db.getAll('cuoc'))).not.toContain('Bí Mật');
    expect((await b.docTatCa()).cuoc[0].tenNNT).toBe('Công ty Bí Mật');
    expect(await b.xacNhanMatMa('mat-ma-bbb')).toBe(true);
  });
  it('tệp bị sửa → báo hỏng', async () => {
    const a = await moMoi();
    await nap(a);
    await a.datMatMa('mat-ma-123');
    const goi = JSON.parse((await taoSaoLuu(a, gio)).noiDung);
    goi.ban.ct = goi.ban.ct.slice(0, -4) + (goi.ban.ct.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    const b = await moMoi();
    await expect(nhapSaoLuu(b, JSON.stringify(goi), 'GOP', gio, 'mat-ma-123')).rejects.toMatchObject({ ma: 'HONG' });
  });
});

describe('Tệp không hợp lệ', () => {
  it('không phải JSON / sai định dạng / phiên bản mới / thiếu nội dung', () => {
    expect(() => docTepSaoLuu('xin chào')).toThrowError(LoiSaoLuu);
    expect(() => docTepSaoLuu('{}')).toThrow(/không phải là tệp sao lưu/);
    expect(() => docTepSaoLuu(JSON.stringify({ dinhDang: DINH_DANG_SAO_LUU, phienBan: 99, daMaHoa: false }))).toThrow(/phiên bản mới hơn/);
    expect(() => docTepSaoLuu(JSON.stringify({ dinhDang: DINH_DANG_SAO_LUU, phienBan: 1, daMaHoa: false }))).toThrow(/thiếu nội dung/);
    expect(() => docTepSaoLuu(JSON.stringify({ dinhDang: DINH_DANG_SAO_LUU, phienBan: 1, daMaHoa: true }))).toThrow(/thiếu nội dung/);
  });
  it('bỏ qua bản ghi hỏng (thiếu id) và đếm', async () => {
    const goi = { dinhDang: DINH_DANG_SAO_LUU, phienBan: 1, taoLuc: gio, daMaHoa: false, duLieu: { cuoc: [{ ma: 'x' }, { id: 'c9', ma: 'KT-9', mst: '1' }], viec: 'rác', keHoach: [], khoiThoiGian: [], keHoachNgay: [] } };
    const k = await moMoi();
    const bc = await nhapSaoLuu(k, JSON.stringify(goi), 'GOP', gio);
    expect(bc.boQua).toBe(1);
    expect((await k.docTatCa()).cuoc.map((c) => c.id)).toEqual(['c9']);
  });
});

describe('Nhắc sao lưu hằng tuần', () => {
  it('thứ Sáu và đã quá 7 ngày (hoặc chưa từng) mới nhắc', () => {
    expect(canNhacSaoLuu('2026-11-27', undefined)).toBe(true);
    expect(canNhacSaoLuu('2026-11-27', null)).toBe(true);
    expect(canNhacSaoLuu('2026-11-27', '2026-11-20')).toBe(false); // đúng 7 ngày
    expect(canNhacSaoLuu('2026-11-27', '2026-11-19')).toBe(true);
    expect(canNhacSaoLuu('2026-11-27', '2026-11-26')).toBe(false);
    expect(canNhacSaoLuu('2026-11-26', null)).toBe(false); // thứ Năm
  });
  it('sinhLichNhac thêm nhắc 15:45 thứ Sáu khi cần; không nhắc nếu không truyền saoLuuCuoi', () => {
    const base = { homNay: '2026-11-23', lich: lichTronTru(), caiDat: caiDatMacDinh(), cuoc: [], viec: [], keHoach: [] };
    const co = sinhLichNhac({ ...base, saoLuuCuoi: '2026-11-10' }, '2026-11-23', '2026-11-30').filter((n) => n.khoa.startsWith('nhip:SAOLUU'));
    expect(co.map((n) => n.luc)).toEqual(['2026-11-27T15:45']);
    expect(co[0].noiDung).toContain('10/11/2026');
    expect(sinhLichNhac(base, '2026-11-23', '2026-11-30').some((n) => n.khoa.startsWith('nhip:SAOLUU'))).toBe(false);
    expect(sinhLichNhac({ ...base, saoLuuCuoi: '2026-11-25' }, '2026-11-23', '2026-11-30').some((n) => n.khoa.startsWith('nhip:SAOLUU'))).toBe(false);
  });
});
