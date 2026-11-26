// Dữ liệu mẫu: 6 cuộc ở các giai đoạn khác nhau (TÍNH TƯƠNG ĐỐI theo ngày hôm nay), 1 kế hoạch năm,
// 10 việc khác, vài khối thời gian. MST giả `0100000xxx`. Mọi bản ghi có cờ `laDuLieuMau` để xóa riêng.
import type { CaiDat, CongViec, CuocKiemTra, KeHoach, KhoiThoiGian, NgayGio, NgayISO, SuKien } from '../core/kieu';
import { sinhChecklist } from '../core/checklist';
import { congNLV, tachNgay, type Lich } from '../core/lich';
import { chonBoQuyTac } from '../core/quyTac';
import { taoCuocRong, tinhMoc } from '../core/vuViec';
import { lanLapTu } from '../core/viec';
import type { Kho } from './kho';

export interface DuLieuMau {
  keHoach: KeHoach[];
  cuoc: CuocKiemTra[];
  viec: CongViec[];
  khoiThoiGian: KhoiThoiGian[];
}

type Dat = (c: CuocKiemTra, ma: string, ngay: NgayISO, them?: { soVB?: string; ghiChu?: string }) => void;
const dat: Dat = (c, ma, ngay, them) => {
  c.buoc[ma] = { xong: true, ngay, ...them };
};

