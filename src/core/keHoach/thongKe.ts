// Tiến độ kế hoạch năm: chỉ tiêu, đếm theo giai đoạn, tiền, tích lũy theo tháng, cảnh báo (UI §4.11).
import type { CuocKiemTra, GiaiDoan, Id, KeHoach, NgayISO } from '../kieu';
import { demNLV, tachNgay, type Lich } from '../lich';
import { chonBoQuyTac, type VaQuyTac } from '../quyTac';
import { THU_TU_GIAI_DOAN, tinhGiaiDoan } from '../vuViec/giaiDoan';
import { tinhMoc } from '../vuViec/tinhMoc';
import { hanCuaKeHoach } from './han';

export interface DuLieuKeHoach {
  homNay: NgayISO;
  lich: Lich;
  cuoc: CuocKiemTra[];
  keHoach: KeHoach[];
  va?: VaQuyTac;
}

export interface BoLocKeHoach {
  nam: number;
  /** Bỏ trống = tất cả kế hoạch của năm */
  keHoachId?: Id;
  /** Chỉ tính các cuộc của một trưởng đoàn (bản cá nhân) */
  truongDoan?: string;
}

export interface ThangTichLuy {
  thang: number; // 1..12
  /** Số cuộc có QĐ xử lý/KL tích lũy đến hết tháng – undefined với tháng chưa tới */
  thucTe?: number;
  /** Số cuộc đã ban hành QĐ kiểm tra tích lũy – undefined với tháng chưa tới */
  banHanhQD?: number;
  /** Đường lý tưởng tuyến tính đến 31/12 */
  lyTuong: number;
}

export interface CanhBaoKeHoach {
  ma: 'QUA_THANG_DU_KIEN' | 'CUOI_NAM' | 'CONG_KHAI_KE_HOACH' | 'BAO_CAO_CHUYEN_DE' | 'VUOT_CHI_TIEU';
  muc: 'THONG_TIN' | 'CANH_BAO' | 'KHAN';
  noiDung: string;
  cuocIds?: Id[];
  keHoachId?: Id;
}

export interface ThongKeKeHoach {
  chiTieu: number;
  /** Số cuộc thực tế thuộc phạm vi lọc */
  soCuoc: number;
  duocGiao: number;
  daBanHanhQD: number;
  daCongBo: number;
  daKetThucTaiDN: number;
  daCoQDXuLy: number;
  baiBo: number;
  tonChuyenNamSau: number;
  theoGiaiDoan: Record<GiaiDoan, number>;
  tien: { truyThu: number; phat: number; chamNop: number; giamKhauTru: number; giamLo: number; thuHoiHoan: number; phaiNop: number; daNop: number; conPhaiNop: number };
  tichLuyThang: ThangTichLuy[];
  canhBao: CanhBaoKeHoach[];
}

const xong = (c: CuocKiemTra, ma: string): string | undefined => (c.buoc[ma]?.xong ? c.buoc[ma].ngay : undefined);

/** Cuộc thuộc kế hoạch nào → năm: theo kế hoạch; không có kế hoạch thì theo năm ban hành QĐ, ngày tạo. */
export function namCuaCuoc(c: CuocKiemTra, keHoach: KeHoach[]): number {
  const kh = c.keHoachId ? keHoach.find((k) => k.id === c.keHoachId) : undefined;
  if (kh) return kh.nam;
  const d0 = xong(c, 'P5');
  return Number((d0 ?? c.taoLuc).slice(0, 4));
}

export function locCuoc(d: DuLieuKeHoach, loc: BoLocKeHoach): CuocKiemTra[] {
  return d.cuoc.filter((c) => {
    if (c.xoaLuc) return false;
    if (namCuaCuoc(c, d.keHoach) !== loc.nam) return false;
    if (loc.keHoachId && c.keHoachId !== loc.keHoachId) return false;
    if (loc.truongDoan && c.truongDoan !== loc.truongDoan) return false;
    return true;
  });
}

const thangCua = (n: NgayISO) => tachNgay(n).thang;
const namCua = (n: NgayISO) => tachNgay(n).nam;

