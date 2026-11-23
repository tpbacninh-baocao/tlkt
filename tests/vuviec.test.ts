import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import {
  kiemTraBoDanhDau,
  kiemTraDanhDauBuoc,
  kiemTraSuKien,
  laNgayTaiDN,
  lyDoKhongChoPhep,
  mucSLA,
  ngayThuMayTaiDN,
  taoCuocRong,
  tienDoGiaiDoan,
  tinhDiem,
  tinhGiaiDoan,
  tinhMoc,
  timMoc,
  viecSongSong,
  viecTiepTheo,
  xemTruocSuKien,
  diemUuTienMoc,
} from '../src/core/vuViec';
import type { CuocKiemTra, GiaiDoan, LoaiSuKien, SuKien } from '../src/core/kieu';

const lich = lichTronTru();
const sk = (o: Record<string, unknown>, i = 0): SuKien => ({ id: 's' + i, taoLuc: `2026-10-01T08:0${i}`, ...o }) as SuKien;

function cuoc(buoc: Record<string, string>, extra: Partial<CuocKiemTra> = {}): CuocKiemTra {
  const c = taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: '2026-01-01T00:00', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}
const nc = (homNay: string) => ({ lich, homNay });
const tinh = (c: CuocKiemTra, homNay = '2026-12-31') => tinhMoc(c, nc(homNay));

