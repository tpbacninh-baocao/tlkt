import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { caiDatMacDinh } from '../src/core/caiDat';
import { taoCuocRong } from '../src/core/vuViec';
import { baoCaoTienDoDoan, baoCaoTuan, banTinSang, danhTinhCuoc, tinBaoLanhDao, tomTatMotCuoc, tongHopHomNay, type DuLieuTomTat } from '../src/core/tomTat';
import type { CongViec, CuocKiemTra } from '../src/core/kieu';

const lich = lichTronTru();
function cuoc(extra: Partial<CuocKiemTra>, buoc: Record<string, string>): CuocKiemTra {
  const c = taoCuocRong({ id: 'c', ma: 'KT-2026-001', taoLuc: '2026-01-01T00:00', mst: '0100000001', tenNNT: 'Công ty A', truongDoan: 'Nguyễn Văn A', ...extra });
  for (const [ma, ngay] of Object.entries(buoc)) c.buoc[ma] = { xong: true, ngay };
  return c;
}
function dl(cuocs: CuocKiemTra[], homNay: string, extra: Partial<DuLieuTomTat> = {}): DuLieuTomTat {
  const caiDat = caiDatMacDinh();
  caiDat.canBo = { hoTen: 'Nguyễn Văn A', donVi: 'Phòng Kiểm tra', chucVu: 'Chuyên viên' };
  return { homNay, bayGio: `${homNay}T10:00`, lich, caiDat, cuoc: cuocs, viec: [], keHoach: [], ...extra };
}

// Cuộc đang kiểm tra tại DN – ví dụ trong SPEC §12.7
const dangKT = () => {
  const c = cuoc({ soQD: '123/QĐ-CT' }, { P5: '2026-10-05', Q5: '2026-10-12' });
  c.yeuCauTaiLieu = [
    { id: 'y1', noiDung: 'Sổ chi tiết 331', guiLuc: '2026-10-12T15:00' }, // hạn 13/10 11:30 → quá hạn lúc 14/10 10:00
    { id: 'y2', noiDung: 'Hợp đồng vay', guiLuc: '2026-10-14T09:00' }, // hạn 14/10 15:00
  ];
  c.nhatKy = { '2026-10-12': { daGhiITNK: true }, '2026-10-13': { daGhiITNK: true } };
  return c;
};

