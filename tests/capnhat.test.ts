import { describe, it, expect } from 'vitest';
import type { SuKien } from '../src/core/kieu';
import { moTaSuKien, xoaSuKienKhoiCuoc, ganSuKienVaoCuoc as ganSK, boTickKhoiCuoc, boXongKhoiCuoc, datNgayKhongLamTaiDN, datNhatKyVaoCuoc, ganXongVaoCuoc, ghiLyDoTreVaoCuoc, nhanBanCuocTho, taoCuocRong, tickVaoCuoc } from '../src/core/vuViec';

const goc = () => taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x' });

describe('Đánh dấu xong / bỏ', () => {
  it('lưu ngày, số văn bản, ghi chú; bỏ chuỗi rỗng; không đổi cuộc gốc', () => {
    const c = goc();
    const m = ganXongVaoCuoc(c, 'Q1', { ngay: '2026-10-08', soVB: ' 12/CV ', ghiChu: '', lyDoTre: '  ' });
    expect(m.buoc.Q1).toEqual({ xong: true, ngay: '2026-10-08', soVB: '12/CV' });
    expect(c.buoc.Q1).toBeUndefined();
  });
  it('D0 lưu số QĐ kiểm tra; X lưu số QĐ xử lý, loại văn bản và có xử lý', () => {
    expect(ganXongVaoCuoc(goc(), 'P5', { ngay: '2026-10-05', soVB: '101/QĐ-CT' }).soQD).toBe('101/QĐ-CT');
    const x = ganXongVaoCuoc(goc(), 'X', { ngay: '2026-11-10', soQDXL: '88/QĐ-XPHC', loaiVanBanXL: 'QD_XU_PHAT', coXuLy: true });
    expect(x.ketQua).toMatchObject({ soQDXL: '88/QĐ-XPHC', loaiVanBanXL: 'QD_XU_PHAT', coXuLy: true });
    expect(ganXongVaoCuoc(goc(), 'X', { ngay: '2026-11-10', soVB: '77' }).ketQua.soQDXL).toBe('77');
  });
  it('bỏ đánh dấu: xóa bước, nhưng giữ lý do trễ đã ghi', () => {
    const c = ganXongVaoCuoc(goc(), 'Q5', { ngay: '2026-10-21', lyDoTre: 'NNT xin lùi' });
    expect(boXongKhoiCuoc(c, 'Q5').buoc.Q5).toEqual({ xong: false, lyDoTre: 'NNT xin lùi' });
    const d = ganXongVaoCuoc(goc(), 'Q1', { ngay: '2026-10-08' });
    expect(boXongKhoiCuoc(d, 'Q1').buoc.Q1).toBeUndefined();
  });
  it('ghi / xóa lý do trễ cho bước chưa xong và đã xong', () => {
    let c = ghiLyDoTreVaoCuoc(goc(), 'Q5', 'Chờ lịch NNT');
    expect(c.buoc.Q5).toEqual({ xong: false, lyDoTre: 'Chờ lịch NNT' });
    c = ghiLyDoTreVaoCuoc(c, 'Q5', '');
    expect(c.buoc.Q5).toBeUndefined();
    c = ganXongVaoCuoc(goc(), 'Q5', { ngay: '2026-10-21' });
    expect(ghiLyDoTreVaoCuoc(c, 'Q5', 'Bổ sung sau').buoc.Q5).toMatchObject({ xong: true, lyDoTre: 'Bổ sung sau' });
  });
});

