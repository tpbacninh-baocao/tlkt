// Sinh danh sách nhắc việc (hàm thuần) – ARCHITECTURE §8.1.
// Nhắc việc bám theo HẠN MỤC TIÊU; cảnh báo vi phạm bám theo hạn pháp lý (có thêm nhắc riêng vào ngày hạn pháp lý và nhắc quá hạn).
import type { CaiDat, CongViec, CuocKiemTra, KeHoach, NgayGio, NgayISO } from '../kieu';
import {
  congNLV,
  congNgayThuan,
  dinhDangNgay,
  dinhDangNgayNgan,
  ghepNgayGio,
  gioSangPhut,
  laNgayLamViec,
  tachNgayGio,
  thuNgan,
  thuTrongTuan,
  type Lich,
} from '../lich';
import { sinhChecklist } from '../checklist';
import { hanCuaKeHoach } from '../keHoach';
import { chonBoQuyTac, type VaQuyTac } from '../quyTac';
import { changDangChay, dongHoVuongMac, dongHoYeuCau, hanYeuCauTaiLieu } from '../vuViec/dongHo';
import { tinhMoc } from '../vuViec/tinhMoc';
import { laNgayTaiDN } from '../vuViec/viecTiepTheo';
import { nhanCuoc } from './anDanh';
import { canNhacSaoLuu } from './saoLuu';

export type MucDoNhac = 'THONG_TIN' | 'CANH_BAO' | 'KHAN' | 'BAO_THUC' | 'QUA_HAN';

export interface Nhac {
  /** Khóa duy nhất, ổn định – dùng để không phát trùng */
  khoa: string;
  luc: NgayGio;
  mucDo: MucDoNhac;
  tieuDe: string;
  noiDung: string;
  /** Đường dẫn hash trong app, ví dụ '#cuoc-<id>' */
  lienKet: string;
}

export interface DuLieuNhac {
  homNay: NgayISO;
  lich: Lich;
  caiDat: CaiDat;
  cuoc: CuocKiemTra[];
  viec: CongViec[];
  keHoach: KeHoach[];
  va?: VaQuyTac;
  /** Ngày sao lưu gần nhất; null = chưa từng; bỏ trống = không nhắc sao lưu */
  saoLuuCuoi?: NgayISO | null;
}

type KieuHan = 'PHAP_LY' | 'NOI_BO' | 'TUY_CHON';

const GIO = (g: string) => gioSangPhut(g);

/** Dời giờ nhắc nằm trong khung yên lặng sang cuối khung (trừ mức BAO_THUC). */
export function ganGioYenLang(luc: NgayGio, tu: string, den: string): NgayGio {
  const { ngay, phut } = tachNgayGio(luc);
  const a = GIO(tu);
  const b = GIO(den);
  if (a > b) {
    if (phut >= a) return ghepNgayGio(congNgayThuan(ngay, 1), b);
    if (phut < b) return ghepNgayGio(ngay, b);
    return luc;
  }
  return phut >= a && phut < b ? ghepNgayGio(ngay, b) : luc;
}

interface NguonHan {
  tienTo: string; // 'cuoc:<id>:Q5' – phần đầu của khóa
  tieuDeNguon: string; // “KT …1234” / tên
  ten: string; // tên bước/việc
  han: NgayISO; // hạn dùng để nhắc (mục tiêu / nội bộ)
  hanPhapLy?: NgayISO;
  kieu: KieuHan;
  lienKet: string;
  canCu?: string;
  gio?: string;
}