describe('Tóm tắt một cuộc', () => {
  it('đang kiểm tra – đúng mẫu câu trong SPEC (ngày thứ 3/20, hạn gia hạn 28/10, yêu cầu tài liệu, nhật ký)', () => {
    const t = tomTatMotCuoc(dangKT(), dl([dangKT()], '2026-10-14'));
    expect(t).toContain('Đến 14/10/2026, đoàn kiểm tra Công ty A (MST …0001) đang kiểm tra tại trụ sở ngày thứ 3/20');
    expect(t).toContain('hạn đề nghị gia hạn 28/10/2026');
    expect(t).toContain('còn 2 yêu cầu tài liệu chưa nhận (quá 06 giờ làm việc: 1)');
    expect(t).toContain('nhật ký iTNK đã ghi đủ');
    expect(t).toMatchSnapshot();
  });
  it('thiếu nhật ký; đã gia hạn; đã tạm dừng', () => {
    const c = dangKT();
    c.nhatKy = {};
    c.suKien = [
      { id: 's1', taoLuc: '2026-10-13T08:00', loai: 'GIA_HAN', ngayDeNghi: '2026-10-13', ngayQD: '2026-10-13', soNgay: 20 },
      { id: 's2', taoLuc: '2026-10-13T09:00', loai: 'TAM_DUNG', tuNgay: '2026-10-14', denNgay: '2026-10-16', lyDo: 'x' },
    ];
    const t = tomTatMotCuoc(c, dl([c], '2026-10-19'));
    expect(t).toContain('đã gia hạn 20 ngày');
    expect(t).toContain('đã tạm dừng 3 ngày');
    expect(t).toContain('thiếu nhật ký iTNK');
    expect(t).not.toContain('hạn đề nghị gia hạn');
  });
  it('ẩn danh: không lộ tên, chỉ “KT …1234”; hienDayDu ghi đè', () => {
    const c = dangKT();
    const d = dl([c], '2026-10-14');
    d.caiDat.anDanh = true;
    expect(tomTatMotCuoc(c, d)).toContain('đoàn kiểm tra KT …0001 đang');
    expect(tomTatMotCuoc(c, d)).not.toContain('Công ty A');
    expect(tomTatMotCuoc(c, { ...d, hienDayDu: true })).toContain('Công ty A (MST …0001)');
    expect(danhTinhCuoc({ mst: '0100000001', tenNNT: '' }, false)).toBe('KT …0001');
  });
  it('các giai đoạn khác (snapshot)', () => {
    const base = { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30', B1: '2026-11-03', B4: '2026-11-05' };
    const ds = {
      chuanBi: cuoc({}, { P1: '2026-09-01' }),
      choCongBo: cuoc({ soQD: '123/QĐ-CT' }, { P5: '2026-10-05' }),
      bienBan: cuoc({}, { P5: '2026-10-05', Q5: '2026-10-12', T7: '2026-10-30' }),
      choQDXuLy: cuoc({ ketQua: { coXuLy: true, truyThu: 1, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 } }, base),
      sauQD: cuoc({}, { ...base, X: '2026-11-10' }),
      nopTien: Object.assign(
        cuoc({ ketQua: { coXuLy: true, truyThu: 10_000_000, phat: 2_000_000, chamNop: 500_000, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0 }, nopTien: [{ id: 'n', ngay: '2026-11-20', soTien: 5_000_000, daNhapTTR: true }] }, { ...base, X: '2026-11-10', S1: '2026-11-13', S5: '2026-11-12' }),
      ),
      baiBo: cuoc({ suKien: [{ id: 'b', taoLuc: 'x', loai: 'BAI_BO', ngayQD: '2026-10-08', lyDo: 'x' }] }, { P5: '2026-10-05' }),
    };
    const kq: Record<string, string> = {};
    for (const [k, c] of Object.entries(ds)) kq[k] = tomTatMotCuoc(c, dl([c], '2026-11-23'));
    expect(kq).toMatchSnapshot();
    expect(kq.nopTien).toContain('còn 7.500.000 đồng');
  });
});

describe('Bản tin sáng', () => {
  it('gom quá hạn / hôm nay / 3 NLV / tại DN / nhập liệu (snapshot)', () => {
    const a = dangKT();
    const b = cuoc({ id: 'c2', ma: 'KT-2026-002', mst: '0100000002', tenNNT: 'Công ty B' }, { P5: '2026-10-05' });
    const v: CongViec = { id: 'v1', tieuDe: 'Nộp báo cáo tháng', nguon: 'THUONG_XUYEN', han: '2026-10-14', viecCon: [], taoLuc: 'x', suaLuc: 'x' };
    expect(banTinSang(dl([a, b], '2026-10-14', { viec: [v] }))).toMatchSnapshot();
  });
  it('không có việc → thông báo không có việc gấp', () => {
    const t = banTinSang(dl([], '2026-10-14'));
    expect(t).toContain('BẢN TIN SÁNG – Thứ Tư 14/10/2026');
    expect(t).toContain('Chào Nguyễn Văn A');
    expect(t).toContain('Không có việc gấp – xem kế hoạch tuần.');
  });
  it('ẩn danh trong bản tin', () => {
    const d = dl([dangKT()], '2026-10-14');
    d.caiDat.anDanh = true;
    expect(banTinSang(d)).not.toContain('Công ty A');
    expect(banTinSang(d)).toContain('KT …0001');
  });
  it('cắt danh sách dài', () => {
    const viec: CongViec[] = Array.from({ length: 8 }, (_, i) => ({ id: 'v' + i, tieuDe: 'Việc ' + i, nguon: 'TU_DAT', han: '2026-10-12', viecCon: [], taoLuc: 'x', suaLuc: 'x' }));
    const t = banTinSang(dl([], '2026-10-14', { viec }));
    expect(t).toContain('Quá hạn: 8 việc');
    expect(t).toContain('… và 3 việc khác');
  });
});

describe('Tổng hợp Hôm nay', () => {
  it('KPI và nhóm khớp với trạng thái từng việc', () => {
    const a = dangKT();
    const th = tongHopHomNay(dl([a], '2026-10-14'));
    expect(th.taiDN).toHaveLength(1);
    expect(th.taiDN[0]).toMatchObject({ ycChuaNhan: 2, ycQuaHan: 1, daGhiITNK: false });
    expect(th.kpi.quaHan).toBe(th.quaHan.length);
    expect(th.quaHan.every((m) => m.trangThai === 'QUA_HAN')).toBe(true);
    expect(th.baNLVToi.every((m) => m.trangThai === 'SAP_DEN')).toBe(true);
    // sắp theo điểm giảm dần
    for (let i = 1; i < th.quaHan.length; i++) expect(th.quaHan[i - 1].diem).toBeGreaterThanOrEqual(th.quaHan[i].diem);
  });
});

describe('Báo cáo tiến độ đoàn', () => {
  it('đầy đủ các mục (snapshot)', () => {
    const c = dangKT();
    expect(baoCaoTienDoDoan(c, dl([c], '2026-10-14'))).toMatchSnapshot();
  });
  it('ẩn danh', () => {
    const d = dl([dangKT()], '2026-10-14');
    d.caiDat.anDanh = true;
    const t = baoCaoTienDoDoan(dangKT(), d);
    expect(t).not.toContain('Công ty A');
    expect(t).toContain('Đối tượng: KT …0001');
  });
});

describe('Báo cáo tuần', () => {
  it('kết quả tuần, cuộc đang làm, tồn đọng, kế hoạch tuần sau (snapshot)', () => {
    const c = dangKT();
    c.buoc.Q1 = { xong: true, ngay: '2026-10-07' };
    c.buoc.Q2 = { xong: true, ngay: '2026-10-08' };
    const v: CongViec = { id: 'v1', tieuDe: 'Báo cáo giao ban', nguon: 'LANH_DAO', han: '2026-10-13', xong: '2026-10-13T09:00', viecCon: [], taoLuc: 'x', suaLuc: 'x' };
    const t = baoCaoTuan(dl([c], '2026-10-16', { viec: [v] }), '2026-10-14');
    expect(t).toContain('BÁO CÁO TUẦN – từ 12/10/2026 đến 18/10/2026');
    expect(t).toContain('Công ty A (MST …0001): Công bố QĐ kiểm tra');
    expect(t).toContain('Việc: Báo cáo giao ban (13/10/2026)');
    expect(t).not.toContain('Gửi QĐ kiểm tra cho NNT'); // Q1 xong tuần trước
    expect(t).toMatchSnapshot();
  });
});

describe('Tin báo lãnh đạo (leo thang)', () => {
  it('chỉ soạn khi có việc quá hạn quá 1 ngày làm việc', () => {
    const c = cuoc({}, { P5: '2026-10-05' }); // Q1 hạn 08/10
    expect(tinBaoLanhDao(dl([c], '2026-10-06'))).toBeUndefined(); // chưa có việc nào quá hạn
    const t = tinBaoLanhDao(dl([c], '2026-10-14'));
    expect(t).toBeDefined();
    expect(t).toContain('Kính gửi lãnh đạo');
    expect(t).toContain('quá');
    expect(t).toContain('06/10/2026');
  });
  it('không có việc quá hạn → không có tin', () => {
    expect(tinBaoLanhDao(dl([], '2026-10-14'))).toBeUndefined();
  });
});