export function thongKeKeHoach(d: DuLieuKeHoach, loc: BoLocKeHoach): ThongKeKeHoach {
  const cs = locCuoc(d, loc);
  const khPhamVi = d.keHoach.filter((k) => !k.xoaLuc && k.nam === loc.nam && (!loc.keHoachId || k.id === loc.keHoachId));
  const chiTieuDat = khPhamVi.reduce((t, k) => t + (k.chiTieuSoCuoc ?? 0), 0);
  const chiTieu = chiTieuDat || cs.length;

  const theoGiaiDoan = Object.fromEntries(THU_TU_GIAI_DOAN.map((g) => [g, 0])) as Record<GiaiDoan, number>;
  const tien = { truyThu: 0, phat: 0, chamNop: 0, giamKhauTru: 0, giamLo: 0, thuHoiHoan: 0, phaiNop: 0, daNop: 0, conPhaiNop: 0 };
  let daBanHanhQD = 0;
  let daCongBo = 0;
  let daKetThucTaiDN = 0;
  let daCoQDXuLy = 0;
  let baiBo = 0;
  let ton = 0;
  const ngayD0: NgayISO[] = [];
  const ngayX: NgayISO[] = [];

  for (const c of cs) {
    const bo = chonBoQuyTac(xong(c, 'P5'), d.homNay, c.boQuyTacGhiDe, d.va);
    const gd = tinhGiaiDoan(c, tinhMoc(c, { lich: d.lich, homNay: d.homNay, bo }));
    theoGiaiDoan[gd]++;
    const bb = gd === 'BAI_BO';
    if (bb) baiBo++;
    const d0 = xong(c, 'P5');
    const x = xong(c, 'X');
    if (!bb) {
      if (d0) {
        daBanHanhQD++;
        ngayD0.push(d0);
      }
      if (xong(c, 'Q5')) daCongBo++;
      if (xong(c, 'T7')) daKetThucTaiDN++;
      if (x) {
        daCoQDXuLy++;
        ngayX.push(x);
      } else ton++;
    }
    const k = c.ketQua;
    tien.truyThu += k.truyThu;
    tien.phat += k.phat;
    tien.chamNop += k.chamNop;
    tien.giamKhauTru += k.giamKhauTru;
    tien.giamLo += k.giamLo;
    tien.thuHoiHoan += k.thuHoiHoan;
    tien.daNop += c.nopTien.reduce((t, l) => t + l.soTien, 0);
  }
  tien.phaiNop = tien.truyThu + tien.phat + tien.chamNop;
  tien.conPhaiNop = Math.max(0, tien.phaiNop - tien.daNop);

  // Tích lũy theo tháng
  const thangHienTai = namCua(d.homNay) === loc.nam ? thangCua(d.homNay) : namCua(d.homNay) > loc.nam ? 12 : 0;
  const tichLuyThang: ThangTichLuy[] = [];
  for (let t = 1; t <= 12; t++) {
    const denHet = (n: NgayISO) => namCua(n) < loc.nam || (namCua(n) === loc.nam && thangCua(n) <= t);
    const toi = t <= thangHienTai;
    tichLuyThang.push({
      thang: t,
      thucTe: toi ? ngayX.filter(denHet).length : undefined,
      banHanhQD: toi ? ngayD0.filter(denHet).length : undefined,
      lyTuong: Math.round(((chiTieu * t) / 12) * 100) / 100,
    });
  }

  // ----- Cảnh báo -----
  const canhBao: CanhBaoKeHoach[] = [];
  const homNayThang = `${namCua(d.homNay)}-${String(thangCua(d.homNay)).padStart(2, '0')}`;
  const chuaQD = cs.filter((c) => c.keHoachId && !xong(c, 'P5') && !c.suKien.some((s) => s.loai === 'BAI_BO'));
  const quaThang = chuaQD.filter((c) => c.thangDuKien && c.thangDuKien < homNayThang);
  if (quaThang.length) {
    canhBao.push({ ma: 'QUA_THANG_DU_KIEN', muc: 'CANH_BAO', noiDung: `${quaThang.length} cuộc kế hoạch đã quá tháng dự kiến mà chưa ban hành QĐ kiểm tra.`, cuocIds: quaThang.map((c) => c.id) });
  }
  if (namCua(d.homNay) === loc.nam && thangCua(d.homNay) >= 10) {
    const chuaKiemTra = cs.filter((c) => c.keHoachId && !xong(c, 'Q5') && !c.suKien.some((s) => s.loai === 'BAI_BO'));
    if (chuaKiemTra.length) {
      canhBao.push({ ma: 'CUOI_NAM', muc: thangCua(d.homNay) >= 11 ? 'KHAN' : 'CANH_BAO', noiDung: `${chuaKiemTra.length} cuộc chưa kiểm tra – cân nhắc chuyển sang đầu năm sau (Đ15.5.e).`, cuocIds: chuaKiemTra.map((c) => c.id) });
    }
  }
  const boMd = chonBoQuyTac(undefined, d.homNay, undefined, d.va);
  for (const kh of khPhamVi) {
    for (const h of hanCuaKeHoach(d.lich, boMd, kh, d.homNay)) {
      if (h.ngayXong || !h.han) continue;
      if (['QUA_HAN', 'HOM_NAY', 'SAP_DEN'].includes(h.trangThai)) {
        const nlv = demNLV(d.lich, d.homNay, h.han);
        const cau = h.trangThai === 'QUA_HAN' ? `đã quá hạn ${-nlv} ngày LV` : h.trangThai === 'HOM_NAY' ? 'hạn hôm nay' : `còn ${nlv} ngày LV`;
        canhBao.push({
          ma: h.ma === 'CONG_KHAI_KE_HOACH' ? 'CONG_KHAI_KE_HOACH' : 'BAO_CAO_CHUYEN_DE',
          muc: h.trangThai === 'SAP_DEN' ? 'CANH_BAO' : 'KHAN',
          noiDung: `${kh.ten}: ${h.ten} ${cau} (hạn ${h.han.slice(8, 10)}/${h.han.slice(5, 7)}/${h.han.slice(0, 4)}).`,
          keHoachId: kh.id,
        });
      }
    }
  }
  if (chiTieuDat && cs.length > chiTieuDat) {
    canhBao.push({ ma: 'VUOT_CHI_TIEU', muc: 'THONG_TIN', noiDung: `Số cuộc (${cs.length}) vượt chỉ tiêu được giao (${chiTieuDat}).` });
  }

  return {
    chiTieu,
    soCuoc: cs.length,
    duocGiao: chiTieu,
    daBanHanhQD,
    daCongBo,
    daKetThucTaiDN,
    daCoQDXuLy,
    baiBo,
    tonChuyenNamSau: ton,
    theoGiaiDoan,
    tien,
    tichLuyThang,
    canhBao,
  };
}
