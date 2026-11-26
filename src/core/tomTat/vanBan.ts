// Sinh văn bản tiếng Việt tự động: tóm tắt một cuộc, bản tin sáng, báo cáo tiến độ đoàn, báo cáo tuần (SPEC §12.7).
import type { CuocKiemTra, MocTinh, NgayISO } from '../kieu';
import { boaCuoiMST } from '../nhacViec/anDanh';
import {
  congNgayThuan,
  dinhDangNgay,
  dinhDangNgayThu,
  dinhDangSo,
  ngayDauTuan,
  dinhDangNgayNgan,
} from '../lich';
import { suKienGiaHan, tongNgayTamDung } from '../quyTac';
import { TEN_GIAI_DOAN } from '../vuViec/giaiDoan';
import { laBuocNoiBoDaQua, timMoc } from '../vuViec/tinhMoc';
import { anDanhHieuLuc, phanTichCuoc, soNhapLieuThieu, tenNgan, type DuLieuTomTat, type PhanTichCuoc } from './phanTich';
import { tongHopHomNay, type MucViec } from './tongHop';

const GACH = '–';

/** “Công ty A (MST …1234)” hoặc, khi ẩn danh, “KT …1234”. */
export function danhTinhCuoc(c: Pick<CuocKiemTra, 'mst' | 'tenNNT'>, anDanh: boolean): string {
  const duoi = boaCuoiMST(c.mst);
  if (anDanh || !c.tenNNT.trim()) return `KT …${duoi}`;
  return `${c.tenNNT} (MST …${duoi})`;
}

export function conLaiNLV(nlv: number | undefined): string {
  if (nlv === undefined) return '';
  if (nlv < 0) return `quá ${-nlv} ngày LV`;
  if (nlv === 0) return 'hôm nay';
  return `còn ${nlv} ngày LV`;
}

function hanCuaMoc(m: MocTinh | undefined): NgayISO | undefined {
  return m ? (m.noiBo ? m.hanMucTieu : m.hanPhapLy) : undefined;
}

function cauTiepTheo(p: PhanTichCuoc): string | undefined {
  const m = p.tiepTheo;
  if (!m) return undefined;
  const han = hanCuaMoc(m);
  const ten = tenNgan(m.ten);
  return `việc tiếp theo: ${ten}${han ? ` (hạn ${dinhDangNgay(han)}${m.nlvConLai !== undefined ? ', ' + conLaiNLV(m.nlvConLai) : ''})` : ''}`;
}

function conPhaiNop(c: CuocKiemTra): { phai: number; da: number; con: number } {
  const phai = c.ketQua.truyThu + c.ketQua.phat + c.ketQua.chamNop;
  const da = c.nopTien.reduce((t, l) => t + l.soTien, 0);
  return { phai, da, con: Math.max(0, phai - da) };
}

