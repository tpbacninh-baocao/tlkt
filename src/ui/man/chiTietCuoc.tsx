// Chi tiết cuộc (UI §4.6): đầu trang dính, thanh tab, nội dung từng tab.
import { dinhDangNgay } from '../../core/lich';
import { nhanBanCuocTho, taoMaCuoc, mucSLA } from '../../core/vuViec';
import { nhanCuoc, linkGoogleLich } from '../../core/nhacViec';
import { tenNgan } from '../../core/tomTat';
import { viecConThieu } from '../../core/checklist';
import { TEN_GIAI_DOAN } from '../../core/vuViec';
import { luuCuoc, xoaMem, khoiPhucThungRac } from '../hanhDong';
import { moFormXongBuoc } from '../chiTiet/formXong';
import { TabDongThoiGian } from '../chiTiet/dongThoiGian';
import { TabKetQua } from '../chiTiet/tabKetQua';
import { TabLichSu, TabLuuTru } from '../chiTiet/tabLuuTruVaLichSu';
import { TabNhatKy } from '../chiTiet/tabNhatKy';
import { TabTaiLieu } from '../chiTiet/tabTaiLieu';
import { TabNhapHeThong } from '../chiTiet/tabNhapHeThong';
import { TabSuKien } from '../chiTiet/tabSuKien';
import { bayGio, caiDat, diDen, dsCuoc, homNay, phanTichMap, toast, xacNhan } from '../store';
import { xuatIcs } from '../xuat';
import { MenuNoi, NhanGiaiDoan, NhanLoai, NhanSLA, TrangThaiRong, chuNgay, conLaiNLVChu } from '../thanhPhan';
import { moFormCuoc } from './themCuoc';

const TABS = [
  { ma: '', ten: 'Dòng thời gian' },
  { ma: 'su-kien', ten: 'Sự kiện' },
  { ma: 'nhap-he-thong', ten: 'Nhập hệ thống' },
  { ma: 'nhat-ky', ten: 'Nhật ký' },
  { ma: 'tai-lieu', ten: 'Tài liệu & vướng mắc' },
  { ma: 'ket-qua', ten: 'Kết quả & nộp tiền' },
  { ma: 'luu-tru', ten: 'Hồ sơ lưu trữ' },
  { ma: 'lich-su', ten: 'Lịch sử sửa' },
] as const;

