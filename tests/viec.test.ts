import { describe, it, expect } from 'vitest';
import { lichTronTru, taoLich } from '../src/core/lich';
import {
  boHoanThanh,
  cacLanLap,
  diemUuTienViec,
  docLap,
  dongBoViecMau,
  hoanThanhViec,
  laLapHopLe,
  lanLapKeTiep,
  lanLapTu,
  layMau,
  mauBatMacDinh,
  moTaLap,
  MAU_VIEC,
  nhanDienHan,
  nhomViec,
  sapXepViec,
  taoViecTuMau,
  trangThaiViec,
} from '../src/core/viec';
import type { CongViec } from '../src/core/kieu';

const lich = lichTronTru();
let dem = 0;
const taoId = () => 'id' + ++dem;
const viec = (o: Partial<CongViec> = {}): CongViec => ({
  id: 'v1', tieuDe: 'Việc', nguon: 'TU_DAT', viecCon: [], taoLuc: '2026-11-01T08:00', suaLuc: '2026-11-01T08:00', ...o,
});

describe('Cú pháp lặp', () => {
  it('đọc đúng các kiểu; từ chối cú pháp sai', () => {
    expect(docLap('NGAY')).toEqual({ kieu: 'NGAY' });
    expect(docLap('TUAN:5')).toEqual({ kieu: 'TUAN', thu: 5 });
    expect(docLap('THANG:13')).toEqual({ kieu: 'THANG', ngay: 13 });
    expect(docLap('THANG:CUOI')).toEqual({ kieu: 'THANG_CUOI', tru: 0 });
    expect(docLap('THANG:CUOI-2')).toEqual({ kieu: 'THANG_CUOI', tru: 2 });
    expect(docLap('QUY:CUOI-5')).toEqual({ kieu: 'QUY_CUOI', tru: 5 });
    expect(docLap('NAM:01-02')).toEqual({ kieu: 'NAM', thang: 1, ngay: 2 });
    for (const x of ['TUAN:6', 'TUAN:0', 'THANG:32', 'NAM:13-01', 'XYZ', '', undefined]) expect(laLapHopLe(x as string)).toBe(false);
  });
  it('mô tả tiếng Việt', () => {
    expect(moTaLap('TUAN:5')).toBe('Thứ Sáu hằng tuần');
    expect(moTaLap('THANG:13')).toBe('Ngày 13 hằng tháng');
    expect(moTaLap('NAM:01-02')).toBe('Ngày 02/01 hằng năm');
  });
});

