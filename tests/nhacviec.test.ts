import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { caiDatMacDinh } from '../src/core/caiDat';
import { taoCuocRong } from '../src/core/vuViec';
import {
  CANH_BAO_MAC_DINH,
  ganGioYenLang,
  gapDong,
  linkGoogleLich,
  nhanCuoc,
  sinhLichNhac,
  sinhSuKienLich,
  taoICS,
  thoatICS,
  type DuLieuNhac,
} from '../src/core/nhacViec';
import type { CongViec, CuocKiemTra } from '../src/core/kieu';

const lich = lichTronTru();
function cuoc(buoc: Record<string, string>, extra: Partial<CuocKiemTra> = {}): CuocKiemTra {
  const c = taoCuocRong({ id: 'c1', ma: 'KT-2026-001', taoLuc: '2026-01-01T00:00', mst: '0100000001', tenNNT: 'Công ty TNHH Mẫu Một', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}
function dl(cuocs: CuocKiemTra[], homNay = '2026-10-06', extra: Partial<DuLieuNhac> = {}): DuLieuNhac {
  return { homNay, lich, caiDat: caiDatMacDinh(), cuoc: cuocs, viec: [], keHoach: [], ...extra };
}
const theoTienTo = <T extends { khoa: string }>(ds: T[], tt: string): T[] => ds.filter((n) => n.khoa.startsWith(tt));

describe('Lịch nhắc cho một hạn pháp lý (Q1: hạn 08/10, mục tiêu 07/10)', () => {
  const ds = sinhLichNhac(dl([cuoc({ P5: '2026-10-05' })]), '2026-09-01', '2026-10-10');
  const q1 = theoTienTo(ds, 'cuoc:c1:Q1|');
  it('số lượng: T−5, T−2, T−1 ×2, T ×2, ngày hạn pháp lý, quá hạn 1 NLV', () => {
    expect(q1.map((n) => n.khoa.split('|')[1])).toEqual(['T-5', 'T-2', 'T-1a', 'T-1b', 'T0a', 'T0b', 'PL', 'QH@2026-10-09']);
  });
  it('thời điểm và mức độ đúng bảng ARCH §8.1', () => {
    const b = Object.fromEntries(q1.map((n) => [n.khoa.split('|')[1], [n.luc, n.mucDo]]));
    expect(b['T-5']).toEqual(['2026-09-30T08:00', 'THONG_TIN']);
    expect(b['T-2']).toEqual(['2026-10-05T08:00', 'CANH_BAO']);
    expect(b['T-1a']).toEqual(['2026-10-06T08:00', 'KHAN']);
    expect(b['T-1b']).toEqual(['2026-10-06T14:00', 'KHAN']);
    expect(b['T0a']).toEqual(['2026-10-07T07:30', 'BAO_THUC']);
    expect(b['T0b']).toEqual(['2026-10-07T13:30', 'KHAN']);
    expect(b['PL']).toEqual(['2026-10-08T07:30', 'BAO_THUC']);
    expect(b['QH@2026-10-09']).toEqual(['2026-10-09T08:00', 'QUA_HAN']);
  });
  it('bước đã xong thì không nhắc', () => {
    const ds2 = sinhLichNhac(dl([cuoc({ P5: '2026-10-05', Q1: '2026-10-06' })]), '2026-09-01', '2026-10-31');
    expect(theoTienTo(ds2, 'cuoc:c1:Q1|')).toHaveLength(0);
  });
  it('bước dự kiến (tính từ mốc chưa có) không nhắc', () => {
    expect(theoTienTo(ds, 'cuoc:c1:Q3')).toHaveLength(0);
  });
  it('quá hạn: mỗi NLV 08:00, số ngày tăng dần', () => {
    const d2 = sinhLichNhac(dl([cuoc({ P5: '2026-10-05' })]), '2026-10-09', '2026-10-14');
    const qh = theoTienTo(d2, 'cuoc:c1:Q1|QH').map((n) => [n.luc, n.tieuDe.match(/Quá hạn (\d+)/)![1]]);
    expect(qh).toEqual([['2026-10-09T08:00', '1'], ['2026-10-12T08:00', '2'], ['2026-10-13T08:00', '3'], ['2026-10-14T08:00', '4']]);
  });
});

describe('Hạn nội bộ / việc khác', () => {
  it('hạn nội bộ: T−1 08:00 và ngày T 07:30; tên bước dài được cắt', () => {
    const ds = sinhLichNhac(dl([cuoc({ P1: '2026-09-01' })], '2026-09-02'), '2026-09-01', '2026-09-30');
    const p2 = theoTienTo(ds, 'cuoc:c1:P2|');
    expect(p2.map((n) => [n.khoa.split('|')[1], n.luc, n.mucDo])).toEqual([
      ['T-1', '2026-09-14T08:00', 'CANH_BAO'],
      ['T0', '2026-09-15T07:30', 'KHAN'],
      ['QH@2026-09-16', '2026-09-16T08:00', 'QUA_HAN'],
      ['QH@2026-09-17', '2026-09-17T08:00', 'QUA_HAN'],
      ['QH@2026-09-18', '2026-09-18T08:00', 'QUA_HAN'],
      ['QH@2026-09-21', '2026-09-21T08:00', 'QUA_HAN'],
      ['QH@2026-09-22', '2026-09-22T08:00', 'QUA_HAN'],
      ['QH@2026-09-23', '2026-09-23T08:00', 'QUA_HAN'],
      ['QH@2026-09-24', '2026-09-24T08:00', 'QUA_HAN'],
      ['QH@2026-09-25', '2026-09-25T08:00', 'QUA_HAN'],
      ['QH@2026-09-28', '2026-09-28T08:00', 'QUA_HAN'],
      ['QH@2026-09-29', '2026-09-29T08:00', 'QUA_HAN'],
      ['QH@2026-09-30', '2026-09-30T08:00', 'QUA_HAN'],
    ]);
    expect(p2.every((n) => n.tieuDe.length < 160)).toBe(true);
  });
  it('việc ngoài cuộc dùng giờ của việc', () => {
    const v: CongViec = { id: 'v1', tieuDe: 'Nộp báo cáo tháng', nguon: 'THUONG_XUYEN', han: '2026-10-28', gio: '08:00', viecCon: [], taoLuc: 'x', suaLuc: 'x' };
    const ds = sinhLichNhac(dl([], '2026-10-06', { viec: [v] }), '2026-10-20', '2026-10-30');
    expect(theoTienTo(ds, 'viec:v1').map((n) => n.luc)).toEqual(['2026-10-27T08:00', '2026-10-28T08:00', '2026-10-29T08:00', '2026-10-30T08:00']);
    expect(theoTienTo(ds, 'viec:v1').map((n) => n.lienKet)).toEqual(['#viec', '#viec', '#viec', '#viec']);
  });
  it('việc xong/đã xóa không nhắc', () => {
    const v: CongViec = { id: 'v1', tieuDe: 'x', nguon: 'TU_DAT', han: '2026-10-28', viecCon: [], taoLuc: 'x', suaLuc: 'x', xong: '2026-10-20T08:00' };
    expect(sinhLichNhac(dl([], '2026-10-06', { viec: [v] }), '2026-10-01', '2026-10-31').filter((n) => n.khoa.startsWith('viec:'))).toHaveLength(0);
  });
});

describe('Nhật ký iTNK', () => {
  const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
  const ds = (cc: CuocKiemTra) => sinhLichNhac(dl([cc], '2026-10-12'), '2026-10-12', '2026-10-13');
  it('16:30 nhắc; 17:15 báo thức; 07:45 hôm sau', () => {
    const nk = theoTienTo(ds(c), 'cuoc:c1:NK|07|2026-10-12').concat(theoTienTo(ds(c), 'cuoc:c1:NK|16|2026-10-12'), theoTienTo(ds(c), 'cuoc:c1:NK|17|2026-10-12'));
    expect(nk.map((n) => [n.luc, n.mucDo]).sort()).toEqual([
      ['2026-10-12T16:30', 'CANH_BAO'],
      ['2026-10-12T17:15', 'BAO_THUC'],
      ['2026-10-13T07:45', 'KHAN'],
    ]);
  });
  it('đã tích thì không nhắc; ngày không xuống DN không nhắc', () => {
    c.nhatKy['2026-10-12'] = { daGhiITNK: true };
    expect(theoTienTo(ds(c), 'cuoc:c1:NK|16|2026-10-12')).toHaveLength(0);
    const c2 = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' }, { ngayKhongLamTaiDN: ['2026-10-13'] });
    expect(theoTienTo(ds(c2), 'cuoc:c1:NK|16|2026-10-13')).toHaveLength(0);
  });
  it('không nhắc nhật ký cuối tuần', () => {
    const c3 = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    const d = sinhLichNhac(dl([c3], '2026-10-12'), '2026-10-17', '2026-10-18');
    expect(d.filter((n) => n.khoa.includes(':NK|'))).toHaveLength(0);
  });
});

describe('Yêu cầu tài liệu & vướng mắc', () => {
  it('nhắc trước 60 phút và đúng hạn', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.yeuCauTaiLieu = [{ id: 'y1', noiDung: 'Sổ sách', guiLuc: '2026-10-12T15:00' }];
    const ds = sinhLichNhac(dl([c], '2026-10-12'), '2026-10-12', '2026-10-14');
    const y = theoTienTo(ds, 'cuoc:c1:YC:y1');
    expect(y.map((n) => n.luc).sort()).toEqual(['2026-10-13T10:30', '2026-10-13T11:30']);
    c.yeuCauTaiLieu[0].nhanLuc = '2026-10-13T09:00';
    expect(theoTienTo(sinhLichNhac(dl([c], '2026-10-12'), '2026-10-12', '2026-10-14'), 'cuoc:c1:YC')).toHaveLength(0);
  });
  it('chặng vướng mắc đang chạy có nhắc', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.vuongMac = [{ id: 'v1', noiDung: 'Hỏi ý kiến', ngayBaoCao: '2026-10-13', daXong: false }];
    const ds = sinhLichNhac(dl([c], '2026-10-13'), '2026-10-13', '2026-10-16');
    expect(theoTienTo(ds, 'cuoc:c1:VM:v1').map((n) => n.luc)).toContain('2026-10-15T07:30');
  });
});

