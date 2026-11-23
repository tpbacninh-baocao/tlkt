import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { laNgayLamViec, lichTronTru } from '../src/core/lich';
import { chonBoQuyTac } from '../src/core/quyTac';
import { tinhGiaiDoan, tinhMoc, kiemTraDanhDauBuoc, CHUOI_MOC } from '../src/core/vuViec';
import { sinhChecklist, checklistDu } from '../src/core/checklist';
import { tongHopHomNay } from '../src/core/tomTat';
import { caiDatMacDinh } from '../src/core/caiDat';
import { thongKeKeHoach } from '../src/core/keHoach';
import { nhomViec } from '../src/core/viec';
import { moKho } from '../src/data/kho';
import { coDuLieuMau, taoDuLieuMau, themDuLieuMau, xoaDuLieuMau } from '../src/data/mau';
import type { GiaiDoan } from '../src/core/kieu';

const lich = lichTronTru();
const NGAY_THU = ['2026-11-23', '2026-11-27', '2026-11-28', '2026-12-31', '2027-01-04', '2027-03-15', '2028-02-29'];

describe.each(NGAY_THU)('Dữ liệu mẫu tính theo ngày hôm nay = %s', (homNay) => {
  const bayGio = `${homNay}T09:00`;
  const m = taoDuLieuMau(homNay, lich, bayGio);
  const phanTich = (c: (typeof m.cuoc)[number]) => {
    const bo = chonBoQuyTac(c.buoc.P5?.ngay, homNay, undefined);
    return { bo, kq: tinhMoc(c, { lich, homNay, bo }) };
  };

  it('đủ 6 cuộc, 1 kế hoạch, 10 việc, khối thời gian; MST giả 0100000xxx; cờ dữ liệu mẫu', () => {
    expect(m.cuoc).toHaveLength(6);
    expect(m.keHoach).toHaveLength(1);
    expect(m.viec).toHaveLength(10);
    expect(m.khoiThoiGian.length).toBeGreaterThanOrEqual(3);
    for (const c of m.cuoc) {
      expect(c.mst).toMatch(/^0100000\d{3}$/);
      expect(c.laDuLieuMau).toBe(true);
    }
    expect(new Set(m.cuoc.map((c) => c.mst)).size).toBe(6);
    for (const x of [...m.keHoach, ...m.viec, ...m.khoiThoiGian]) expect(x.laDuLieuMau).toBe(true);
    expect(new Set([...m.cuoc, ...m.viec, ...m.khoiThoiGian, ...m.keHoach].map((x) => x.id)).size).toBe(6 + 10 + m.khoiThoiGian.length + 1);
  });

  it('sáu giai đoạn khác nhau theo đúng mô tả', () => {
    const gd = m.cuoc.map((c) => {
      const { kq } = phanTich(c);
      return tinhGiaiDoan(c, kq);
    });
    const mong: GiaiDoan[] = ['DANG_KIEM_TRA', 'CHO_CONG_BO', 'BIEN_BAN', 'CHO_QD_XU_LY', 'BAI_BO', 'THEO_DOI_NOP_TIEN'];
    expect(gd).toEqual(mong);
  });

  it('đặc điểm từng cuộc: loại, GDLK, bộ quy tắc, chế độ X', () => {
    const [c1, c2, c3, c4, c5, c6] = m.cuoc;
    expect(c1.loai).toBe('KH');
    expect(c2.loai).toBe('TH');
    expect(c2.hanNgoai).toBeTruthy();
    expect(c3.loai).toBe('GT');
    expect(c4.coGDLK).toBe(true);
    expect(phanTich(c4).kq.cheDoX).toBe('X2'); // có giải trình
    expect(c5.suKien.some((s) => s.loai === 'BAI_BO')).toBe(true);
    expect(phanTich(c6).bo.ma).toBe('QTKT-970');
    expect(phanTich(c1).bo.ma).toBe(homNay < '2026-07-01' ? 'QTKT-970' : 'QTKT-1161');
    expect(c1.keHoachId).toBe('mau-kh');
  });

  it('mọi ngày thực tế hợp lệ: không ở tương lai (cuộc tính tương đối), đúng thứ tự mốc, không xong trễ', () => {
    for (const c of m.cuoc) {
      const { kq } = phanTich(c);
      if (c.id !== 'mau-c6') for (const b of Object.values(c.buoc)) expect(b.ngay! <= homNay).toBe(true);
      const ngayMoc = CHUOI_MOC.map((x) => c.buoc[x.buoc]?.ngay).filter(Boolean) as string[];
      expect([...ngayMoc].sort()).toEqual(ngayMoc);
      expect(kq.danhSach.filter((x) => x.trangThai === 'XONG_TRE').map((x) => x.ma), `cuộc ${c.id}`).toEqual([]);
    }
  });

  it('mỗi bước đã đánh dấu đều qua kiểm tra ràng buộc (như khi người dùng tự nhập)', () => {
    for (const goc of m.cuoc) {
      // cuộc bãi bỏ: kiểm tra trên bản chưa bãi bỏ (sau bãi bỏ không được đánh dấu thêm – đúng quy tắc)
      const c = { ...goc, suKien: goc.suKien.filter((s) => s.loai !== 'BAI_BO') };
      const { kq } = phanTich(c);
      for (const [ma, b] of Object.entries(c.buoc)) {
        if (!b.xong || !kq.danhSach.find((x) => x.ma === ma)) continue;
        const r = kiemTraDanhDauBuoc(c, kq, ma, b.ngay!, homNay);
        expect(r.loi, `${c.id}/${ma}`).toEqual([]);
      }
    }
  });

  it('cuộc 1: ngày thứ 4/20, có yêu cầu tài liệu, vướng mắc, thiếu nhật ký hôm qua và 1 mục nhập liệu', () => {
    const c1 = m.cuoc[0];
    const dl = { homNay, bayGio: `${homNay}T17:00`, lich, caiDat: caiDatMacDinh(), cuoc: m.cuoc, viec: m.viec, keHoach: m.keHoach };
    const th = tongHopHomNay(dl);
    const dn = th.taiDN.find((t) => t.cuocId === c1.id);
    if (laNgayLamViec(lich, homNay)) {
      expect(dn).toBeTruthy();
      expect(dn!.ngayThu?.tong).toBe(homNay < '2026-07-01' ? 10 : 20);
      expect(dn!.ycChuaNhan).toBe(1);
      expect(dn!.ycQuaHan).toBe(1);
    } else {
      expect(dn).toBeUndefined(); // cuối tuần/ngày nghỉ: không ở DN
    }
    expect(c1.vuongMac).toHaveLength(1);
    expect(th.nhapLieuThieu.some((n) => n.cuocId === c1.id && n.viec.ma === 'ITNK_CB')).toBe(true);
  });

  it('có việc quá hạn, hôm nay, tuần này, hộp thu, đã xong, lặp lại và ghim', () => {
    const g = m.viec.map((v) => nhomViec(v, lich, homNay));
    for (const nhom of ['QUA_HAN', 'HOM_NAY', 'TUAN_NAY', 'HOP_THU', 'XONG'] as const) expect(g, nhom).toContain(nhom);
    expect(m.viec.filter((v) => v.lap).length).toBeGreaterThanOrEqual(3);
    expect(m.viec.some((v) => v.ghim)).toBe(true);
    expect(m.viec.every((v) => !v.han || /^\d{4}-\d{2}-\d{2}$/.test(v.han))).toBe(true);
    for (const v of m.viec.filter((x) => x.lap && !x.xong)) expect(v.han! >= homNay).toBe(true);
  });

  it('checklist: cuộc 6 đã đủ trừ lần nộp thứ 2; cuộc 4 đã tích hết', () => {
    const [, , , c4, , c6] = m.cuoc;
    const lay = (c: typeof c4) => {
      const { bo, kq } = phanTich(c);
      void bo;
      return sinhChecklist(c, kq, lich, homNay);
    };
    const l6 = lay(c6);
    const chua = l6.filter((v) => !v.xong && !v.hangNgay).map((v) => v.khoa);
    expect(chua).toEqual(['TTR_NOP#mau-c6-n2']);
    expect(checklistDu(l6)).toBe(true);
    expect(lay(c4).filter((v) => !v.xong && !v.hangNgay)).toEqual([]);
  });

  it('kế hoạch năm: cuộc 1 và 4 thuộc kế hoạch mẫu; thống kê hợp lý', () => {
    const tk = thongKeKeHoach({ homNay, lich, cuoc: m.cuoc, keHoach: m.keHoach }, { nam: Number(homNay.slice(0, 4)), keHoachId: 'mau-kh' });
    expect(tk.soCuoc).toBe(2);
    expect(tk.chiTieu).toBe(10);
  });
});