/** Lịch nhắc cho MỘT hạn (chưa xong). */
function lichChoMotHan(n: NguonHan, lich: Lich, homNay: NgayISO, tuNgay: NgayISO, denNgay: NgayISO): Nhac[] {
  const kq: Nhac[] = [];
  const tieuDe = (cau: string) => `${n.tieuDeNguon} – ${cau}`;
  const mo = n.canCu ? ` · ${n.canCu}` : '';
  const them = (kieuNhac: string, ngay: NgayISO, gio: string, mucDo: MucDoNhac, cau: string, noiDung?: string) => {
    if (ngay < tuNgay || ngay > denNgay) return;
    kq.push({
      khoa: `${n.tienTo}|${kieuNhac}|${n.han}`,
      luc: ghepNgayGio(ngay, GIO(gio)),
      mucDo,
      tieuDe: tieuDe(cau),
      noiDung: noiDung ?? `${n.ten}${mo}`,
      lienKet: n.lienKet,
    });
  };
  const t = n.han;
  const ngayTruoc = (so: number) => congNLV(lich, t, -so);
  const nhanHan = `hạn ${dinhDangNgay(t)} (${thuNgan(t)})`;

  if (n.kieu === 'PHAP_LY') {
    them('T-5', ngayTruoc(5), '08:00', 'THONG_TIN', `Còn 5 ngày LV: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T-2', ngayTruoc(2), '08:00', 'CANH_BAO', `Còn 2 ngày LV: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T-1a', ngayTruoc(1), '08:00', 'KHAN', `Ngày mai đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T-1b', ngayTruoc(1), '14:00', 'KHAN', `Ngày mai đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T0a', t, '07:30', 'BAO_THUC', `Hôm nay đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T0b', t, '13:30', 'KHAN', `Hôm nay đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
  } else if (n.kieu === 'NOI_BO') {
    them('T-1', ngayTruoc(1), '08:00', 'CANH_BAO', `Ngày mai đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T0', t, n.gio ?? '07:30', 'KHAN', `Hôm nay đến hạn: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
  } else {
    them('T-2', ngayTruoc(2), '08:00', 'CANH_BAO', `Còn 2 ngày LV – hạn chót: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T-1', ngayTruoc(1), '08:00', 'KHAN', `Ngày mai là hạn chót: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
    them('T0', t, '07:30', 'KHAN', `Hôm nay là hạn chót: ${n.ten}`, `${n.ten} – ${nhanHan}${mo}`);
  }

  // Ngày hạn pháp lý (khi khác hạn mục tiêu): báo thức riêng
  if (n.kieu === 'PHAP_LY' && n.hanPhapLy && n.hanPhapLy !== t) {
    const pl = n.hanPhapLy;
    if (pl >= tuNgay && pl <= denNgay) {
      kq.push({
        khoa: `${n.tienTo}|PL|${pl}`,
        luc: ghepNgayGio(pl, GIO('07:30')),
        mucDo: 'BAO_THUC',
        tieuDe: tieuDe(`HẠN PHÁP LÝ hôm nay: ${n.ten}`),
        noiDung: `${n.ten} – hạn pháp lý ${dinhDangNgay(pl)} (${thuNgan(pl)})${mo}`,
        lienKet: n.lienKet,
      });
    }
  }

  // Quá hạn: 08:00 mỗi NLV kể từ NLV sau hạn (pháp lý, hoặc hạn nội bộ)
  if (n.kieu !== 'TUY_CHON') {
    const hanQuaHan = n.kieu === 'PHAP_LY' ? n.hanPhapLy ?? t : t;
    let d = congNLV(lich, hanQuaHan, 1);
    for (let i = 0; d <= denNgay && i < 120; i++, d = congNLV(lich, d, 1)) {
      if (d < tuNgay) continue;
      const soNgay = i + 1;
      kq.push({
        khoa: `${n.tienTo}|QH@${d}|${n.han}`,
        luc: ghepNgayGio(d, GIO('08:00')),
        mucDo: 'QUA_HAN',
        tieuDe: tieuDe(`Quá hạn ${soNgay} ngày LV: ${n.ten}`),
        noiDung: `${n.ten} – hạn ${dinhDangNgay(hanQuaHan)}${mo}. Ghi lý do trễ để giải trình.`,
        lienKet: n.lienKet,
      });
    }
  }
  return kq;
}

function tuanLe(ngay: NgayISO, thu: number): boolean {
  return thuTrongTuan(ngay) === thu;
}

function catNgan(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

/** Các nguồn hạn của một cuộc (bước chưa xong, checklist chưa tích, yêu cầu tài liệu, vướng mắc). */
function nguonCuaCuoc(c: CuocKiemTra, d: DuLieuNhac, anDanh: boolean, tuNgay: NgayISO, denNgay: NgayISO, ra: Nhac[]) {
  const { lich, homNay } = d;
  const bo = chonBoQuyTac(c.buoc.P5?.xong ? c.buoc.P5.ngay : undefined, homNay, c.boQuyTacGhiDe, d.va);
  const kq = tinhMoc(c, { lich, homNay, bo });
  const ten = nhanCuoc(c, anDanh);
  const lienKet = `#cuoc-${c.id}`;
  const gop = (n: NguonHan) => ra.push(...lichChoMotHan(n, lich, homNay, tuNgay, denNgay));

  for (const m of kq.danhSach) {
    if (c.buoc[m.ma]?.xong || m.trangThai === 'KHONG_AP_DUNG' || m.duKien) continue;
    if (['hanTinh', 'hangNgay', 'theoDoi', 'theoDoiNopTien'].includes(m.loai)) continue;
    const han = m.noiBo ? m.hanMucTieu : m.hanMucTieu ?? m.hanPhapLy;
    if (!han) continue;
    const kieu: KieuHan = m.loai === 'tuyChon' ? 'TUY_CHON' : m.noiBo ? 'NOI_BO' : 'PHAP_LY';
    gop({
      tienTo: `cuoc:${c.id}:${m.ma}`,
      tieuDeNguon: ten,
      ten: catNgan(m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, ''), 70),
      han,
      hanPhapLy: m.hanPhapLy,
      kieu,
      lienKet,
      canCu: m.canCu,
    });
    // nhắc trước n ngày (lưu trữ hồ sơ…)
    const buocQT = bo.buoc.find((b) => b.ma === m.ma);
    if (buocQT?.nhacTruocNgay && m.hanPhapLy) {
      const ngay = congNgayThuan(m.hanPhapLy, -buocQT.nhacTruocNgay);
      if (ngay >= tuNgay && ngay <= denNgay) {
        ra.push({
          khoa: `cuoc:${c.id}:${m.ma}|TRUOC-${buocQT.nhacTruocNgay}|${m.hanPhapLy}`,
          luc: ghepNgayGio(ngay, GIO('08:00')),
          mucDo: 'THONG_TIN',
          tieuDe: `${ten} – Còn ${buocQT.nhacTruocNgay} ngày: ${m.ten}`,
          noiDung: `Hạn ${dinhDangNgay(m.hanPhapLy)} · ${m.canCu}`,
          lienKet,
        });
      }
    }
  }

  // Theo dõi nộp tiền: thứ Hai hằng tuần đến khi nộp đủ
  const s4 = kq.danhSach.find((m) => m.ma === 'S4');
  const phaiNop = c.ketQua.truyThu + c.ketQua.phat + c.ketQua.chamNop;
  const daNop = c.nopTien.reduce((t, l) => t + l.soTien, 0);
  if (s4 && s4.trangThai !== 'KHONG_AP_DUNG' && !c.buoc.S4?.xong && phaiNop > daNop && c.buoc.X?.ngay) {
    for (let ngay = tuNgay; ngay <= denNgay; ngay = congNgayThuan(ngay, 1)) {
      if (!tuanLe(ngay, 1) || ngay <= c.buoc.X.ngay || !laNgayLamViec(lich, ngay)) continue;
      ra.push({
        khoa: `cuoc:${c.id}:S4|TUAN@${ngay}`,
        luc: ghepNgayGio(ngay, GIO('08:30')),
        mucDo: 'THONG_TIN',
        tieuDe: `${ten} – Đôn đốc nộp tiền`,
        noiDung: `Còn phải nộp ${new Intl.NumberFormat('vi-VN').format(phaiNop - daNop)} đồng. Hạn nộp theo QĐ: ${s4.hanPhapLy ? dinhDangNgay(s4.hanPhapLy) : 'chưa rõ'}.`,
        lienKet,
      });
    }
  }

  // Checklist nhập liệu
  for (const v of sinhChecklist(c, kq, lich, homNay, { tenChucNang: d.caiDat.tenChucNangHeThong })) {
    if (v.xong || v.trangThai === 'KHONG_AP_DUNG' || v.hangNgay) continue;
    gop({
      tienTo: `cuoc:${c.id}:CL:${v.khoa}`,
      tieuDeNguon: ten,
      ten: catNgan(`Nhập ${v.heThong}: ${v.chucNang}`, 80),
      han: v.han,
      kieu: 'NOI_BO',
      lienKet: `#nhap-lieu`,
    });
  }

  // Nhật ký iTNK: 16:30 · 17:15 báo thức · 07:45 hôm sau
  const gNk = d.caiDat.nhac.nhatKy || '16:30';
  const gNkBt = d.caiDat.nhac.nhatKyBaoThuc || '17:15';
  const cuoi = c.buoc.T7?.ngay ?? kq.moc.E?.ngay;
  const dauC = kq.moc.C && !kq.moc.C.duKien ? kq.moc.C.ngay : undefined;
  if (dauC && cuoi && !kq.baiBo) {
    for (let ngay = dauC > tuNgay ? dauC : tuNgay; ngay <= cuoi && ngay <= denNgay; ngay = congNgayThuan(ngay, 1)) {
      if (!laNgayTaiDN(c, kq, lich, ngay) || c.nhatKy[ngay]?.daGhiITNK) continue;
      const cau = 'Ghi nhật ký iTNK hôm nay';
      ra.push({ khoa: `cuoc:${c.id}:NK|16|${ngay}`, luc: ghepNgayGio(ngay, GIO(gNk)), mucDo: 'CANH_BAO', tieuDe: `${ten} – ${cau}`, noiDung: 'Cập nhật nhật ký đoàn / tiến độ công việc trên iTNK.', lienKet });
      ra.push({ khoa: `cuoc:${c.id}:NK|17|${ngay}`, luc: ghepNgayGio(ngay, GIO(gNkBt)), mucDo: 'BAO_THUC', tieuDe: `${ten} – Chưa ghi nhật ký iTNK hôm nay`, noiDung: 'Hôm nay chưa tích “đã ghi iTNK”.', lienKet });
      const hom = congNLV(lich, ngay, 1);
      ra.push({ khoa: `cuoc:${c.id}:NK|07|${ngay}`, luc: ghepNgayGio(hom, GIO('07:45')), mucDo: 'KHAN', tieuDe: `${ten} – Còn thiếu nhật ký iTNK ${dinhDangNgayNgan(ngay)}`, noiDung: 'Nhật ký ngày hôm trước vẫn chưa được ghi.', lienKet });
    }
  }

  // Yêu cầu tài liệu: hạn − 60 phút và đúng hạn
  for (const y of c.yeuCauTaiLieu) {
    if (y.nhanLuc) continue;
    const han = hanYeuCauTaiLieu(lich, bo, y);
    const truoc = bo.dongHo.YEU_CAU_TAI_LIEU.nhacTruocPhut ?? 60;
    const { ngay, phut } = tachNgayGio(han);
    const lucTruoc = ghepNgayGio(ngay, Math.max(0, phut - truoc));
    const gh = `NNT cung cấp tài liệu: ${y.noiDung}`;
    ra.push({ khoa: `cuoc:${c.id}:YC:${y.id}|TRUOC|${han}`, luc: lucTruoc, mucDo: 'CANH_BAO', tieuDe: `${ten} – Còn ${truoc} phút: ${y.noiDung}`, noiDung: gh, lienKet });
    ra.push({ khoa: `cuoc:${c.id}:YC:${y.id}|HAN|${han}`, luc: han, mucDo: 'KHAN', tieuDe: `${ten} – Hết hạn cung cấp tài liệu: ${y.noiDung}`, noiDung: `${gh}. ${dongHoYeuCau(lich, bo, y, han).goiY ?? ''}`.trim(), lienKet });
  }

  // Vướng mắc: chặng đang chạy
  for (const v of c.vuongMac) {
    if (v.daXong) continue;
    const chang = changDangChay(dongHoVuongMac(lich, bo, v, homNay));
    if (!chang?.han) continue;
    gop({ tienTo: `cuoc:${c.id}:VM:${v.id}:${chang.ma}`, tieuDeNguon: ten, ten: catNgan(`${chang.ten} (vướng mắc: ${v.noiDung})`, 80), han: chang.han, kieu: 'NOI_BO', lienKet, canCu: chang.canCu });
  }
}

export function sinhLichNhac(d: DuLieuNhac, tuNgay: NgayISO, denNgay: NgayISO): Nhac[] {
  const nh = d.caiDat.nhac;
  if (!nh.bat) return [];
  const { lich, homNay } = d;
  const ra: Nhac[] = [];

  for (const c of d.cuoc) {
    if (c.xoaLuc) continue;
    nguonCuaCuoc(c, d, d.caiDat.anDanh, tuNgay, denNgay, ra);
  }

  // Việc ngoài cuộc
  for (const v of d.viec) {
    if (v.xong || v.xoaLuc || !v.han) continue;
    ra.push(
      ...lichChoMotHan(
        { tienTo: `viec:${v.id}`, tieuDeNguon: 'Việc', ten: v.tieuDe, han: v.han, kieu: 'NOI_BO', lienKet: '#viec', gio: v.gio },
        lich,
        homNay,
        tuNgay,
        denNgay,
      ),
    );
  }

  // Kế hoạch: hạn công khai, báo cáo chuyên đề
  const boMd = chonBoQuyTac(undefined, homNay, undefined, d.va);
  for (const kh of d.keHoach) {
    if (kh.xoaLuc) continue;
    for (const h of hanCuaKeHoach(lich, boMd, kh, homNay)) {
      if (!h.han || h.ngayXong) continue;
      ra.push(...lichChoMotHan({ tienTo: `kh:${kh.id}:${h.ma}`, tieuDeNguon: 'Kế hoạch', ten: `${h.ten} (${kh.ten})`, han: h.han, hanPhapLy: h.han, kieu: 'PHAP_LY', lienKet: '#ke-hoach-nam', canCu: h.canCu }, lich, homNay, tuNgay, denNgay));
    }
  }

  // Nhịp cố định theo ngày
  for (let ngay = tuNgay; ngay <= denNgay; ngay = congNgayThuan(ngay, 1)) {
    const lv = laNgayLamViec(lich, ngay);
    if (lv && nh.banTinSang) {
      ra.push({ khoa: `nhip:BANTIN|${ngay}`, luc: ghepNgayGio(ngay, GIO(nh.banTinSang)), mucDo: 'THONG_TIN', tieuDe: 'Bản tin sáng', noiDung: `Bản tin ${dinhDangNgay(ngay)}: việc quá hạn, đến hạn, nhập liệu còn thiếu.`, lienKet: '#hom-nay' });
    }
    if (thuTrongTuan(ngay) === 5 && lv) {
      ra.push({ khoa: `nhip:RSTUAN|${ngay}`, luc: ghepNgayGio(ngay, GIO('15:30')), mucDo: 'THONG_TIN', tieuDe: 'Rà soát tuần', noiDung: 'Rà soát việc trong tuần, chuyển việc chưa xong sang tuần sau.', lienKet: '#bao-cao' });
    }
    if (thuTrongTuan(ngay) === 1 && lv) {
      ra.push({ khoa: `nhip:KHTUAN|${ngay}`, luc: ghepNgayGio(ngay, GIO('07:30')), mucDo: 'THONG_TIN', tieuDe: 'Kế hoạch tuần', noiDung: 'Lên kế hoạch cho tuần mới.', lienKet: '#ke-hoach-ngay' });
    }
    if (d.saoLuuCuoi !== undefined && lv && canNhacSaoLuu(ngay, d.saoLuuCuoi)) {
      ra.push({ khoa: `nhip:SAOLUU|${ngay}`, luc: ghepNgayGio(ngay, GIO('15:45')), mucDo: 'CANH_BAO', tieuDe: 'Sao lưu dữ liệu', noiDung: d.saoLuuCuoi ? `Lần sao lưu gần nhất: ${dinhDangNgay(d.saoLuuCuoi)}. Tải tệp sao lưu để không mất dữ liệu.` : 'Bạn chưa sao lưu lần nào. Tải tệp sao lưu để không mất dữ liệu.', lienKet: '#cai-dat' });
    }
    // Kế hoạch năm: từ 01/10, thứ Hai đầu tháng – cuộc kế hoạch chưa có QĐ
    const [nam, thang, ngayTrongThang] = ngay.split('-').map(Number);
    if (thang >= 10 && ngayTrongThang <= 7 && thuTrongTuan(ngay) === 1) {
      const chua = d.cuoc.filter((c) => !c.xoaLuc && c.keHoachId && !c.buoc.P5?.xong && !c.suKien.some((s) => s.loai === 'BAI_BO') && c.taoLuc.slice(0, 4) <= String(nam));
      if (chua.length) {
        ra.push({ khoa: `nhip:KHNAM|${ngay}`, luc: ghepNgayGio(ngay, GIO('08:00')), mucDo: 'CANH_BAO', tieuDe: `Kế hoạch năm: ${chua.length} cuộc chưa ban hành QĐ`, noiDung: 'Cân nhắc đẩy nhanh hoặc chuyển sang đầu năm sau (Đ15.5.e).', lienKet: '#ke-hoach-nam' });
      }
    }
  }

  // Giờ yên lặng + lọc cửa sổ + sắp xếp, loại trùng khóa
  const thay = new Map<string, Nhac>();
  for (const n of ra) {
    const luc = n.mucDo === 'BAO_THUC' ? n.luc : ganGioYenLang(n.luc, nh.gioYenLangTu, nh.gioYenLangDen);
    const ngay = luc.slice(0, 10);
    if (ngay < tuNgay || ngay > denNgay) continue;
    thay.set(n.khoa, { ...n, luc });
  }
  return [...thay.values()].sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : a.khoa < b.khoa ? -1 : 1));
}
