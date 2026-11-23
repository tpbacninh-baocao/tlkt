// Danh sách cuộc: dòng hiển thị, tìm/lọc/sắp xếp, SLA của cả cuộc, dữ liệu Gantt, quy tắc kéo-thả Kanban.
import type { CuocKiemTra, GiaiDoan, KeHoach, MocTinh, NgayISO } from '../kieu';
import { soNgayGiua } from '../lich';
import { namCuaCuoc } from '../keHoach/thongKe';
import { diemUuTienCuoc, mucSLA, THU_TU_GIAI_DOAN, type MucSLA } from '../vuViec';
import { phanTichCuoc, type DuLieuTomTat, type PhanTichCuoc } from './phanTich';
import { laBuocNoiBoDaQua } from '../vuViec/tinhMoc';

export interface DongCuoc {
  cuoc: CuocKiemTra;
  pt: PhanTichCuoc;
  diem: number;
  sla: MucSLA;
  /** Hạn của việc tiếp theo (để sắp xếp theo hạn) */
  hanTiep?: NgayISO;
}

const MUC_NANG: Record<string, number> = { QUA_HAN: 4, HOM_NAY: 3, SAP_DEN: 2, CHUA_DEN: 1 };

/** SLA của cả cuộc = mức nặng nhất trong các bước pháp lý đang mở (bỏ bước dự kiến và nội bộ của giai đoạn đã qua). */
export function slaCuoc(pt: PhanTichCuoc): MucSLA {
  if (pt.giaiDoan === 'BAI_BO') return 'KHONG_AP_DUNG';
  if (pt.giaiDoan === 'HOAN_THANH') return 'XONG_DUNG_HAN';
  let tot: MocTinh | undefined;
  for (const m of pt.kq.danhSach) {
    if (pt.cuoc.buoc[m.ma]?.xong || m.duKien || m.trangThai === 'KHONG_AP_DUNG' || laBuocNoiBoDaQua(pt.cuoc, m)) continue;
    if (['hanTinh', 'hangNgay', 'theoDoi', 'tuyChon'].includes(m.loai)) continue;
    if (!tot || (MUC_NANG[m.trangThai] ?? 0) > (MUC_NANG[tot.trangThai] ?? 0)) tot = m;
  }
  return tot ? mucSLA(tot) : 'CON_LAU';
}

export function taoDongCuoc(c: CuocKiemTra, d: DuLieuTomTat, pt?: PhanTichCuoc): DongCuoc {
  const p = pt ?? phanTichCuoc(c, d);
  const t = p.tiepTheo;
  return {
    cuoc: c,
    pt: p,
    diem: diemUuTienCuoc(c, p.kq, d.lich, d.homNay),
    sla: slaCuoc(p),
    hanTiep: t ? (t.noiBo ? t.hanMucTieu : t.hanPhapLy) : undefined,
  };
}

function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function timKhop(c: CuocKiemTra, q: string): boolean {
  const t = q.trim();
  if (!t) return true;
  const chu = boDau(t);
  const so = t.replace(/\D/g, '');
  if (so.length >= 3 && c.mst.replace(/\D/g, '').includes(so)) return true;
  const kho = boDau([c.tenNNT, c.ma, c.soQD ?? '', c.truongDoan, c.noiDung ?? '', c.vanBanGiao ?? ''].join(' | '));
  return chu.split(/\s+/).every((tu) => kho.includes(tu));
}

export interface BoLocCuoc {
  tim?: string;
  giaiDoan?: GiaiDoan[];
  loai?: string[];
  keHoachId?: string;
  nam?: number;
  sla?: MucSLA[];
  truongDoan?: string;
  coHanNgoai?: boolean;
}

