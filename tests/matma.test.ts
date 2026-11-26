import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { moKho, KhoDangKhoa } from '../src/data/kho';
import { BoChanSai, KhoaTuDong, SO_VONG_MAC_DINH, giaiMa, kiemTraDoDaiMatMa, maHoa, moKhoaBangMatMa, suyRaKhoa, taoCauHinhMatMa, tuBase64 } from '../src/data/mat';
import { taoCuocRong } from '../src/core/vuViec';
import { caiDatMacDinh } from '../src/core/caiDat';

let dem = 0;
const ten = () => `mm-${++dem}`;
const gio = () => '2026-11-23T08:00';

async function khoCoDuLieu(tenKho = ten()) {
  const k = await moKho({ ten: tenKho, dongHo: gio });
  const c = taoCuocRong({ id: 'c1', ma: 'KT-1', taoLuc: gio(), mst: '0100000001', tenNNT: 'Công ty Bí Mật', truongDoan: 'Nguyễn Văn A' });
  c.buoc.P5 = { xong: true, ngay: '2026-11-02', soVB: '123/QĐ' };
  await k.luuCuoc(c);
  await k.luuViec({ id: 'v1', tieuDe: 'Việc nội bộ nhạy cảm', nguon: 'TU_DAT', viecCon: [], taoLuc: gio(), suaLuc: gio() });
  const cd = caiDatMacDinh();
  cd.canBo.hoTen = 'Nguyễn Văn A';
  await k.luuCaiDat(cd);
  return { k, tenKho };
}

describe('Primitive mã hóa', () => {
  it('mã hóa → giải mã đúng; mỗi lần mã hóa cho kết quả khác (iv ngẫu nhiên)', async () => {
    const { khoa } = await taoCauHinhMatMa('matkhau-123');
    const g = { a: 'Tiếng Việt có dấu: Đoàn kiểm tra', b: [1, 2, 3], c: { d: null } };
    const m1 = await maHoa(khoa, g);
    const m2 = await maHoa(khoa, g);
    expect(m1.ct).not.toBe(m2.ct);
    expect(m1.iv).not.toBe(m2.iv);
    expect(tuBase64(m1.iv).length).toBe(12);
    expect(await giaiMa(khoa, m1)).toEqual(g);
  });
  it('cấu hình dùng ≥ 210.000 vòng, salt 16 byte; từ chối số vòng thấp và mật mã ngắn', async () => {
    const { cauHinh } = await taoCauHinhMatMa('matkhau-123');
    expect(cauHinh.soVong).toBeGreaterThanOrEqual(210_000);
    expect(SO_VONG_MAC_DINH).toBe(210_000);
    expect(tuBase64(cauHinh.salt).length).toBe(16);
    await expect(taoCauHinhMatMa('matkhau-123', 1000)).rejects.toThrow(/tối thiểu/);
    await expect(taoCauHinhMatMa('12345')).rejects.toThrow(/6 ký tự/);
    expect(kiemTraDoDaiMatMa('123456')).toBeUndefined();
    expect(kiemTraDoDaiMatMa('abc')).toMatch(/6 ký tự/);
  });
  it('sai mật mã bị từ chối; đúng mật mã mở được', async () => {
    const { cauHinh } = await taoCauHinhMatMa('dung-mat-ma');
    expect(await moKhoaBangMatMa('sai-mat-ma', cauHinh)).toBeNull();
    expect(await moKhoaBangMatMa('', cauHinh)).toBeNull();
    expect(await moKhoaBangMatMa('dung-mat-ma', cauHinh)).not.toBeNull();
  });
  it('khóa sai không giải mã được; dữ liệu bị sửa bị phát hiện', async () => {
    const a = await taoCauHinhMatMa('khoa-a-111');
    const b = await taoCauHinhMatMa('khoa-b-222');
    const m = await maHoa(a.khoa, { x: 1 });
    await expect(giaiMa(b.khoa, m)).rejects.toBeTruthy();
    const hong = { ...m, ct: m.ct.slice(0, -4) + (m.ct.endsWith('AAAA') ? 'BBBB' : 'AAAA') };
    await expect(giaiMa(a.khoa, hong)).rejects.toBeTruthy();
  });
  it('cùng mật mã, salt khác → khóa khác', async () => {
    const s1 = new Uint8Array(16).fill(1);
    const s2 = new Uint8Array(16).fill(2);
    const k1 = await suyRaKhoa('mat-khau-giong', s1, 210_000);
    const k2 = await suyRaKhoa('mat-khau-giong', s2, 210_000);
    const m = await maHoa(k1, 'x');
    await expect(giaiMa(k2, m)).rejects.toBeTruthy();
  });
});

