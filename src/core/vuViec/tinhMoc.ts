// Tính toàn bộ mốc của MỘT cuộc kiểm tra (ARCHITECTURE §4.5–4.7). Hàm thuần: chỉ lưu đầu vào, kết quả tính lại mỗi lần.
import type { BoQuyTac, BuocQuyTac, CuocKiemTra, MocTinh, NgayISO, TrangThaiMoc } from '../kieu';
import { demNLV, laNgayISO, type Lich } from '../lich';
import {
  chonBoQuyTac,
  chonCheDoX,
  tinhHan,
  tinhHanMucTieu,
  type BangMoc,
  type KetQuaHan,
  type NguCanhHan,
  type VaQuyTac,
} from '../quyTac';

export interface NguCanhTinhMoc {
  lich: Lich;
  homNay: NgayISO;
  /** Nếu không truyền: chọn theo D0 thực tế (hoặc hôm nay) + ghi đè của cuộc. */
  bo?: BoQuyTac;
  va?: VaQuyTac;
}

export interface KetQuaTinhMoc {
  bo: BoQuyTac;
  cheDoX: 'X1' | 'X2' | 'X3' | 'X4';
  /** Bảng mốc gốc (thực tế hoặc dự kiến): P1, D0, C, E, K, B, R, X, HAN_B1, NGAY_GIAO_QD, NGAY_PHAT_HIEN */
  moc: BangMoc;
  danhSach: MocTinh[];
  baiBo: boolean;
}

/** Số NLV tối đa để coi là "sắp đến hạn". */
export const NLV_SAP_DEN = 3;

function ngayThucTe(cuoc: CuocKiemTra, ma: string): NgayISO | undefined {
  const b = cuoc.buoc[ma];
  return b?.xong && b.ngay && laNgayISO(b.ngay) ? b.ngay : undefined;
}

/** Trạng thái của một mốc chưa xong, theo hạn dùng để so sánh. */
export function trangThaiTheoHan(lich: Lich, homNay: NgayISO, han: NgayISO | undefined, duKien: boolean): TrangThaiMoc {
  if (!han) return 'CHUA_DEN';
  if (duKien) return demNLV(lich, homNay, han) <= NLV_SAP_DEN && han >= homNay ? 'SAP_DEN' : 'CHUA_DEN';
  if (homNay > han) return 'QUA_HAN';
  if (homNay === han) return 'HOM_NAY';
  return demNLV(lich, homNay, han) <= NLV_SAP_DEN ? 'SAP_DEN' : 'CHUA_DEN';
}

function ngayToiPham(cuoc: CuocKiemTra): NgayISO | undefined {
  const ds = cuoc.suKien
    .filter((s) => s.loai === 'TOI_PHAM' && typeof s.ngayPhatHien === 'string' && laNgayISO(s.ngayPhatHien))
    .map((s) => s.ngayPhatHien as NgayISO)
    .sort();
  return ds[0];
}

function tongPhaiNop(cuoc: CuocKiemTra): number {
  const k = cuoc.ketQua;
  return (k.truyThu || 0) + (k.phat || 0) + (k.chamNop || 0);
}

