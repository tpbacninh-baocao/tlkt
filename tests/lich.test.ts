import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';
import {
  congGioLV,
  congNLV,
  congNgay,
  congNgayKhongLui,
  congThang,
  demNLV,
  dinhDangNgay,
  dinhDangNgayThu,
  dinhDangSo,
  docNgayVN,
  laNgayLamViec,
  lui,
  lichTronTru,
  phutLamViecGiua,
  taoLich,
  tenNgayNghi,
  thuTrongTuan,
} from '../src/core/lich';

const l = lichTronTru();

describe('Ngày cơ bản', () => {
  it('thứ trong tuần đúng (05/10/2026 là thứ Hai)', () => {
    expect(thuTrongTuan('2026-10-05')).toBe(1);
    expect(thuTrongTuan('2026-11-01')).toBe(0);
    expect(thuTrongTuan('2024-02-29')).toBe(4);
  });
  it('định dạng tiếng Việt', () => {
    expect(dinhDangNgay('2026-11-02')).toBe('02/11/2026');
    expect(dinhDangNgayThu('2026-11-23')).toBe('Thứ Hai 23/11/2026');
    expect(dinhDangSo(1234567)).toBe('1.234.567');
    expect(dinhDangSo(-999)).toBe('-999');
    expect(docNgayVN('5/1/2027')).toBe('2027-01-05');
    expect(docNgayVN('31/02/2027')).toBeNull();
  });
});

describe('laNgayLamViec', () => {
  it('thứ Bảy/Chủ nhật nghỉ, ngày lễ nghỉ, làm bù đi làm', () => {
    const lich = taoLich({
      ngayNghiCoDinh: [{ ngayThang: '09-02', ten: 'Quốc khánh' }],
      ngayNghiThem: ['2026-10-07'],
      ngayLamBu: ['2026-10-10'],
    });
    expect(laNgayLamViec(lich, '2026-10-05')).toBe(true);
    expect(laNgayLamViec(lich, '2026-10-03')).toBe(false);
    expect(laNgayLamViec(lich, '2026-10-07')).toBe(false);
    expect(laNgayLamViec(lich, '2026-10-10')).toBe(true); // thứ Bảy làm bù
    expect(laNgayLamViec(lich, '2027-09-02')).toBe(false); // lễ cố định (thứ Năm)
    expect(tenNgayNghi(lich, '2026-09-02')).toBe('Quốc khánh');
  });
});

describe('congNLV', () => {
  it('đi tới: ngày sự kiện không tính', () => {
    expect(congNLV(l, '2026-10-05', 3)).toBe('2026-10-08');
    expect(congNLV(l, '2026-10-05', 10)).toBe('2026-10-19');
    expect(congNLV(l, '2026-10-05', 0)).toBe('2026-10-05');
  });
  it('đi tới từ ngày nghỉ', () => {
    expect(congNLV(l, '2026-10-10', 1)).toBe('2026-10-12'); // thứ Bảy → thứ Hai
    expect(congNLV(l, '2026-10-10', 2)).toBe('2026-10-13');
  });
  it('đi lùi', () => {
    expect(congNLV(l, '2026-11-02', -3)).toBe('2026-10-28'); // A05
    expect(congNLV(l, '2026-10-12', -1)).toBe('2026-10-09');
  });
  it('qua biên năm có ngày nghỉ (H01)', () => {
    const lich = taoLich({ ngayNghiThem: ['2027-01-01'] });
    expect(congNLV(lich, '2026-12-30', 7)).toBe('2027-01-11');
    expect(congNLV(lich, '2026-12-30', 2)).toBe('2027-01-04');
  });
});

describe('congNgay / lui / congNgayKhongLui', () => {
  it('lùi từ Chủ nhật sang thứ Hai', () => {
    expect(lui(l, '2026-11-01')).toBe('2026-11-02');
    expect(lui(l, '2026-11-02')).toBe('2026-11-02');
    expect(congNgay(l, '2026-10-12', 20)).toBe('2026-11-02');
    expect(congNgayKhongLui(l, '2026-10-12', 20)).toBe('2026-11-01');
  });
  it('ngày làm bù thì không phải lùi', () => {
    const lich = taoLich({ ngayLamBu: ['2026-11-01'] });
    expect(lui(lich, '2026-11-01')).toBe('2026-11-01');
  });
  it('lùi qua nhiều ngày nghỉ liên tiếp', () => {
    const lich = taoLich({ ngayNghiThem: ['2026-11-02', '2026-11-03'] });
    expect(lui(lich, '2026-11-01')).toBe('2026-11-04');
  });
});