describe('Kho mã hóa', () => {
  it('bật mật mã: bản ghi trong IndexedDB chỉ còn { id, iv, ct }, không lộ nội dung', async () => {
    const { k } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    expect(k.daMaHoa()).toBe(true);
    for (const kho of ['cuoc', 'viec', 'caiDat', 'nhatKyHeThong'] as const) {
      const ds = (await k.db.getAll(kho)) as Record<string, unknown>[];
      expect(ds.length).toBeGreaterThan(0);
      for (const r of ds) expect(Object.keys(r).sort()).toEqual(['ct', 'id', 'iv']);
    }
    const tho = JSON.stringify(await k.db.getAll('cuoc')) + JSON.stringify(await k.db.getAll('viec')) + JSON.stringify(await k.db.getAll('caiDat'));
    expect(tho).not.toContain('Bí Mật');
    expect(tho).not.toContain('nhạy cảm');
    expect(tho).not.toContain('Nguyễn Văn A');
    // meta không mã hóa nhưng không chứa mật mã
    const meta = (await k.docMeta<{ salt: string; soVong: number; kiemTra: unknown }>('matMa'))!;
    expect(meta.soVong).toBeGreaterThanOrEqual(210_000);
    expect(JSON.stringify(meta)).not.toContain('mat-ma-123');
    // vẫn đọc bình thường khi đang mở
    const du = await k.docTatCa();
    expect(du.cuoc[0].tenNNT).toBe('Công ty Bí Mật');
    expect(du.caiDat.canBo.hoTen).toBe('Nguyễn Văn A');
  });
  it('ghi mới khi đang mã hóa cũng được mã hóa', async () => {
    const { k } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    await k.luuViec({ id: 'v2', tieuDe: 'Bí mật mới', nguon: 'TU_DAT', viecCon: [], taoLuc: gio(), suaLuc: gio() });
    const raw = JSON.stringify(await k.db.getAll('viec'));
    expect(raw).not.toContain('Bí mật mới');
    expect((await k.docTatCa()).viec.map((v) => v.id).sort()).toEqual(['v1', 'v2']);
  });
  it('mở lại app: đang khóa, truy cập bị chặn; sai mật mã bị từ chối; đúng mật mã mở được và dữ liệu nguyên vẹn', async () => {
    const { k, tenKho } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    k.dong();
    const k2 = await moKho({ ten: tenKho, dongHo: gio });
    expect(k2.daMaHoa()).toBe(true);
    expect(k2.dangKhoa()).toBe(true);
    await expect(k2.docTatCa()).rejects.toBeInstanceOf(KhoDangKhoa);
    await expect(k2.luuViec({ id: 'x', tieuDe: 'x', nguon: 'TU_DAT', viecCon: [], taoLuc: 'x', suaLuc: 'x' })).rejects.toBeInstanceOf(KhoDangKhoa);
    expect(await k2.moKhoa('sai-mat-ma')).toBe(false);
    expect(k2.dangKhoa()).toBe(true);
    expect(await k2.moKhoa('mat-ma-123')).toBe(true);
    expect(k2.dangKhoa()).toBe(false);
    const du = await k2.docTatCa();
    expect(du.cuoc[0]).toMatchObject({ id: 'c1', tenNNT: 'Công ty Bí Mật', truongDoan: 'Nguyễn Văn A' });
    expect(du.cuoc[0].buoc.P5.soVB).toBe('123/QĐ');
    expect(du.viec[0].tieuDe).toBe('Việc nội bộ nhạy cảm');
  });
  it('khóa lại: xóa khóa khỏi bộ nhớ', async () => {
    const { k } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    k.khoaLai();
    expect(k.dangKhoa()).toBe(true);
    await expect(k.docTatCa()).rejects.toBeInstanceOf(KhoDangKhoa);
    expect(await k.moKhoa('mat-ma-123')).toBe(true);
    expect((await k.docTatCa()).cuoc).toHaveLength(1);
  });
  it('đổi mật mã giữ nguyên dữ liệu; mật mã cũ không còn dùng được; salt mới', async () => {
    const { k, tenKho } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-cu-1');
    const truoc = await k.docTatCa();
    const saltCu = (await k.layCauHinhMatMa())!.salt;
    expect(await k.doiMatMa('sai-mat-khau', 'mat-ma-moi-2')).toBe(false);
    expect(await k.doiMatMa('mat-ma-cu-1', 'mat-ma-moi-2')).toBe(true);
    expect((await k.layCauHinhMatMa())!.salt).not.toBe(saltCu);
    expect(await k.docTatCa()).toEqual(truoc); // dữ liệu y nguyên
    k.dong();
    const k2 = await moKho({ ten: tenKho, dongHo: gio });
    expect(await k2.moKhoa('mat-ma-cu-1')).toBe(false);
    expect(await k2.moKhoa('mat-ma-moi-2')).toBe(true);
    expect((await k2.docTatCa()).cuoc[0].tenNNT).toBe('Công ty Bí Mật');
    // nhật ký (kể cả dòng cũ) vẫn đọc được bằng khóa mới
    expect((await k2.docNhatKy({ id: 'c1' })).length).toBeGreaterThan(0);
  });
  it('tắt mật mã: dữ liệu trở lại dạng thường, đọc được không cần mật mã', async () => {
    const { k, tenKho } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    expect(await k.tatMatMa('sai')).toBe(false);
    expect(k.daMaHoa()).toBe(true);
    expect(await k.tatMatMa('mat-ma-123')).toBe(true);
    expect(k.daMaHoa()).toBe(false);
    const raw = (await k.db.getAll('cuoc')) as { tenNNT?: string }[];
    expect(raw[0].tenNNT).toBe('Công ty Bí Mật');
    k.dong();
    const k2 = await moKho({ ten: tenKho, dongHo: gio });
    expect(k2.dangKhoa()).toBe(false);
    expect((await k2.docTatCa()).cuoc).toHaveLength(1);
  });
  it('không đặt mật mã chồng lên mật mã cũ; mật mã ngắn bị từ chối mà dữ liệu không bị hỏng', async () => {
    const { k } = await khoCoDuLieu();
    await expect(k.datMatMa('abc')).rejects.toThrow(/6 ký tự/);
    expect(k.daMaHoa()).toBe(false);
    expect((await k.docTatCa()).cuoc).toHaveLength(1);
    await k.datMatMa('mat-ma-123');
    await expect(k.datMatMa('mat-ma-khac')).rejects.toThrow(/đổi mật mã/);
  });
  it('dữ liệu bị sửa trong IndexedDB bị phát hiện khi đọc', async () => {
    const { k } = await khoCoDuLieu();
    await k.datMatMa('mat-ma-123');
    const r = (await k.db.get('cuoc', 'c1')) as { id: string; iv: string; ct: string };
    await k.db.put('cuoc', { ...r, ct: r.ct.slice(0, -4) + (r.ct.endsWith('AAAA') ? 'BBBB' : 'AAAA') });
    await expect(k.tatCa('cuoc')).rejects.toBeTruthy();
  });
});