describe('Các lần lặp', () => {
  it('NGAY: mỗi ngày làm việc', () => {
    expect(cacLanLap(lich, 'NGAY', '2026-11-20', '2026-11-25')).toEqual(['2026-11-20', '2026-11-23', '2026-11-24', '2026-11-25']);
  });
  it('TUAN:5: mỗi thứ Sáu; ngày nghỉ lễ → lùi về ngày làm việc TRƯỚC', () => {
    expect(cacLanLap(lich, 'TUAN:5', '2026-11-01', '2026-11-30')).toEqual(['2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27']);
    const l2 = taoLich({ ngayNghiThem: ['2026-11-13'] });
    expect(cacLanLap(l2, 'TUAN:5', '2026-11-01', '2026-11-30')).toContain('2026-11-12');
    expect(cacLanLap(l2, 'TUAN:5', '2026-11-01', '2026-11-30')).not.toContain('2026-11-13');
  });
  it('TUAN:1: mỗi thứ Hai', () => {
    expect(cacLanLap(lich, 'TUAN:1', '2026-11-01', '2026-11-30')).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
  });
  it('THANG:13: ngày 13; rơi cuối tuần → lùi về thứ Sáu', () => {
    expect(cacLanLap(lich, 'THANG:13', '2026-10-01', '2027-01-31')).toEqual(['2026-10-13', '2026-11-13', '2026-12-11', '2027-01-13']);
    // 13/12/2026 là Chủ nhật → thứ Sáu 11/12
  });
  it('THANG:28 và THANG:31 (tháng thiếu ngày)', () => {
    expect(cacLanLap(lich, 'THANG:28', '2026-11-01', '2026-12-31')).toEqual(['2026-11-27', '2026-12-28']); // 28/11 là thứ Bảy
    expect(cacLanLap(lich, 'THANG:31', '2026-11-01', '2026-12-31')).toEqual(['2026-11-30', '2026-12-31']); // tháng 11 chỉ có 30 ngày
  });
  it('THANG:CUOI / CUOI-2: ngày cuối tháng (trừ 2 ngày), lùi về ngày làm việc trước', () => {
    expect(cacLanLap(lich, 'THANG:CUOI', '2026-11-01', '2027-01-31')).toEqual(['2026-11-30', '2026-12-31', '2027-01-29']);
    expect(cacLanLap(lich, 'THANG:CUOI-2', '2026-11-01', '2026-12-31')).toEqual(['2026-11-27', '2026-12-29']); // 28/11 thứ Bảy → 27/11
  });
  it('QUY:CUOI-5: chỉ các tháng 3, 6, 9, 12', () => {
    expect(cacLanLap(lich, 'QUY:CUOI-5', '2026-01-01', '2026-12-31')).toEqual(['2026-03-26', '2026-06-25', '2026-09-25', '2026-12-25']);
  });
  it('NAM:01-02: 02/01 hằng năm, lùi nếu ngày nghỉ', () => {
    // 02/01/2027 thứ Bảy → thứ Sáu 01/01/2027; 02/01/2028 Chủ nhật → thứ Sáu 31/12/2027; 02/01/2029 thứ Ba
    expect(cacLanLap(lich, 'NAM:01-02', '2026-06-01', '2029-12-31')).toEqual(['2027-01-01', '2027-12-31', '2029-01-02']);
  });
  it('NAM:02-29 ở năm không nhuận → 28/02', () => {
    expect(cacLanLap(lich, 'NAM:02-29', '2027-01-01', '2027-12-31')).toEqual(['2027-02-26']); // 28/02/2027 là Chủ nhật → thứ Sáu 26/02
  });
  it('lần kế tiếp (không tính ngày gốc) và từ ngày', () => {
    expect(lanLapKeTiep(lich, 'TUAN:5', '2026-11-27')).toBe('2026-12-04');
    expect(lanLapTu(lich, 'TUAN:5', '2026-11-27')).toBe('2026-11-27');
    expect(lanLapKeTiep(lich, 'THANG:13', '2026-12-11')).toBe('2027-01-13');
  });
});

describe('Hoàn thành việc lặp lại', () => {
  it('tạo lần kế tiếp, đặt lại việc con, chỉ một bản ghi mở cho chuỗi', () => {
    const v = viec({ lap: 'TUAN:5', han: '2026-11-27', viecCon: [{ id: 'c1', tieuDe: 'a', xong: true }], mauMa: 'DON_DOC_NOP' });
    const { daXong, tiep } = hoanThanhViec(v, '2026-11-27T10:00', lich, taoId);
    expect(daXong.xong).toBe('2026-11-27T10:00');
    expect(tiep!.han).toBe('2026-12-04');
    expect(tiep!.xong).toBeUndefined();
    expect(tiep!.id).not.toBe(v.id);
    expect(tiep!.mauMa).toBe('DON_DOC_NOP');
    expect(tiep!.viecCon).toHaveLength(1);
    expect(tiep!.viecCon[0].xong).toBe(false);
  });
  it('xong sớm → lần kế tiếp vẫn sau hạn hiện tại; xong muộn → bỏ qua các lần đã trôi qua', () => {
    const v = viec({ lap: 'TUAN:5', han: '2026-11-27' });
    expect(hoanThanhViec(v, '2026-11-24T10:00', lich, taoId).tiep!.han).toBe('2026-12-04');
    expect(hoanThanhViec(v, '2026-12-14T10:00', lich, taoId).tiep!.han).toBe('2026-12-18'); // bỏ 04/12, 11/12
  });
  it('việc không lặp thì không có lần kế tiếp; bỏ đánh dấu xong', () => {
    const r = hoanThanhViec(viec({ han: '2026-11-27' }), '2026-11-27T10:00', lich, taoId);
    expect(r.tiep).toBeUndefined();
    expect(boHoanThanh(r.daXong, '2026-11-27T11:00').xong).toBeUndefined();
  });
  it('mỗi kiểu lặp đều sinh được lần kế tiếp', () => {
    for (const lap of ['NGAY', 'TUAN:3', 'THANG:15', 'THANG:CUOI', 'THANG:CUOI-2', 'QUY:CUOI-5', 'NAM:01-02']) {
      const { tiep } = hoanThanhViec(viec({ lap, han: '2026-11-23' }), '2026-11-23T09:00', lich, taoId);
      expect(tiep?.han, lap).toBeTruthy();
      expect(tiep!.han! > '2026-11-23').toBe(true);
    }
  });
});

