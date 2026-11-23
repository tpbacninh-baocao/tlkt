// Tổng hợp việc cần làm của tất cả cuộc + việc ngoài cuộc: màn Hôm nay, bản tin sáng, báo cáo.
import type { MocTinh, NgayISO, TrangThaiMoc } from '../kieu';
import { demNLV } from '../lich';
import type { ViecChecklist } from '../checklist';
import { nhanCuoc } from '../nhacViec/anDanh';
import { diemUuTienMoc, laBuocNoiBoDaQua, tinhDiem, mucSLA, type MucSLA } from '../vuViec';
import { diemUuTienViec, trangThaiViec } from '../viec/viec';
import { anDanhHieuLuc, phanTichCuoc, soNhapLieuThieu, tenNgan, type DuLieuTomTat, type PhanTichCuoc } from './phanTich';

export interface MucViec {
  khoa: string;
  loai: 'BUOC' | 'CHECKLIST' | 'VIEC';
  tieuDe: string;
  cuocId?: string;
  maCuoc?: string;
  nhanCuoc?: string;
  han?: NgayISO;
  noiBo?: boolean;
  trangThai: TrangThaiMoc;
  muc: MucSLA;
  nlvConLai?: number;
  diem: number;
  canCu?: string;
  maBuoc?: string;
  heThong?: string;
  viecId?: string;
  lienKet: string;
  quaHanChuaGiaiTrinh?: boolean;
}

export interface TaiDN {
  cuocId: string;
  nhanCuoc: string;
  ngayThu?: { n: number; tong: number; donVi: 'N' | 'NLV' };
  hanE?: NgayISO;
  daGhiITNK: boolean;
  ycChuaNhan: number;
  ycQuaHan: number;
}

export interface TongHopHomNay {
  quaHan: MucViec[];
  homNay: MucViec[];
  baNLVToi: MucViec[];
  nhapLieuThieu: { cuocId: string; nhanCuoc: string; viec: ViecChecklist }[];
  taiDN: TaiDN[];
  kpi: { quaHan: number; homNay: number; baNLV: number; nhapLieuThieu: number };
  /** Toàn bộ việc đang mở (đã sắp theo điểm ưu tiên) – cột “Việc tiếp theo” */
  tatCa: MucViec[];
  /** Phân tích từng cuộc (bỏ cuộc đã xóa) để dùng lại */
  phanTich: PhanTichCuoc[];
}

const theoDiem = (a: MucViec, b: MucViec) => b.diem - a.diem || (a.han ?? '9999') .localeCompare(b.han ?? '9999');

function mucTuMoc(p: PhanTichCuoc, m: MocTinh, d: DuLieuTomTat): MucViec {
  const c = p.cuoc;
  const an = anDanhHieuLuc(d);
  return {
    khoa: `cuoc:${c.id}:${m.ma}`,
    loai: 'BUOC',
    tieuDe: tenNgan(m.ten),
    cuocId: c.id,
    maCuoc: c.ma,
    nhanCuoc: nhanCuoc(c, an),
    han: m.noiBo ? m.hanMucTieu : m.hanPhapLy,
    noiBo: m.noiBo,
    trangThai: m.trangThai,
    muc: mucSLA(m),
    nlvConLai: m.nlvConLai,
    diem: diemUuTienMoc(m, c, d.lich, d.homNay),
    canCu: m.canCu,
    maBuoc: m.ma,
    lienKet: `#cuoc-${c.id}`,
    quaHanChuaGiaiTrinh: m.quaHanChuaGiaiTrinh,
  };
}