export function ManChiTietCuoc({ id, tab }: { id: string; tab?: string }) {
  const c = dsCuoc.value.find((x) => x.id === id);
  const pt = phanTichMap.value.get(id);
  if (!c) {
    return (
      <TrangThaiRong tieuDe="Không tìm thấy cuộc kiểm tra" moTa="Cuộc này có thể đã bị xóa hẳn.">
        <a class="nut" href="#cuoc">‹ Về danh sách cuộc</a>
      </TrangThaiRong>
    );
  }
  if (c.xoaLuc || !pt) {
    return (
      <TrangThaiRong tieuDe="Cuộc này đang ở Thùng rác" moTa={`${c.ma} · ${c.tenNNT}`}>
        <button type="button" class="nut nut-chinh" onClick={() => void khoiPhucThungRac('cuoc', c.id)}>Khôi phục</button>
        <a class="nut" href="#cuoc">‹ Về danh sách cuộc</a>
      </TrangThaiRong>
    );
  }

  const an = caiDat.value.anDanh;
  const tt = pt.tiepTheo;
  const hanGan = tt ? (tt.noiBo ? tt.hanMucTieu : tt.hanPhapLy) : undefined;
  const thieuNhapLieu = viecConThieu(pt.checklist.filter((v) => !v.hangNgay)).length;
  const dem: Record<string, number | undefined> = { 'su-kien': c.suKien.length, 'nhap-he-thong': thieuNhapLieu };
  const tabHienTai = TABS.find((t) => t.ma === (tab ?? ''))?.ma ?? '';

  const nhanBan = async () => {
    const moi = nhanBanCuocTho(c, crypto.randomUUID(), taoMaCuoc(dsCuoc.value, Number(homNay.value.slice(0, 4))), bayGio.value);
    const luu = await luuCuoc(moi);
    toast(`Đã nhân bản thành ${luu.ma}`);
    diDen(`#cuoc-${luu.id}`);
  };
  const xoa = async () => {
    const dongY = await xacNhan({ tieuDe: `Xóa cuộc ${c.ma}?`, moTa: 'Cuộc được chuyển vào Thùng rác và có thể khôi phục trong 30 ngày.', nutChinh: 'Xóa', nguyHiem: true });
    if (!dongY) return;
    await xoaMem('cuoc', c.id, `cuộc ${c.ma}`);
    diDen('#cuoc');
  };

  return (
    <div>
      <header class="dau-cuoc">
        <div class="dong-tren">
          <button type="button" class="nut nut-nhe nut-nho" onClick={() => (history.length > 1 ? history.back() : diDen('#cuoc'))} aria-label="Quay lại">
            ‹ Quay lại
          </button>
          <h2>{c.ma}</h2>
          <NhanLoai loai={c.loai} />
          <NhanGiaiDoan gd={pt.giaiDoan} />
          <span style={{ flex: 1 }} />
          <MenuNoi
            nhan="Tùy chọn cuộc"
            hanhDong={[
              { nhan: 'Sửa thông tin', chay: () => moFormCuoc(c.id) },
              { nhan: 'Nhân bản', chay: () => void nhanBan() },
              { nhan: 'Xuất lịch .ics', chay: () => void xuatIcs({ loai: 'CUOC', cuocId: c.id, ma: c.ma }) },
              { nhan: 'In', chay: () => window.print() },
              { nhan: 'Xóa', chay: () => void xoa() },
            ]}
          />
        </div>
        <p style={{ margin: '4px 0' }}>
          <b>{nhanCuoc(c, an)}</b>
          {!an && <span> · MST {c.mst}</span>}
          <span> · Trưởng đoàn: {c.truongDoan || '—'}</span>
        </p>
        {tt ? (
          <div class="banner-tiep">
            <div class="noi-dung-tiep">
              <span class="phu">Việc tiếp theo</span>
              <div class="dam">{tenNgan(tt.ten)}</div>
              <div class="phu">
                {hanGan ? `Hạn ${chuNgay(hanGan)}` : ''}
                {tt.nlvConLai !== undefined ? ` · ${conLaiNLVChu(tt.nlvConLai)}` : ''} · Bộ quy tắc {pt.bo.ma}
              </div>
            </div>
            <NhanSLA muc={mucSLA(tt)} />
            {['moc', 'buoc', 'dieuKien', 'theoDoiNopTien'].includes(tt.loai) && (
              <button type="button" class="nut nut-chinh nut-nho" onClick={() => moFormXongBuoc(c.id, tt.ma)}>
                ✓ Đánh dấu xong
              </button>
            )}
            {hanGan && <a class="nut nut-nho" href={linkGoogleLich({ ngay: tt.hanMucTieu ?? hanGan, tieuDe: `${nhanCuoc(c, an)} – ${tenNgan(tt.ten)}`, moTa: tt.canCu })} target="_blank" rel="noopener noreferrer">Thêm Google Lịch</a>}
          </div>
        ) : (
          <div class="banner-tiep"><span>{pt.giaiDoan === 'BAI_BO' ? 'Cuộc đã bị bãi bỏ.' : 'Không còn việc tiếp theo.'} Giai đoạn: {TEN_GIAI_DOAN[pt.giaiDoan]}.</span></div>
        )}
        {c.hanNgoai && <p class="phu" style={{ margin: '4px 0 0' }}>Hạn ngoài: {chuNgay(c.hanNgoai)} {c.hanNgoaiGhiChu ? `– ${c.hanNgoaiGhiChu}` : ''}</p>}
        <p class="phu" style={{ margin: '2px 0 0' }}>
          {c.thangDuKien ? `Tháng dự kiến ${c.thangDuKien.slice(5)}/${c.thangDuKien.slice(0, 4)} · ` : ''}Tạo {dinhDangNgay(c.taoLuc.slice(0, 10))}
        </p>
      </header>

      <nav class="tabs" aria-label="Các phần của cuộc">
        {TABS.map((t) => (
          <a key={t.ma} href={`#cuoc-${c.id}${t.ma ? '/' + t.ma : ''}`} aria-current={t.ma === tabHienTai ? 'true' : undefined}>
            {t.ten}
            {dem[t.ma] ? ` (${dem[t.ma]})` : ''}
          </a>
        ))}
      </nav>

      {tabHienTai === '' && <TabDongThoiGian pt={pt} />}
      {tabHienTai === 'su-kien' && <TabSuKien pt={pt} />}
      {tabHienTai === 'nhap-he-thong' && <TabNhapHeThong pt={pt} />}
      {tabHienTai === 'nhat-ky' && <TabNhatKy pt={pt} />}
      {tabHienTai === 'tai-lieu' && <TabTaiLieu pt={pt} />}
      {tabHienTai === 'ket-qua' && <TabKetQua pt={pt} />}
      {tabHienTai === 'luu-tru' && <TabLuuTru pt={pt} />}
      {tabHienTai === 'lich-su' && <TabLichSu pt={pt} />}
    </div>
  );
}
