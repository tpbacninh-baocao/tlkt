import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';
import {
  chonBoQuyTac,
  chonCheDoX,
  datVaBuoc,
  datVaThamSo,
  giaiBoQuyTac,
  khoiPhucMacDinh,
  laBoChuyenTiep,
  layBuoc,
  tinhE,
  tinhHan,
  tinhHanMucTieu,
  tongNgayTamDung,
  type BangMoc,
} from '../src/core/quyTac';
import { lichTronTru, taoLich } from '../src/core/lich';
import type { SuKien } from '../src/core/kieu';

const lich = lichTronTru();
const sk = (o: Record<string, unknown>, i = 0): SuKien => ({ id: 's' + i, taoLuc: `2026-10-0${i + 1}T08:00`, ...o }) as SuKien;
const moc = (o: Record<string, string>): BangMoc =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { ngay: v, duKien: false }]));

describe('Chọn bộ quy tắc theo ngày QĐ (nhóm R)', () => {
  const nhom = kichBan.nhom.find((n) => n.ten.startsWith('Chọn bộ quy tắc'))!;
  for (const ca of nhom.ca as any[]) {
    it(`${ca.id}: ${ca.moTa}`, () => {
      const bo = chonBoQuyTac(ca.dauVao.D0, '2026-11-23');
      if (ca.boQuyTacMongDoi) expect(bo.ma).toBe(ca.boQuyTacMongDoi);
      if (ca.buoc) {
        const b = layBuoc(bo, ca.buoc)!;
        const kq = tinhHan(b.han, moc(ca.dauVao as Record<string, string>), {
          lich,
          bo,
          coGDLK: false,
          suKien: (ca.dauVao.suKien ?? []).map((s: any, i: number) => sk(s, i)),
        });
        expect(kq.han).toBe(ca.ketQua);
      }
    });
  }
});

describe('Gộp kế thừa', () => {
  it('QTKT-970 kế thừa 1161 và chỉ ghi đè T1', () => {
    const b970 = giaiBoQuyTac('QTKT-970');
    const b1161 = giaiBoQuyTac('QTKT-1161');
    expect(laBoChuyenTiep(b970)).toBe(true);
    expect(laBoChuyenTiep(b1161)).toBe(false);
    expect(b970.buoc.length).toBe(b1161.buoc.length);
    expect(layBuoc(b970, 'T1')!.han!.donVi).toBe('NLV');
    expect(layBuoc(b970, 'T1')!.han!.soNeuGDLK).toBeUndefined(); // han thay nguyên khối, không dính 40
    expect(layBuoc(b970, 'Q1')!.han!.so).toBe(3);
    expect(layBuoc(b1161, 'T1')!.han!.donVi).toBe('N');
  });
  it('mốc ranh giới: 30/06/2026 → 970; 01/07/2026 → 1161', () => {
    expect(chonBoQuyTac('2026-06-30', '2026-11-23').ma).toBe('QTKT-970');
    expect(chonBoQuyTac('2026-07-01', '2026-11-23').ma).toBe('QTKT-1161');
  });
  it('chưa có D0 → dùng ngày hôm nay; ghi đè theo cuộc', () => {
    expect(chonBoQuyTac(undefined, '2026-11-23').ma).toBe('QTKT-1161');
    expect(chonBoQuyTac(undefined, '2026-11-23', 'QTKT-970').ma).toBe('QTKT-970');
  });
});

describe('Bản vá người dùng', () => {
  it('đổi số ngày Q1 rồi khôi phục mặc định', () => {
    let va = datVaBuoc({}, 'QTKT-1161', 'Q1', { so: 5 });
    const bo = giaiBoQuyTac('QTKT-1161', va);
    expect(tinhHan(layBuoc(bo, 'Q1')!.han, moc({ D0: '2026-10-05' }), { lich, bo, coGDLK: false, suKien: [] }).han).toBe('2026-10-12');
    va = khoiPhucMacDinh(va, 'QTKT-1161', 'Q1');
    const bo2 = giaiBoQuyTac('QTKT-1161', va);
    expect(layBuoc(bo2, 'Q1')!.han!.so).toBe(3);
    expect(Object.keys(va['QTKT-1161']?.buoc ?? {})).toHaveLength(0);
  });
  it('bản vá bộ cha chảy xuống bộ con; không sửa dữ liệu gốc', () => {
    const va = datVaBuoc({}, 'QTKT-1161', 'B1', { so: 6 });
    expect(layBuoc(giaiBoQuyTac('QTKT-970', va), 'B1')!.han!.so).toBe(6);
    expect(layBuoc(giaiBoQuyTac('QTKT-1161'), 'B1')!.han!.so).toBe(5);
  });
  it('đổi tham số hạn nộp tiền và chế độ X', () => {
    const va = datVaThamSo(datVaBuoc({}, 'QTKT-1161', 'Q1', { dem: 0 }), 'QTKT-1161', 'hanNopTienNgay', 15);
    const bo = giaiBoQuyTac('QTKT-1161', va);
    expect(bo.thamSo.hanNopTienNgay).toBe(15);
    const kq = tinhHan(layBuoc(bo, 'S4')!.han, moc({ NGAY_GIAO_QD: '2026-11-02' }), { lich, bo, coGDLK: false, suKien: [] });
    expect(kq.han).toBe('2026-11-17');
    expect(khoiPhucMacDinh(va, 'QTKT-1161')).toEqual({});
  });
});

