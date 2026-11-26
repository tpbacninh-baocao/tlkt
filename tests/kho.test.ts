import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { moKho, Kho, PHIEN_BAN_SCHEMA, soSanhThayDoi, yeuCauLuuBen, CAC_KHO } from '../src/data/kho';
import { taoCuocRong } from '../src/core/vuViec';
import { caiDatMacDinh } from '../src/core/caiDat';
import type { CongViec, KeHoach } from '../src/core/kieu';

let dem = 0;
let gio = '2026-11-23T08:00';
async function moMoi(ten = `kho-${++dem}`): Promise<Kho> {
  return moKho({ ten, dongHo: () => gio });
}
const cuocMau = (id = 'c1') => taoCuocRong({ id, ma: 'KT-1', taoLuc: '2026-11-01T00:00', mst: '0100000001', tenNNT: 'Công ty A' });
const viecMau = (id = 'v1'): CongViec => ({ id, tieuDe: 'Việc 1', nguon: 'TU_DAT', viecCon: [], taoLuc: gio, suaLuc: gio });

beforeEach(() => {
  gio = '2026-11-23T08:00';
});

describe('Mở kho & schema', () => {
  it('tạo đủ 9 kho; ghi số phiên bản schema', async () => {
    const k = await moMoi();
    expect([...k.db.objectStoreNames].sort()).toEqual([...CAC_KHO].sort());
    expect(await k.docMeta<number>('phienBan')).toBe(PHIEN_BAN_SCHEMA);
    expect(k.daMaHoa()).toBe(false);
  });
  it('migrate chạy các bước còn thiếu theo thứ tự, không chạy lại', async () => {
    const k = await moMoi();
    const chay: number[] = [];
    const buoc = [
      { den: 3, chay: async () => void chay.push(3) },
      { den: 2, chay: async () => void chay.push(2) },
    ];
    expect(await k.migrate(buoc)).toBe(3);
    expect(chay).toEqual([2, 3]);
    expect(await k.docMeta<number>('phienBan')).toBe(3);
    await k.migrate(buoc);
    expect(chay).toEqual([2, 3]);
  });
  it('yeuCauLuuBen không lỗi khi môi trường không hỗ trợ', async () => {
    expect(await yeuCauLuuBen()).toBe(false);
  });
});

