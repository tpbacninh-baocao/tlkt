import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';
import { lichTronTru, taoLich } from '../src/core/lich';
import { giaiBoQuyTac } from '../src/core/quyTac';
import { changDangChay, dongHoVuongMac, dongHoYeuCau, hanYeuCauTaiLieu, nlvConLaiChang } from '../src/core/vuViec';
import { hanCuaKeHoach, thoiHieuKiemTraLai } from '../src/core/keHoach';
import type { KeHoach, VuongMac } from '../src/core/kieu';

const lich = lichTronTru();
const bo = giaiBoQuyTac('QTKT-1161');

describe('Đồng hồ yêu cầu tài liệu 06 giờ LV', () => {
  const nhomW = kichBan.nhom.find((n) => n.ten.startsWith('Đồng hồ giờ làm việc'))!;
  for (const ca of nhomW.ca as any[]) {
    it(`${ca.id}: ${ca.moTa}`, () => {
      expect(hanYeuCauTaiLieu(lich, bo, { guiLuc: ca.dauVao.luc })).toBe(ca.ketQua);
    });
  }
  const y = { id: 'y', noiDung: 'Sổ sách', guiLuc: '2026-10-12T15:00' }; // hạn 13/10 11:30
  it('còn hạn / sắp hết (≤ 60 phút) / quá hạn', () => {
    const a = dongHoYeuCau(lich, bo, y, '2026-10-12T16:00');
    expect(a.trangThai).toBe('CON_HAN');
    expect(a.conLaiPhut).toBe(60 + 240); // 1h tới 17:00 + 4h sáng hôm sau
    expect(a.nhan).toBe('Còn 5 giờ LV');
    const b = dongHoYeuCau(lich, bo, y, '2026-10-13T10:45');
    expect(b.trangThai).toBe('SAP_HET');
    expect(b.nhan).toBe('Còn 45 phút LV');
    const c = dongHoYeuCau(lich, bo, y, '2026-10-13T14:00'); // quá 11:30 → 13:00–14:00 = 60 phút LV
    expect(c.trangThai).toBe('QUA_HAN');
    expect(c.nhan).toBe('Quá hạn 1 giờ làm việc');
    expect(c.goiY).toMatch(/biên bản VPHC/);
  });
  it('đã nhận: đúng hạn / trễ', () => {
    expect(dongHoYeuCau(lich, bo, { ...y, nhanLuc: '2026-10-13T09:00' }, '2026-10-14T09:00').trangThai).toBe('DA_NHAN_DUNG_HAN');
    expect(dongHoYeuCau(lich, bo, { ...y, nhanLuc: '2026-10-13T15:00' }, '2026-10-14T09:00').trangThai).toBe('DA_NHAN_TRE');
  });
  it('gửi vào cuối tuần: tính từ đầu tuần sau', () => {
    expect(hanYeuCauTaiLieu(lich, bo, { guiLuc: '2026-10-17T10:00' })).toBe('2026-10-19T15:00'); // thứ Bảy → T2 07:30: 4h sáng + 2h chiều (từ 13:00)
  });
  it('ngày nghỉ lễ làm lệch hạn', () => {
    const l2 = taoLich({ ngayNghiThem: ['2026-10-13'] });
    expect(hanYeuCauTaiLieu(l2, bo, { guiLuc: '2026-10-12T15:00' })).toBe('2026-10-14T11:30');
  });
});

