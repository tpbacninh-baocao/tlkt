// Đồng hồ: yêu cầu tài liệu (06 giờ làm việc) và vướng mắc (3 chặng × 02 NLV) – SPEC §8, rules.dongHo.
import type { BoQuyTac, NgayGio, NgayISO, TrangThaiMoc, VuongMac, YeuCauTaiLieu } from '../kieu';
import { congGioLV, congNLV, demNLV, dinhDangThoiLuong, phutLamViecGiua, type Lich } from '../lich';
import { trangThaiTheoHan } from './tinhMoc';

export type TrangThaiYeuCau = 'DA_NHAN_DUNG_HAN' | 'DA_NHAN_TRE' | 'CON_HAN' | 'SAP_HET' | 'QUA_HAN';

export interface DongHoYeuCau {
  han: NgayGio;
  trangThai: TrangThaiYeuCau;
  /** Số phút làm việc còn lại (âm = đã quá) – chỉ khi chưa nhận */
  conLaiPhut?: number;
  nhan: string;
  goiY?: string;
}

/** Hạn NNT cung cấp tài liệu = thời điểm gửi + 06 giờ làm việc. */
export function hanYeuCauTaiLieu(lich: Lich, bo: BoQuyTac, y: Pick<YeuCauTaiLieu, 'guiLuc'>): NgayGio {
  const cfg = bo.dongHo.YEU_CAU_TAI_LIEU;
  return congGioLV(lich, y.guiLuc, cfg.so);
}

export function dongHoYeuCau(lich: Lich, bo: BoQuyTac, y: YeuCauTaiLieu, bayGio: NgayGio): DongHoYeuCau {
  const cfg = bo.dongHo.YEU_CAU_TAI_LIEU;
  const han = hanYeuCauTaiLieu(lich, bo, y);
  if (y.nhanLuc) {
    const dung = y.nhanLuc <= han;
    return { han, trangThai: dung ? 'DA_NHAN_DUNG_HAN' : 'DA_NHAN_TRE', nhan: dung ? 'Đã nhận đúng hạn' : 'Đã nhận – trễ hạn' };
  }
  if (bayGio > han) {
    const tre = phutLamViecGiua(lich, han, bayGio);
    return {
      han,
      trangThai: 'QUA_HAN',
      conLaiPhut: -tre,
      nhan: `Quá hạn ${dinhDangThoiLuong(tre)} làm việc`,
      goiY: cfg.quaHan,
    };
  }
  const con = phutLamViecGiua(lich, bayGio, han);
  const sap = con <= (cfg.nhacTruocPhut ?? 60);
  return {
    han,
    trangThai: sap ? 'SAP_HET' : 'CON_HAN',
    conLaiPhut: con,
    nhan: `Còn ${dinhDangThoiLuong(con)} LV`,
  };
}

// ---------- Vướng mắc: 3 chặng, mỗi chặng 02 NLV ----------
export interface ChangVuongMac {
  ma: 'VUONG_MAC_LANH_DAO' | 'VUONG_MAC_LAY_Y_KIEN' | 'VUONG_MAC_TONG_HOP';
  ten: string;
  tu?: NgayISO; // ngày bắt đầu đếm
  han?: NgayISO;
  ngayXong?: NgayISO;
  trangThai: TrangThaiMoc;
  canCu: string;
}

const CHANG: { ma: ChangVuongMac['ma']; maQT: string; truongXong: keyof VuongMac }[] = [
  { ma: 'VUONG_MAC_LANH_DAO', maQT: 'VUONG_MAC_LANH_DAO', truongXong: 'ngayLanhDaoBaoCao' },
  { ma: 'VUONG_MAC_LAY_Y_KIEN', maQT: 'VUONG_MAC_LAY_Y_KIEN', truongXong: 'ngayNhanYKien' },
  { ma: 'VUONG_MAC_TONG_HOP', maQT: 'VUONG_MAC_TONG_HOP', truongXong: 'ngayTongHop' },
];

/**
 * Chặng 1: từ ngày báo cáo → lãnh đạo bộ phận chỉ đạo/xin ý kiến (hoàn thành khi có ngayLanhDaoBaoCao).
 * Chặng 2: từ ngày lãnh đạo → gửi văn bản lấy ý kiến (hoàn thành khi có ngayNhanYKien).
 * Chặng 3: từ ngày nhận ý kiến → đoàn tổng hợp báo cáo (hoàn thành khi có ngayTongHop).
 */
export function dongHoVuongMac(lich: Lich, bo: BoQuyTac, v: VuongMac, homNay: NgayISO): ChangVuongMac[] {
  const kq: ChangVuongMac[] = [];
  for (const c of CHANG) {
    const cfg = bo.dongHo[c.maQT];
    const tu = (cfg.tu ? (v[cfg.tu as keyof VuongMac] as NgayISO | undefined) : undefined) || undefined;
    const ngayXong = v[c.truongXong] as NgayISO | undefined;
    const han = tu ? congNLV(lich, tu, cfg.so) : undefined;
    let trangThai: TrangThaiMoc = 'CHUA_DEN';
    if (!tu) trangThai = 'CHUA_DEN';
    else if (ngayXong) trangThai = ngayXong <= han! ? 'XONG_DUNG_HAN' : 'XONG_TRE';
    else if (v.daXong) trangThai = 'KHONG_AP_DUNG';
    else trangThai = trangThaiTheoHan(lich, homNay, han, false);
    kq.push({ ma: c.ma, ten: cfg.ten, tu, han, ngayXong, trangThai, canCu: cfg.canCu });
  }
  return kq;
}

/** Chặng đang chạy của một vướng mắc (chặng đầu tiên chưa có ngày hoàn thành mà đã có ngày bắt đầu). */
export function changDangChay(chang: ChangVuongMac[]): ChangVuongMac | undefined {
  return chang.find((c) => c.tu && !c.ngayXong && c.trangThai !== 'KHONG_AP_DUNG');
}

export function nlvConLaiChang(lich: Lich, c: ChangVuongMac, homNay: NgayISO): number | undefined {
  return c.han ? demNLV(lich, homNay, c.han) : undefined;
}