describe('Nhịp cố định, giờ yên lặng, khóa, ẩn danh', () => {
  it('bản tin sáng 07:15 các ngày làm việc; rà soát tuần thứ Sáu 15:30; kế hoạch tuần thứ Hai 07:30', () => {
    const ds = sinhLichNhac(dl([]), '2026-10-09', '2026-10-13');
    expect(ds.filter((n) => n.khoa.startsWith('nhip:BANTIN')).map((n) => n.luc)).toEqual(['2026-10-09T07:15', '2026-10-12T07:15', '2026-10-13T07:15']);
    expect(ds.find((n) => n.khoa === 'nhip:RSTUAN|2026-10-09')!.luc).toBe('2026-10-09T15:30');
    expect(ds.find((n) => n.khoa === 'nhip:KHTUAN|2026-10-12')!.luc).toBe('2026-10-12T07:30');
  });
  it('kế hoạch năm: từ tháng 10, thứ Hai đầu tháng, cuộc kế hoạch chưa có QĐ', () => {
    const c = cuoc({}, { keHoachId: 'k1', loai: 'KH' });
    const ds = sinhLichNhac(dl([c]), '2026-10-01', '2026-11-10');
    expect(ds.filter((n) => n.khoa.startsWith('nhip:KHNAM')).map((n) => n.luc)).toEqual(['2026-10-05T08:00', '2026-11-02T08:00']);
    expect(sinhLichNhac(dl([cuoc({ P5: '2026-09-01' }, { keHoachId: 'k1' })]), '2026-10-01', '2026-11-10').filter((n) => n.khoa.startsWith('nhip:KHNAM'))).toHaveLength(0);
  });
  it('giờ yên lặng 21:00–06:30: dời sang 06:30; báo thức không dời', () => {
    expect(ganGioYenLang('2026-10-06T22:00', '21:00', '06:30')).toBe('2026-10-07T06:30');
    expect(ganGioYenLang('2026-10-06T05:00', '21:00', '06:30')).toBe('2026-10-06T06:30');
    expect(ganGioYenLang('2026-10-06T07:00', '21:00', '06:30')).toBe('2026-10-06T07:00');
    const v: CongViec = { id: 'v9', tieuDe: 'Họp tối', nguon: 'TU_DAT', han: '2026-10-28', gio: '22:00', viecCon: [], taoLuc: 'x', suaLuc: 'x' };
    const ds = sinhLichNhac(dl([], '2026-10-06', { viec: [v] }), '2026-10-27', '2026-10-29');
    expect(ds.find((n) => n.khoa.includes('|T0|'))!.luc).toBe('2026-10-29T06:30');
    const c = cuoc({ P5: '2026-10-05' });
    const cd = caiDatMacDinh();
    cd.nhac.gioYenLangTu = '07:00';
    cd.nhac.gioYenLangDen = '09:00';
    const q = sinhLichNhac(dl([c], '2026-10-06', { caiDat: cd }), '2026-10-01', '2026-10-10').filter((n) => n.khoa.startsWith('cuoc:c1:Q1|'));
    expect(q.find((n) => n.khoa.includes('T0a'))!.luc).toBe('2026-10-07T07:30'); // BAO_THUC giữ nguyên
    expect(q.find((n) => n.khoa.includes('T-2'))!.luc).toBe('2026-10-05T09:00'); // 08:00 dời sang 09:00
  });
  it('khóa duy nhất, ổn định giữa các lần sinh, đổi khi hạn đổi', () => {
    const d = dl([cuoc({ P5: '2026-10-05' })]);
    const a = sinhLichNhac(d, '2026-09-01', '2026-12-31');
    const b = sinhLichNhac(d, '2026-09-01', '2026-12-31');
    expect(a.map((n) => n.khoa)).toEqual(b.map((n) => n.khoa));
    expect(new Set(a.map((n) => n.khoa)).size).toBe(a.length);
    const doi = sinhLichNhac(dl([cuoc({ P5: '2026-10-06' })]), '2026-09-01', '2026-12-31');
    const kA = new Set(a.filter((n) => n.khoa.startsWith('cuoc:c1:Q1|T-2')).map((n) => n.khoa));
    expect(doi.filter((n) => kA.has(n.khoa))).toHaveLength(0);
  });
  it('sắp xếp theo thời gian', () => {
    const ds = sinhLichNhac(dl([cuoc({ P5: '2026-10-05', Q5: '2026-10-12' })], '2026-10-13'), '2026-10-01', '2026-11-30');
    for (let i = 1; i < ds.length; i++) expect(ds[i - 1].luc <= ds[i].luc).toBe(true);
  });
  it('ẩn danh: “KT …1234 – …”, không lộ tên NNT', () => {
    const cd = caiDatMacDinh();
    cd.anDanh = true;
    const ds = sinhLichNhac(dl([cuoc({ P5: '2026-10-05' })], '2026-10-06', { caiDat: cd }), '2026-10-05', '2026-10-08');
    const t = ds.find((n) => n.khoa.startsWith('cuoc:c1:Q1|T-2'))!;
    expect(t.tieuDe.startsWith('KT …0001 – ')).toBe(true);
    expect(JSON.stringify(ds)).not.toContain('Mẫu Một');
    expect(nhanCuoc({ mst: '0100000001', tenNNT: 'Công ty A' }, false)).toBe('Công ty A (…0001)');
  });
  it('tắt nhắc → không có gì', () => {
    const cd = caiDatMacDinh();
    cd.nhac.bat = false;
    expect(sinhLichNhac(dl([cuoc({ P5: '2026-10-05' })], '2026-10-06', { caiDat: cd }), '2026-10-01', '2026-12-31')).toEqual([]);
  });
  it('cuộc đã xóa mềm không nhắc', () => {
    expect(sinhLichNhac(dl([cuoc({ P5: '2026-10-05' }, { xoaLuc: '2026-10-06T00:00' })]), '2026-10-01', '2026-12-31').filter((n) => n.khoa.startsWith('cuoc:'))).toHaveLength(0);
  });
  it('theo dõi nộp tiền: thứ Hai hằng tuần đến khi nộp đủ; nhắc trước hạn lưu trữ 30 ngày', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05', X: '2026-11-10', S1: '2026-11-13' });
    c.ketQua.truyThu = 10_000_000;
    c.nopTien = [{ id: 'n1', ngay: '2026-11-20', soTien: 4_000_000, daNhapTTR: true }];
    const ds = sinhLichNhac(dl([c], '2026-11-23'), '2026-11-23', '2026-12-08');
    expect(theoTienTo(ds, 'cuoc:c1:S4|TUAN').map((n) => n.luc)).toEqual(['2026-11-23T08:30', '2026-11-30T08:30', '2026-12-07T08:30']);
    expect(theoTienTo(ds, 'cuoc:c1:S4|TUAN')[0].noiDung).toContain('6.000.000');
    c.nopTien.push({ id: 'n2', ngay: '2026-11-21', soTien: 6_000_000, daNhapTTR: false });
    expect(theoTienTo(sinhLichNhac(dl([c], '2026-11-23'), '2026-11-23', '2026-12-08'), 'cuoc:c1:S4|TUAN')).toHaveLength(0);
    const luuTru = sinhLichNhac(dl([c], '2026-11-23'), '2027-10-01', '2027-10-31').find((n) => n.khoa.includes(':S6|TRUOC-30'));
    expect(luuTru!.luc).toBe('2027-10-11T08:00'); // 10/11/2027 − 30 ngày
  });
});