describe('CRUD + audit log', () => {
  it('thêm cuộc: gán taoLuc/suaLuc, ghi nhật ký THEM; sửa: ghi SUA với trường thay đổi', async () => {
    const k = await moMoi();
    const c = await k.luuCuoc(cuocMau());
    expect(c.suaLuc).toBe('2026-11-23T08:00');
    gio = '2026-11-23T09:30';
    await k.luuCuoc({ ...c, tenNNT: 'Công ty B', truongDoan: 'Nguyễn Văn A' });
    const doc = await k.lay<{ tenNNT: string; suaLuc: string }>('cuoc', 'c1');
    expect(doc!.tenNNT).toBe('Công ty B');
    expect(doc!.suaLuc).toBe('2026-11-23T09:30');
    const nk = await k.docNhatKy({ doiTuong: 'cuoc', id: 'c1' });
    expect(nk.map((e) => e.hanhDong)).toEqual(['SUA', 'THEM']);
    expect(nk[0].truoc).toEqual({ tenNNT: 'Công ty A', truongDoan: '' });
    expect(nk[0].sau).toEqual({ tenNNT: 'Công ty B', truongDoan: 'Nguyễn Văn A' });
    expect(JSON.stringify(nk[0])).not.toContain('suaLuc');
  });
  it('lưu không đổi gì thì không ghi dòng SUA', async () => {
    const k = await moMoi();
    const c = await k.luuCuoc(cuocMau());
    await k.luuCuoc(c);
    expect((await k.docNhatKy({ id: 'c1' })).map((e) => e.hanhDong)).toEqual(['THEM']);
  });
  it('việc, kế hoạch, khối thời gian, kế hoạch ngày, cài đặt: lưu và đọc lại', async () => {
    const k = await moMoi();
    await k.luuViec(viecMau());
    const kh: KeHoach = { id: 'k1', nam: 2026, loai: 'KH_NAM', ten: 'KH 2026', chiTieuSoCuoc: 8 };
    await k.luuKeHoach(kh);
    await k.luuKhoiThoiGian({ id: 'b1', ngay: '2026-11-23', tu: '07:30', den: '11:30', tieuDe: 'Tại DN' });
    await k.luuKeHoachNgay({ ngay: '2026-11-23', mucTieu: ['Gửi QĐ'], nhacNho: '', ghiChu: 'x', choNgayMai: '' });
    const cd = caiDatMacDinh();
    cd.canBo.hoTen = 'Nguyễn Văn A';
    await k.luuCaiDat(cd);
    const du = await k.docTatCa();
    expect(du.viec.map((v) => v.id)).toEqual(['v1']);
    expect(du.keHoach[0]).toMatchObject({ id: 'k1', chiTieuSoCuoc: 8 });
    expect(du.khoiThoiGian).toHaveLength(1);
    expect(du.keHoachNgay[0]).toEqual({ ngay: '2026-11-23', mucTieu: ['Gửi QĐ'], nhacNho: '', ghiChu: 'x', choNgayMai: '' });
    expect(du.caiDat.canBo.hoTen).toBe('Nguyễn Văn A');
    expect((await k.layKeHoachNgay('2026-11-23'))!.ghiChu).toBe('x');
    await k.xoaKhoiThoiGian('b1');
    expect((await k.docTatCa()).khoiThoiGian).toHaveLength(0);
  });
  it('cài đặt chưa lưu → mặc định; cài đặt cũ thiếu trường được bổ sung', async () => {
    const k = await moMoi();
    expect((await k.docCaiDat()).nhac.banTinSang).toBe('07:15');
    await k.ghiTho('caiDat', { id: 'caiDat', canBo: { hoTen: 'X', donVi: 'Y' }, nhac: { bat: false } });
    const cd = await k.docCaiDat();
    expect(cd.canBo.hoTen).toBe('X');
    expect(cd.nhac).toMatchObject({ bat: false, banTinSang: '07:15', gioYenLangTu: '21:00' });
    expect(cd.khoaTuDongPhut).toBe(5);
  });
  it('chuẩn hóa dữ liệu cũ thiếu trường', async () => {
    const k = await moMoi();
    await k.ghiTho('cuoc', { id: 'cu', ma: 'KT-CU', mst: '0100000009', tenNNT: 'Cũ' });
    const [c] = (await k.docTatCa()).cuoc;
    expect(c.suKien).toEqual([]);
    expect(c.buoc).toEqual({});
    expect(c.ketQua.truyThu).toBe(0);
  });
  it('nhật ký chỉ giữ số dòng gần nhất', async () => {
    const k = await moMoi();
    k.gioiHanNhatKy = 5;
    for (let i = 0; i < 9; i++) {
      gio = `2026-11-23T08:0${i}`;
      await k.ghiNhatKy({ luc: gio, hanhDong: 'NHAP', doiTuong: 'thu', id: String(i) });
    }
    const ds = await k.docNhatKy();
    expect(ds).toHaveLength(5);
    expect(ds.map((d) => d.id)).toEqual(['8', '7', '6', '5', '4']);
  });
  it('soSanhThayDoi bỏ qua suaLuc và trường không đổi', () => {
    expect(soSanhThayDoi({ a: 1, b: 2, suaLuc: 'x' }, { a: 1, b: 3, suaLuc: 'y' })).toEqual({ truoc: { b: 2 }, sau: { b: 3 } });
    expect(soSanhThayDoi({ a: 1 }, { a: 1 })).toBeUndefined();
  });
});