export function locCuocDS(rows: DongCuoc[], loc: BoLocCuoc, keHoach: KeHoach[]): DongCuoc[] {
  return rows.filter((r) => {
    const c = r.cuoc;
    if (loc.tim && !timKhop(c, loc.tim)) return false;
    if (loc.giaiDoan?.length && !loc.giaiDoan.includes(r.pt.giaiDoan)) return false;
    if (loc.loai?.length && !loc.loai.includes(c.loai)) return false;
    if (loc.keHoachId && c.keHoachId !== loc.keHoachId) return false;
    if (loc.nam && namCuaCuoc(c, keHoach) !== loc.nam) return false;
    if (loc.sla?.length && !loc.sla.includes(r.sla)) return false;
    if (loc.truongDoan && c.truongDoan !== loc.truongDoan) return false;
    if (loc.coHanNgoai && !c.hanNgoai) return false;
    return true;
  });
}

export type KieuSapXep = 'UU_TIEN' | 'HAN' | 'NGAY_TAO' | 'TEN';

export function sapXepCuocDS(rows: DongCuoc[], kieu: KieuSapXep): DongCuoc[] {
  const a = [...rows];
  switch (kieu) {
    case 'UU_TIEN':
      return a.sort((x, y) => y.diem - x.diem || x.cuoc.ma.localeCompare(y.cuoc.ma));
    case 'HAN':
      return a.sort((x, y) => (x.hanTiep ?? '9999').localeCompare(y.hanTiep ?? '9999') || y.diem - x.diem);
    case 'NGAY_TAO':
      return a.sort((x, y) => y.cuoc.taoLuc.localeCompare(x.cuoc.taoLuc));
    case 'TEN':
      return a.sort((x, y) => x.cuoc.tenNNT.localeCompare(y.cuoc.tenNNT, 'vi'));
  }
}

// ---------- Kanban: kéo thả chỉ để mở form xác nhận ----------
export type DichKeoTha =
  | { kieu: 'XONG_BUOC'; ma: string; ten: string }
  | { kieu: 'SU_KIEN'; loai: 'BAI_BO' }
  | { kieu: 'KHONG'; lyDo: string };

/** Bước hoàn thành để chuyển cuộc sang giai đoạn kế tiếp. */
const BUOC_VAO_GIAI_DOAN: Partial<Record<GiaiDoan, { ma: string; ten: string }>> = {
  CHO_CONG_BO: { ma: 'P5', ten: 'ban hành QĐ kiểm tra' },
  DANG_KIEM_TRA: { ma: 'Q5', ten: 'công bố QĐ kiểm tra' },
  BIEN_BAN: { ma: 'T7', ten: 'công khai dự thảo biên bản' },
  CHO_QD_XU_LY: { ma: 'B4', ten: 'báo cáo kết quả kiểm tra' },
  SAU_QD: { ma: 'X', ten: 'ban hành QĐ xử phạt/Kết luận' },
  HOAN_THANH: { ma: 'S5', ten: 'hoàn thành cuộc trên iTNK' },
  THEO_DOI_NOP_TIEN: { ma: 'S5', ten: 'hoàn thành cuộc trên iTNK' },
};

export function xuLyKeoTha(hienTai: GiaiDoan, dich: GiaiDoan): DichKeoTha {
  if (hienTai === dich) return { kieu: 'KHONG', lyDo: 'Cuộc đang ở giai đoạn này.' };
  if (hienTai === 'BAI_BO') return { kieu: 'KHONG', lyDo: 'Cuộc đã bị bãi bỏ.' };
  if (dich === 'BAI_BO') return { kieu: 'SU_KIEN', loai: 'BAI_BO' };
  const i = THU_TU_GIAI_DOAN.indexOf(hienTai);
  const j = THU_TU_GIAI_DOAN.indexOf(dich);
  if (j < i) return { kieu: 'KHONG', lyDo: 'Không lùi giai đoạn bằng kéo thả – hãy sửa mốc ở chi tiết cuộc.' };
  const b = BUOC_VAO_GIAI_DOAN[dich];
  if (j > i + 1 && !(hienTai === 'SAU_QD' && (dich === 'HOAN_THANH' || dich === 'THEO_DOI_NOP_TIEN'))) {
    return { kieu: 'KHONG', lyDo: 'Hãy hoàn thành lần lượt từng giai đoạn.' };
  }
  if (!b) return { kieu: 'KHONG', lyDo: 'Không có bước nào để chuyển vào giai đoạn này.' };
  return { kieu: 'XONG_BUOC', ma: b.ma, ten: b.ten };
}

