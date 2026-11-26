import { describe, it, expect } from 'vitest';
import { chuanHoaThang, docDongKeHoach, goiYGhepCot, nhanDienCot, timDongTieuDe } from '../src/core/nhapXuat';
import { taoCuocRong } from '../src/core/vuViec';

describe('Nhận diện cột', () => {
  it('tiêu đề mẫu 06/QTKT-TC', () => {
    const h = ['STT', 'Tên người nộp thuế', 'Mã số thuế', 'Địa chỉ', 'Nội dung kiểm tra', 'Chuyên đề', 'Thời gian dự kiến', 'Trưởng đoàn'];
    expect(goiYGhepCot(h)).toEqual(['stt', 'ten', 'mst', 'diaChi', 'noiDung', 'chuyenDe', 'thoiGian', 'truongDoan']);
  });
  it('gần đúng: không dấu, hoa thường, viết tắt', () => {
    expect(nhanDienCot('TEN NNT')).toBe('ten');
    expect(nhanDienCot('MST')).toBe('mst');
    expect(nhanDienCot('Dia chi tru so')).toBe('diaChi');
    expect(nhanDienCot('Tháng dự kiến')).toBe('thoiGian');
    expect(nhanDienCot('Cột lạ')).toBeNull();
  });
  it('mỗi trường chỉ gán một cột', () => {
    expect(goiYGhepCot(['Tên NNT', 'Tên công ty'])).toEqual(['ten', null]);
  });
  it('tìm dòng tiêu đề khi có dòng tiêu đề bảng phía trên', () => {
    const rows = [['DANH SÁCH KIỂM TRA NĂM 2027'], [], ['STT', 'Tên NNT', 'MST'], ['1', 'A', '0100000001']];
    expect(timDongTieuDe(rows)).toBe(2);
    expect(timDongTieuDe([['a', 'b'], ['c', 'd']])).toBe(-1);
  });
});

describe('chuanHoaThang', () => {
  it.each([
    ['03/2027', '2027-03'],
    ['3/2027', '2027-03'],
    ['tháng 3/2027', '2027-03'],
    ['2027-03', '2027-03'],
    ['2027-03-01', '2027-03'],
    ['15/03/2027', '2027-03'],
    ['Mar-27', '2027-03'],
    ['Mar 2027', '2027-03'],
    ['7', '2027-07'],
    ['Tháng 12', '2027-12'],
  ])('%s → %s', (v, kq) => expect(chuanHoaThang(v, 2027)).toBe(kq));
  it('không đọc được', () => {
    expect(chuanHoaThang('quý 2', 2027)).toBeUndefined();
    expect(chuanHoaThang('13/2027', 2027)).toBeUndefined();
    expect(chuanHoaThang('', 2027)).toBeUndefined();
  });
});

describe('docDongKeHoach', () => {
  const ghep = ['stt', 'ten', 'mst', 'diaChi', 'noiDung', 'chuyenDe', 'thoiGian', 'truongDoan'] as const;
  const ng = { nam: 2027, cuocDaCo: [], keHoach: [] };
  it('dòng hợp lệ', () => {
    const r = docDongKeHoach([['1', 'Cty A', '0100000001', 'HN', 'GTGT', '', '03/2027', 'Nguyễn A']], [...ghep], 0, ng);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ dong: 1, ten: 'Cty A', mst: '0100000001', thangDuKien: '2027-03', truongDoan: 'Nguyễn A', loi: [], canhBao: [], trung: false });
  });
  it('bỏ dòng trống, đánh số dòng theo tệp', () => {
    const r = docDongKeHoach([['STT', 'Tên'], ['', '', ''], ['1', 'Cty A', '0100000001']], [...ghep], 1, ng);
    expect(r.map((x) => x.dong)).toEqual([3]);
  });
  it('MST bị Excel làm mất số 0 đầu → tự thêm kèm cảnh báo', () => {
    const r = docDongKeHoach([['1', 'Cty A', '100000001']], [...ghep], 0, ng);
    expect(r[0].mst).toBe('0100000001');
    expect(r[0].loi).toEqual([]);
    expect(r[0].canhBao.join()).toContain('số 0 đầu');
  });
  it('thiếu tên hoặc MST sai → lỗi chặn', () => {
    const r = docDongKeHoach([['1', '', '0100000001'], ['2', 'Cty B', '12345']], [...ghep], 0, ng);
    expect(r[0].loi).toContain('Thiếu tên người nộp thuế.');
    expect(r[1].loi.length).toBe(1);
  });
  it('trùng MST trong tệp và với cuộc đã có cùng năm', () => {
    const co = taoCuocRong({ id: 'c1', ma: 'KT-2027-001', taoLuc: '2027-01-02T08:00', mst: '0100000002', thangDuKien: '2027-05' });
    const kh = [{ id: 'k1', nam: 2027, loai: 'KH_NAM' as const, ten: 'KH 2027' }];
    co.keHoachId = 'k1';
    const r = docDongKeHoach([['1', 'A', '0100000001'], ['2', 'A2', '0100000001'], ['3', 'B', '0100000002']], [...ghep], 0, { nam: 2027, cuocDaCo: [co], keHoach: kh });
    expect(r.map((x) => x.trung)).toEqual([false, true, true]);
    expect(r[1].canhBao.join()).toContain('dòng 1');
    expect(r[2].canhBao.join()).toContain('KT-2027-001');
  });
  it('thời gian ngoài năm kế hoạch hoặc không đọc được → cảnh báo, không chặn', () => {
    const r = docDongKeHoach([['1', 'A', '0100000001', '', '', '', '03/2028'], ['2', 'B', '0100000002', '', '', '', 'quý 2']], [...ghep], 0, ng);
    expect(r.every((x) => x.loi.length === 0 && x.canhBao.length === 1)).toBe(true);
    expect(r[1].thangDuKien).toBeUndefined();
  });
});
