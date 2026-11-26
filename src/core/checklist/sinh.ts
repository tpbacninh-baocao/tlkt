// Sinh checklist nhập liệu TTR/iTNK/TMS theo mốc, sự kiện, điều kiện, lần nộp tiền (SPEC §9).
import type { CuocKiemTra, NgayISO, SuKien, TrangThaiMoc } from '../kieu';
import { congNLV, congNgayThuan, demNLV, dinhDangNgay, type Lich } from '../lich';
import { trangThaiTheoHan, type KetQuaTinhMoc } from '../vuViec/tinhMoc';
import { laNgayTaiDN } from '../vuViec/viecTiepTheo';
import { DANH_MUC_CHECKLIST, DANH_MUC_HANG_NGAY, TEN_HE_THONG, type MaHeThong, type MucChecklist } from './danhMuc';
import { noiDungSaoChep, type DauVaoSaoChep } from './saoChep';

export interface ViecChecklist {
  /** Khóa duy nhất, ổn định: `MA` hoặc `MA#<id sự kiện | id lần nộp | ngày>` */
  khoa: string;
  ma: string;
  heThong: MaHeThong;
  tenHeThong: string;
  chucNang: string;
  phatSinh: NgayISO;
  han: NgayISO;
  xong: boolean;
  ngayTick?: NgayISO;
  trangThai: TrangThaiMoc;
  nlvConLai?: number;
  saoChep: string[];
  sau?: string[];
  hangNgay?: boolean;
  suKienId?: string;
  lanNopId?: string;
  /** Lý do không cho tích (ví dụ cần Kết thúc + Báo cáo kết quả trước khi Hoàn thành cuộc) */
  chanTick?: string;
  ghiChu?: string;
}

export interface TuyChonChecklist {
  /** Ghi đè tên chức năng theo mã việc (cài đặt) */
  tenChucNang?: Record<string, string>;
}

const NGAY_SU_KIEN: Record<string, string> = {
  HOAN: 'ngay',
  TAM_DUNG: 'tuNgay',
  GIA_HAN: 'ngayQD',
  DIEU_CHINH: 'ngayQD',
  BAI_BO: 'ngayQD',
  PHU_LUC_BB: 'ngay',
};

function ngayMoc(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, khi: string): NgayISO | undefined {
  if (khi === 'Q3') return cuoc.buoc.Q3?.xong ? cuoc.buoc.Q3.ngay : undefined;
  const m = kq.moc[khi];
  if (!m || m.duKien) return undefined;
  return m.ngay;
}

function xetLaKetLuan(cuoc: CuocKiemTra): boolean {
  if (cuoc.ketQua.loaiVanBanXL) return cuoc.ketQua.loaiVanBanXL === 'KET_LUAN';
  return !cuoc.ketQua.coXuLy;
}