describe('Xuất .ics (RFC 5545)', () => {
  const d = dl([cuoc({ P5: '2026-10-05' }, { tenNNT: 'Công ty TNHH Mẫu Một, chi nhánh; Hà Nội' })]);
  const sk = sinhSuKienLich(d, '2026-10-01', '2026-12-31');
  const ics = taoICS(sk, '2026-10-06T09:00');
  const dong = ics.split('\r\n');
  it('cấu trúc: BEGIN/END cân bằng, kết thúc bằng CRLF, dùng CRLF', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '').includes('\n')).toBe(false);
    const dem = (x: string) => dong.filter((l) => l === x).length;
    expect(dem('BEGIN:VEVENT')).toBe(dem('END:VEVENT'));
    expect(dem('BEGIN:VALARM')).toBe(dem('END:VALARM'));
    expect(dem('BEGIN:VEVENT')).toBe(sk.length);
    expect(dem('BEGIN:VALARM')).toBe(sk.length * 3);
    expect(dem('BEGIN:VCALENDAR')).toBe(1);
  });
  it('mọi dòng ≤ 75 octet; dòng nối tiếp bắt đầu bằng dấu cách', () => {
    const enc = new TextEncoder();
    for (const l of dong) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    const dai = gapDong('DESCRIPTION:' + 'Ă'.repeat(100));
    expect(dai.split('\r\n').length).toBeGreaterThan(1);
    expect(dai.split('\r\n').slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(dai.replace(/\r\n /g, '')).toBe('DESCRIPTION:' + 'Ă'.repeat(100)); // gập rồi nối lại không mất ký tự
  });
  it('escape dấu phẩy, chấm phẩy, gạch chéo, xuống dòng', () => {
    expect(thoatICS('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne');
    const g = dong.join('\n').replace(/\n /g, '');
    expect(g).toContain('Mẫu Một\\, chi nhánh\; Hà Nội');
  });
  it('mỗi hạn: sự kiện 07:30–08:00 ngày hạn mục tiêu, thêm sự kiện HẠN PHÁP LÝ; VALARM -P2D, -P1D, PT0M', () => {
    const q1 = sk.filter((e) => e.uid.startsWith('cuoc-c1-Q1-'));
    expect(q1.map((e) => [e.uid, e.ngay])).toEqual([['cuoc-c1-Q1-MT@tlkt', '2026-10-07'], ['cuoc-c1-Q1-PL@tlkt', '2026-10-08']]);
    expect(q1[1].tieuDe.startsWith('HẠN PHÁP LÝ – ')).toBe(true);
    expect(ics).toContain('DTSTART:20261007T073000');
    expect(ics).toContain('DTEND:20261007T080000');
    expect(CANH_BAO_MAC_DINH).toEqual(['-P2D', '-P1D', 'PT0M']);
    expect(dong.filter((l) => l.startsWith('TRIGGER:')).slice(0, 3)).toEqual(['TRIGGER:-P2D', 'TRIGGER:-P1D', 'TRIGGER:PT0M']);
  });
  it('DTSTAMP là UTC (giờ VN − 7); UID ổn định, duy nhất', () => {
    expect(ics).toContain('DTSTAMP:20261006T020000Z');
    expect(new Set(sk.map((e) => e.uid)).size).toBe(sk.length);
    expect(taoICS(sinhSuKienLich(d, '2026-10-01', '2026-12-31'), '2026-10-06T09:00')).toBe(ics);
  });
  it('lọc theo cửa sổ và theo một cuộc; xuất việc ngoài cuộc', () => {
    const hep = sinhSuKienLich(d, '2026-10-08', '2026-10-08');
    expect(hep.every((e) => e.ngay === '2026-10-08')).toBe(true);
    const hai = dl([cuoc({ P5: '2026-10-05' }), cuoc({ P5: '2026-10-05' }, { id: 'c2', ma: 'KT-2' })]);
    expect(sinhSuKienLich(hai, '2026-10-01', '2026-12-31', 'c2').every((e) => e.uid.startsWith('cuoc-c2-'))).toBe(true);
    const v: CongViec = { id: 'v1', tieuDe: 'Nộp báo cáo', nguon: 'LANH_DAO', han: '2026-10-20', gio: '09:00', soVB: '12/CV', viecCon: [], taoLuc: 'x', suaLuc: 'x' };
    const e = sinhSuKienLich(dl([], '2026-10-06', { viec: [v] }), '2026-10-01', '2026-10-31')[0];
    expect(e).toMatchObject({ uid: 'viec-v1@tlkt', gioTu: '09:00', gioDen: '09:30' });
  });
  it('ẩn danh trong .ics', () => {
    const cd = caiDatMacDinh();
    cd.anDanh = true;
    const s = taoICS(sinhSuKienLich(dl([cuoc({ P5: '2026-10-05' })], '2026-10-06', { caiDat: cd }), '2026-10-01', '2026-12-31'), '2026-10-06T09:00');
    expect(s).not.toContain('Mẫu Một');
    expect(s).toContain('KT …0001');
  });
});

describe('Link Google Lịch', () => {
  it('đúng định dạng TEMPLATE, múi giờ VN, mã hóa tiếng Việt', () => {
    const u = linkGoogleLich({ ngay: '2026-11-06', tieuDe: 'Hạn ký biên bản & gửi', moTa: 'Đ17.3.c' });
    expect(u.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE&')).toBe(true);
    expect(u).toContain('dates=20261106T073000/20261106T080000');
    expect(u).toContain('ctz=Asia%2FHo_Chi_Minh');
    const url = new URL(u);
    expect(url.searchParams.get('text')).toBe('Hạn ký biên bản & gửi');
    expect(url.searchParams.get('details')).toBe('Đ17.3.c');
  });
});
