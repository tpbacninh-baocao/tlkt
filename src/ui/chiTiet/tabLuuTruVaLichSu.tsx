// Tab “Hồ sơ lưu trữ” (checklist thành phần hồ sơ theo Đ35.2) và tab “Lịch sử sửa” (nhật ký thay đổi của riêng cuộc).
import { useEffect, useState } from 'preact/hooks';
import type { NhatKyHeThong } from '../../core/kieu';
import { dinhDangNgayGio } from '../../core/lich';
import { THANH_PHAN_HO_SO, daTichHoSo, mucSLA, tichHoSoVaoCuoc } from '../../core/vuViec';
import type { PhanTichCuoc } from '../../core/tomTat';
import { capNhatCuoc } from '../hanhDongCuoc';
import { homNay, kho_, dsCuoc } from '../store';
import { NhanSLA, ThanhTienDo, TrangThaiRong, chuNgay, conLaiNLVChu } from '../thanhPhan';
import { moFormXongBuoc } from './formXong';

export function TabLuuTru({ pt }: { pt: PhanTichCuoc }) {
  const c = pt.cuoc;
  const s6 = pt.kq.danhSach.find((m) => m.ma === 'S6');
  const daTich = THANH_PHAN_HO_SO.filter((t) => daTichHoSo(c, t.ma)).length;
  const xong = !!c.buoc.S6?.xong;
  return (
    <div>
      <section class="the" aria-label="Hạn bàn giao lưu trữ">
        <h3>Bàn giao hồ sơ lưu trữ</h3>
        {s6 ? (
          <>
            <p>
              Hạn bàn giao (X + 12 tháng): <b>{chuNgay(s6.hanPhapLy)}</b>
              {s6.duKien ? ' (dự kiến – chưa có QĐ xử phạt/Kết luận)' : ''} <NhanSLA muc={mucSLA(s6)} />
            </p>
            <p class="phu">{s6.canCu} · Biểu mẫu {s6.bieuMau.join(', ')} · nhắc trước 30 ngày{s6.nlvConLai !== undefined && !s6.duKien ? ` · ${conLaiNLVChu(s6.nlvConLai)}` : ''}</p>
            <div class="hang-nut">
              {xong ? (
                <span class="dam">✓ Đã bàn giao {chuNgay(c.buoc.S6.ngay)}</span>
              ) : (
                <button type="button" class="nut nut-chinh" disabled={!c.buoc.X?.xong} title={c.buoc.X?.xong ? undefined : 'Cần ban hành QĐ xử phạt/Kết luận trước'} onClick={() => moFormXongBuoc(c.id, 'S6')}>
                  Đánh dấu đã bàn giao…
                </button>
              )}
              {xong && (
                <button type="button" class="nut nut-nho" onClick={() => moFormXongBuoc(c.id, 'S6')}>
                  Sửa
                </button>
              )}
            </div>
          </>
        ) : null}
      </section>
      <section class="the" aria-label="Thành phần hồ sơ">
        <h3>Thành phần hồ sơ (Đ35.2)</h3>
        <ThanhTienDo xong={daTich} tong={THANH_PHAN_HO_SO.length} nhan={`${daTich}/${THANH_PHAN_HO_SO.length} thành phần đã đủ`} />
        <ul class="ds-nl" style={{ marginTop: 8 }}>
          {THANH_PHAN_HO_SO.map((t) => (
            <li key={t.ma} class="hang-nl" style={{ gridTemplateColumns: 'auto 1fr' }}>
              <input type="checkbox" id={`lt-${t.ma}`} checked={daTichHoSo(c, t.ma)} onChange={(e) => void capNhatCuoc(c.id, (x) => tichHoSoVaoCuoc(x, t.ma, (e.target as HTMLInputElement).checked ? homNay.value : null))} />
              <label for={`lt-${t.ma}`}>{t.ten}</label>
            </li>
          ))}
        </ul>
        <p class="phu">Ứng dụng chỉ ghi nhận bạn đã chuẩn bị đủ thành phần; không lưu nội dung tài liệu của NNT.</p>
      </section>
    </div>
  );
}

