import { describe, it, expect } from 'vitest';
import { lichTronTru } from '../src/core/lich';
import { caiDatMacDinh } from '../src/core/caiDat';
import { khoangGantt, locCuocDS, sapXepCuocDS, taoDongCuoc, timKhop, tinhGantt, xuLyKeoTha, type DuLieuTomTat } from '../src/core/tomTat';
import { taoDuLieuMau } from '../src/data/mau';
import { taoCuocRong } from '../src/core/vuViec';

const lich = lichTronTru();
const HOM_NAY = '2026-11-23';
const m = taoDuLieuMau(HOM_NAY, lich, `${HOM_NAY}T09:00`);
const d: DuLieuTomTat = { homNay: HOM_NAY, bayGio: `${HOM_NAY}T17:00`, lich, caiDat: caiDatMacDinh(), cuoc: m.cuoc, viec: m.viec, keHoach: m.keHoach };
const rows = m.cuoc.map((c) => taoDongCuoc(c, d));
const theoId = (id: string) => rows.find((r) => r.cuoc.id === id)!;

describe('Tìm kiếm', () => {
  it('theo MST (đủ hoặc 3+ số cuối), tên không dấu, mã, số QĐ, trưởng đoàn', () => {
    const c = m.cuoc[0];
    expect(timKhop(c, '0100000001')).toBe(true);
    expect(timKhop(c, '001')).toBe(true);
    expect(timKhop(c, '0100000002')).toBe(false);
    expect(timKhop(c, 'mau mot')).toBe(true);
    expect(timKhop(c, 'MẪU MỘT')).toBe(true);
    expect(timKhop(c, 'KT-2026-001')).toBe(true);
    expect(timKhop(c, '101/QĐ')).toBe(true);
    expect(timKhop(c, 'nguyen van a')).toBe(true);
    expect(timKhop(c, '')).toBe(true);
    expect(timKhop(c, 'khong co day')).toBe(false);
  });
  it('số không có trong MST/mã → không khớp', () => {
    expect(timKhop(m.cuoc[0], '999')).toBe(false);
  });
});

describe('SLA cả cuộc', () => {
  it('mức nặng nhất trong các bước pháp lý đang mở; bãi bỏ có mức riêng', () => {
    expect(theoId('mau-c1').sla).toBe('CON_LAU'); // đúng tiến độ (việc nhập liệu quá hạn không tính vào SLA cuộc)
    expect(theoId('mau-c3').sla).toBe('SAP_DEN'); // hạn ký biên bản còn 3 ngày LV
    expect(theoId('mau-c6').sla).toBe('QUA_HAN_CHUA_GIAI_TRINH'); // theo dõi nộp tiền quá hạn
    expect(theoId('mau-c5').sla).toBe('KHONG_AP_DUNG');
  });
});

describe('Lọc', () => {
  it('theo giai đoạn / loại / SLA / trưởng đoàn / hạn ngoài / kế hoạch', () => {
    expect(locCuocDS(rows, { giaiDoan: ['DANG_KIEM_TRA'] }, m.keHoach).map((r) => r.cuoc.id)).toEqual(['mau-c1']);
    expect(locCuocDS(rows, { loai: ['TH', 'GT'] }, m.keHoach).map((r) => r.cuoc.id).sort()).toEqual(['mau-c2', 'mau-c3']);
    expect(locCuocDS(rows, { coHanNgoai: true }, m.keHoach).map((r) => r.cuoc.id)).toEqual(['mau-c2']);
    expect(locCuocDS(rows, { keHoachId: 'mau-kh' }, m.keHoach).map((r) => r.cuoc.id).sort()).toEqual(['mau-c1', 'mau-c4']);
    expect(locCuocDS(rows, { nam: 2026 }, m.keHoach)).toHaveLength(6);
    expect(locCuocDS(rows, { nam: 2025 }, m.keHoach)).toHaveLength(0);
    expect(locCuocDS(rows, { truongDoan: 'Người lạ' }, m.keHoach)).toHaveLength(0);
    expect(locCuocDS(rows, { tim: 'mau sau' }, m.keHoach).map((r) => r.cuoc.id)).toEqual(['mau-c6']);
    expect(locCuocDS(rows, { sla: ['KHONG_AP_DUNG'] }, m.keHoach).map((r) => r.cuoc.id)).toEqual(['mau-c5']);
  });
  it('kết hợp nhiều điều kiện là VÀ', () => {
    expect(locCuocDS(rows, { loai: ['KH'], giaiDoan: ['BIEN_BAN'] }, m.keHoach)).toHaveLength(0);
    expect(locCuocDS(rows, { loai: ['KH'], giaiDoan: ['CHO_QD_XU_LY'] }, m.keHoach).map((r) => r.cuoc.id)).toEqual(['mau-c4']);
  });
});

