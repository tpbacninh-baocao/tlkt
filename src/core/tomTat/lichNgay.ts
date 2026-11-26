// Dữ liệu cho màn Lịch: lưới tháng, gom việc theo ngày, gợi ý khối thời gian “Tại DN” và “Nhập TTR/iTNK”.
import type { KhoiThoiGian, NgayISO } from '../kieu';
import { congNgayThuan, laNgayLamBu, laNgayLamViec, ngayCuoiThang, ngayDauTuan, taoNgay, tenNgayNghi, thuTrongTuan, type Lich } from '../lich';
import { laNgayTaiDN } from '../vuViec';
import type { MucViec } from './tongHop';
import { nhanCuoc } from '../nhacViec/anDanh';
import type { PhanTichCuoc } from './phanTich';

export interface OLich {
  ngay: NgayISO;
  thuocThang: boolean;
  /** Tên ngày lễ/nghỉ (nếu có) */
  tenNghi?: string;
  cuoiTuan: boolean;
  lamBu: boolean;
  /** Không phải ngày làm việc (lễ hoặc cuối tuần chưa làm bù) */
  nghi: boolean;
}

/** Lưới tháng: các tuần bắt đầu thứ Hai, đủ 4–6 tuần phủ kín tháng. */
export function luoiThang(nam: number, thang: number, lich: Lich): OLich[][] {
  const dau = taoNgay(nam, thang, 1);
  const cuoi = taoNgay(nam, thang, ngayCuoiThang(nam, thang));
  const tuan: OLich[][] = [];
  for (let t = ngayDauTuan(dau); t <= cuoi; t = congNgayThuan(t, 7)) {
    const hang: OLich[] = [];
    for (let i = 0; i < 7; i++) {
      const ngay = congNgayThuan(t, i);
      const thu = thuTrongTuan(ngay);
      hang.push({
        ngay,
        thuocThang: ngay >= dau && ngay <= cuoi,
        tenNghi: tenNgayNghi(lich, ngay),
        cuoiTuan: thu === 0 || thu === 6,
        lamBu: laNgayLamBu(lich, ngay),
        nghi: !laNgayLamViec(lich, ngay),
      });
    }
    tuan.push(hang);
  }
  return tuan;
}

/** Gom các việc đang mở theo ngày hạn trong khoảng [tu, den] (hạn pháp lý/nội bộ/việc ngoài cuộc). */
export function gomMucTheoNgay(ds: MucViec[], tu: NgayISO, den: NgayISO): Map<NgayISO, MucViec[]> {
  const m = new Map<NgayISO, MucViec[]>();
  for (const x of ds) {
    if (!x.han || x.han < tu || x.han > den) continue;
    m.set(x.han, [...(m.get(x.han) ?? []), x]);
  }
  for (const [k, v] of m) m.set(k, v.sort((a, b) => b.diem - a.diem));
  return m;
}

const MUC_NANG: Record<string, number> = { QUA_HAN: 4, HOM_NAY: 3, SAP_DEN: 2, CHUA_DEN: 1 };

/** Trạng thái nặng nhất trong các việc của một ngày (để tô chấm màu). */
export function trangThaiNangNhat(ds: MucViec[]): MucViec['trangThai'] | undefined {
  let tot: MucViec | undefined;
  for (const x of ds) if (!tot || (MUC_NANG[x.trangThai] ?? 0) > (MUC_NANG[tot.trangThai] ?? 0)) tot = x;
  return tot?.trangThai;
}

export interface GoiYKhoi {
  khoa: string;
  ngay: NgayISO;
  tu: string;
  den: string;
  tieuDe: string;
  cuocId?: string;
  loai: 'TAI_DN' | 'NHAP_HE_THONG';
}

/**
 * Gợi ý khối thời gian: “Tại DN <tên>” cho từng ngày làm việc tại doanh nghiệp (theo khung giờ làm việc),
 * và “Nhập TTR/iTNK” 30 phút cuối ngày nếu hôm đó có việc nhập liệu đến hạn.
 * Bỏ các gợi ý đã trùng với khối người dùng tạo (cùng ngày, cùng cuộc, cùng khung giờ).
 */
export function goiYKhoiThoiGian(
  pts: PhanTichCuoc[],
  lich: Lich,
  tu: NgayISO,
  den: NgayISO,
  daCo: KhoiThoiGian[],
  anDanh: boolean,
  khung: readonly (readonly [number, number])[] = lich.khung,
): GoiYKhoi[] {
  const kq: GoiYKhoi[] = [];
  const gio = (p: number) => `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`;
  for (const pt of pts) {
    for (let d = tu; d <= den; d = congNgayThuan(d, 1)) {
      if (laNgayTaiDN(pt.cuoc, pt.kq, lich, d)) {
        for (const [a, b] of khung) {
          const x: GoiYKhoi = { khoa: `dn:${pt.cuoc.id}:${d}:${gio(a)}`, ngay: d, tu: gio(a), den: gio(b), tieuDe: `Tại DN ${nhanCuoc(pt.cuoc, anDanh)}`, cuocId: pt.cuoc.id, loai: 'TAI_DN' };
          if (!daCo.some((k) => k.ngay === d && k.cuocId === pt.cuoc.id && k.tu === x.tu && k.den === x.den)) kq.push(x);
        }
      }
      const soViec = pt.checklist.filter((v) => !v.xong && !v.hangNgay && v.trangThai !== 'KHONG_AP_DUNG' && v.han === d).length;
      if (soViec > 0 && laNgayLamViec(lich, d)) {
        const cuoi = khung.length ? khung[khung.length - 1][1] : 17 * 60;
        const x: GoiYKhoi = { khoa: `nl:${pt.cuoc.id}:${d}`, ngay: d, tu: gio(cuoi - 30), den: gio(cuoi), tieuDe: `Nhập TTR/iTNK (${soViec} việc) – ${nhanCuoc(pt.cuoc, anDanh)}`, cuocId: pt.cuoc.id, loai: 'NHAP_HE_THONG' };
        if (!daCo.some((k) => k.ngay === d && k.cuocId === pt.cuoc.id && k.tieuDe === x.tieuDe)) kq.push(x);
      }
    }
  }
  return kq.sort((a, b) => (a.ngay + a.tu < b.ngay + b.tu ? -1 : 1));
}

/** Xếp các khối chồng giờ thành các “làn” cạnh nhau: mỗi khối có `lan` (0..) và `soLan` của cụm chồng nhau. */
export function xepLanKhoi<T extends { tu: string; den: string }>(ds: T[]): (T & { lan: number; soLan: number })[] {
  const a = [...ds].sort((x, y) => (x.tu < y.tu ? -1 : x.tu > y.tu ? 1 : x.den < y.den ? -1 : 1));
  const kq: (T & { lan: number; soLan: number })[] = [];
  let cum: (T & { lan: number; soLan: number })[] = [];
  let cuoiLan: string[] = [];
  let cuoiCum = '';
  const dongCum = () => {
    for (const x of cum) x.soLan = cuoiLan.length;
    kq.push(...cum);
    cum = [];
    cuoiLan = [];
  };
  for (const x of a) {
    if (cum.length && x.tu >= cuoiCum) dongCum();
    let lan = cuoiLan.findIndex((e) => e <= x.tu);
    if (lan < 0) lan = cuoiLan.length;
    cuoiLan[lan] = x.den;
    cuoiCum = cum.length ? (x.den > cuoiCum ? x.den : cuoiCum) : x.den;
    cum.push({ ...x, lan, soLan: 1 });
  }
  dongCum();
  return kq;
}