describe('Lưu / xóa riêng dữ liệu mẫu trong kho', () => {
  it('thêm không nhân đôi; xóa chỉ xóa dữ liệu mẫu, giữ dữ liệu thật', async () => {
    const k = await moKho({ ten: 'mau-kho-1', dongHo: () => '2026-11-23T09:00' });
    await k.luuViec({ id: 'that-1', tieuDe: 'Việc thật của tôi', nguon: 'TU_DAT', viecCon: [], taoLuc: 'x', suaLuc: 'x' });
    expect(await coDuLieuMau(k)).toBe(false);
    expect(await themDuLieuMau(k, '2026-11-23', lich, '2026-11-23T09:00')).toEqual({ soCuoc: 6, soViec: 10 });
    await themDuLieuMau(k, '2026-11-23', lich, '2026-11-23T09:00');
    let du = await k.docTatCa();
    expect(du.cuoc).toHaveLength(6);
    expect(du.viec).toHaveLength(11);
    expect(du.keHoach).toHaveLength(1);
    expect(await coDuLieuMau(k)).toBe(true);
    expect(await xoaDuLieuMau(k, '2026-11-23T10:00')).toBe(6 + 10 + 3 + 1);
    du = await k.docTatCa();
    expect(du.cuoc).toHaveLength(0);
    expect(du.keHoach).toHaveLength(0);
    expect(du.khoiThoiGian).toHaveLength(0);
    expect(du.viec.map((v) => v.id)).toEqual(['that-1']);
    expect(await coDuLieuMau(k)).toBe(false);
  });
  it('không tạo trùng việc lặp lại đã có từ mẫu (app tự tạo ở onboarding)', async () => {
    const k = await moKho({ ten: 'mau-kho-3', dongHo: () => '2026-11-23T09:00' });
    await k.luuViec({ id: 'tu-mau', tieuDe: 'Rà soát dữ liệu…', nguon: 'THUONG_XUYEN', mauMa: 'RS_13', lap: 'THANG:13', han: '2026-12-11', viecCon: [], taoLuc: 'x', suaLuc: 'x' });
    const r = await themDuLieuMau(k, '2026-11-23', lich, '2026-11-23T09:00');
    expect(r.soViec).toBe(9); // bỏ mau-v6 (RS_13) vì đã có bản đang mở
    const dsViec = (await k.docTatCa()).viec;
    expect(dsViec.filter((v) => v.mauMa === 'RS_13')).toHaveLength(1);
    expect(dsViec).toHaveLength(10);
    // đã xong thì không chặn
    const k2 = await moKho({ ten: 'mau-kho-4', dongHo: () => '2026-11-23T09:00' });
    await k2.luuViec({ id: 'da-xong', tieuDe: 'x', nguon: 'THUONG_XUYEN', mauMa: 'RS_13', lap: 'THANG:13', viecCon: [], taoLuc: 'x', suaLuc: 'x', xong: '2026-11-13T08:00' });
    expect((await themDuLieuMau(k2, '2026-11-23', lich, '2026-11-23T09:00')).soViec).toBe(10);
  });
  it('trưởng đoàn mặc định là cán bộ trong cài đặt', () => {
    const cd = caiDatMacDinh();
    cd.canBo.hoTen = 'Hoàng Văn Test';
    expect(taoDuLieuMau('2026-11-23', lich, 'x', cd).cuoc.every((c) => c.truongDoan === 'Hoàng Văn Test')).toBe(true);
  });
  it('dữ liệu mẫu hoạt động khi kho đã bật mật mã', async () => {
    const k = await moKho({ ten: 'mau-kho-2', dongHo: () => '2026-11-23T09:00' });
    await k.datMatMa('mat-ma-123');
    await themDuLieuMau(k, '2026-11-23', lich, '2026-11-23T09:00');
    expect((await k.docTatCa()).cuoc).toHaveLength(6);
    expect(JSON.stringify(await k.db.getAll('cuoc'))).not.toContain('Mẫu Một');
  });
});