export function sinhChecklist(cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich, homNay: NgayISO, tc: TuyChonChecklist = {}): ViecChecklist[] {
  const demHan = kq.bo.thamSo.hanNhapLieuNLV ?? 1;
  const ds: ViecChecklist[] = [];

  const them = (muc: MucChecklist, phatSinh: NgayISO, hau?: { suKien?: SuKien; lanNop?: { id: string; ngay: NgayISO } }) => {
    const hauTo = hau?.suKien ? `#${hau.suKien.id}` : hau?.lanNop ? `#${hau.lanNop.id}` : '';
    const khoa = muc.ma + hauTo;
    const han = congNLV(lich, phatSinh, demHan);
    let ngayTick: NgayISO | undefined = cuoc.checklist[khoa];
    if (!ngayTick && hau?.lanNop) {
      const ln = cuoc.nopTien.find((l) => l.id === hau.lanNop!.id);
      if (ln?.daNhapTTR) ngayTick = ln.ngay;
    }
    const xong = !!ngayTick;
    let trangThai: TrangThaiMoc;
    if (xong) trangThai = ngayTick! <= han ? 'XONG_DUNG_HAN' : 'XONG_TRE';
    else if (kq.baiBo && !(muc.khi === 'SK:BAI_BO')) trangThai = 'KHONG_AP_DUNG';
    else trangThai = trangThaiTheoHan(lich, homNay, han, false);
    const chucNang = tc.tenChucNang?.[muc.ma] ?? muc.chucNang;
    ds.push({
      khoa,
      ma: muc.ma,
      heThong: muc.heThong,
      tenHeThong: TEN_HE_THONG[muc.heThong],
      chucNang,
      phatSinh,
      han,
      xong,
      ngayTick,
      trangThai,
      nlvConLai: xong || trangThai === 'KHONG_AP_DUNG' ? undefined : demNLV(lich, homNay, han),
      saoChep: muc.saoChep,
      sau: muc.sau,
      suKienId: hau?.suKien?.id,
      lanNopId: hau?.lanNop?.id,
    });
  };

  const laKetLuan = xetLaKetLuan(cuoc);
  for (const muc of DANH_MUC_CHECKLIST) {
    if (muc.khi.startsWith('SK:')) {
      const loai = muc.khi.slice(3);
      for (const sk of cuoc.suKien.filter((s) => s.loai === loai)) {
        const truong = NGAY_SU_KIEN[loai];
        const ngay = (truong && typeof sk[truong] === 'string' ? (sk[truong] as string) : undefined) ?? sk.taoLuc.slice(0, 10);
        them(muc, ngay, { suKien: sk });
      }
    } else if (muc.khi === 'NOP_TIEN') {
      for (const l of cuoc.nopTien) them(muc, l.ngay, { lanNop: l });
    } else {
      const ngay = ngayMoc(cuoc, kq, muc.khi);
      if (!ngay) continue;
      if (muc.dieuKien === 'X_LA_KET_LUAN' && !laKetLuan) continue;
      if (muc.dieuKien === 'X_LA_QD_XU_PHAT' && laKetLuan) continue;
      them(muc, ngay);
    }
  }

  // Việc có `sau`: chỉ được tích khi các việc tiên quyết đã tích
  for (const v of ds) {
    if (!v.sau?.length) continue;
    const chua = v.sau.filter((m) => {
      const dep = ds.find((d) => d.ma === m);
      return dep && !dep.xong;
    });
    if (chua.length) {
      v.chanTick = `Cần xong trước: ${chua.map((m) => ds.find((d) => d.ma === m)!.chucNang).join('; ')}`;
    }
  }

  // Nhật ký iTNK hằng ngày: mỗi ngày làm việc tại DN từ C đến hôm nay
  const nk = DANH_MUC_HANG_NGAY[0];
  const c = kq.moc.C;
  if (nk && c && !c.duKien && !kq.baiBo) {
    const cuoi = cuoc.buoc.T7?.ngay ?? kq.moc.E?.ngay;
    for (let d = c.ngay; cuoi && d <= cuoi && d <= homNay; d = congNgayThuan(d, 1)) {
      if (!laNgayTaiDN(cuoc, kq, lich, d)) continue;
      const xong = !!cuoc.nhatKy[d]?.daGhiITNK;
      let trangThai: TrangThaiMoc = 'XONG_DUNG_HAN';
      if (!xong) trangThai = d < homNay ? 'QUA_HAN' : 'HOM_NAY';
      ds.push({
        khoa: `${nk.ma}#${d}`,
        ma: nk.ma,
        heThong: nk.heThong,
        tenHeThong: TEN_HE_THONG[nk.heThong],
        chucNang: tc.tenChucNang?.[nk.ma] ?? nk.chucNang,
        phatSinh: d,
        han: d,
        xong,
        ngayTick: xong ? d : undefined,
        trangThai,
        nlvConLai: xong ? undefined : demNLV(lich, homNay, d),
        saoChep: [],
        hangNgay: true,
      });
    }
  }
  return ds;
}

/** Tiến độ “7/12 việc nhập liệu” (không tính việc đã KHONG_AP_DUNG và nhật ký hằng ngày). */
export function tienDoChecklist(ds: ViecChecklist[]): { xong: number; tong: number } {
  const v = ds.filter((d) => !d.hangNgay && d.trangThai !== 'KHONG_AP_DUNG');
  return { xong: v.filter((d) => d.xong).length, tong: v.length };
}

/** Điều kiện “checklist đủ” cho S5: mọi việc (trừ nhật ký hằng ngày và nộp tiền các lần) đã tích. */
export function checklistDu(ds: ViecChecklist[]): boolean {
  return ds.filter((d) => !d.hangNgay && d.ma !== 'TTR_NOP' && d.trangThai !== 'KHONG_AP_DUNG').every((d) => d.xong);
}

/** Việc nhập liệu còn thiếu (chưa tích, còn áp dụng) – dùng cho màn “Nhập liệu còn thiếu”. */
export function viecConThieu(ds: ViecChecklist[]): ViecChecklist[] {
  return ds.filter((d) => !d.xong && d.trangThai !== 'KHONG_AP_DUNG');
}

/** Khóa lưu dấu tích trong cuoc.checklist (nhật ký hằng ngày lưu ở cuoc.nhatKy). */
export function khoaTick(v: ViecChecklist): string {
  return v.khoa;
}

/** Nội dung “Sao chép thông tin” của một việc. */
export function saoChepViec(v: ViecChecklist, cuoc: CuocKiemTra, kq: KetQuaTinhMoc, lich: Lich): string {
  const dau: DauVaoSaoChep = {
    cuoc,
    kq,
    lich,
    suKien: v.suKienId ? cuoc.suKien.find((s) => s.id === v.suKienId) : undefined,
    lanNop: v.lanNopId ? cuoc.nopTien.find((l) => l.id === v.lanNopId) : undefined,
  };
  if (v.hangNgay) {
    const g = cuoc.nhatKy[v.phatSinh]?.ghiChu;
    return `Ngày: ${dinhDangNgay(v.phatSinh)}\nGhi chú: ${g ?? '(chưa có)'}`;
  }
  const tieuDe = `${v.heThong} › ${v.chucNang}`;
  return `${tieuDe}\n${noiDungSaoChep(v.saoChep, dau)}`;
}