describe('Tích checklist / nhật ký', () => {
  it('tích và bỏ tích một việc; lần nộp tiền đồng bộ cờ daNhapTTR', () => {
    const c = { ...goc(), nopTien: [{ id: 'n1', ngay: '2026-11-20', soTien: 5, daNhapTTR: false }] };
    const v = { khoa: 'TTR_NOP#n1', phatSinh: '2026-11-20', lanNopId: 'n1' };
    const t = tickVaoCuoc(c, v, '2026-11-21');
    expect(t.checklist['TTR_NOP#n1']).toBe('2026-11-21');
    expect(t.nopTien[0].daNhapTTR).toBe(true);
    const b = boTickKhoiCuoc(t, v);
    expect(b.checklist['TTR_NOP#n1']).toBeUndefined();
    expect(b.nopTien[0].daNhapTTR).toBe(false);
    expect(c.nopTien[0].daNhapTTR).toBe(false);
  });
  it('nhật ký hằng ngày: tích thì ghi vào nhatKy theo ngày phát sinh', () => {
    const v = { khoa: 'ITNK_NK#2026-10-12', phatSinh: '2026-10-12', hangNgay: true };
    const t = tickVaoCuoc(goc(), v, '2026-10-13');
    expect(t.nhatKy['2026-10-12']).toEqual({ daGhiITNK: true });
    expect(Object.keys(t.checklist)).toEqual([]);
    expect(boTickKhoiCuoc(t, v).nhatKy['2026-10-12'].daGhiITNK).toBe(false);
  });
  it('ghi chú nhật ký giữ lại khi đổi trạng thái; ngày không xuống DN', () => {
    let c = datNhatKyVaoCuoc(goc(), '2026-10-12', false, 'Kiểm tra sổ 331');
    c = datNhatKyVaoCuoc(c, '2026-10-12', true);
    expect(c.nhatKy['2026-10-12']).toEqual({ daGhiITNK: true, ghiChu: 'Kiểm tra sổ 331' });
    c = datNgayKhongLamTaiDN(c, '2026-10-14', true);
    c = datNgayKhongLamTaiDN(c, '2026-10-13', true);
    expect(c.ngayKhongLamTaiDN).toEqual(['2026-10-13', '2026-10-14']);
    expect(datNgayKhongLamTaiDN(c, '2026-10-13', false).ngayKhongLamTaiDN).toEqual(['2026-10-14']);
  });
});