describe('Giai đoạn (đủ 9)', () => {
  const ca: [GiaiDoan, Record<string, string>, Partial<CuocKiemTra>?][] = [
    ['CHUAN_BI', {}],
    ['CHO_CONG_BO', { P5: '2026-10-05' }],
    ['DANG_KIEM_TRA', { P5: '2026-10-05', Q5: '2026-10-12' }],
    ['BIEN_BAN', { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }],
    ['CHO_QD_XU_LY', { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05' }],
    ['SAU_QD', { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05', X: '2026-11-10' }],
    ['THEO_DOI_NOP_TIEN', { X: '2026-11-10', S1: '2026-11-13', S5: '2026-11-12' }, { ketQua: { coXuLy: true, truyThu: 5, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 } }],
    ['HOAN_THANH', { X: '2026-11-10', S1: '2026-11-13', S5: '2026-11-12' }],
    ['HOAN_THANH', { X: '2026-11-10', S1: '2026-11-13', S5: '2026-11-12', S4: '2026-11-20' }, { ketQua: { coXuLy: true, truyThu: 5, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 } }],
  ];
  for (const [gd, buoc, extra] of ca) {
    it(gd + (extra ? ' (có nợ)' : ''), () => {
      const c = cuoc(buoc, extra);
      expect(tinhGiaiDoan(c, tinh(c))).toBe(gd);
    });
  }
  it('BAI_BO ưu tiên cao nhất', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.suKien = [sk({ loai: 'BAI_BO', ngayQD: '2026-10-14', lyDo: 'x' })];
    expect(tinhGiaiDoan(c, tinh(c))).toBe('BAI_BO');
  });
  it('tiến độ giai đoạn', () => {
    expect(tienDoGiaiDoan('DANG_KIEM_TRA')).toEqual({ daQua: 3, tong: 8 });
  });
});

describe('Ràng buộc đánh dấu bước', () => {
  const ktra = (buoc: Record<string, string>, ma: string, ngay: string, homNay = '2026-12-31', lyDo?: string) => {
    const c = cuoc(buoc);
    return kiemTraDanhDauBuoc(c, tinh(c, homNay), ma, ngay, homNay, lyDo);
  };
  it('C khi chưa có D0 → chặn', () => {
    const r = ktra({}, 'Q5', '2026-10-12');
    expect(r.hopLe).toBe(false);
    expect(r.loi[0]).toMatch(/QĐ kiểm tra/);
  });
  it('K khi chưa có C → chặn', () => expect(ktra({ P5: '2026-10-05' }, 'T7', '2026-10-30').hopLe).toBe(false));
  it('B khi chưa có K → chặn', () => expect(ktra({ P5: '2026-10-05', Q5: '2026-10-12' }, 'B1', '2026-11-03').hopLe).toBe(false));
  it('R khi chưa có B → chặn', () => expect(ktra({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }, 'B4', '2026-11-05').hopLe).toBe(false));
  it('X khi chưa có B → chặn', () => expect(ktra({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }, 'X', '2026-11-10').hopLe).toBe(false));
  it('X có B nhưng chưa có B5 → cảnh báo mềm, vẫn hợp lệ', () => {
    const r = ktra({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05' }, 'X', '2026-11-10', '2026-11-10');
    expect(r.hopLe).toBe(true);
    expect(r.canhBao.join(' ')).toMatch(/B5/);
  });
  it('ngày phải ≥ mốc trước', () => {
    const r = ktra({ P5: '2026-10-05' }, 'Q5', '2026-10-02');
    expect(r.hopLe).toBe(false);
    expect(r.loi.join(' ')).toMatch(/05\/10\/2026/);
  });
  it('ngày không được sau mốc sau đã có (sửa C muộn hơn K)', () => {
    const r = ktra({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }, 'Q5', '2026-11-02');
    expect(r.hopLe).toBe(false);
  });
  it('sau hạn pháp lý → bắt buộc lý do trễ', () => {
    // Q5 hạn 19/10 → nhập 21/10
    const thieu = ktra({ P5: '2026-10-05' }, 'Q5', '2026-10-21');
    expect(thieu.canLyDoTre).toBe(true);
    expect(thieu.hopLe).toBe(false);
    expect(thieu.loi).toContain('Bắt buộc ghi lý do trễ.');
    const du = ktra({ P5: '2026-10-05' }, 'Q5', '2026-10-21', '2026-12-31', 'NNT xin lùi lịch');
    expect(du.hopLe).toBe(true);
    expect(ktra({ P5: '2026-10-05' }, 'Q5', '2026-10-19').canLyDoTre).toBe(false);
  });
  it('bước nội bộ không bắt buộc lý do trễ', () => {
    const r = ktra({ P1: '2026-09-01' }, 'P2', '2026-12-01');
    expect(r.canLyDoTre).toBe(false);
    expect(r.hopLe).toBe(true);
  });
  it('ngày tương lai → cảnh báo; ngày sai định dạng → lỗi', () => {
    expect(ktra({ P5: '2026-10-05' }, 'Q5', '2026-10-12', '2026-10-06').canhBao.join(' ')).toMatch(/tương lai/);
    expect(ktra({ P5: '2026-10-05' }, 'Q5', '12/10/2026').hopLe).toBe(false);
  });
  it('cuộc bãi bỏ → chặn', () => {
    const c = cuoc({ P5: '2026-10-05' });
    c.suKien = [sk({ loai: 'BAI_BO' })];
    expect(kiemTraDanhDauBuoc(c, tinh(c), 'Q1', '2026-10-07', '2026-10-08').hopLe).toBe(false);
  });
  it('bỏ đánh dấu bị chặn khi bước sau còn xong', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    expect(kiemTraBoDanhDau(c, 'P5').hopLe).toBe(false);
    expect(kiemTraBoDanhDau(c, 'Q5').hopLe).toBe(true);
  });
});

describe('Ràng buộc sự kiện', () => {
  const base = { P5: '2026-10-05', Q5: '2026-10-12' };
  const ktra = (c: CuocKiemTra, e: Record<string, unknown>, homNay = '2026-10-20') =>
    kiemTraSuKien(c, tinh(c, homNay), e as { loai: LoaiSuKien }, nc(homNay));
  it('hoãn chỉ trước khi công bố', () => {
    expect(lyDoKhongChoPhep(cuoc({ P5: '2026-10-05' }), 'HOAN')).toBeUndefined();
    expect(lyDoKhongChoPhep(cuoc(base), 'HOAN')).toMatch(/trước khi công bố/);
    expect(lyDoKhongChoPhep(cuoc({}), 'HOAN')).toMatch(/Chưa có QĐ/);
  });
  it('tạm dừng/gia hạn chỉ trong khoảng C–K', () => {
    expect(lyDoKhongChoPhep(cuoc({ P5: '2026-10-05' }), 'GIA_HAN')).toMatch(/đang kiểm tra tại DN/);
    expect(lyDoKhongChoPhep(cuoc(base), 'GIA_HAN')).toBeUndefined();
    expect(lyDoKhongChoPhep(cuoc({ ...base, T7: '2026-10-30' }), 'TAM_DUNG')).toMatch(/đã kết thúc/);
  });
  it('gia hạn chỉ 1 lần', () => {
    const c = cuoc(base);
    c.suKien = [sk({ loai: 'GIA_HAN', ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soNgay: 20 })];
    expect(lyDoKhongChoPhep(c, 'GIA_HAN')).toBe('Chỉ được gia hạn 1 lần');
    expect(lyDoKhongChoPhep(c, 'GIA_HAN', 's0')).toBeUndefined(); // đang sửa chính nó
  });
  it('gia hạn: số ngày ≤ 20 (GDLK ≤ 40)', () => {
    const e = { loai: 'GIA_HAN', ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soNgay: 21 };
    expect(ktra(cuoc(base), e).loi.join(' ')).toMatch(/tối đa 20/);
    expect(ktra(cuoc(base), { ...e, soNgay: 20 }).hopLe).toBe(true);
    expect(ktra(cuoc(base, { coGDLK: true }), { ...e, soNgay: 40 }).hopLe).toBe(true);
    expect(ktra(cuoc(base, { coGDLK: true }), { ...e, soNgay: 41 }).hopLe).toBe(false);
    expect(ktra(cuoc(base), { ...e, soNgay: 0 }).hopLe).toBe(false);
  });
  it('gia hạn: cảnh báo đề nghị muộn so với hạn T3 (28/10)', () => {
    const e = { loai: 'GIA_HAN', ngayDeNghi: '2026-10-30', ngayQD: '2026-10-30', soNgay: 10 };
    const r = ktra(cuoc(base), e, '2026-10-30');
    expect(r.hopLe).toBe(true);
    expect(r.canhBao[0]).toMatch(/28\/10\/2026.*30\/10\/2026.*muộn/);
    expect(ktra(cuoc(base), { ...e, ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27' }, '2026-10-26').canhBao).toHaveLength(0);
  });
  it('gia hạn: đề nghị sau E → lỗi', () => {
    const r = ktra(cuoc(base), { loai: 'GIA_HAN', ngayDeNghi: '2026-11-05', ngayQD: '2026-11-05', soNgay: 5 }, '2026-11-05');
    expect(r.hopLe).toBe(false);
  });
  it('tạm dừng: trong C–K, không chồng nhau', () => {
    const c = cuoc(base);
    expect(ktra(c, { loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23', lyDo: 'x' }).hopLe).toBe(true);
    expect(ktra(c, { loai: 'TAM_DUNG', tuNgay: '2026-10-10', denNgay: '2026-10-13', lyDo: 'x' }).hopLe).toBe(false); // trước C
    expect(ktra(c, { loai: 'TAM_DUNG', tuNgay: '2026-10-20', denNgay: '2026-10-19', lyDo: 'x' }).hopLe).toBe(false);
    c.suKien = [sk({ loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23', lyDo: 'x' })];
    expect(ktra(c, { loai: 'TAM_DUNG', tuNgay: '2026-10-22', denNgay: '2026-10-26', lyDo: 'x' }).loi.join(' ')).toMatch(/Trùng/);
  });
  it('hoãn: hết hoãn phải sau ngày hoãn; thiếu lý do → lỗi', () => {
    const c = cuoc({ P5: '2026-10-05' });
    expect(ktra(c, { loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-27', lyDo: 'NNT bận' }, '2026-10-10').hopLe).toBe(true);
    expect(ktra(c, { loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-10', lyDo: 'x' }, '2026-10-10').hopLe).toBe(false);
    expect(ktra(c, { loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-27' }, '2026-10-10').hopLe).toBe(false);
  });
  it('vụ việc phức tạp bắt buộc lý do; chỉ sau K', () => {
    const c = cuoc({ ...base, T7: '2026-10-30' });
    expect(ktra(c, { loai: 'PHUC_TAP', ngay: '2026-11-04', lyDo: '  ' }).hopLe).toBe(false);
    expect(ktra(c, { loai: 'PHUC_TAP', ngay: '2026-11-04', lyDo: 'Nhiều tình tiết' }).hopLe).toBe(true);
    expect(lyDoKhongChoPhep(cuoc(base), 'PHUC_TAP')).toBeTruthy();
  });
  it('bãi bỏ: không khi đã có X; sau bãi bỏ mọi sự kiện bị chặn', () => {
    expect(lyDoKhongChoPhep(cuoc({ P5: '2026-10-05', X: '2026-11-10' }), 'BAI_BO')).toBeTruthy();
    const c = cuoc(base);
    c.suKien = [sk({ loai: 'BAI_BO' })];
    expect(lyDoKhongChoPhep(c, 'TOI_PHAM')).toBe('Cuộc đã bị bãi bỏ');
  });
  it('xem trước: gia hạn đổi E từ 02/11 thành 23/11, kéo theo T3/T7…', () => {
    const c = cuoc(base);
    const ds = xemTruocSuKien(c, sk({ loai: 'GIA_HAN', ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soNgay: 20 }), nc('2026-10-26'));
    const t1 = ds.find((d) => d.ma === 'T1')!;
    expect(t1).toMatchObject({ truoc: '2026-11-02', sau: '2026-11-23' });
    expect(ds.find((d) => d.ma === 'T3')).toMatchObject({ truoc: '2026-10-28', sau: '2026-11-18' });
    expect(ds.find((d) => d.ma === 'Q1')).toBeUndefined();
  });
});

describe('Việc tiếp theo', () => {
  it('bước đầu tiên chưa xong, áp dụng được', () => {
    const c = cuoc({ P5: '2026-10-05' });
    expect(viecTiepTheo(c, tinh(c, '2026-10-06'))!.ma).toBe('Q1');
    c.buoc.Q1 = { xong: true, ngay: '2026-10-07' };
    expect(viecTiepTheo(c, tinh(c, '2026-10-08'))!.ma).toBe('Q2');
  });
  it('bỏ qua bước nội bộ của giai đoạn đã qua (P2–P4 khi đã có D0)', () => {
    const c = cuoc({ P1: '2026-09-01', P5: '2026-10-05' });
    expect(viecTiepTheo(c, tinh(c, '2026-10-06'))!.giaiDoan).not.toBe('CHUAN_BI');
  });
  it('cuộc mới: P2; sau khi xong hết đến D0', () => {
    const c = cuoc({ P1: '2026-09-01' });
    expect(viecTiepTheo(c, tinh(c, '2026-09-02'))!.ma).toBe('P2');
  });
  it('B2 chỉ là việc tiếp theo khi điều kiện thỏa', () => {
    const c = cuoc({ P5: '2026-10-05', Q1: '2026-10-07', Q2: '2026-10-08', Q3: '2026-10-09', Q4: '2026-10-09', Q5: '2026-10-12', T5: '2026-10-28', T6: '2026-10-29', T7: '2026-10-30' });
    expect(viecTiepTheo(c, tinh(c, '2026-11-02'))!.ma).toBe('B1');
    expect(viecTiepTheo(c, tinh(c, '2026-11-09'))!.ma).toBe('B1'); // B1 vẫn đứng trước B2
  });
  it('mục song song: yêu cầu tài liệu, vướng mắc, nhật ký hôm nay', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.yeuCauTaiLieu = [{ id: 'y1', noiDung: 'Sổ sách', guiLuc: '2026-10-13T09:00' }];
    c.vuongMac = [{ id: 'v1', noiDung: 'Hỏi ý kiến', ngayBaoCao: '2026-10-14', daXong: false }];
    const kq = tinh(c, '2026-10-14');
    const ds = viecSongSong(c, kq, lich, '2026-10-14');
    expect(ds.map((d) => d.loai).sort()).toEqual(['NHAT_KY', 'VUONG_MAC', 'YEU_CAU_TAI_LIEU']);
    c.nhatKy['2026-10-14'] = { daGhiITNK: true };
    expect(viecSongSong(c, kq, lich, '2026-10-14').some((d) => d.loai === 'NHAT_KY')).toBe(false);
  });
  it('ngày tại DN: loại trừ cuối tuần, tạm dừng, ngày không xuống DN', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.suKien = [sk({ loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23' })];
    c.ngayKhongLamTaiDN = ['2026-10-14'];
    const kq = tinh(c, '2026-10-26');
    expect(laNgayTaiDN(c, kq, lich, '2026-10-12')).toBe(true);
    expect(laNgayTaiDN(c, kq, lich, '2026-10-14')).toBe(false);
    expect(laNgayTaiDN(c, kq, lich, '2026-10-17')).toBe(false);
    expect(laNgayTaiDN(c, kq, lich, '2026-10-21')).toBe(false);
    expect(laNgayTaiDN(c, kq, lich, '2026-10-26')).toBe(true);
    expect(ngayThuMayTaiDN(c, kq, lich, '2026-10-26')).toBe(5); // 12, 13, 15, 16 (14 nghỉ; 19–23 tạm dừng) và 26
  });
});

describe('SLA 4 trạng thái + xong', () => {
  const q = (buoc: Record<string, string>, homNay: string, ma = 'Q5') => timMoc(tinh(cuoc(buoc), homNay), ma)!;
  it('🟢 còn lâu / 🟡 sắp đến / 🟠 hôm nay-ngày mai / 🔴 quá hạn / ⚫ chưa giải trình', () => {
    const b = { P5: '2026-10-05' }; // hạn Q5 19/10
    expect(mucSLA(q(b, '2026-10-06'))).toBe('CON_LAU');
    expect(mucSLA(q(b, '2026-10-14'))).toBe('SAP_DEN'); // 3 NLV
    expect(mucSLA(q(b, '2026-10-15'))).toBe('SAP_DEN'); // còn 2 NLV (16, 19)
    expect(mucSLA(q(b, '2026-10-16'))).toBe('HOM_NAY_NGAY_MAI'); // còn 1 NLV = ngày mai làm việc
    expect(mucSLA(q(b, '2026-10-19'))).toBe('HOM_NAY_NGAY_MAI');
    expect(mucSLA(q(b, '2026-10-21'))).toBe('QUA_HAN_CHUA_GIAI_TRINH');
  });
  it('quá hạn đã có lý do → 🔴', () => {
    const c = cuoc({ P5: '2026-10-05' });
    c.buoc.Q5 = { xong: false, lyDoTre: 'NNT bận' };
    expect(mucSLA(timMoc(tinh(c, '2026-10-21'), 'Q5')!)).toBe('QUA_HAN');
  });
  it('✅ xong đúng hạn / ☑️ xong trễ / dự kiến', () => {
    expect(mucSLA(q({ P5: '2026-10-05', Q5: '2026-10-19' }, '2026-10-20'))).toBe('XONG_DUNG_HAN');
    expect(mucSLA(q({ P5: '2026-10-05', Q5: '2026-10-21' }, '2026-10-22'))).toBe('XONG_TRE');
    expect(mucSLA(q({ P5: '2026-10-05', Q5: '2026-10-12' }, '2026-10-13', 'B1'))).toBe('DU_KIEN');
  });
});

describe('Điểm ưu tiên', () => {
  it('công thức (10 − min(10, NLV)) × hệ số + cộng', () => {
    expect(tinhDiem({ nlvConLai: 2, heSo: 3 })).toBe(24);
    expect(tinhDiem({ nlvConLai: 2, heSo: 1.5 })).toBe(12);
    expect(tinhDiem({ nlvConLai: 2, heSo: 1 })).toBe(8);
    expect(tinhDiem({ nlvConLai: 20, heSo: 3 })).toBe(0);
    expect(tinhDiem({ nlvConLai: -2, heSo: 3, quaHan: true })).toBe(12 * 3 + 20);
    expect(tinhDiem({ nlvConLai: 5, heSo: 3, cong: 2 })).toBe(17);
    expect(tinhDiem({ nlvConLai: 20, heSo: 3, ghim: true })).toBe(1000);
  });
  it('cộng điểm: văn bản giao, loại TH, vướng mắc mở', () => {
    const c = cuoc({ P5: '2026-10-05' }, { loai: 'TH', vanBanGiao: 'CV 123' });
    c.vuongMac = [{ id: 'v', noiDung: 'x', ngayBaoCao: '2026-10-06', daXong: false }];
    const kq = tinh(c, '2026-10-06');
    const m = timMoc(kq, 'Q1')!; // hạn 08/10 → 2 NLV
    const co = diemUuTienMoc(m, c, lich, '2026-10-06');
    const khong = diemUuTienMoc(m, cuoc({ P5: '2026-10-05' }), lich, '2026-10-06');
    expect(co - khong).toBe(5);
    expect(khong).toBe((10 - 2) * 3);
  });
});