/** Tóm tắt một cuộc thành một đoạn văn. */
export function tomTatMotCuoc(c: CuocKiemTra, d: DuLieuTomTat, pt?: PhanTichCuoc): string {
  const p = pt ?? phanTichCuoc(c, d);
  const ten = danhTinhCuoc(c, anDanhHieuLuc(d));
  const { kq } = p;
  const y: string[] = [];
  const ngay = (ma: string) => {
    const m = kq.moc[ma];
    return m && !m.duKien ? dinhDangNgay(m.ngay) : undefined;
  };
  switch (p.giaiDoan) {
    case 'CHUAN_BI':
      y.push('đang chuẩn bị hồ sơ trình ban hành QĐ kiểm tra');
      break;
    case 'CHO_CONG_BO': {
      y.push(`đã có QĐ kiểm tra${c.soQD ? ' số ' + c.soQD : ''} ngày ${ngay('D0')}`);
      const q5 = hanCuaMoc(timMoc(kq, 'Q5'));
      if (q5) y.push(`chờ công bố, hạn công bố ${dinhDangNgay(q5)}`);
      break;
    }
    case 'DANG_KIEM_TRA': {
      const nt = p.ngayThu;
      y.push(nt ? `đang kiểm tra tại trụ sở ngày thứ ${nt.n}/${nt.tong}${nt.donVi === 'NLV' ? ' (ngày làm việc)' : ''}` : 'đang kiểm tra tại trụ sở');
      if (kq.moc.E) y.push(`hạn kết thúc tại trụ sở ${dinhDangNgay(kq.moc.E.ngay)}`);
      const gh = suKienGiaHan(c.suKien);
      const t3 = timMoc(kq, 'T3');
      if (gh) y.push(`đã gia hạn ${gh.soNgay} ngày`);
      else if (t3?.hanPhapLy && t3.trangThai !== 'KHONG_AP_DUNG') y.push(`hạn đề nghị gia hạn ${dinhDangNgay(t3.hanPhapLy)}`);
      const td = tongNgayTamDung(c.suKien);
      if (td) y.push(`đã tạm dừng ${td} ngày`);
      if (p.ycChuaNhan) {
        const gio = String(p.bo.dongHo.YEU_CAU_TAI_LIEU.so).padStart(2, '0');
        y.push(`còn ${p.ycChuaNhan} yêu cầu tài liệu chưa nhận (quá ${gio} giờ làm việc: ${p.ycQuaHan})`);
      }
      y.push(p.nhatKyThieu ? `thiếu nhật ký iTNK ${p.nhatKyThieu} ngày` : 'nhật ký iTNK đã ghi đủ');
      break;
    }
    case 'BIEN_BAN': {
      y.push(`đã công khai dự thảo biên bản ngày ${ngay('K')}`);
      const b1 = hanCuaMoc(timMoc(kq, 'B1'));
      if (b1) y.push(`hạn ký biên bản ${dinhDangNgay(b1)}`);
      break;
    }
    case 'CHO_QD_XU_LY': {
      y.push(`đã ký biên bản ngày ${ngay('B')}`);
      const x = hanCuaMoc(timMoc(kq, 'X'));
      if (x) y.push(`hạn ban hành ${kq.cheDoX === 'X4' ? 'Kết luận kiểm tra' : 'QĐ xử phạt'} ${dinhDangNgay(x)} (${kq.cheDoX})`);
      break;
    }
    case 'SAU_QD':
      y.push(`đã ban hành ${kq.cheDoX === 'X4' ? 'Kết luận kiểm tra' : 'QĐ xử phạt'} ngày ${ngay('X')}`);
      break;
    case 'THEO_DOI_NOP_TIEN': {
      const n = conPhaiNop(c);
      y.push(`đã hoàn thành các bước, đang theo dõi nộp tiền: phải nộp ${dinhDangSo(n.phai)} đồng, đã nộp ${dinhDangSo(n.da)} đồng, còn ${dinhDangSo(n.con)} đồng`);
      break;
    }
    case 'HOAN_THANH':
      y.push('đã hoàn thành cuộc kiểm tra');
      break;
    case 'BAI_BO': {
      const bb = c.suKien.find((s) => s.loai === 'BAI_BO');
      y.push(`QĐ kiểm tra đã bị bãi bỏ${bb && typeof bb.ngayQD === 'string' ? ' ngày ' + dinhDangNgay(bb.ngayQD) : ''}`);
      break;
    }
  }
  if (!['DANG_KIEM_TRA', 'HOAN_THANH', 'BAI_BO'].includes(p.giaiDoan)) {
    const tt = cauTiepTheo(p);
    if (tt) y.push(tt);
  }
  if (p.soBuocQuaHan) y.push(`đang có ${p.soBuocQuaHan} bước quá hạn`);
  const thieu = soNhapLieuThieu(p);
  if (thieu && !['HOAN_THANH', 'BAI_BO'].includes(p.giaiDoan)) y.push(`còn ${thieu} mục nhập liệu hệ thống chưa làm`);
  if (p.giaiDoan === 'BAI_BO') return `Đến ${dinhDangNgay(d.homNay)}, ${y[0].replace('QĐ kiểm tra đã bị bãi bỏ', `QĐ kiểm tra đối với ${ten} đã bị bãi bỏ`)}.`;
  return `Đến ${dinhDangNgay(d.homNay)}, đoàn kiểm tra ${ten} ${y.join('; ')}.`;
}