const TEN_HANH_DONG: Record<string, string> = { THEM: 'Tạo', SUA: 'Sửa', XOA: 'Xóa (vào Thùng rác)', KHOI_PHUC: 'Khôi phục', CAI_DAT: 'Cài đặt', NHAP: 'Nhập', XUAT: 'Xuất' };
const TEN_TRUONG: Record<string, string> = {
  mst: 'MST', tenNNT: 'Tên NNT', diaChi: 'Địa chỉ', doiTuong: 'Đối tượng', loai: 'Loại cuộc', keHoachId: 'Kế hoạch', thangDuKien: 'Tháng dự kiến',
  coGDLK: 'Giao dịch liên kết', truongDoan: 'Trưởng đoàn', thanhVien: 'Thành viên', giamSat: 'Giám sát', noiDung: 'Nội dung', thoiKy: 'Thời kỳ',
  buoc: 'Các bước', suKien: 'Sự kiện', ketQua: 'Kết quả', nopTien: 'Nộp tiền', checklist: 'Nhập hệ thống', nhatKy: 'Nhật ký iTNK',
  yeuCauTaiLieu: 'Yêu cầu tài liệu', vuongMac: 'Vướng mắc', hanNgoai: 'Hạn ngoài', vanBanGiao: 'Văn bản giao', soQD: 'Số QĐ',
  ngayCongBoDuKien: 'Ngày công bố dự kiến', ngayKhongLamTaiDN: 'Ngày không xuống DN', kiemTraLai: 'Kiểm tra lại', kiemTraDienTu: 'Kiểm tra điện tử',
};

function gonGia(v: unknown): string {
  if (v === undefined || v === null || v === '') return '(trống)';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `${v.length} mục`;
  const s = JSON.stringify(v);
  return s.length > 140 ? s.slice(0, 137) + '…' : s;
}

/** Với đối tượng lớn (buoc, checklist…) chỉ nêu khóa thay đổi. */
function moTaThayDoi(truoc: unknown, sau: unknown): string[] {
  const t = (truoc ?? {}) as Record<string, unknown>;
  const s = (sau ?? {}) as Record<string, unknown>;
  const dong: string[] = [];
  for (const k of Object.keys(s)) {
    const a = t[k];
    const b = s[k];
    const ten = TEN_TRUONG[k] ?? k;
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const kk of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) {
        const x = (a as Record<string, unknown>)[kk];
        const y = (b as Record<string, unknown>)[kk];
        if (JSON.stringify(x) !== JSON.stringify(y)) dong.push(`${k === 'checklist' && kk.startsWith('LT:') ? 'Hồ sơ lưu trữ' : ten} › ${kk.replace(/^LT:/, '')}: ${gonGia(x)} → ${gonGia(y)}`);
      }
    } else dong.push(`${ten}: ${gonGia(a)} → ${gonGia(b)}`);
  }
  return dong;
}

export function TabLichSu({ pt }: { pt: PhanTichCuoc }) {
  const id = pt.cuoc.id;
  const [ds, setDs] = useState<(NhatKyHeThong & { khoaBanGhi: string })[] | null>(null);
  const [loi, setLoi] = useState('');
  // nạp lại mỗi khi cuộc được lưu (suaLuc đổi)
  const suaLuc = dsCuoc.value.find((c) => c.id === id)?.suaLuc;
  useEffect(() => {
    let huy = false;
    kho_()
      .docNhatKy({ id, gioiHan: 100 })
      .then((r) => !huy && setDs(r))
      .catch((e) => !huy && setLoi(String(e)));
    return () => {
      huy = true;
    };
  }, [id, suaLuc]);
  if (loi) return <p class="loi-truong">Không đọc được lịch sử: {loi}</p>;
  if (!ds) return <p class="phu" role="status">Đang tải lịch sử…</p>;
  if (!ds.length) return <TrangThaiRong tieuDe="Chưa có lịch sử" moTa="Mọi thao tác thêm/sửa/xóa cuộc sẽ được ghi lại ở đây." />;
  return (
    <section class="the" aria-label="Lịch sử sửa">
      <h3>Lịch sử sửa ({ds.length})</h3>
      <p class="phu">Ghi lại 100 thay đổi gần nhất của cuộc này. Dữ liệu chỉ lưu trên máy bạn.</p>
      <ol class="lich-su">
        {ds.map((e) => {
          const dong = e.hanhDong === 'SUA' ? moTaThayDoi(e.truoc, e.sau) : [];
          return (
            <li key={e.khoaBanGhi}>
              <div>
                <span class="dam">{TEN_HANH_DONG[e.hanhDong] ?? e.hanhDong}</span> <span class="phu">{dinhDangNgayGio(e.luc)}</span>
              </div>
              {dong.length > 0 && (
                <ul>
                  {dong.slice(0, 8).map((d, i) => (
                    <li key={i} class="phu">{d}</li>
                  ))}
                  {dong.length > 8 && <li class="phu">… và {dong.length - 8} thay đổi khác</li>}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
