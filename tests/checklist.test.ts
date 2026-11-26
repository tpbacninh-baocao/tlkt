import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { checklistDu, saoChepViec, sinhChecklist, tienDoChecklist, viecConThieu, type ViecChecklist } from '../src/core/checklist';
import { taoCuocRong, tinhMoc } from '../src/core/vuViec';
import type { CuocKiemTra, SuKien } from '../src/core/kieu';

const lich = lichTronTru();
const sk = (o: Record<string, unknown>, i = 0): SuKien => ({ id: 'sk' + i, taoLuc: `2026-10-01T08:0${i}`, ...o }) as SuKien;

function cuoc(buoc: Record<string, string>, extra: Partial<CuocKiemTra> = {}): CuocKiemTra {
  const c = taoCuocRong({
    id: 'c', ma: 'KT-2026-001', taoLuc: '2026-01-01T00:00', mst: '0100000001', tenNNT: 'Công ty TNHH Mẫu Một',
    truongDoan: 'Nguyễn Văn A', thanhVien: [{ hoTen: 'Trần B', phanViec: 'Thuế GTGT' }], giamSat: ['Lê C'],
    thoiKy: 'năm 2025', noiDung: 'Thuế GTGT, TNDN', ...extra,
  });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}
const sinh = (c: CuocKiemTra, homNay: string, tenChucNang?: Record<string, string>) =>
  sinhChecklist(c, tinhMoc(c, { lich, homNay }), lich, homNay, { tenChucNang });
const maTheoHeThong = (ds: ViecChecklist[]) => ds.filter((d) => !d.hangNgay).map((d) => d.ma);