function dongViec(m: MucViec): string {
  const nguon = m.nhanCuoc ? `${m.nhanCuoc}: ` : '';
  const han = m.han ? ` (hạn ${dinhDangNgayNgan(m.han)}${m.nlvConLai !== undefined ? ', ' + conLaiNLV(m.nlvConLai) : ''})` : '';
  return `   ${GACH} ${nguon}${m.tieuDe}${han}`;
}

function nhomDong(ds: MucViec[], toiDa = 5): string[] {
  const kq = ds.slice(0, toiDa).map(dongViec);
  if (ds.length > toiDa) kq.push(`   ${GACH} … và ${ds.length - toiDa} việc khác`);
  return kq;
}

/** Bản tin sáng cá nhân. */
export function banTinSang(d: DuLieuTomTat): string {
  const th = tongHopHomNay(d);
  const ten = d.caiDat.canBo.hoTen.trim();
  const dong: string[] = [`BẢN TIN SÁNG ${GACH} ${dinhDangNgayThu(d.homNay)}`, `Chào ${ten || 'bạn'}, tình hình hôm nay:`];
  if (th.kpi.quaHan) dong.push(`• Quá hạn: ${th.kpi.quaHan} việc`, ...nhomDong(th.quaHan));
  if (th.kpi.homNay) dong.push(`• Đến hạn hôm nay: ${th.kpi.homNay} việc`, ...nhomDong(th.homNay));
  if (th.kpi.baNLV) dong.push(`• 3 ngày làm việc tới: ${th.kpi.baNLV} việc`, ...nhomDong(th.baNLVToi, 3));
  for (const t of th.taiDN) {
    const nt = t.ngayThu ? ` ${GACH} ngày thứ ${t.ngayThu.n}/${t.ngayThu.tong}` : '';
    const e = t.hanE ? ` ${GACH} hạn kết thúc ${dinhDangNgay(t.hanE)}` : '';
    dong.push(`• Tại doanh nghiệp hôm nay: ${t.nhanCuoc}${nt}${e}${t.daGhiITNK ? '' : ' – chưa ghi nhật ký iTNK'}`);
    if (t.ycChuaNhan) dong.push(`   ${GACH} ${t.ycChuaNhan} yêu cầu tài liệu chưa nhận (quá hạn: ${t.ycQuaHan})`);
  }
  if (th.kpi.nhapLieuThieu) dong.push(`• Nhập liệu còn thiếu: ${th.kpi.nhapLieuThieu} mục (TTR/iTNK/TMS)`);
  if (!th.kpi.quaHan && !th.kpi.homNay && !th.kpi.baNLV && !th.taiDN.length && !th.kpi.nhapLieuThieu) {
    dong.push('• Không có việc gấp – xem kế hoạch tuần.');
  }
  return dong.join('\n');
}