describe('Chặn đoán mật mã & khóa tự động', () => {
  it('sai 5 lần → chờ 30 giây, đúng thì xóa bộ đếm', () => {
    const b = new BoChanSai();
    for (let i = 0; i < 4; i++) b.thatBai(1000);
    expect(b.conCho(1000)).toBe(0);
    expect(b.lanSaiHienTai()).toBe(4);
    b.thatBai(1000);
    expect(b.conCho(1000)).toBe(30);
    expect(b.conCho(1000 + 12_000)).toBe(18);
    expect(b.conCho(1000 + 30_000)).toBe(0);
    b.thatBai(40_000);
    b.thanhCong();
    expect(b.lanSaiHienTai()).toBe(0);
  });
  it('khóa sau 5 phút không thao tác; thao tác làm mới', () => {
    const t = new KhoaTuDong(5, 0);
    expect(t.kiemTra(4 * 60_000)).toBe(false);
    t.hoatDong(4 * 60_000);
    expect(t.kiemTra(8 * 60_000)).toBe(false);
    expect(t.kiemTra(9 * 60_000)).toBe(true);
  });
  it('tab ẩn quá 5 phút → khóa khi hiện lại; ẩn ngắn thì không', () => {
    const t = new KhoaTuDong(5, 0);
    t.anTab(60_000);
    expect(t.hienTab(2 * 60_000)).toBe(false);
    t.hoatDong(2 * 60_000);
    t.anTab(2 * 60_000);
    expect(t.hienTab(8 * 60_000)).toBe(true);
  });
  it('đặt 0 phút = không tự khóa', () => {
    const t = new KhoaTuDong(0, 0);
    expect(t.kiemTra(10 * 3600_000)).toBe(false);
    t.anTab(0);
    expect(t.hienTab(10 * 3600_000)).toBe(false);
  });
});