describe('Sắp xếp', () => {
  it('ưu tiên: điểm giảm dần; hạn: hạn tiếp theo gần nhất trước, không hạn cuối; tên; ngày tạo', () => {
    const uu = sapXepCuocDS(rows, 'UU_TIEN');
    for (let i = 1; i < uu.length; i++) expect(uu[i - 1].diem).toBeGreaterThanOrEqual(uu[i].diem);
    const han = sapXepCuocDS(rows, 'HAN');
    const hanDS = han.map((r) => r.hanTiep ?? '9999');
    expect([...hanDS].sort()).toEqual(hanDS);
    const ten = sapXepCuocDS(rows, 'TEN').map((r) => r.cuoc.tenNNT);
    expect(ten).toEqual([...ten].sort((a, b) => a.localeCompare(b, 'vi')));
    const tao = sapXepCuocDS([{ ...rows[0], cuoc: { ...rows[0].cuoc, taoLuc: '2026-01-01T00:00' } }, { ...rows[1], cuoc: { ...rows[1].cuoc, taoLuc: '2026-05-01T00:00' } }], 'NGAY_TAO');
    expect(tao[0].cuoc.taoLuc).toBe('2026-05-01T00:00');
  });
  it('không làm đổi mảng gốc', () => {
    const goc = rows.map((r) => r.cuoc.id);
    sapXepCuocDS(rows, 'TEN');
    expect(rows.map((r) => r.cuoc.id)).toEqual(goc);
  });
});

describe('Kéo thả Kanban chỉ mở form xác nhận', () => {
  it('sang giai đoạn liền kề → form bước tương ứng', () => {
    expect(xuLyKeoTha('CHUAN_BI', 'CHO_CONG_BO')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'P5' });
    expect(xuLyKeoTha('CHO_CONG_BO', 'DANG_KIEM_TRA')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'Q5' });
    expect(xuLyKeoTha('DANG_KIEM_TRA', 'BIEN_BAN')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'T7' });
    expect(xuLyKeoTha('BIEN_BAN', 'CHO_QD_XU_LY')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'B4' });
    expect(xuLyKeoTha('CHO_QD_XU_LY', 'SAU_QD')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'X' });
    expect(xuLyKeoTha('SAU_QD', 'HOAN_THANH')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'S5' });
    expect(xuLyKeoTha('SAU_QD', 'THEO_DOI_NOP_TIEN')).toMatchObject({ kieu: 'XONG_BUOC', ma: 'S5' });
  });
  it('sang Bãi bỏ → mở form sự kiện; lùi/nhảy cóc/cùng cột → từ chối kèm lý do', () => {
    expect(xuLyKeoTha('DANG_KIEM_TRA', 'BAI_BO')).toEqual({ kieu: 'SU_KIEN', loai: 'BAI_BO' });
    for (const [a, b] of [['BIEN_BAN', 'CHO_CONG_BO'], ['CHUAN_BI', 'BIEN_BAN'], ['BIEN_BAN', 'BIEN_BAN'], ['BAI_BO', 'CHUAN_BI']] as const) {
      const r = xuLyKeoTha(a, b);
      expect(r.kieu).toBe('KHONG');
    }
  });
});

describe('Gantt', () => {
  it('cuộc đang kiểm tra: 3 đoạn (chuẩn bị, chờ công bố, tại DN), đoạn sau dự kiến', () => {
    const g = tinhGantt(theoId('mau-c1').pt);
    expect(g.doan.map((x) => x.giaiDoan)).toEqual(['CHUAN_BI', 'CHO_CONG_BO', 'DANG_KIEM_TRA', 'BIEN_BAN']);
    expect(g.doan[0].duKien).toBe(false);
    expect(g.doan[2].duKien).toBe(true); // C thực tế nhưng điểm cuối (K) mới là dự kiến → vẽ nét đứt
    expect(g.doan[3].duKien).toBe(true);
    for (const x of g.doan) expect(x.den >= x.tu).toBe(true);
    expect(g.hanPhapLy.some((h) => h.ma === 'T1' || h.ma === 'T7')).toBe(true);
  });
  it('tạm dừng được đưa vào để vẽ gạch chéo', () => {
    const c = taoCuocRong({ id: 'x', ma: 'KT-X', taoLuc: 'x', mst: '0100000009' });
    c.buoc.P5 = { xong: true, ngay: '2026-10-05' };
    c.buoc.Q5 = { xong: true, ngay: '2026-10-12' };
    c.suKien = [{ id: 's', taoLuc: 'x', loai: 'TAM_DUNG', tuNgay: '2026-10-19', denNgay: '2026-10-23' }];
    const g = tinhGantt(taoDongCuoc(c, { ...d, cuoc: [c] }).pt);
    expect(g.tamDung).toEqual([{ tu: '2026-10-19', den: '2026-10-23' }]);
    expect(g.doan.find((x) => x.giaiDoan === 'DANG_KIEM_TRA')!.den).toBe('2026-11-06'); // E có cộng 5 ngày tạm dừng
  });
  it('cuộc chưa có mốc → không có đoạn; khoảng chung gồm cả hôm nay', () => {
    const c = taoCuocRong({ id: 'y', ma: 'KT-Y', taoLuc: 'x' });
    const g = tinhGantt(taoDongCuoc(c, { ...d, cuoc: [c] }).pt);
    expect(g.doan).toEqual([]);
    const k = khoangGantt([tinhGantt(theoId('mau-c1').pt), tinhGantt(theoId('mau-c6').pt)], HOM_NAY);
    expect(k.tu).toBe('2026-05-18');
    expect(k.den >= HOM_NAY).toBe(true);
    expect(k.soNgay).toBeGreaterThan(150);
    expect(khoangGantt([g], HOM_NAY)).toEqual({ tu: HOM_NAY, den: HOM_NAY, soNgay: 1 });
  });
});