/** Báo cáo tiến độ đoàn gửi lãnh đạo (dán Zalo/email). */
export function baoCaoTienDoDoan(c: CuocKiemTra, d: DuLieuTomTat, pt?: PhanTichCuoc): string {
  const p = pt ?? phanTichCuoc(c, d);
  const an = anDanhHieuLuc(d);
  const { kq } = p;
  const mocDong = (nhan: string, ma: string) => {
    const m = kq.moc[ma];
    if (!m) return `   ${GACH} ${nhan}: chưa có`;
    const dau = ma === 'E' ? (m.duKien ? ' (dự kiến)' : ' (hạn)') : m.duKien ? ' (dự kiến)' : ' ✓';
    return `   ${GACH} ${nhan}: ${dinhDangNgay(m.ngay)}${dau}`;
  };
  const dong: string[] = [
    'BÁO CÁO TIẾN ĐỘ ĐOÀN KIỂM TRA',
    `Ngày ${dinhDangNgay(d.homNay)}`,
    `Đối tượng: ${danhTinhCuoc(c, an)} ${GACH} ${c.ma} [${c.loai}]`,
    `Trưởng đoàn: ${c.truongDoan || '(chưa nhập)'}`,
    `Giai đoạn: ${TEN_GIAI_DOAN[p.giaiDoan]}`,
    `Quyết định kiểm tra: ${c.soQD ? 'số ' + c.soQD + ', ' : ''}ngày ${kq.moc.D0 && !kq.moc.D0.duKien ? dinhDangNgay(kq.moc.D0.ngay) : '(chưa ban hành)'}`,
    `Tóm tắt: ${tomTatMotCuoc(c, d, p)}`,
    'Các mốc chính:',
    mocDong('Ban hành QĐ (D0)', 'D0'),
    mocDong('Công bố QĐ (C)', 'C'),
    mocDong('Hạn kết thúc tại trụ sở (E)', 'E'),
    mocDong('Công khai dự thảo biên bản (K)', 'K'),
    mocDong('Ký biên bản (B)', 'B'),
    mocDong('Ban hành QĐ xử phạt/Kết luận (X)', 'X'),
  ];
  const tt = p.tiepTheo;
  dong.push(`Việc tiếp theo: ${tt ? cauTiepTheo(p)!.replace('việc tiếp theo: ', '') : 'không còn việc tiếp theo'}`);
  const vm = c.vuongMac.filter((v) => !v.daXong);
  dong.push(`Vướng mắc đang chờ ý kiến: ${vm.length}${vm.length ? ' (' + vm.map((v) => v.noiDung).join('; ') + ')' : ''}`);
  if (c.ketQua.truyThu || c.ketQua.phat || c.ketQua.chamNop) {
    dong.push(`Kết quả: truy thu ${dinhDangSo(c.ketQua.truyThu)}, phạt ${dinhDangSo(c.ketQua.phat)}, chậm nộp ${dinhDangSo(c.ketQua.chamNop)} (đồng)`);
  }
  dong.push('Đề xuất, kiến nghị: …');
  return dong.join('\n');
}