export function tinhMoc(cuoc: CuocKiemTra, nc: NguCanhTinhMoc): KetQuaTinhMoc {
  const { lich, homNay } = nc;
  const d0Thuc = ngayThucTe(cuoc, 'P5');
  const bo = nc.bo ?? chonBoQuyTac(d0Thuc, homNay, cuoc.boQuyTacGhiDe, nc.va);
  const cheDoX = chonCheDoX(cuoc.suKien, cuoc.ketQua.coXuLy);
  const baiBo = cuoc.suKien.some((s) => s.loai === 'BAI_BO');
  const ctx: NguCanhHan = { lich, bo, coGDLK: cuoc.coGDLK, suKien: cuoc.suKien, cheDoX };

  const moc: BangMoc = {};
  const phatHien = ngayToiPham(cuoc);
  if (phatHien) moc.NGAY_PHAT_HIEN = { ngay: phatHien, duKien: false };

  // Lượt 1: đi theo thứ tự bước, mỗi bước sinh ra mốc thì ghi mốc (thực tế, hoặc dự kiến = hạn của bước đó).
  for (const b of bo.buoc) {
    const kq = tinhHan(b.han, moc, ctx);
    const thuc = b.loai === 'hanTinh' ? ngayThucTe(cuoc, 'T7') : ngayThucTe(cuoc, b.ma);
    if (b.moc) {
      if (b.loai === 'hanTinh') {
        // E luôn có giá trị tính được (không có "ngày thực tế").
        if (kq.han) moc[b.moc] = { ngay: kq.han, duKien: kq.duKien };
      } else if (thuc) {
        moc[b.moc] = { ngay: thuc, duKien: false };
      } else {
        let ngay = kq.han;
        if (b.moc === 'C') {
          // Ngày công bố dự kiến: hoãn > ngày người dùng nhập > hạn của bước Q5
          const hoan = cuoc.suKien.some((s) => s.loai === 'HOAN' && typeof s.denNgay === 'string');
          if (!hoan && cuoc.ngayCongBoDuKien && laNgayISO(cuoc.ngayCongBoDuKien)) ngay = cuoc.ngayCongBoDuKien;
        }
        if (ngay) moc[b.moc] = { ngay, duKien: true };
      }
    }
    if (b.ma === 'B1' && kq.han) moc.HAN_B1 = { ngay: kq.han, duKien: kq.duKien };
    if (b.ma === 'S1') {
      const s1 = ngayThucTe(cuoc, 'S1');
      if (s1) moc.NGAY_GIAO_QD = { ngay: s1, duKien: false };
      else if (kq.han) moc.NGAY_GIAO_QD = { ngay: kq.han, duKien: true };
    }
  }

  // Lượt 2: tính lại hạn từng bước với bảng mốc đầy đủ (B5 cần X, Q2 cần C…).
  const danhSach: MocTinh[] = [];
  const kPhapLy = (b: BuocQuyTac): KetQuaHan => tinhHan(b.han, moc, ctx);

  for (const b of bo.buoc) {
    const kq = kPhapLy(b);
    const bt = cuoc.buoc[b.ma];
    const noiBo = !!b.han?.noiBo;
    const dem = b.dem ?? 0;
    const hanPhapLy = noiBo ? undefined : kq.han;
    const hanMucTieu = kq.han ? (noiBo ? kq.han : tinhHanMucTieu(lich, kq.han, dem)) : undefined;
    const hanSoSanh = noiBo ? kq.han : hanPhapLy;

    let xong = !!bt?.xong;
    let ngayXong = xong ? bt?.ngay : undefined;
    let trangThai: TrangThaiMoc;
    let ghiChu = kq.ghiChu;
    let dieuKien = false;
    let tuyChon = false;

    switch (b.loai) {
      case 'hanTinh': {
        const k = ngayThucTe(cuoc, 'T7');
        xong = !!k;
        ngayXong = k;
        trangThai = 'CHUA_DEN';
        break;
      }
      case 'hangNgay': {
        xong = !!ngayThucTe(cuoc, 'T7');
        ngayXong = ngayThucTe(cuoc, 'T7');
        trangThai = xong ? 'XONG_DUNG_HAN' : 'CHUA_DEN';
        break;
      }
      case 'tuyChon': {
        tuyChon = true;
        const gh = cuoc.suKien.find((s) => s.loai === 'GIA_HAN');
        if (gh) {
          xong = true;
          ngayXong = typeof gh.ngayDeNghi === 'string' ? gh.ngayDeNghi : undefined;
        }
        trangThai = 'CHUA_DEN';
        break;
      }
      case 'dieuKien': {
        dieuKien = true;
        trangThai = 'CHUA_DEN';
        break;
      }
      case 'theoDoi':
        trangThai = 'CHUA_DEN';
        break;
      default:
        trangThai = 'CHUA_DEN';
    }

    // Điều kiện áp dụng
    let apDung = true;
    if (b.loai === 'dieuKien') {
      if (b.dieuKien === 'B1_QUA_HAN_CHUA_KY') {
        const hanB1 = moc.HAN_B1;
        apDung = !!ngayThucTe(cuoc, 'T7') && !ngayThucTe(cuoc, 'B1') && !!hanB1 && !hanB1.duKien && homNay > hanB1.ngay;
      } else if (b.dieuKien === 'CO_SU_KIEN_TOI_PHAM') {
        apDung = !!phatHien;
      }
    } else if (b.loai === 'theoDoiNopTien') {
      apDung = tongPhaiNop(cuoc) > 0;
    }

    const duKien = kq.duKien;
    if (xong) {
      const han = hanSoSanh;
      if (b.loai === 'hanTinh' || !ngayXong || !han) trangThai = b.loai === 'hangNgay' ? trangThai : 'XONG_DUNG_HAN';
      if (ngayXong && han) trangThai = ngayXong <= han ? 'XONG_DUNG_HAN' : 'XONG_TRE';
    } else if (baiBo) {
      trangThai = 'KHONG_AP_DUNG';
      ghiChu = 'Cuộc đã bị bãi bỏ';
    } else if (!apDung) {
      trangThai = 'KHONG_AP_DUNG';
    } else if (b.loai === 'hangNgay') {
      // giữ nguyên
    } else if (b.loai === 'tuyChon') {
      // Hạn chót đề nghị gia hạn: chỉ có ý nghĩa khi đang kiểm tra tại DN
      const dangKiemTra = !!moc.C && !moc.C.duKien && !ngayThucTe(cuoc, 'T7');
      if (!dangKiemTra && !kq.han) trangThai = 'CHUA_DEN';
      else if (dangKiemTra && kq.han && homNay > kq.han) {
        trangThai = 'KHONG_AP_DUNG';
        ghiChu = 'Đã quá hạn chót đề nghị gia hạn';
      } else trangThai = trangThaiTheoHan(lich, homNay, kq.han, duKien || !dangKiemTra);
    } else if (b.loai === 'theoDoi') {
      if (kq.han && !duKien && homNay > kq.han) {
        trangThai = 'KHONG_AP_DUNG';
        ghiChu = 'Đã hết thời hạn NNT được giải trình';
      } else trangThai = trangThaiTheoHan(lich, homNay, kq.han, duKien);
    } else if (!kq.han) {
      trangThai = 'CHUA_DEN';
    } else {
      trangThai = trangThaiTheoHan(lich, homNay, hanSoSanh, duKien);
    }

    const m: MocTinh = {
      ma: b.ma,
      ten: b.ten,
      giaiDoan: b.giaiDoan,
      loai: b.loai,
      hanPhapLy,
      hanMucTieu,
      duKien,
      noiBo,
      trangThai,
      ngayXong,
      canCu: b.canCu,
      bieuMau: b.bieuMau,
      nguoi: b.nguoi,
      moc: b.moc,
      tuyChon: tuyChon || undefined,
      dieuKien: dieuKien || undefined,
      ghiChu,
      thieuMoc: kq.thieuMoc,
    };
    const hanDeDem = hanSoSanh ?? hanMucTieu;
    if (!xong && hanDeDem && trangThai !== 'KHONG_AP_DUNG') m.nlvConLai = demNLV(lich, homNay, hanDeDem);
    if (trangThai === 'QUA_HAN' && !bt?.lyDoTre) m.quaHanChuaGiaiTrinh = true;
    if (trangThai === 'XONG_TRE' && ngayXong && hanSoSanh) m.soNgayTre = Math.max(1, demNLV(lich, hanSoSanh, ngayXong));
    danhSach.push(m);
  }

  return { bo, cheDoX, moc, danhSach, baiBo };
}

export function timMoc(kq: KetQuaTinhMoc, ma: string): MocTinh | undefined {
  return kq.danhSach.find((m) => m.ma === ma);
}