// ---------- Dòng thời gian (Gantt) ----------
export interface DoanGantt {
  giaiDoan: GiaiDoan;
  tu: NgayISO;
  den: NgayISO;
  duKien: boolean;
  nhan: string;
}
export interface ChamGantt {
  ma: string;
  ngay: NgayISO;
  ten: string;
  duKien: boolean;
}
export interface TamDungGantt {
  tu: NgayISO;
  den: NgayISO;
}
export interface GanttCuoc {
  cuocId: string;
  doan: DoanGantt[];
  hanPhapLy: ChamGantt[];
  tamDung: TamDungGantt[];
  tu?: NgayISO;
  den?: NgayISO;
}

export function tinhGantt(pt: PhanTichCuoc): GanttCuoc {
  const c = pt.cuoc;
  const m = pt.kq.moc;
  const doan: DoanGantt[] = [];
  const P1 = c.buoc.P1?.xong ? c.buoc.P1.ngay : undefined;
  const D0 = m.D0;
  const C = m.C;
  const K = c.buoc.T7?.xong ? { ngay: c.buoc.T7.ngay!, duKien: false } : m.K ?? (m.E ? { ngay: m.E.ngay, duKien: true } : undefined);
  const X = m.X;
  const them = (giaiDoan: GiaiDoan, tu: NgayISO | undefined, den: NgayISO | undefined, duKien: boolean, nhan: string) => {
    if (tu && den && den >= tu) doan.push({ giaiDoan, tu, den, duKien, nhan });
  };
  them('CHUAN_BI', P1, D0?.ngay, !!D0?.duKien, 'Chuẩn bị');
  them('CHO_CONG_BO', D0?.ngay, C?.ngay, !!C?.duKien || !!D0?.duKien, 'Chờ công bố');
  them('DANG_KIEM_TRA', C?.ngay, K?.ngay, !!K?.duKien || !!C?.duKien, 'Tại DN');
  them('BIEN_BAN', K?.ngay, X?.ngay, !!X?.duKien || !!K?.duKien, 'Sau kiểm tra');

  const cham: ChamGantt[] = [];
  for (const mt of pt.kq.danhSach) {
    if (!mt.hanPhapLy || mt.noiBo || ['theoDoi', 'hangNgay', 'tuyChon'].includes(mt.loai)) continue;
    if (!['Q5', 'T1', 'T7', 'B1', 'B4', 'X', 'S1', 'S6'].includes(mt.ma)) continue;
    cham.push({ ma: mt.ma, ngay: mt.hanPhapLy, ten: mt.ten.replace(/\s*\(= [A-Z0-9]+\)/g, ''), duKien: mt.duKien });
  }
  const tamDung: TamDungGantt[] = c.suKien
    .filter((s) => s.loai === 'TAM_DUNG' && typeof s.tuNgay === 'string' && typeof s.denNgay === 'string')
    .map((s) => ({ tu: s.tuNgay as string, den: s.denNgay as string }));

  const moc = [...doan.flatMap((d) => [d.tu, d.den]), ...cham.map((x) => x.ngay)].sort();
  return { cuocId: c.id, doan, hanPhapLy: cham, tamDung, tu: moc[0], den: moc[moc.length - 1] };
}

/** Khoảng thời gian chung cho trục Gantt: từ ngày sớm nhất đến muộn nhất của mọi cuộc + hôm nay, đệm vài ngày. */
export function khoangGantt(ds: GanttCuoc[], homNay: NgayISO): { tu: NgayISO; den: NgayISO; soNgay: number } {
  const tat = ds.flatMap((g) => (g.tu && g.den ? [g.tu, g.den] : [])).concat(homNay).sort();
  const tu = tat[0];
  const den = tat[tat.length - 1];
  return { tu, den, soNgay: soNgayGiua(tu, den) + 1 };
}