describe('Đồng hồ vướng mắc (3 chặng × 02 NLV)', () => {
  const v: VuongMac = { id: 'v', noiDung: 'Hỏi ý kiến về chi phí', ngayBaoCao: '2026-10-12', daXong: false };
  it('chặng 1 chạy từ ngày báo cáo: hạn +2 NLV', () => {
    const c = dongHoVuongMac(lich, bo, v, '2026-10-13');
    expect(c[0]).toMatchObject({ tu: '2026-10-12', han: '2026-10-14', trangThai: 'SAP_DEN' });
    expect(c[1].tu).toBeUndefined();
    expect(changDangChay(c)!.ma).toBe('VUONG_MAC_LANH_DAO');
    expect(nlvConLaiChang(lich, c[0], '2026-10-13')).toBe(1);
  });
  it('quá hạn chặng 1; xong đúng hạn chuyển sang chặng 2', () => {
    expect(dongHoVuongMac(lich, bo, v, '2026-10-15')[0].trangThai).toBe('QUA_HAN');
    const v2 = { ...v, ngayLanhDaoBaoCao: '2026-10-14' };
    const c = dongHoVuongMac(lich, bo, v2, '2026-10-15');
    expect(c[0].trangThai).toBe('XONG_DUNG_HAN');
    expect(c[1]).toMatchObject({ tu: '2026-10-14', han: '2026-10-16' });
    expect(changDangChay(c)!.ma).toBe('VUONG_MAC_LAY_Y_KIEN');
  });
  it('chặng trễ → XONG_TRE; chặng 3 sau khi nhận ý kiến', () => {
    const v3 = { ...v, ngayLanhDaoBaoCao: '2026-10-16', ngayNhanYKien: '2026-10-21' };
    const c = dongHoVuongMac(lich, bo, v3, '2026-10-22');
    expect(c[0].trangThai).toBe('XONG_TRE'); // hạn 14/10, xong 16/10
    expect(c[1]).toMatchObject({ han: '2026-10-20', trangThai: 'XONG_TRE' });
    expect(c[2]).toMatchObject({ tu: '2026-10-21', han: '2026-10-23' });
    expect(changDangChay(c)!.ma).toBe('VUONG_MAC_TONG_HOP');
  });
  it('đã xong toàn bộ', () => {
    const c = dongHoVuongMac(lich, bo, { ...v, ngayLanhDaoBaoCao: '2026-10-13', ngayNhanYKien: '2026-10-14', ngayTongHop: '2026-10-15', daXong: true }, '2026-10-20');
    expect(c.every((x) => x.trangThai.startsWith('XONG'))).toBe(true);
    expect(changDangChay(c)).toBeUndefined();
  });
});

describe('Hạn kế hoạch và thời hiệu', () => {
  const kh: KeHoach = { id: 'k', nam: 2026, loai: 'CD_PHAT_SINH', ten: 'Chuyên đề X', ngayPheDuyet: '2026-10-05', ngayTongKet: '2026-12-01' };
  it('công khai kế hoạch ≤ 30 ngày; báo cáo chuyên đề phát sinh 15 ngày', () => {
    const ds = hanCuaKeHoach(lich, bo, kh, '2026-10-06');
    expect(ds.find((d) => d.ma === 'CONG_KHAI_KE_HOACH')!.han).toBe('2026-11-04');
    expect(ds.find((d) => d.ma === 'BAO_CAO_CHUYEN_DE_PHAT_SINH')!.han).toBe('2026-10-20');
    expect(ds.find((d) => d.ma === 'BAO_CAO_KET_THUC_CHUYEN_DE')!.han).toBe('2026-12-22'); // 15 NLV từ 01/12
  });
  it('trạng thái: đã công khai đúng hạn / quá hạn', () => {
    const a = hanCuaKeHoach(lich, bo, { ...kh, ngayCongKhai: '2026-10-20' }, '2026-11-10').find((d) => d.ma === 'CONG_KHAI_KE_HOACH')!;
    expect(a.trangThai).toBe('XONG_DUNG_HAN');
    const b = hanCuaKeHoach(lich, bo, kh, '2026-11-10').find((d) => d.ma === 'CONG_KHAI_KE_HOACH')!;
    expect(b.trangThai).toBe('QUA_HAN');
  });
  it('kế hoạch năm thường không có hạn chuyên đề phát sinh', () => {
    const ds = hanCuaKeHoach(lich, bo, { ...kh, loai: 'KH_NAM' }, '2026-10-06');
    expect(ds.map((d) => d.ma)).toEqual(['CONG_KHAI_KE_HOACH']);
  });
  it('thiếu ngày phê duyệt → chưa có hạn', () => {
    expect(hanCuaKeHoach(lich, bo, { id: 'k', nam: 2026, loai: 'KH_NAM', ten: 'x' }, '2026-10-06')[0].han).toBeUndefined();
  });
  it('thời hiệu kiểm tra lại = 24 tháng', () => {
    const t = thoiHieuKiemTraLai(bo, '2025-03-15', '2026-11-23');
    expect(t.han).toBe('2027-03-15');
    expect(t.conHieuLuc).toBe(true);
    expect(thoiHieuKiemTraLai(bo, '2024-03-15', '2026-11-23').conHieuLuc).toBe(false);
    expect(thoiHieuKiemTraLai(bo, '2024-02-29', '2026-01-01').han).toBe('2026-02-28'); // 29/02 → cuối tháng 2/2026
  });
});