describe('Mẫu việc thường xuyên', () => {
  it('đọc đủ mẫu từ JSON; mẫu bật mặc định', () => {
    expect(MAU_VIEC.length).toBe(7);
    expect(mauBatMacDinh()).toEqual(['RS_13', 'RS_CUOI', 'BC_THANG', 'BC_NAM', 'DON_DOC_NOP', 'RS_QUY']);
    expect(layMau('GIAO_BAN')!.batMacDinh).toBe(false);
  });
  it('tạo việc từ mẫu: hạn = lần lặp đầu từ hôm nay', () => {
    const v = taoViecTuMau(layMau('RS_13')!, '2026-11-23', lich, 'x', '2026-11-23T08:00');
    expect(v.han).toBe('2026-12-11'); // 13/12 là Chủ nhật → 11/12
    expect(v.nguon).toBe('THUONG_XUYEN');
    expect(v.mauMa).toBe('RS_13');
    expect(v.gio).toBe('08:00');
    expect(taoViecTuMau(layMau('BC_THANG')!, '2026-11-23', lich, 'y', 'z').han).toBe('2026-11-27'); // 28/11 thứ Bảy → 27/11
    expect(taoViecTuMau(layMau('BC_NAM')!, '2026-11-23', lich, 'y', 'z').han).toBe('2027-01-01'); // 02/01/2027 là thứ Bảy → 01/01 (thứ Sáu)
  });
  it('đồng bộ: chỉ tạo cho mẫu bật mà chưa có bản ghi đang mở', () => {
    const ds = dongBoViecMau(['RS_13', 'GIAO_BAN'], [], '2026-11-23', lich, taoId, '2026-11-23T08:00');
    expect(ds.map((d) => d.mauMa)).toEqual(['RS_13', 'GIAO_BAN']);
    const daCo = viec({ mauMa: 'RS_13' });
    expect(dongBoViecMau(['RS_13'], [daCo], '2026-11-23', lich, taoId, 'x').length).toBe(0);
    expect(dongBoViecMau(['RS_13'], [{ ...daCo, xong: '2026-11-20T08:00' }], '2026-11-23', lich, taoId, 'x').length).toBe(1);
    expect(dongBoViecMau(['KHONG_CO'], [], '2026-11-23', lich, taoId, 'x').length).toBe(0);
  });
});