describe('Nhân bản cuộc', () => {
  it('giữ NNT/đoàn, xóa tiến trình và dữ liệu phát sinh', () => {
    const c = ganXongVaoCuoc(taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x', mst: '0100109106', tenNNT: 'A', truongDoan: 'T', loai: 'TH', coGDLK: true, thanhVien: [{ hoTen: 'B', phanViec: 'GTGT' }], giamSat: ['G'], hanNgoai: '2026-12-01', vanBanGiao: 'CV1', soQD: '1/QĐ' }), 'P5', { ngay: '2026-10-05', soVB: '1/QĐ' });
    c.suKien = [{ id: 's', taoLuc: 'x', loai: 'BAI_BO' }];
    c.nopTien = [{ id: 'n', ngay: '2026-11-01', soTien: 1, daNhapTTR: true }];
    c.checklist = { TTR_QD: '2026-10-06' };
    const b = nhanBanCuocTho(c, 'moi', 'KT-2', '2026-11-23T08:00');
    expect(b).toMatchObject({ id: 'moi', ma: 'KT-2', mst: '0100109106', tenNNT: 'A', truongDoan: 'T', loai: 'TH', coGDLK: true, giamSat: ['G'] });
    expect(b.thanhVien).toEqual([{ hoTen: 'B', phanViec: 'GTGT' }]);
    expect(b.thanhVien[0]).not.toBe(c.thanhVien[0]);
    expect(b.buoc).toEqual({});
    expect([b.suKien, b.nopTien]).toEqual([[], []]);
    expect(b.checklist).toEqual({});
    expect(b.soQD).toBeUndefined();
    expect(b.hanNgoai).toBeUndefined();
    expect(b.vanBanGiao).toBeUndefined();
    expect(b.taoLuc).toBe('2026-11-23T08:00');
  });
});


describe('Sự kiện trong cuộc', () => {
  const sk = (o: Record<string, unknown>): SuKien => ({ id: 's1', taoLuc: '2026-10-20T08:00', ...o }) as SuKien;
  it('thêm, thay theo id, xóa; giữ thứ tự theo thời gian tạo', () => {
    let c = taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x' });
    c = ganSK(c, sk({ loai: 'GIAI_TRINH', ngay: '2026-11-05' }));
    c = ganSK(c, sk({ id: 's0', taoLuc: '2026-10-19T08:00', loai: 'TOI_PHAM', ngayPhatHien: '2026-10-19' }));
    expect(c.suKien.map((s) => s.id)).toEqual(['s0', 's1']);
    c = ganSK(c, sk({ loai: 'GIAI_TRINH', ngay: '2026-11-06' }));
    expect(c.suKien).toHaveLength(2);
    expect(c.suKien[1].ngay).toBe('2026-11-06');
    expect(xoaSuKienKhoiCuoc(c, 's0').suKien.map((s) => s.id)).toEqual(['s1']);
  });
  it('cùng phút: giữ đúng thứ tự thêm, và sửa không làm nhảy vị trí', () => {
    let c = taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x' });
    for (const id of ['z', 'a', 'm']) c = ganSK(c, sk({ id, loai: 'GIAI_TRINH', ngay: '2026-11-05' }));
    expect(c.suKien.map((s) => s.id)).toEqual(['z', 'a', 'm']);
    c = ganSK(c, sk({ id: 'a', loai: 'GIAI_TRINH', ngay: '2026-11-09' }));
    expect(c.suKien.map((s) => s.id)).toEqual(['z', 'a', 'm']);
    expect(c.suKien[1].ngay).toBe('2026-11-09');
  });
  it('điều chỉnh QĐ cập nhật đoàn/nội dung/thời kỳ và nhớ giá trị cũ, kể cả khi sửa lại', () => {
    let c = taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x', truongDoan: 'A', noiDung: 'GTGT', thoiKy: '2025' });
    c = ganSK(c, sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-20', truongDoanMoi: 'B', noiDungMoi: 'GTGT, TNDN' }));
    expect(c).toMatchObject({ truongDoan: 'B', noiDung: 'GTGT, TNDN', thoiKy: '2025' });
    expect(c.suKien[0].truoc).toEqual({ truongDoan: 'A', noiDung: 'GTGT' });
    c = ganSK(c, sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-21', truongDoanMoi: 'C', noiDungMoi: 'GTGT, TNDN' }));
    expect(c.truongDoan).toBe('C');
    expect(c.suKien[0].truoc).toEqual({ truongDoan: 'A', noiDung: 'GTGT' }); // vẫn là giá trị ban đầu
  });
  it('không điền “mới” thì không đổi gì và không có `truoc`', () => {
    const c = ganSK(taoCuocRong({ id: 'c', ma: 'KT-1', taoLuc: 'x', truongDoan: 'A' }), sk({ loai: 'DIEU_CHINH', ngayQD: '2026-10-20', truongDoanMoi: '  ' }));
    expect(c.truongDoan).toBe('A');
    expect(c.suKien[0].truoc).toBeUndefined();
  });
  it('mô tả ngắn từng loại', () => {
    expect(moTaSuKien(sk({ loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23', lyDo: 'NNT báo bận' }))).toBe('Tạm dừng 19/10/2026 – 23/10/2026 (5 ngày) · NNT báo bận');
    expect(moTaSuKien(sk({ loai: 'GIA_HAN', soNgay: 20, ngayDeNghi: '2026-10-26', ngayQD: '2026-10-27', soQD: '77' }))).toBe('Gia hạn 20 ngày · đề nghị 26/10/2026 · QĐ số 77 ngày 27/10/2026');
    expect(moTaSuKien(sk({ loai: 'HOAN', ngay: '2026-10-10', denNgay: '2026-10-27', soVB: '5', lyDo: 'x' }))).toBe('Hoãn từ 10/10/2026 đến 27/10/2026 · TB số 5 · x');
    expect(moTaSuKien(sk({ loai: 'TOI_PHAM', ngayPhatHien: '2026-10-20', noiDung: 'Hóa đơn khống' }))).toBe('Dấu hiệu tội phạm phát hiện 20/10/2026 · Hóa đơn khống');
    for (const l of ['DIEU_CHINH', 'BAI_BO', 'GIAI_TRINH', 'PHUC_TAP', 'KHONG_NHAN_QD', 'TAM_GIU_TL', 'PHU_LUC_BB'] as const) {
      expect(moTaSuKien(sk({ loai: l, ngay: '2026-10-20', ngayQD: '2026-10-20' })).length).toBeGreaterThan(5);
    }
  });
});