describe('congThang', () => {
  it('cùng ngày tháng sau, lùi nếu rơi ngày nghỉ', () => {
    expect(congThang(l, '2026-11-03', 1)).toBe('2026-12-03');
    expect(congThang(l, '2026-11-03', 2)).toBe('2027-01-04'); // 03/01/2027 là Chủ nhật (A15)
    expect(congThang(l, '2026-11-10', 12)).toBe('2027-11-10'); // A17
  });
  it('tháng không có ngày đó → ngày cuối tháng', () => {
    expect(congThang(l, '2027-01-31', 1)).toBe('2027-03-01'); // 28/02/2027 là Chủ nhật → 01/03
    expect(congThang(l, '2024-01-31', 1)).toBe('2024-02-29'); // năm nhuận, thứ Năm
  });
  it('29/02 cộng 12 tháng', () => {
    expect(congThang(l, '2024-02-29', 12)).toBe('2025-02-28');
  });
  it('trừ tháng', () => {
    expect(congThang(l, '2026-03-31', -1)).toBe('2026-03-02'); // 28/02/2026 là thứ Bảy → ngày làm việc kế tiếp
    expect(congThang(l, '2026-04-15', -1)).toBe('2026-03-16'); // 15/03/2026 là Chủ nhật
  });
});

describe('demNLV', () => {
  it('đếm ngày làm việc trong (a, b]', () => {
    expect(demNLV(l, '2026-10-05', '2026-10-09')).toBe(4);
    expect(demNLV(l, '2026-10-09', '2026-10-12')).toBe(1);
    expect(demNLV(l, '2026-10-05', '2026-10-05')).toBe(0);
  });
  it('âm khi b < a', () => {
    expect(demNLV(l, '2026-10-09', '2026-10-05')).toBe(-4);
  });
});

describe('Chế độ thận trọng', () => {
  const t = lichTronTru(true);
  it('ngày sự kiện được tính là ngày 1 với NLV', () => {
    expect(congNLV(t, '2026-10-05', 3)).toBe('2026-10-07');
    expect(congNLV(t, '2026-10-10', 1)).toBe('2026-10-12'); // ngày sự kiện là ngày nghỉ: tính bình thường
  });
  it('không lùi qua ngày nghỉ', () => {
    expect(lui(t, '2026-11-01')).toBe('2026-11-01');
    expect(congNgay(t, '2026-10-12', 20)).toBe('2026-10-31');
  });
  it('tháng: trừ một ngày, không lùi', () => {
    expect(congThang(t, '2026-11-03', 1)).toBe('2026-12-02');
  });
});

describe('Giờ làm việc – nhóm W trong kich-ban-han.json', () => {
  const nhomW = kichBan.nhom.find((n) => n.ten.startsWith('Đồng hồ giờ làm việc'))!;
  for (const ca of nhomW.ca as { id: string; moTa: string; dauVao: { luc: string }; gioLamViec: number; ketQua: string }[]) {
    it(`${ca.id}: ${ca.moTa}`, () => {
      expect(congGioLV(l, ca.dauVao.luc, ca.gioLamViec)).toBe(ca.ketQua);
    });
  }
  it('kết thúc đúng cuối khung thì không nhảy sang khung sau', () => {
    expect(congGioLV(l, '2026-10-12T07:30', 4)).toBe('2026-10-12T11:30');
  });
  it('bắt đầu ngoài giờ (thứ Bảy) → từ đầu khung thứ Hai', () => {
    expect(congGioLV(l, '2026-10-17T10:00', 1)).toBe('2026-10-19T08:30');
  });
  it('qua ngày nghỉ lễ', () => {
    const lich = taoLich({ ngayNghiThem: ['2026-10-13'] });
    expect(congGioLV(lich, '2026-10-12T16:00', 2)).toBe('2026-10-14T08:30');
  });
  it('đếm phút làm việc giữa hai thời điểm', () => {
    expect(phutLamViecGiua(l, '2026-10-12T10:30', '2026-10-12T13:30')).toBe(60 + 30);
    expect(phutLamViecGiua(l, '2026-10-16T16:00', '2026-10-19T08:30')).toBe(60 + 60);
    expect(phutLamViecGiua(l, '2026-10-12T15:00', '2026-10-13T11:30')).toBe(360);
  });
});