describe('Sinh việc theo từng mốc (D0 → X)', () => {
  const buoc = { P5: '2026-10-05', Q3: '2026-10-09', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05', X: '2026-11-10' };
  it('chưa có mốc nào → không có việc', () => expect(sinh(cuoc({}), '2026-10-01')).toHaveLength(0));
  it('D0 → 4 việc (TTR_QD, ITNK_QD, ITNK_TV, ITNK_GS)', () => {
    expect(maTheoHeThong(sinh(cuoc({ P5: '2026-10-05' }), '2026-10-06'))).toEqual(['TTR_QD', 'ITNK_QD', 'ITNK_TV', 'ITNK_GS']);
  });
  it('Q3 → ITNK_PC; C → 3 việc; K → 2; B → 1; R → 1', () => {
    expect(maTheoHeThong(sinh(cuoc({ P5: '2026-10-05', Q3: '2026-10-09' }), '2026-10-10'))).toContain('ITNK_PC');
    const c = maTheoHeThong(sinh(cuoc({ P5: '2026-10-05', Q5: '2026-10-12' }), '2026-10-13'));
    expect(c.slice(4)).toEqual(['TTR_CB', 'ITNK_CB', 'TMS_CB']);
    const k = maTheoHeThong(sinh(cuoc({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }), '2026-10-31'));
    expect(k.slice(7)).toEqual(['ITNK_KT', 'TTR_NLV']);
    const b = maTheoHeThong(sinh(cuoc({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03' }), '2026-11-04'));
    expect(b.slice(9)).toEqual(['TTR_BB']);
    const r = maTheoHeThong(sinh(cuoc({ ...buoc, X: undefined as never, B4: '2026-11-05' }), '2026-11-06'));
    expect(r.slice(11)).toEqual(['ITNK_BCKQ']); // 4 (D0) + 1 (Q3) + 3 (C) + 2 (K) + 1 (B)
  });
  it('X (quyết định xử phạt): TTR_QDXL + TMS_QDXL + TMS_NGAYKL + ITNK_DUYET + ITNK_HT; không có TTR_KL', () => {
    const c = cuoc(buoc, { ketQua: { coXuLy: true, truyThu: 1, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 } });
    const ma = maTheoHeThong(sinh(c, '2026-11-11'));
    expect(ma).toHaveLength(4 + 1 + 3 + 2 + 1 + 1 + 5);
    expect(ma.slice(-5)).toEqual(['TTR_QDXL', 'TMS_QDXL', 'TMS_NGAYKL', 'ITNK_DUYET', 'ITNK_HT']);
    expect(ma).not.toContain('TTR_KL');
  });
  it('X (kết luận): TTR_KL thay cho TTR_QDXL', () => {
    const ma = maTheoHeThong(sinh(cuoc(buoc), '2026-11-11'));
    expect(ma).toContain('TTR_KL');
    expect(ma).not.toContain('TTR_QDXL');
    // loaiVanBanXL ghi đè
    const c2 = cuoc(buoc, { ketQua: { coXuLy: false, truyThu: 0, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0, loaiVanBanXL: 'QD_XU_PHAT' } });
    expect(maTheoHeThong(sinh(c2, '2026-11-11'))).toContain('TTR_QDXL');
  });
  it('mốc dự kiến không sinh việc', () => {
    expect(maTheoHeThong(sinh(cuoc({ P5: '2026-10-05' }, { ngayCongBoDuKien: '2026-10-12' }), '2026-10-06'))).not.toContain('TTR_CB');
  });
});

describe('Sinh việc theo sự kiện và nộp tiền', () => {
  const base = { P5: '2026-10-05', Q5: '2026-10-12' };
  it('GIA_HAN → TTR_GH + ITNK_GH; TAM_DUNG → TTR_TD + ITNK_TD; BAI_BO → TTR_HUY + ITNK_HUY', () => {
    const c = cuoc(base);
    c.suKien = [
      sk({ loai: 'GIA_HAN', ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soNgay: 20, soQD: '77/QĐ' }, 0),
      sk({ loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23', soVB: '5/TB' }, 1),
    ];
    const ma = maTheoHeThong(sinh(c, '2026-10-28'));
    for (const m of ['TTR_GH', 'ITNK_GH', 'TTR_TD', 'ITNK_TD']) expect(ma).toContain(m);
    c.suKien.push(sk({ loai: 'HOAN', ngay: '2026-10-08', denNgay: '2026-10-10' }, 2), sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-20', soQD: '9' }, 3), sk({ loai: 'PHU_LUC_BB', ngay: '2026-11-05', noiDung: 'x' }, 4));
    const ma2 = maTheoHeThong(sinh(c, '2026-11-06'));
    for (const m of ['TTR_HOAN', 'TTR_DC', 'ITNK_DC', 'TTR_PLBB']) expect(ma2).toContain(m);
  });
  it('mỗi sự kiện cùng loại sinh một việc riêng, khóa ổn định', () => {
    const c = cuoc(base);
    c.suKien = [sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-20' }, 0), sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-22' }, 1)];
    const ds = sinh(c, '2026-10-23').filter((d) => d.ma === 'TTR_DC');
    expect(ds.map((d) => d.khoa)).toEqual(['TTR_DC#sk0', 'TTR_DC#sk1']);
  });
  it('2 lần nộp tiền → 2 việc TTR_NOP; tích riêng từng lần', () => {
    const c = cuoc({ ...base, X: '2026-11-10' });
    c.nopTien = [
      { id: 'n1', ngay: '2026-11-20', soTien: 1_000_000, daNhapTTR: false },
      { id: 'n2', ngay: '2026-11-27', soTien: 500_000, daNhapTTR: true },
    ];
    const nop = sinh(c, '2026-11-30').filter((d) => d.ma === 'TTR_NOP');
    expect(nop.map((d) => d.khoa)).toEqual(['TTR_NOP#n1', 'TTR_NOP#n2']);
    expect(nop[0].xong).toBe(false);
    expect(nop[1].xong).toBe(true);
    c.checklist['TTR_NOP#n1'] = '2026-11-30';
    expect(sinh(c, '2026-11-30').find((d) => d.khoa === 'TTR_NOP#n1')!.xong).toBe(true);
  });
  it('bãi bỏ: chỉ còn việc hủy; việc khác chưa tích thành không áp dụng', () => {
    const c = cuoc(base);
    c.suKien = [sk({ loai: 'BAI_BO', ngayQD: '2026-10-15', soQD: '10/QĐ', lyDo: 'x' })];
    const ds = sinh(c, '2026-10-16');
    expect(ds.find((d) => d.ma === 'TTR_HUY')!.trangThai).not.toBe('KHONG_AP_DUNG');
    expect(ds.find((d) => d.ma === 'ITNK_HUY')!.trangThai).not.toBe('KHONG_AP_DUNG');
    expect(ds.find((d) => d.ma === 'TTR_QD')!.trangThai).toBe('KHONG_AP_DUNG');
    expect(viecConThieu(ds).map((d) => d.ma).sort()).toEqual(['ITNK_HUY', 'TTR_HUY']);
  });
});

describe('Hạn, trạng thái, tích', () => {
  it('hạn = ngày phát sinh + 1 NLV; quá hạn → QUA_HAN', () => {
    const c = cuoc({ P5: '2026-10-05' });
    const ds = sinh(c, '2026-10-07');
    const v = ds.find((d) => d.ma === 'TTR_QD')!;
    expect(v.han).toBe('2026-10-06');
    expect(v.trangThai).toBe('QUA_HAN');
    expect(sinh(c, '2026-10-05').find((d) => d.ma === 'TTR_QD')!.trangThai).toBe('SAP_DEN');
  });
  it('tích đúng hạn / trễ; tiến độ; checklistDu', () => {
    const c = cuoc({ P5: '2026-10-05' });
    c.checklist = { TTR_QD: '2026-10-06', ITNK_QD: '2026-10-09', ITNK_TV: '2026-10-06', ITNK_GS: '2026-10-06' };
    const ds = sinh(c, '2026-10-10');
    expect(ds.find((d) => d.ma === 'TTR_QD')!.trangThai).toBe('XONG_DUNG_HAN');
    expect(ds.find((d) => d.ma === 'ITNK_QD')!.trangThai).toBe('XONG_TRE');
    expect(tienDoChecklist(ds)).toEqual({ xong: 4, tong: 4 });
    expect(checklistDu(ds)).toBe(true);
    expect(checklistDu(sinh(cuoc({ P5: '2026-10-05' }), '2026-10-10'))).toBe(false);
  });
  it('ITNK_HT bị chặn tích cho đến khi xong ITNK_KT và ITNK_BCKQ', () => {
    const buoc = { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05', X: '2026-11-10' };
    const c = cuoc(buoc);
    let ht = sinh(c, '2026-11-11').find((d) => d.ma === 'ITNK_HT')!;
    expect(ht.chanTick).toMatch(/Cần xong trước/);
    c.checklist = { ITNK_KT: '2026-10-30', ITNK_BCKQ: '2026-11-06' };
    ht = sinh(c, '2026-11-11').find((d) => d.ma === 'ITNK_HT')!;
    expect(ht.chanTick).toBeUndefined();
  });
  it('tên chức năng ghi đè được', () => {
    const ds = sinh(cuoc({ P5: '2026-10-05' }), '2026-10-06', { TTR_QD: 'Nhập QĐ TTKT (bản mới)' });
    expect(ds.find((d) => d.ma === 'TTR_QD')!.chucNang).toBe('Nhập QĐ TTKT (bản mới)');
    expect(ds.find((d) => d.ma === 'ITNK_QD')!.chucNang).toBe('Nhập thông tin quyết định');
  });
});

describe('Nhật ký iTNK hằng ngày', () => {
  it('mỗi ngày làm việc tại DN một việc; ngày đã ghi thì xong', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.nhatKy['2026-10-12'] = { daGhiITNK: true };
    c.ngayKhongLamTaiDN = ['2026-10-14'];
    const nk = sinh(c, '2026-10-16').filter((d) => d.hangNgay);
    expect(nk.map((d) => d.phatSinh)).toEqual(['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16']);
    expect(nk.map((d) => d.trangThai)).toEqual(['XONG_DUNG_HAN', 'QUA_HAN', 'QUA_HAN', 'HOM_NAY']);
    expect(tienDoChecklist(nk.concat())).toEqual({ xong: 0, tong: 0 }); // không tính vào tiến độ nhập liệu
  });
  it('ngừng sau K', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-14' });
    expect(sinh(c, '2026-10-20').filter((d) => d.hangNgay).map((d) => d.phatSinh)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
  });
});

describe('Sao chép thông tin', () => {
  it('TTR_QD: đúng thứ tự trường, định dạng ngày/tên', () => {
    const c = cuoc({ P5: '2026-10-05' });
    c.soQD = '123/QĐ-CT';
    const kq = tinhMoc(c, { lich, homNay: '2026-10-06' });
    const v = sinhChecklist(c, kq, lich, '2026-10-06').find((d) => d.ma === 'TTR_QD')!;
    const txt = saoChepViec(v, c, kq, lich).split('\n');
    expect(txt[0]).toBe('TTR › Thanh tra kiểm tra doanh nghiệp / Nhập Quyết định TTKT');
    expect(txt.slice(1)).toEqual([
      'Mã số thuế: 0100000001',
      'Tên người nộp thuế: Công ty TNHH Mẫu Một',
      'Số quyết định kiểm tra: 123/QĐ-CT',
      'Ngày quyết định: 05/10/2026',
      'Thời kỳ kiểm tra: năm 2025',
      'Nội dung: Thuế GTGT, TNDN',
      'Trưởng đoàn: Nguyễn Văn A',
      'Thành viên đoàn: Trần B (Thuế GTGT)',
    ]);
  });
  it('trường thiếu → “(chưa có)”; việc từ sự kiện lấy dữ liệu sự kiện', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12' });
    c.suKien = [sk({ loai: 'GIA_HAN', ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soNgay: 20, soQD: '77/QĐ' })];
    const kq = tinhMoc(c, { lich, homNay: '2026-10-28' });
    const v = sinhChecklist(c, kq, lich, '2026-10-28').find((d) => d.ma === 'TTR_GH')!;
    const txt = saoChepViec(v, c, kq, lich);
    expect(txt).toContain('Số QĐ gia hạn: 77/QĐ');
    expect(txt).toContain('Ngày QĐ gia hạn: 27/10/2026');
    expect(txt).toContain('Số ngày gia hạn: 20');
    expect(txt).toContain('Số quyết định kiểm tra: (chưa có)');
  });
  it('ITNK_KT: hạn mới và ngày kết thúc; TTR_NOP: số tiền định dạng 1.234.567', () => {
    const c = cuoc({ P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', X: '2026-11-10' });
    c.nopTien = [{ id: 'n1', ngay: '2026-11-20', soTien: 1234567, daNhapTTR: false }];
    const kq = tinhMoc(c, { lich, homNay: '2026-11-21' });
    const ds = sinhChecklist(c, kq, lich, '2026-11-21');
    expect(saoChepViec(ds.find((d) => d.ma === 'ITNK_KT')!, c, kq, lich)).toContain('Ngày kết thúc kiểm tra tại trụ sở: 30/10/2026');
    const nop = saoChepViec(ds.find((d) => d.ma === 'TTR_NOP')!, c, kq, lich);
    expect(nop).toContain('Số tiền nộp: 1.234.567');
    expect(nop).toContain('Ngày nộp: 20/11/2026');
  });
});