describe('Nhận diện hạn – tách tiêu đề và biến thể', () => {
  const nd = (c: string, goc = '2026-11-23') => nhanDienHan(c, goc, lich);
  it('tách phần còn lại', () => {
    expect(nd('nộp báo cáo ngày mai')).toMatchObject({ han: '2026-11-24', phanConLai: 'nộp báo cáo', cum: 'ngày mai' });
    expect(nd('gửi tờ trình sau 3 ngày làm việc').phanConLai).toBe('gửi tờ trình');
    expect(nd('trả lời văn bản 123 trước 15/12')).toMatchObject({ han: '2026-12-15', phanConLai: 'trả lời văn bản 123' });
    expect(nd('báo cáo lãnh đạo thứ sáu tuần sau').phanConLai).toBe('báo cáo lãnh đạo');
    expect(nd('ghi chú không có hạn')).toEqual({ phanConLai: 'ghi chú không có hạn' });
  });
  it('không phân biệt hoa thường, dấu', () => {
    expect(nd('HỌP THỨ SÁU').han).toBe('2026-11-27');
    expect(nd('hop thu sau').han).toBe('2026-11-27');
    expect(nd('Nộp báo cáo NGAY MAI').han).toBe('2026-11-24');
    expect(nd('nop bao cao mai').han).toBe('2026-11-24');
  });
  it('hôm nay, ngày kia', () => {
    expect(nd('xử lý hôm nay').han).toBe('2026-11-23');
    expect(nd('làm ngày kia').han).toBe('2026-11-25');
  });
  it('thứ: gần nhất, không tính hôm nay; thứ hai tuần sau; chủ nhật; thứ 6', () => {
    expect(nd('họp thứ hai').han).toBe('2026-11-30'); // hôm nay là thứ Hai → thứ Hai tuần sau
    expect(nd('họp thứ hai tuần sau').han).toBe('2026-11-30');
    expect(nd('họp thứ tư', '2026-11-25').han).toBe('2026-12-02'); // hôm nay là thứ Tư → không tính hôm nay
    expect(nd('họp thứ 6').han).toBe('2026-11-27');
    expect(nd('đi thứ bảy').han).toBe('2026-11-28');
    expect(nd('nộp chủ nhật').han).toBe('2026-11-29');
    expect(nd('họp thứ sáu tuần này').han).toBe('2026-11-27');
  });
  it('sau n ngày / n ngày làm việc / qua cuối tuần', () => {
    expect(nd('gửi sau 10 ngày').han).toBe('2026-12-03');
    expect(nd('gửi 5 ngày làm việc').han).toBe('2026-11-30');
    expect(nd('nộp sau 5 nlv').han).toBe('2026-11-30');
    expect(nd('xong cuối tuần').han).toBe('2026-11-27');
    expect(nd('xong cuối tuần', '2026-11-28').han).toBe('2026-12-04');
  });
  it('dd/mm đã qua → năm sau; dd/mm/yyyy; không nhận ngày sai', () => {
    expect(nd('nộp 15/12').han).toBe('2026-12-15');
    expect(nd('nộp 05/01').han).toBe('2027-01-05');
    expect(nd('nộp 23/11').han).toBe('2026-11-23');
    expect(nd('nộp 22/11').han).toBe('2027-11-22');
    expect(nd('nộp ngày 5/1/2027').han).toBe('2027-01-05');
    expect(nd('nộp 31/02').han).toBeUndefined();
    expect(nd('kế hoạch tháng 03/2027').han).toBeUndefined();
  });
  it('cuối tháng: lùi về ngày làm việc trước; qua rồi thì tháng sau', () => {
    expect(nd('tổng hợp cuối tháng', '2026-10-05').han).toBe('2026-10-30'); // 31/10 là thứ Bảy → 30/10
    expect(nd('tổng hợp cuối tháng', '2026-10-31').han).toBe('2026-11-30');
    expect(nd('cuối tháng', '2026-12-31').han).toBe('2026-12-31');
  });
});

describe('Trạng thái, nhóm, ưu tiên của việc', () => {
  it('nhóm hiển thị', () => {
    const g = (o: Partial<CongViec>) => nhomViec(viec(o), lich, '2026-11-23');
    expect(g({})).toBe('HOP_THU');
    expect(g({ han: '2026-11-20' })).toBe('QUA_HAN');
    expect(g({ han: '2026-11-23' })).toBe('HOM_NAY');
    expect(g({ han: '2026-11-27' })).toBe('TUAN_NAY');
    expect(g({ han: '2026-12-15' })).toBe('SAU');
    expect(g({ han: '2026-11-20', xong: '2026-11-21T08:00' })).toBe('XONG');
  });
  it('trạng thái SLA', () => {
    expect(trangThaiViec(viec({ han: '2026-11-20' }), lich, '2026-11-23')).toBe('QUA_HAN');
    expect(trangThaiViec(viec({ han: '2026-11-25' }), lich, '2026-11-23')).toBe('SAP_DEN');
    expect(trangThaiViec(viec({ han: '2026-11-20', xong: '2026-11-19T08:00' }), lich, '2026-11-23')).toBe('XONG_DUNG_HAN');
    expect(trangThaiViec(viec({ han: '2026-11-20', xong: '2026-11-22T08:00' }), lich, '2026-11-23')).toBe('XONG_TRE');
  });
  it('điểm ưu tiên: lãnh đạo giao cao hơn tự đặt; quá hạn +20; ghim lên đầu', () => {
    const a = diemUuTienViec(viec({ nguon: 'LANH_DAO', han: '2026-11-25' }), lich, '2026-11-23');
    const b = diemUuTienViec(viec({ nguon: 'TU_DAT', han: '2026-11-25' }), lich, '2026-11-23');
    expect(a).toBeGreaterThan(b);
    expect(diemUuTienViec(viec({ nguon: 'TU_DAT', han: '2026-11-20' }), lich, '2026-11-23')).toBeGreaterThan(20);
    const ds = sapXepViec([viec({ id: 'a', han: '2026-12-30' }), viec({ id: 'b', han: '2026-11-24' }), viec({ id: 'c', han: '2026-12-31', ghim: true })], lich, '2026-11-23');
    expect(ds.map((v) => v.id)).toEqual(['c', 'b', 'a']);
  });
});