/** Báo cáo tuần của cá nhân; `ngayTrongTuan` là một ngày bất kỳ trong tuần cần báo cáo. */
export function baoCaoTuan(d: DuLieuTomTat, ngayTrongTuan: NgayISO): string {
  const dau = ngayDauTuan(ngayTrongTuan);
  const cuoi = congNgayThuan(dau, 6);
  const dauSau = congNgayThuan(dau, 7);
  const cuoiSau = congNgayThuan(dau, 13);
  const an = anDanhHieuLuc(d);
  const th = tongHopHomNay(d);
  const dong: string[] = [`BÁO CÁO TUẦN ${GACH} từ ${dinhDangNgay(dau)} đến ${dinhDangNgay(cuoi)}`];
  if (d.caiDat.canBo.hoTen.trim()) dong.push(`Cán bộ: ${d.caiDat.canBo.hoTen}${d.caiDat.canBo.donVi ? ' ' + GACH + ' ' + d.caiDat.canBo.donVi : ''}`);

  const xong: string[] = [];
  for (const p of th.phanTich) {
    for (const m of p.kq.danhSach) {
      if (m.ngayXong && m.ngayXong >= dau && m.ngayXong <= cuoi && m.loai !== 'hanTinh' && m.loai !== 'hangNgay') {
        xong.push(`   ${GACH} ${danhTinhCuoc(p.cuoc, an)}: ${tenNgan(m.ten)} (${dinhDangNgay(m.ngayXong)})`);
      }
    }
  }
  for (const v of d.viec) {
    if (v.xong && !v.xoaLuc && v.xong.slice(0, 10) >= dau && v.xong.slice(0, 10) <= cuoi) xong.push(`   ${GACH} Việc: ${v.tieuDe} (${dinhDangNgay(v.xong.slice(0, 10))})`);
  }
  dong.push(`1. Kết quả trong tuần: ${xong.length ? xong.length + ' việc đã hoàn thành' : 'chưa ghi nhận việc hoàn thành'}`, ...xong);

  const dangLam = th.phanTich.filter((p) => !['HOAN_THANH', 'BAI_BO'].includes(p.giaiDoan));
  dong.push(`2. Các cuộc đang thực hiện: ${dangLam.length}`);
  for (const p of dangLam) {
    const tt = cauTiepTheo(p);
    dong.push(`   ${GACH} ${danhTinhCuoc(p.cuoc, an)} [${TEN_GIAI_DOAN[p.giaiDoan]}]${tt ? '; ' + tt : ''}`);
  }
  dong.push(`3. Tồn đọng, quá hạn: ${th.quaHan.length}`, ...nhomDong(th.quaHan, 8));

  const sau = th.phanTich
    .flatMap((p) => p.kq.danhSach.filter((m) => !p.cuoc.buoc[m.ma]?.xong && !m.duKien && m.trangThai !== 'KHONG_AP_DUNG' && !['hanTinh', 'hangNgay', 'theoDoi', 'tuyChon'].includes(m.loai) && !laBuocNoiBoDaQua(p.cuoc, m)).map((m) => ({ p, m })))
    .filter(({ m }) => {
      const h = hanCuaMoc(m);
      return h && h >= dauSau && h <= cuoiSau;
    })
    .sort((a, b) => (hanCuaMoc(a.m)! < hanCuaMoc(b.m)! ? -1 : 1));
  dong.push(`4. Kế hoạch tuần sau (${dinhDangNgayNgan(dauSau)}–${dinhDangNgayNgan(cuoiSau)}): ${sau.length} hạn`);
  for (const { p, m } of sau.slice(0, 10)) dong.push(`   ${GACH} ${danhTinhCuoc(p.cuoc, an)}: ${tenNgan(m.ten)} (hạn ${dinhDangNgay(hanCuaMoc(m)!)})`);
  dong.push(`5. Nhập liệu hệ thống còn thiếu: ${th.kpi.nhapLieuThieu} mục`);
  return dong.join('\n');
}

/**
 * Leo thang (SPEC §13): khi có việc quá hạn quá 1 ngày làm việc, soạn sẵn tin báo lãnh đạo/tổ trưởng.
 * Trả về undefined nếu không có việc nào như vậy. Người dùng tự gửi.
 */
export function tinBaoLanhDao(d: DuLieuTomTat): string | undefined {
  const ds = tongHopHomNay(d).quaHan.filter((m) => m.nlvConLai !== undefined && m.nlvConLai < -1);
  if (!ds.length) return undefined;
  const dong: string[] = [`Kính gửi lãnh đạo, em xin báo cáo các việc đang quá hạn (tính đến ${dinhDangNgay(d.homNay)}):`];
  ds.slice(0, 8).forEach((m, i) => {
    dong.push(`${i + 1}. ${m.nhanCuoc ? m.nhanCuoc + ' ' + GACH + ' ' : ''}${m.tieuDe}${m.han ? ` (hạn ${dinhDangNgay(m.han)}, quá ${-(m.nlvConLai as number)} ngày làm việc)` : ''}`);
  });
  if (ds.length > 8) dong.push(`… và ${ds.length - 8} việc khác.`);
  dong.push('Em đang xử lý và đề nghị lãnh đạo cho ý kiến chỉ đạo/gia hạn nếu cần. Em xin báo cáo.');
  return dong.join('\n');
}
