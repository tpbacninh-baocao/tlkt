import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { taoCuocRong } from '../src/core/vuViec';
import { locCuoc, namCuaCuoc, thongKeKeHoach, type DuLieuKeHoach } from '../src/core/keHoach';
import type { CuocKiemTra, KeHoach } from '../src/core/kieu';

const lich = lichTronTru();
const kh: KeHoach = { id: 'k1', nam: 2026, loai: 'KH_NAM', ten: 'Kế hoạch 2026', chiTieuSoCuoc: 8, ngayPheDuyet: '2026-01-05', ngayCongKhai: '2026-01-20' };

function cuoc(id: string, buoc: Record<string, string>, extra: Partial<CuocKiemTra> = {}): CuocKiemTra {
  const c = taoCuocRong({ id, ma: 'KT-' + id, taoLuc: '2026-01-10T00:00', keHoachId: 'k1', loai: 'KH', truongDoan: 'Nguyễn Văn A', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}

// 6 cuộc: chưa QĐ (tháng dự kiến 05/2026) · đã QĐ · đã công bố · đã K · có X (tháng 6) · bãi bỏ · thêm 1 có X tháng 9 với tiền
const dsCuoc: CuocKiemTra[] = [
  cuoc('1', {}, { thangDuKien: '2026-05' }),
  cuoc('2', { P5: '2026-03-10' }),
  cuoc('3', { P5: '2026-03-12', Q5: '2026-03-20' }),
  cuoc('4', { P5: '2026-04-01', Q5: '2026-04-10', T7: '2026-04-28' }),
  cuoc('5', { P5: '2026-02-02', Q5: '2026-02-09', T7: '2026-02-25', B1: '2026-03-02', B4: '2026-03-04', X: '2026-06-10' }, { ketQua: { coXuLy: true, truyThu: 1_000_000, phat: 200_000, chamNop: 50_000, giamKhauTru: 300_000, giamLo: 400_000, thuHoiHoan: 0 }, nopTien: [{ id: 'n', ngay: '2026-06-30', soTien: 500_000, daNhapTTR: true }] }),
  cuoc('6', { P5: '2026-03-01' }, { suKien: [{ id: 'b', taoLuc: 'x', loai: 'BAI_BO', ngayQD: '2026-03-05' }] }),
  cuoc('7', { P5: '2026-05-04', Q5: '2026-05-12', T7: '2026-05-28', B1: '2026-06-02', B4: '2026-06-04', X: '2026-09-09' }, { ketQua: { coXuLy: true, truyThu: 2_000_000, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 100_000, thuHoiHoan: 0 } }),
];
const dl = (homNay: string, extra: Partial<DuLieuKeHoach> = {}): DuLieuKeHoach => ({ homNay, lich, cuoc: dsCuoc, keHoach: [kh], ...extra });

describe('Thống kê kế hoạch năm', () => {
  const tk = thongKeKeHoach(dl('2026-09-15'), { nam: 2026 });
  it('chỉ tiêu và số lượng theo từng bước', () => {
    expect(tk.chiTieu).toBe(8);
    expect(tk.soCuoc).toBe(7);
    expect(tk.daBanHanhQD).toBe(5); // cuộc 2,3,4,5,7 (cuộc 6 bãi bỏ không tính)
    expect(tk.daCongBo).toBe(4);
    expect(tk.daKetThucTaiDN).toBe(3);
    expect(tk.daCoQDXuLy).toBe(2);
    expect(tk.baiBo).toBe(1);
    expect(tk.tonChuyenNamSau).toBe(4); // cuộc 1,2,3,4 chưa có X (cuộc bãi bỏ không tính)
  });
  it('đếm theo giai đoạn: tổng bằng số cuộc', () => {
    expect(Object.values(tk.theoGiaiDoan).reduce((a, b) => a + b, 0)).toBe(7);
    expect(tk.theoGiaiDoan).toMatchObject({ CHUAN_BI: 1, CHO_CONG_BO: 1, DANG_KIEM_TRA: 1, BIEN_BAN: 1, SAU_QD: 2, BAI_BO: 1 });
  });
  it('tổng tiền và còn phải nộp', () => {
    expect(tk.tien).toMatchObject({ truyThu: 3_000_000, phat: 200_000, chamNop: 50_000, giamKhauTru: 300_000, giamLo: 500_000, phaiNop: 3_250_000, daNop: 500_000, conPhaiNop: 2_750_000 });
  });
  it('tích lũy theo tháng: đường thực tế dừng ở tháng hiện tại; đường lý tưởng tuyến tính', () => {
    expect(tk.tichLuyThang).toHaveLength(12);
    expect(tk.tichLuyThang[0].thucTe).toBe(0);
    expect(tk.tichLuyThang[5].thucTe).toBe(1); // hết tháng 6: cuộc 5
    expect(tk.tichLuyThang[8].thucTe).toBe(2); // hết tháng 9: cuộc 5, 7
    expect(tk.tichLuyThang[9].thucTe).toBeUndefined();
    expect(tk.tichLuyThang[2].banHanhQD).toBe(3); // hết tháng 3: cuộc 5 (02/02), 2 (10/03), 3 (12/03); cuộc 6 bãi bỏ không tính
    expect(tk.tichLuyThang[5].lyTuong).toBe(4);
    expect(tk.tichLuyThang[11].lyTuong).toBe(8);
  });
});

describe('Cảnh báo', () => {
  it('quá tháng dự kiến mà chưa có QĐ', () => {
    const tk = thongKeKeHoach(dl('2026-06-15'), { nam: 2026 });
    const cb = tk.canhBao.find((c) => c.ma === 'QUA_THANG_DU_KIEN')!;
    expect(cb.cuocIds).toEqual(['1']);
    expect(thongKeKeHoach(dl('2026-05-15'), { nam: 2026 }).canhBao.some((c) => c.ma === 'QUA_THANG_DU_KIEN')).toBe(false);
  });
  it('từ tháng 10: cuộc chưa kiểm tra → cân nhắc chuyển năm sau; tháng 11 khẩn', () => {
    const t9 = thongKeKeHoach(dl('2026-09-30'), { nam: 2026 });
    expect(t9.canhBao.some((c) => c.ma === 'CUOI_NAM')).toBe(false);
    const t10 = thongKeKeHoach(dl('2026-10-05'), { nam: 2026 }).canhBao.find((c) => c.ma === 'CUOI_NAM')!;
    expect(t10.noiDung).toBe('2 cuộc chưa kiểm tra – cân nhắc chuyển sang đầu năm sau (Đ15.5.e).');
    expect(t10.cuocIds).toEqual(['1', '2']);
    expect(t10.muc).toBe('CANH_BAO');
    expect(thongKeKeHoach(dl('2026-11-05'), { nam: 2026 }).canhBao.find((c) => c.ma === 'CUOI_NAM')!.muc).toBe('KHAN');
  });
  it('hạn công khai kế hoạch 30 ngày; chuyên đề phát sinh báo cáo 15 ngày', () => {
    const chua: KeHoach = { id: 'k2', nam: 2026, loai: 'CD_PHAT_SINH', ten: 'Chuyên đề Y', ngayPheDuyet: '2026-09-01' };
    const tk = thongKeKeHoach(dl('2026-09-29', { keHoach: [kh, chua] }), { nam: 2026, keHoachId: 'k2' });
    const cb = tk.canhBao.filter((c) => c.keHoachId === 'k2');
    expect(cb.map((c) => c.ma).sort()).toEqual(['BAO_CAO_CHUYEN_DE', 'CONG_KHAI_KE_HOACH']);
    expect(cb.find((c) => c.ma === 'BAO_CAO_CHUYEN_DE')!.noiDung).toContain('đã quá hạn'); // hạn 16/09
    expect(cb.find((c) => c.ma === 'CONG_KHAI_KE_HOACH')!.noiDung).toContain('hạn 01/10/2026'); // 01/09 + 30 = 01/10
    // đã công khai → hết cảnh báo
    const xong: KeHoach = { ...chua, ngayCongKhai: '2026-09-10', ngayBaoCaoCapTren: '2026-09-10' };
    expect(thongKeKeHoach(dl('2026-09-29', { keHoach: [kh, xong] }), { nam: 2026, keHoachId: 'k2' }).canhBao).toHaveLength(0);
  });
  it('vượt chỉ tiêu', () => {
    const nho: KeHoach = { ...kh, chiTieuSoCuoc: 5 };
    expect(thongKeKeHoach(dl('2026-09-15', { keHoach: [nho] }), { nam: 2026 }).canhBao.some((c) => c.ma === 'VUOT_CHI_TIEU')).toBe(true);
  });
});

describe('Bộ lọc', () => {
  it('theo năm, theo kế hoạch, theo trưởng đoàn; không tính cuộc đã xóa', () => {
    expect(locCuoc(dl('2026-09-15'), { nam: 2026 })).toHaveLength(7);
    expect(locCuoc(dl('2026-09-15'), { nam: 2027 })).toHaveLength(0);
    expect(locCuoc(dl('2026-09-15'), { nam: 2026, keHoachId: 'khong-co' })).toHaveLength(0);
    expect(locCuoc(dl('2026-09-15'), { nam: 2026, truongDoan: 'Người khác' })).toHaveLength(0);
    const xoa = [...dsCuoc, cuoc('8', {}, { xoaLuc: '2026-09-01T00:00' })];
    expect(locCuoc(dl('2026-09-15', { cuoc: xoa }), { nam: 2026 })).toHaveLength(7);
  });
  it('cuộc không thuộc kế hoạch tính theo năm ban hành QĐ', () => {
    const c = cuoc('9', { P5: '2027-01-05' }, { keHoachId: undefined, loai: 'VP' });
    expect(namCuaCuoc(c, [kh])).toBe(2027);
    expect(namCuaCuoc(cuoc('10', {}, { keHoachId: undefined }), [kh])).toBe(2026);
  });
  it('không có chỉ tiêu → chỉ tiêu = số cuộc', () => {
    const khKhong: KeHoach = { ...kh, chiTieuSoCuoc: undefined };
    expect(thongKeKeHoach(dl('2026-09-15', { keHoach: [khKhong] }), { nam: 2026 }).chiTieu).toBe(7);
  });
  it('năm đã qua: đủ 12 tháng thực tế', () => {
    const tk = thongKeKeHoach(dl('2027-02-01'), { nam: 2026 });
    expect(tk.tichLuyThang[11].thucTe).toBe(2);
    expect(tk.tichLuyThang.every((t) => t.thucTe !== undefined)).toBe(true);
  });
});