/** Các việc (bước + nhập liệu + việc ngoài cuộc) đang mở, chưa phân nhóm. */
export function cacMucViecDangMo(d: DuLieuTomTat, phanTich?: PhanTichCuoc[]): MucViec[] {
  const ds: MucViec[] = [];
  const pt = phanTich ?? d.cuoc.filter((c) => !c.xoaLuc).map((c) => phanTichCuoc(c, d));
  const an = anDanhHieuLuc(d);
  for (const p of pt) {
    for (const m of p.kq.danhSach) {
      if (p.cuoc.buoc[m.ma]?.xong || m.trangThai === 'KHONG_AP_DUNG' || m.duKien) continue;
      if (['hanTinh', 'hangNgay', 'theoDoi', 'tuyChon'].includes(m.loai)) continue;
      if (laBuocNoiBoDaQua(p.cuoc, m)) continue;
      ds.push(mucTuMoc(p, m, d));
    }
    for (const v of p.checklist) {
      if (v.xong || v.hangNgay || v.trangThai === 'KHONG_AP_DUNG') continue;
      const nlv = demNLV(d.lich, d.homNay, v.han);
      ds.push({
        khoa: `cuoc:${p.cuoc.id}:CL:${v.khoa}`,
        loai: 'CHECKLIST',
        tieuDe: `Nhập ${v.heThong}: ${v.chucNang}`,
        cuocId: p.cuoc.id,
        maCuoc: p.cuoc.ma,
        nhanCuoc: nhanCuoc(p.cuoc, an),
        han: v.han,
        noiBo: true,
        trangThai: v.trangThai,
        muc: v.trangThai === 'QUA_HAN' ? 'QUA_HAN_CHUA_GIAI_TRINH' : v.trangThai === 'HOM_NAY' ? 'HOM_NAY_NGAY_MAI' : v.trangThai === 'SAP_DEN' ? 'SAP_DEN' : 'CON_LAU',
        nlvConLai: nlv,
        diem: tinhDiem({ nlvConLai: nlv, heSo: 1.5, quaHan: v.trangThai === 'QUA_HAN', ghim: p.cuoc.ghim }),
        heThong: v.heThong,
        lienKet: '#nhap-lieu',
      });
    }
  }
  for (const v of d.viec) {
    if (v.xong || v.xoaLuc || !v.han) continue;
    const tt = trangThaiViec(v, d.lich, d.homNay);
    ds.push({
      khoa: `viec:${v.id}`,
      loai: 'VIEC',
      tieuDe: v.tieuDe,
      han: v.han,
      trangThai: tt,
      muc: tt === 'QUA_HAN' ? 'QUA_HAN' : tt === 'HOM_NAY' ? 'HOM_NAY_NGAY_MAI' : tt === 'SAP_DEN' ? 'SAP_DEN' : 'CON_LAU',
      nlvConLai: demNLV(d.lich, d.homNay, v.han),
      diem: diemUuTienViec(v, d.lich, d.homNay),
      viecId: v.id,
      lienKet: '#viec',
    });
  }
  return ds.sort(theoDiem);
}

export function tongHopHomNay(d: DuLieuTomTat): TongHopHomNay {
  const phanTich = d.cuoc.filter((c) => !c.xoaLuc).map((c) => phanTichCuoc(c, d));
  const an = anDanhHieuLuc(d);
  const dang = cacMucViecDangMo(d, phanTich);
  const quaHan = dang.filter((m) => m.trangThai === 'QUA_HAN');
  const homNay = dang.filter((m) => m.trangThai === 'HOM_NAY');
  const baNLVToi = dang.filter((m) => m.trangThai === 'SAP_DEN');

  const nhapLieuThieu: TongHopHomNay['nhapLieuThieu'] = [];
  const taiDN: TaiDN[] = [];
  for (const p of phanTich) {
    for (const v of p.checklist) {
      if (!v.xong && !v.hangNgay && v.trangThai !== 'KHONG_AP_DUNG') nhapLieuThieu.push({ cuocId: p.cuoc.id, nhanCuoc: nhanCuoc(p.cuoc, an), viec: v });
    }
    if (p.taiDNHomNay) {
      taiDN.push({
        cuocId: p.cuoc.id,
        nhanCuoc: nhanCuoc(p.cuoc, an),
        ngayThu: p.ngayThu,
        hanE: p.kq.moc.E?.ngay,
        daGhiITNK: p.nhatKyDaGhiHomNay,
        ycChuaNhan: p.ycChuaNhan,
        ycQuaHan: p.ycQuaHan,
      });
    }
  }
  return {
    quaHan,
    homNay,
    baNLVToi,
    nhapLieuThieu,
    taiDN,
    kpi: { quaHan: quaHan.length, homNay: homNay.length, baNLV: baNLVToi.length, nhapLieuThieu: nhapLieuThieu.length },
    tatCa: dang,
    phanTich,
  };
}

export { soNhapLieuThieu };