export function taoDuLieuMau(homNay: NgayISO, lich: Lich, bayGio: NgayGio, caiDat?: Pick<CaiDat, 'canBo' | 'tenChucNangHeThong'>): DuLieuMau {
  const nam = tachNgay(homNay).nam;
  const truongDoan = caiDat?.canBo.hoTen.trim() || 'Nguyễn Văn A';
  const lui = (n: number) => congNLV(lich, homNay, -n); // n ngày làm việc trước hôm nay
  const toi = (n: number) => congNLV(lich, homNay, n);
  const cong = (d: NgayISO, n: number) => congNLV(lich, d, n);
  const thang = (d: NgayISO) => d.slice(0, 7);
  const sk = (id: string, loai: SuKien['loai'], f: Record<string, unknown>): SuKien => ({ id, loai, taoLuc: bayGio, ...f }) as SuKien;
  const co = (id: string, ma: string, mst: string, ten: string, extra: Partial<CuocKiemTra>): CuocKiemTra =>
    taoCuocRong({
      id, ma, mst, tenNNT: ten, laDuLieuMau: true, taoLuc: bayGio, truongDoan,
      thanhVien: [{ hoTen: 'Trần Thị B', phanViec: 'Thuế GTGT' }, { hoTen: 'Lê Văn C', phanViec: 'Thuế TNDN' }],
      giamSat: ['Phạm Thị D (tổ giám sát)'], diaChi: 'Phường Mẫu - TP Mẫu', thoiKy: '01/01/2024 – 31/12/2025', noiDung: 'Thuế GTGT, TNDN năm 2024–2025',
      ...extra,
    });

  const keHoach: KeHoach[] = [
    { id: 'mau-kh', nam, loai: 'KH_NAM', ten: `Kế hoạch kiểm tra năm ${nam} (dữ liệu mẫu)`, soQD: '15/QĐ-CT', ngayPheDuyet: `${nam}-01-05`, ngayCongKhai: `${nam}-01-20`, chiTieuSoCuoc: 10, laDuLieuMau: true, taoLuc: bayGio, suaLuc: bayGio },
  ];

  // ---- 1. KH – đang kiểm tra tại doanh nghiệp (ngày thứ 4) ----
  const C1 = lui(3);
  const D01 = cong(C1, -7);
  const c1 = co('mau-c1', `KT-${nam}-001`, '0100000001', 'Công ty TNHH Mẫu Một', { loai: 'KH', keHoachId: 'mau-kh', thangDuKien: thang(D01), soQD: '101/QĐ-CT' });
  const P11 = cong(D01, -10);
  dat(c1, 'P1', P11);
  dat(c1, 'P2', cong(P11, 6));
  dat(c1, 'P3', cong(P11, 7));
  dat(c1, 'P4', cong(P11, 9));
  dat(c1, 'P5', D01, { soVB: '101/QĐ-CT' });
  dat(c1, 'Q1', cong(D01, 2));
  dat(c1, 'Q2', cong(D01, 3));
  dat(c1, 'Q3', cong(C1, -1));
  dat(c1, 'Q4', cong(C1, -1));
  dat(c1, 'Q5', C1);
  c1.yeuCauTaiLieu = [
    { id: 'mau-c1-y1', noiDung: 'Sổ chi tiết tài khoản 331, 641 năm 2025', guiLuc: `${lui(1)}T15:00` },
    { id: 'mau-c1-y2', noiDung: 'Hợp đồng vay và chứng từ trả lãi', guiLuc: `${lui(2)}T09:00`, nhanLuc: `${lui(2)}T14:00` },
  ];
  c1.vuongMac = [{ id: 'mau-c1-v1', noiDung: 'Hỏi ý kiến về chi phí lãi vay vượt mức khống chế', ngayBaoCao: lui(2), daXong: false }];

  // ---- 2. TH – chờ công bố ----
  const D02 = lui(3);
  const c2 = co('mau-c2', `KT-${nam}-002`, '0100000002', 'Công ty CP Mẫu Hai', { loai: 'TH', hanNgoai: toi(12), hanNgoaiGhiChu: 'Hạn giải quyết hồ sơ hoàn thuế GTGT', vanBanGiao: '3456/CT-KT', noiDung: 'Hoàn thuế GTGT kỳ 2025', soQD: '102/QĐ-CT' });
  dat(c2, 'P1', cong(D02, -8));
  dat(c2, 'P5', D02, { soVB: '102/QĐ-CT' });
  dat(c2, 'Q1', cong(D02, 1));

  // ---- 3. GT – đang ở giai đoạn biên bản (hạn ký biên bản còn 3 ngày LV) ----
  const K3 = lui(2);
  const C3 = cong(K3, -10);
  const D03 = cong(C3, -6);
  const c3 = co('mau-c3', `KT-${nam}-003`, '0100000003', 'Công ty TNHH Mẫu Ba', { loai: 'GT', noiDung: 'Giải thể doanh nghiệp', soQD: '103/QĐ-CT' });
  dat(c3, 'P1', cong(D03, -6));
  dat(c3, 'P5', D03, { soVB: '103/QĐ-CT' });
  for (const [ma, n] of [['Q1', 1], ['Q2', 3], ['Q3', 4], ['Q4', 4]] as const) dat(c3, ma, cong(D03, n));
  dat(c3, 'Q5', C3);
  dat(c3, 'T5', cong(K3, -3));
  dat(c3, 'T6', cong(K3, -2));
  dat(c3, 'T7', K3);

  // ---- 4. GDLK – chờ QĐ xử lý, NNT có giải trình (chế độ X2) ----
  const B4 = lui(5);
  const K4 = cong(B4, -3);
  const C4 = cong(K4, -17);
  const D04 = cong(C4, -6);
  const R4 = cong(B4, 2);
  const c4 = co('mau-c4', `KT-${nam}-004`, '0100000004', 'Công ty TNHH Mẫu Tư', {
    loai: 'KH', keHoachId: 'mau-kh', coGDLK: true, noiDung: 'Chi phí lãi vay; giao dịch liên kết', soQD: '104/QĐ-CT',
    ketQua: { coXuLy: true, truyThu: 850_000_000, phat: 170_000_000, chamNop: 25_000_000, giamKhauTru: 120_000_000, giamLo: 300_000_000, thuHoiHoan: 0, hanhViViPham: 'Khai sai dẫn đến thiếu thuế TNDN' },
  });
  dat(c4, 'P1', cong(D04, -9));
  dat(c4, 'P5', D04, { soVB: '104/QĐ-CT' });
  for (const [ma, n] of [['Q1', 1], ['Q2', 3], ['Q3', 4], ['Q4', 4]] as const) dat(c4, ma, cong(D04, n));
  dat(c4, 'Q5', C4);
  dat(c4, 'T5', cong(K4, -3));
  dat(c4, 'T6', cong(K4, -2));
  dat(c4, 'T7', K4);
  dat(c4, 'B1', B4);
  dat(c4, 'B4', R4);
  c4.suKien = [sk('mau-c4-s1', 'GIAI_TRINH', { ngay: cong(B4, 1), hinhThuc: 'Văn bản', ghiChu: 'NNT giải trình về chi phí lãi vay' })];

  // ---- 5. Bãi bỏ QĐ kiểm tra ----
  const D05 = lui(15);
  const c5 = co('mau-c5', `KT-${nam}-005`, '0100000005', 'Công ty TNHH Mẫu Năm', { loai: 'VP', noiDung: 'Dấu hiệu vi phạm pháp luật thuế', soQD: '105/QĐ-CT' });
  dat(c5, 'P1', cong(D05, -7));
  dat(c5, 'P5', D05, { soVB: '105/QĐ-CT' });
  dat(c5, 'Q1', cong(D05, 2));
  c5.suKien = [sk('mau-c5-s1', 'BAI_BO', { ngayQD: cong(D05, 6), soQD: '109/QĐ-CT', lyDo: 'Có thông tin mới – bãi bỏ QĐ kiểm tra để xác minh thêm' })];

  // ---- 6. Chuyển tiếp QTKT-970, sau QĐ xử phạt, đang theo dõi nộp tiền ----
  // Cuộc này dùng NGÀY CỐ ĐỊNH vì bộ QTKT-970 chỉ áp dụng cho QĐ kiểm tra ban hành trước 01/7/2026.
  const c6 = co('mau-c6', `KT-2026-006`, '0100000006', 'Công ty TNHH Mẫu Sáu', {
    loai: 'KH', soQD: '71/QĐ-CT', noiDung: 'Thuế TNDN năm 2024', thoiKy: '01/01/2024 – 31/12/2024',
    ketQua: { coXuLy: true, truyThu: 420_000_000, phat: 84_000_000, chamNop: 18_500_000, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0, loaiVanBanXL: 'QD_XU_PHAT', soQDXL: '88/QĐ-XPHC', hanhViViPham: 'Khai thiếu doanh thu' },
    nopTien: [
      { id: 'mau-c6-n1', ngay: '2026-07-28', soTien: 200_000_000, daNhapTTR: true },
      { id: 'mau-c6-n2', ngay: '2026-08-10', soTien: 150_000_000, daNhapTTR: false },
    ],
  });
  for (const [ma, ngay] of [['P1', '2026-05-18'], ['P5', '2026-06-10'], ['Q1', '2026-06-12'], ['Q2', '2026-06-15'], ['Q3', '2026-06-16'], ['Q4', '2026-06-16'], ['Q5', '2026-06-17'], ['T5', '2026-06-29'], ['T6', '2026-06-30'], ['T7', '2026-07-01'], ['B1', '2026-07-03'], ['B4', '2026-07-07'], ['B5', '2026-07-10'], ['X', '2026-07-14'], ['S1', '2026-07-17'], ['S5', '2026-07-16']] as const) dat(c6, ma, ngay);
  c6.buoc.P5.soVB = '71/QĐ-CT';

  c6.buoc.S3 = { xong: true, ngay: '2026-07-17' };
  // Các bước chuẩn bị nội bộ (P2–P4) đã làm xong trước khi ban hành QĐ
  for (const c of [c2, c3, c4, c5, c6]) {
    const p1 = c.buoc.P1.ngay!;
    dat(c, 'P2', cong(p1, 3));
    dat(c, 'P3', cong(p1, 4));
    dat(c, 'P4', cong(p1, 5));
  }
  const cuoc = [c1, c2, c3, c4, c5, c6];

  // ---- Checklist & nhật ký ----
  const tick = (c: CuocKiemTra, chonMa: (ma: string, khoa: string) => boolean) => {
    const bo = chonBoQuyTac(c.buoc.P5?.xong ? c.buoc.P5.ngay : undefined, homNay, undefined);
    const kq = tinhMoc(c, { lich, homNay, bo });
    for (const v of sinhChecklist(c, kq, lich, homNay)) {
      if (v.hangNgay || v.xong) continue;
      if (chonMa(v.ma, v.khoa)) c.checklist[v.khoa] = v.phatSinh;
    }
  };
  tick(c1, (ma) => ma !== 'ITNK_CB'); // còn thiếu ITNK_CB (quá hạn) để minh họa
  for (let d = C1; d <= lui(2); d = cong(d, 1)) if (!c1.nhatKy[d]) c1.nhatKy[d] = { daGhiITNK: true };
  tick(c2, (ma) => ma === 'TTR_QD' || ma === 'ITNK_QD');
  tick(c3, (ma) => ma !== 'ITNK_KT');
  for (let d = C3; d <= K3; d = cong(d, 1)) c3.nhatKy[d] = { daGhiITNK: true };
  tick(c4, () => true);
  for (let d = C4; d <= K4; d = cong(d, 1)) c4.nhatKy[d] = { daGhiITNK: true };
  tick(c5, (ma) => ma !== 'ITNK_HUY');
  tick(c6, (_ma, khoa) => khoa !== 'TTR_NOP#mau-c6-n2');

  // ---- 10 việc khác ----
  const v = (id: string, o: Partial<CongViec> & { tieuDe: string }): CongViec => ({ id, nguon: 'TU_DAT', viecCon: [], laDuLieuMau: true, taoLuc: bayGio, suaLuc: bayGio, ...o });
  const lapDen = (lap: string) => lanLapTu(lich, lap, homNay);
  const viec: CongViec[] = [
    v('mau-v1', { tieuDe: 'Nhập báo cáo tháng kết quả kiểm tra (03, 04, 05/QTKT-MC) – hạn trước ngày 01 tháng sau', nguon: 'THUONG_XUYEN', mauMa: 'BC_THANG', lap: 'THANG:28', gio: '08:00', nhom: 'Báo cáo', han: lapDen('THANG:28') }),
    v('mau-v2', { tieuDe: 'Tổng hợp, đôn đốc thu nộp sau kiểm tra', nguon: 'THUONG_XUYEN', mauMa: 'DON_DOC_NOP', lap: 'TUAN:5', gio: '09:00', nhom: 'Sau kiểm tra', han: lapDen('TUAN:5') }),
    v('mau-v3', { tieuDe: 'Trả lời Công văn 1234/CT-KT về số liệu kiểm tra', nguon: 'VAN_BAN', soVB: '1234/CT-KT', nguoiGiao: 'Phòng Tổng hợp', han: lui(2), viecCon: [{ id: 'mau-v3-1', tieuDe: 'Rà số liệu', xong: true }, { id: 'mau-v3-2', tieuDe: 'Dự thảo văn bản trả lời', xong: false }] }),
    v('mau-v4', { tieuDe: 'Chuẩn bị số liệu cung cấp cho Kiểm toán Nhà nước', nguon: 'LANH_DAO', nguoiGiao: 'Lãnh đạo phòng', nhom: 'Cung cấp số liệu cho Kiểm toán Nhà nước / Thanh tra / Công an', han: homNay, gio: '15:00' }),
    v('mau-v5', { tieuDe: 'Xác minh đơn phản ánh của công dân', nguon: 'VAN_BAN', soVB: '56/PA-CT', nhom: 'Giải quyết tố cáo, phản ánh, kiến nghị', han: toi(4) }),
    v('mau-v6', { tieuDe: 'Rà soát dữ liệu kiểm tra trên TTR trước chốt số liệu ngày 15', nguon: 'THUONG_XUYEN', mauMa: 'RS_13', lap: 'THANG:13', gio: '08:00', nhom: 'Báo cáo', han: lapDen('THANG:13') }),
    v('mau-v7', { tieuDe: 'Soạn tờ trình đề xuất kiểm tra chuyên đề', han: toi(8) }),
    v('mau-v8', { tieuDe: 'Đọc lại Quy trình kiểm tra mới (QĐ 1161)' }),
    v('mau-v9', { tieuDe: 'Gửi bản tin tuần cho lãnh đạo phòng', nguon: 'LANH_DAO', han: lui(1), ghim: true }),
    v('mau-v10', { tieuDe: 'In hồ sơ lưu trữ cuộc kiểm tra năm trước', han: lui(3), xong: `${lui(1)}T16:00` }),
  ];

  // ---- Khối thời gian ----
  const khoiThoiGian: KhoiThoiGian[] = [
    { id: 'mau-b1', ngay: homNay, tu: '07:30', den: '11:30', tieuDe: 'Tại DN Công ty TNHH Mẫu Một', cuocId: 'mau-c1', laDuLieuMau: true },
    { id: 'mau-b2', ngay: homNay, tu: '14:00', den: '15:00', tieuDe: 'Họp giao ban phòng', laDuLieuMau: true },
    { id: 'mau-b3', ngay: toi(1), tu: '09:00', den: '09:30', tieuDe: 'Nhập TTR/iTNK sau mốc công bố', cuocId: 'mau-c1', laDuLieuMau: true },
  ];

  return { keHoach, cuoc, viec, khoiThoiGian };
}