describe('Xóa mềm, thùng rác, xóa hẳn sau 30 ngày', () => {
  it('xóa mềm → vẫn còn trong kho với xoaLuc; khôi phục lại được', async () => {
    const k = await moMoi();
    await k.luuCuoc(cuocMau());
    expect(await k.xoaMem('cuoc', 'c1')).toBe(true);
    expect(await k.xoaMem('cuoc', 'c1')).toBe(false);
    expect((await k.docTatCa()).cuoc[0].xoaLuc).toBe('2026-11-23T08:00');
    expect((await k.thungRac()).map((t) => [t.kho, t.doc.id])).toEqual([['cuoc', 'c1']]);
    expect(await k.khoiPhuc('cuoc', 'c1')).toBe(true);
    expect((await k.docTatCa()).cuoc[0].xoaLuc).toBeUndefined();
    expect(await k.thungRac()).toEqual([]);
    expect((await k.docNhatKy({ id: 'c1' })).map((e) => e.hanhDong)).toEqual(['KHOI_PHUC', 'XOA', 'THEM']);
  });
  it('tự xóa hẳn khi quá 30 ngày (đúng 30 ngày vẫn khôi phục được)', async () => {
    const k = await moMoi();
    await k.luuCuoc(cuocMau('c1'));
    await k.luuViec(viecMau('v1'));
    await k.xoaMem('cuoc', 'c1');
    gio = '2026-12-10T08:00';
    await k.xoaMem('viec', 'v1');
    expect(await k.donThungRac('2026-12-23')).toBe(0); // c1: đúng 30 ngày
    expect((await k.thungRac()).length).toBe(2);
    expect(await k.donThungRac('2026-12-24')).toBe(1); // c1: 31 ngày
    expect((await k.thungRac()).map((t) => t.doc.id)).toEqual(['v1']);
    expect((await k.docTatCa()).cuoc).toHaveLength(0);
  });
  it('xóa vĩnh viễn ghi nhật ký', async () => {
    const k = await moMoi();
    await k.luuViec(viecMau());
    await k.xoaVinhVien('viec', 'v1');
    expect((await k.docTatCa()).viec).toHaveLength(0);
    expect((await k.docNhatKy({ id: 'v1' }))[0].hanhDong).toBe('XOA');
  });
});

describe('Nhắc đã phát & xóa toàn bộ', () => {
  it('đánh dấu đã phát, dọn dấu cũ', async () => {
    const k = await moMoi();
    expect(await k.daPhatChua('a|b')).toBe(false);
    await k.danhDauDaPhat('a|b', '2026-09-01T08:00');
    await k.danhDauDaPhat('c|d', '2026-11-22T08:00');
    expect(await k.daPhatChua('a|b')).toBe(true);
    expect((await k.docTatCa()).daPhat).toEqual(new Set(['a|b', 'c|d']));
    expect(await k.donNhacDaPhat('2026-11-23', 45)).toBe(1);
    expect(await k.daPhatChua('a|b')).toBe(false);
    expect(await k.daPhatChua('c|d')).toBe(true);
  });
  it('xóa toàn bộ dữ liệu', async () => {
    const k = await moMoi();
    await k.luuCuoc(cuocMau());
    await k.xoaToanBo();
    const du = await k.docTatCa();
    expect(du.cuoc).toHaveLength(0);
    expect(await k.db.count('nhatKyHeThong')).toBe(0);
    expect(await k.docMeta<number>('phienBan')).toBe(PHIEN_BAN_SCHEMA);
  });
  it('dữ liệu còn nguyên khi mở lại kho', async () => {
    const ten = `kho-${++dem}`;
    const a = await moMoi(ten);
    await a.luuCuoc(cuocMau());
    a.dong();
    const b = await moMoi(ten);
    expect((await b.docTatCa()).cuoc.map((c) => c.id)).toEqual(['c1']);
  });
});