describe('Thuật toán E', () => {
  const bo = giaiBoQuyTac('QTKT-1161');
  const t1 = layBuoc(bo, 'T1')!.han!;
  it('E rơi Chủ nhật → thứ Hai; GDLK 40 ngày', () => {
    expect(tinhE(t1, '2026-10-12', { lich, coGDLK: false, suKien: [] })).toBe('2026-11-02');
    expect(tinhE(t1, '2026-10-12', { lich, coGDLK: true, suKien: [] })).toBe('2026-11-23');
  });
  it('tạm dừng + gia hạn: chỉ lùi một lần ở cuối', () => {
    const td = sk({ loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23' });
    const gh = sk({ loai: 'GIA_HAN', soNgay: 20 }, 1);
    expect(tongNgayTamDung([td])).toBe(5);
    expect(tinhE(t1, '2026-10-12', { lich, coGDLK: false, suKien: [td] })).toBe('2026-11-06');
    expect(tinhE(t1, '2026-10-12', { lich, coGDLK: false, suKien: [gh] })).toBe('2026-11-23');
    // 01/11 + 5 + 20 = 26/11 (thứ Năm)
    expect(tinhE(t1, '2026-10-12', { lich, coGDLK: false, suKien: [td, gh] })).toBe('2026-11-26');
  });
});

describe('tinhHan – các dạng đặc tả', () => {
  const bo = giaiBoQuyTac('QTKT-1161');
  const nc = { lich, bo, coGDLK: false, suKien: [] as SuKien[] };
  it('thiếu mốc gốc → báo thiếu mốc', () => {
    const kq = tinhHan(layBuoc(bo, 'B1')!.han, {}, nc);
    expect(kq.han).toBeUndefined();
    expect(kq.thieuMoc).toBe('K');
  });
  it('mốc dự kiến → hạn gắn cờ dự kiến', () => {
    const kq = tinhHan(layBuoc(bo, 'B1')!.han, { K: { ngay: '2026-10-30', duKien: true } }, nc);
    expect(kq.han).toBe('2026-11-06');
    expect(kq.duKien).toBe(true);
  });
  it('vaTruoc: Q2 = min(D0+5 NLV, C)', () => {
    const q2 = layBuoc(bo, 'Q2')!.han;
    expect(tinhHan(q2, moc({ D0: '2026-10-05' }), nc).han).toBe('2026-10-12');
    expect(tinhHan(q2, moc({ D0: '2026-10-05', C: '2026-10-09' }), nc).han).toBe('2026-10-09');
  });
  it('truoc: Q3 = C; T5 mặc định theo E khi chưa có K', () => {
    expect(tinhHan(layBuoc(bo, 'Q3')!.han, moc({ C: '2026-10-12' }), nc).han).toBe('2026-10-12');
    expect(tinhHan(layBuoc(bo, 'T5')!.han, moc({ E: '2026-11-02' }), nc).han).toBe('2026-11-02');
    expect(tinhHan(layBuoc(bo, 'T5')!.han, moc({ E: '2026-11-02', K: '2026-10-30' }), nc).han).toBe('2026-10-30');
  });
  it('hoãn thay thế hạn công bố', () => {
    const q5 = layBuoc(bo, 'Q5')!.han;
    const hoan = sk({ loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-27' });
    expect(tinhHan(q5, moc({ D0: '2026-10-05' }), { ...nc, suKien: [hoan] }).han).toBe('2026-10-27');
  });
  it('T3 lùi 3 NLV từ E; hạn nộp tiền thamSo; lưu trữ 12 tháng', () => {
    expect(tinhHan(layBuoc(bo, 'T3')!.han, moc({ E: '2026-11-02' }), nc).han).toBe('2026-10-28');
    expect(tinhHan(layBuoc(bo, 'S4')!.han, moc({ NGAY_GIAO_QD: '2026-11-13' }), nc).han).toBe('2026-11-23');
    expect(tinhHan(layBuoc(bo, 'S6')!.han, moc({ X: '2026-11-10' }), nc).han).toBe('2027-11-10');
  });
  it('chế độ X theo sự kiện', () => {
    expect(chonCheDoX([], true)).toBe('X1');
    expect(chonCheDoX([], false)).toBe('X4');
    expect(chonCheDoX([sk({ loai: 'GIAI_TRINH' })], false)).toBe('X2');
    expect(chonCheDoX([sk({ loai: 'GIAI_TRINH' }), sk({ loai: 'PHUC_TAP' }, 1)], true)).toBe('X3');
  });
  it('hạn mục tiêu = hạn pháp lý − đệm NLV', () => {
    expect(tinhHanMucTieu(lich, '2026-11-02', 1)).toBe('2026-10-30');
    expect(tinhHanMucTieu(lich, '2026-11-02', 0)).toBe('2026-11-02');
  });
  it('ngày nghỉ làm đổi hạn', () => {
    const l2 = taoLich({ ngayNghiThem: ['2026-10-06'] });
    expect(tinhHan(layBuoc(bo, 'Q1')!.han, moc({ D0: '2026-10-05' }), { ...nc, lich: l2 }).han).toBe('2026-10-09');
  });
});