type BanGhiTho = { id: string } & Record<string, unknown>;

/** Thêm dữ liệu mẫu (idempotent: chạy lại không nhân đôi vì id cố định). */
export async function themDuLieuMau(
  kho: Kho,
  homNay: NgayISO,
  lich: Lich,
  bayGio: NgayGio,
  caiDat?: Pick<CaiDat, 'canBo' | 'tenChucNangHeThong'>,
): Promise<{ soCuoc: number; soViec: number }> {
  const m = taoDuLieuMau(homNay, lich, bayGio, caiDat);
  // việc lặp lại từ mẫu: nếu đã có bản đang mở (do app tự tạo) thì không thêm bản trùng
  const dangMo = new Set((await kho.tatCa<{ mauMa?: string; xong?: string; xoaLuc?: string }>('viec')).filter((v) => v.mauMa && !v.xong && !v.xoaLuc).map((v) => v.mauMa as string));
  const viecMoi = m.viec.filter((v) => !(v.mauMa && dangMo.has(v.mauMa)));
  for (const k of m.keHoach) await kho.ghiTho('keHoach', k as unknown as BanGhiTho);
  for (const c of m.cuoc) await kho.ghiTho('cuoc', c as unknown as BanGhiTho);
  for (const x of viecMoi) await kho.ghiTho('viec', x as unknown as BanGhiTho);
  for (const b of m.khoiThoiGian) await kho.ghiTho('khoiThoiGian', b as unknown as BanGhiTho);
  await kho.ghiNhatKy({ luc: bayGio, hanhDong: 'THEM', doiTuong: 'duLieuMau', sau: { cuoc: m.cuoc.length, viec: viecMoi.length } });
  return { soCuoc: m.cuoc.length, soViec: viecMoi.length };
}

const KHO_CO_CO_MAU = ['keHoach', 'cuoc', 'viec', 'khoiThoiGian'] as const;

/** Xóa riêng dữ liệu mẫu (xóa hẳn các bản ghi có cờ laDuLieuMau); dữ liệu thật giữ nguyên. */
export async function xoaDuLieuMau(kho: Kho, bayGio: NgayGio): Promise<number> {
  let n = 0;
  for (const k of KHO_CO_CO_MAU) {
    for (const d of await kho.tatCa<{ id: string; laDuLieuMau?: boolean }>(k)) {
      if (d.laDuLieuMau) {
        await kho.xoaVinhVien(k, d.id, false);
        n++;
      }
    }
  }
  await kho.ghiNhatKy({ luc: bayGio, hanhDong: 'XOA', doiTuong: 'duLieuMau', sau: { soBanGhi: n } });
  return n;
}

export async function coDuLieuMau(kho: Kho): Promise<boolean> {
  for (const k of KHO_CO_CO_MAU) {
    if ((await kho.tatCa<{ laDuLieuMau?: boolean }>(k)).some((d) => d.laDuLieuMau)) return true;
  }
  return false;
}
