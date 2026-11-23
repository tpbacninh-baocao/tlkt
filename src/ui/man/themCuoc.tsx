// Thêm/Sửa cuộc kiểm tra – 3 bước + xem trước mốc dự kiến (UI §4.5).
import { useState } from 'preact/hooks';
import type { CuocKiemTra, LoaiCuoc, NgayISO } from '../../core/kieu';
import { chonBoQuyTac } from '../../core/quyTac';
import { thoiHieuKiemTraLai } from '../../core/keHoach';
import { dinhDangNgay } from '../../core/lich';
import { kiemTraMST, taoCuocRong, taoMaCuoc, timCuocTrung, tinhMoc } from '../../core/vuViec';
import { tenNgan } from '../../core/tomTat';
import { luuCuoc } from '../hanhDong';
import { GOI_Y_LOAI, TEN_LOAI_CUOC } from '../chuoi';
import { bayGio, caiDat, diDen, dongBang, dsCuoc, dsKeHoach, homNay, lich, moBang, toast } from '../store';
import { ChonNgay, Truong, chuNgay } from '../thanhPhan';

interface Nhap {
  mst: string;
  tenNNT: string;
  diaChi: string;
  doiTuong: 'TO_CHUC' | 'HKD';
  coQuanQuanLyKhac: boolean;
  loai: LoaiCuoc;
  keHoachId: string;
  thangDuKien: string;
  coGDLK: boolean;
  kiemTraDienTu: boolean;
  kiemTraLai: boolean;
  ngayKLBiKiemTraLai: NgayISO | '';
  hanNgoai: NgayISO | '';
  hanNgoaiGhiChu: string;
  vanBanGiao: string;
  truongDoan: string;
  thanhVien: { hoTen: string; phanViec: string }[];
  giamSat: string[];
  noiDung: string;
  thoiKy: string;
  p1: NgayISO | '';
  ngayCongBoDuKien: NgayISO | '';
}

function nhapTuCuoc(c?: CuocKiemTra): Nhap {
  return {
    mst: c?.mst ?? '',
    tenNNT: c?.tenNNT ?? '',
    diaChi: c?.diaChi ?? '',
    doiTuong: c?.doiTuong ?? 'TO_CHUC',
    coQuanQuanLyKhac: c?.coQuanQuanLyKhac ?? false,
    loai: c?.loai ?? 'KH',
    keHoachId: c?.keHoachId ?? '',
    thangDuKien: c?.thangDuKien ?? '',
    coGDLK: c?.coGDLK ?? false,
    kiemTraDienTu: c?.kiemTraDienTu ?? false,
    kiemTraLai: c?.kiemTraLai ?? false,
    ngayKLBiKiemTraLai: c?.ngayKLBiKiemTraLai ?? '',
    hanNgoai: c?.hanNgoai ?? '',
    hanNgoaiGhiChu: c?.hanNgoaiGhiChu ?? '',
    vanBanGiao: c?.vanBanGiao ?? '',
    truongDoan: c?.truongDoan ?? caiDat.value.canBo.hoTen,
    thanhVien: (c?.thanhVien ?? []).map((t) => ({ hoTen: t.hoTen, phanViec: t.phanViec ?? '' })),
    giamSat: c?.giamSat ?? [],
    noiDung: c?.noiDung ?? '',
    thoiKy: c?.thoiKy ?? '',
    p1: c?.buoc.P1?.xong ? (c.buoc.P1.ngay ?? '') : '',
    ngayCongBoDuKien: c?.ngayCongBoDuKien ?? '',
  };
}

/** Dựng cuộc từ dữ liệu form (giữ nguyên các trường khác của cuộc cũ khi sửa). */
export function dungCuocTuNhap(n: Nhap, cu?: CuocKiemTra): CuocKiemTra {
  const goc =
    cu ??
    taoCuocRong({
      id: crypto.randomUUID(),
      ma: taoMaCuoc(dsCuoc.value, Number(homNay.value.slice(0, 4))),
      taoLuc: bayGio.value,
    });
  const c: CuocKiemTra = {
    ...goc,
    buoc: { ...goc.buoc },
    mst: kiemTraMST(n.mst).mst || n.mst.trim(),
    tenNNT: n.tenNNT.trim(),
    diaChi: n.diaChi.trim() || undefined,
    doiTuong: n.doiTuong,
    coQuanQuanLyKhac: n.coQuanQuanLyKhac,
    loai: n.loai,
    keHoachId: n.keHoachId || undefined,
    thangDuKien: n.thangDuKien || undefined,
    coGDLK: n.coGDLK,
    kiemTraDienTu: n.kiemTraDienTu,
    kiemTraLai: n.kiemTraLai,
    ngayKLBiKiemTraLai: n.kiemTraLai && n.ngayKLBiKiemTraLai ? n.ngayKLBiKiemTraLai : undefined,
    hanNgoai: n.hanNgoai || undefined,
    hanNgoaiGhiChu: n.hanNgoaiGhiChu.trim() || undefined,
    vanBanGiao: n.vanBanGiao.trim() || undefined,
    truongDoan: n.truongDoan.trim(),
    thanhVien: n.thanhVien.filter((t) => t.hoTen.trim()).map((t) => ({ hoTen: t.hoTen.trim(), phanViec: t.phanViec.trim() || undefined })),
    giamSat: n.giamSat.map((s) => s.trim()).filter(Boolean),
    noiDung: n.noiDung.trim() || undefined,
    thoiKy: n.thoiKy.trim() || undefined,
    ngayCongBoDuKien: n.ngayCongBoDuKien || undefined,
  };
  if (n.p1) c.buoc.P1 = { ...(c.buoc.P1 ?? {}), xong: true, ngay: n.p1 };
  else if (c.buoc.P1 && !c.buoc.P1.lyDoTre) delete c.buoc.P1;
  return c;
}

function DanhSachTen(p: { nhan: string; gia: { hoTen: string; phanViec?: string }[]; doi: (v: { hoTen: string; phanViec: string }[]) => void; coPhanViec?: boolean }) {
  const ds = p.gia.map((g) => ({ hoTen: g.hoTen, phanViec: g.phanViec ?? '' }));
  return (
    <fieldset class="truong" style={{ border: 0, padding: 0 }}>
      <legend class="nhan-truong">{p.nhan}</legend>
      {ds.map((g, i) => (
        <div key={i} class="hang" style={{ alignItems: 'flex-end', marginBottom: 4 }}>
          <input type="text" aria-label={`${p.nhan} ${i + 1}: họ tên`} placeholder="Họ tên" value={g.hoTen} onInput={(e) => p.doi(ds.map((x, j) => (j === i ? { ...x, hoTen: (e.target as HTMLInputElement).value } : x)))} style={{ flex: '2 1 160px' }} />
          {p.coPhanViec && (
            <input type="text" aria-label={`${p.nhan} ${i + 1}: phần việc`} placeholder="Phần việc được giao" value={g.phanViec} onInput={(e) => p.doi(ds.map((x, j) => (j === i ? { ...x, phanViec: (e.target as HTMLInputElement).value } : x)))} style={{ flex: '2 1 160px' }} />
          )}
          <button type="button" class="nut nut-nho" aria-label={`Xóa dòng ${i + 1}`} onClick={() => p.doi(ds.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
      <div>
        <button type="button" class="nut nut-nho" onClick={() => p.doi([...ds, { hoTen: '', phanViec: '' }])}>
          ＋ Thêm
        </button>
      </div>
    </fieldset>
  );
}

const MOC_XEM_TRUOC = ['P5', 'Q1', 'Q5', 'T1', 'T3', 'T7', 'B1', 'B4', 'X', 'S6'];

function XemTruoc({ n, cu }: { n: Nhap; cu?: CuocKiemTra }) {
  const giaDinhP1 = !n.p1 && !cu?.buoc.P5?.xong;
  const nhap: Nhap = giaDinhP1 ? { ...n, p1: homNay.value } : n;
  const c = dungCuocTuNhap(nhap, cu);
  const bo = chonBoQuyTac(c.buoc.P5?.xong ? c.buoc.P5.ngay : undefined, homNay.value, c.boQuyTacGhiDe, caiDat.value.vaQuyTac as never);
  const kq = tinhMoc(c, { lich: lich.value, homNay: homNay.value, bo });
  const ds = kq.danhSach.filter((m) => MOC_XEM_TRUOC.includes(m.ma) && (m.hanPhapLy || m.hanMucTieu));
  return (
    <section class="the" aria-label="Xem trước mốc dự kiến">
      <h3>Dòng thời gian dự kiến</h3>
      {giaDinhP1 && <p class="phu">Chưa có ngày nhận phân công – tạm tính như nhận phân công hôm nay ({dinhDangNgay(homNay.value)}).</p>}
      <p class="phu">Bộ quy tắc: {bo.ma}{bo.keThua ? ' (chuyển tiếp – chưa xác nhận)' : ''}. Các mốc nghiêng là ước tính từ mốc dự kiến.</p>
      <table class="bang">
        <tbody>
          {ds.map((m) => (
            <tr key={m.ma} class={m.duKien ? 'mo-dan' : ''}>
              <td>{tenNgan(m.ten)}</td>
              <td class="so">{chuNgay(m.noiBo ? m.hanMucTieu : m.hanPhapLy)}</td>
              <td class="phu">{m.noiBo ? 'nội bộ' : m.duKien ? 'dự kiến' : 'pháp lý'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FormCuoc({ cuocId, idBang }: { cuocId?: string; idBang: string }) {
  const cu = cuocId ? dsCuoc.value.find((c) => c.id === cuocId) : undefined;
  const [buoc, setBuoc] = useState(1);
  const [n, setN] = useState<Nhap>(() => nhapTuCuoc(cu));
  const [dang, setDang] = useState(false);
  const dat = (p: Partial<Nhap>) => setN((x) => ({ ...x, ...p }));
  const kMST = kiemTraMST(n.mst);
  const nam = Number(homNay.value.slice(0, 4));
  const trung = n.mst && kMST.hopLe ? timCuocTrung(dsCuoc.value, kMST.mst, nam, dsKeHoach.value, cuocId) : [];
  const goiY = GOI_Y_LOAI[n.loai];
  const hieu = n.kiemTraLai && n.ngayKLBiKiemTraLai ? thoiHieuKiemTraLai(chonBoQuyTac(undefined, homNay.value), n.ngayKLBiKiemTraLai, homNay.value) : undefined;

  const loiBuoc1 = !kMST.hopLe ? kMST.loi : !n.tenNNT.trim() ? 'Nhập tên người nộp thuế.' : undefined;
  const tiep = () => {
    if (buoc === 1 && loiBuoc1) return;
    setBuoc(buoc + 1);
  };

  const luu = async () => {
    if (loiBuoc1) {
      setBuoc(1);
      return;
    }
    setDang(true);
    try {
      const c = await luuCuoc(dungCuocTuNhap(n, cu));
      dongBang(idBang);
      toast(cu ? `Đã lưu ${c.ma}` : `Đã thêm cuộc ${c.ma}`);
      diDen(`#cuoc-${c.id}`);
    } catch (e) {
      toast(`Không lưu được: ${e instanceof Error ? e.message : e}`, 'loi');
    } finally {
      setDang(false);
    }
  };

  return (
    <div>
      <div class="buoc-form" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <i key={i} class={i <= buoc ? 'da' : ''} />
        ))}
      </div>
      <p class="phu">Bước {buoc}/3 – {buoc === 1 ? 'Người nộp thuế' : buoc === 2 ? 'Phân loại' : 'Đoàn & nội dung'}</p>

      {buoc === 1 && (
        <div>
          <Truong nhan="Mã số thuế" id="c-mst" batBuoc loi={n.mst && !kMST.hopLe ? kMST.loi : undefined}>
            <input id="c-mst" type="text" inputMode="numeric" value={n.mst} onInput={(e) => dat({ mst: (e.target as HTMLInputElement).value })} onBlur={() => kMST.hopLe && dat({ mst: kMST.mst })} />
          </Truong>
          {trung.length > 0 && (
            <p class="the canh-bao" role="alert" style={{ padding: 8 }}>
              ⚠ Đã có cuộc cho MST này trong năm {nam}: {trung.map((t) => t.ma).join(', ')}. Vẫn có thể tạo thêm nếu là cuộc khác.
            </p>
          )}
          <Truong nhan="Tên người nộp thuế" id="c-ten" batBuoc>
            <input id="c-ten" type="text" value={n.tenNNT} onInput={(e) => dat({ tenNNT: (e.target as HTMLInputElement).value })} />
          </Truong>
          <Truong nhan="Địa chỉ" id="c-dc">
            <input id="c-dc" type="text" value={n.diaChi} onInput={(e) => dat({ diaChi: (e.target as HTMLInputElement).value })} />
          </Truong>
          <fieldset class="truong" style={{ border: 0, padding: 0 }}>
            <legend class="nhan-truong">Đối tượng</legend>
            <div class="hang-nut">
              <label class="o-tich"><input type="radio" name="doi-tuong" checked={n.doiTuong === 'TO_CHUC'} onChange={() => dat({ doiTuong: 'TO_CHUC' })} /> Tổ chức</label>
              <label class="o-tich"><input type="radio" name="doi-tuong" checked={n.doiTuong === 'HKD'} onChange={() => dat({ doiTuong: 'HKD' })} /> Hộ, cá nhân kinh doanh</label>
            </div>
          </fieldset>
          <label class="o-tich">
            <input type="checkbox" checked={n.coQuanQuanLyKhac} onChange={(e) => dat({ coQuanQuanLyKhac: (e.target as HTMLInputElement).checked })} />
            <span>Có CQT/bộ phận khác quản lý trực tiếp (phải gửi bản sao QĐ/biên bản)</span>
          </label>
        </div>
      )}

      {buoc === 2 && (
        <div>
          <Truong nhan="Loại cuộc" id="c-loai" batBuoc goiY={goiY?.ghiChu}>
            <select id="c-loai" value={n.loai} onChange={(e) => dat({ loai: (e.target as HTMLSelectElement).value as LoaiCuoc })}>
              {Object.entries(TEN_LOAI_CUOC).map(([ma, ten]) => (
                <option key={ma} value={ma}>{ma} – {ten}</option>
              ))}
            </select>
          </Truong>
          <div class="luoi-2">
            <Truong nhan="Kế hoạch" id="c-kh">
              <select id="c-kh" value={n.keHoachId} onChange={(e) => dat({ keHoachId: (e.target as HTMLSelectElement).value })}>
                <option value="">(Không thuộc kế hoạch)</option>
                {dsKeHoach.value.filter((k) => !k.xoaLuc).map((k) => (
                  <option key={k.id} value={k.id}>{k.ten}</option>
                ))}
              </select>
            </Truong>
            <Truong nhan="Tháng dự kiến (theo mẫu 06/QTKT-TC)" id="c-thang">
              <input id="c-thang" type="month" value={n.thangDuKien} onInput={(e) => dat({ thangDuKien: (e.target as HTMLInputElement).value })} />
            </Truong>
          </div>
          <label class="o-tich">
            <input type="checkbox" checked={n.coGDLK} onChange={(e) => dat({ coGDLK: (e.target as HTMLInputElement).checked })} />
            <span>Có giao dịch liên kết (thời hạn tại trụ sở dài hơn)</span>
          </label>
          <label class="o-tich">
            <input type="checkbox" checked={n.kiemTraDienTu} onChange={(e) => dat({ kiemTraDienTu: (e.target as HTMLInputElement).checked })} />
            <span>Kiểm tra bằng phương thức điện tử</span>
          </label>
          <label class="o-tich">
            <input type="checkbox" checked={n.kiemTraLai} onChange={(e) => dat({ kiemTraLai: (e.target as HTMLInputElement).checked })} />
            <span>Kiểm tra lại</span>
          </label>
          {n.kiemTraLai && (
            <div>
              <ChonNgay id="c-kl" nhan="Ngày ký KL/QĐ xử phạt bị kiểm tra lại" gia={n.ngayKLBiKiemTraLai} doi={(v) => dat({ ngayKLBiKiemTraLai: v })} canhBaoNghi={false} />
              {hieu && (
                <p class={`the ${hieu.conHieuLuc ? '' : 'loi'}`} style={{ padding: 8 }}>
                  {hieu.nhan} – hạn {dinhDangNgay(hieu.han)} ({hieu.canCu})
                </p>
              )}
            </div>
          )}
          <div class="luoi-2">
            <ChonNgay id="c-han-ngoai" nhan="Hạn ngoài (nếu có)" gia={n.hanNgoai} doi={(v) => dat({ hanNgoai: v })} goiY="Ví dụ hạn giải quyết hồ sơ hoàn, hạn đóng MST" />
            <Truong nhan="Ghi chú hạn ngoài" id="c-han-ngoai-gc">
              <input id="c-han-ngoai-gc" type="text" value={n.hanNgoaiGhiChu} onInput={(e) => dat({ hanNgoaiGhiChu: (e.target as HTMLInputElement).value })} />
            </Truong>
          </div>
          <Truong nhan="Văn bản giao (số/ký hiệu, nếu lãnh đạo hoặc cơ quan khác giao)" id="c-vb">
            <input id="c-vb" type="text" value={n.vanBanGiao} onInput={(e) => dat({ vanBanGiao: (e.target as HTMLInputElement).value })} />
          </Truong>
        </div>
      )}

      {buoc === 3 && (
        <div>
          <Truong nhan="Trưởng đoàn" id="c-td">
            <input id="c-td" type="text" value={n.truongDoan} onInput={(e) => dat({ truongDoan: (e.target as HTMLInputElement).value })} />
          </Truong>
          <DanhSachTen nhan="Thành viên đoàn" gia={n.thanhVien} doi={(v) => dat({ thanhVien: v })} coPhanViec />
          <DanhSachTen nhan="Người/tổ giám sát" gia={n.giamSat.map((hoTen) => ({ hoTen }))} doi={(v) => dat({ giamSat: v.map((x) => x.hoTen) })} />
          <Truong nhan="Nội dung kiểm tra" id="c-nd" goiY={goiY ? `Gợi ý: ${goiY.noiDung}` : undefined}>
            <textarea id="c-nd" rows={2} value={n.noiDung} onInput={(e) => dat({ noiDung: (e.target as HTMLTextAreaElement).value })} />
          </Truong>
          <Truong nhan="Thời kỳ kiểm tra" id="c-tk">
            <input id="c-tk" type="text" placeholder="01/01/2024 – 31/12/2025" value={n.thoiKy} onInput={(e) => dat({ thoiKy: (e.target as HTMLInputElement).value })} />
          </Truong>
          <div class="luoi-2">
            <ChonNgay id="c-p1" nhan="Ngày nhận phân công làm trưởng đoàn (P1)" gia={n.p1} doi={(v) => dat({ p1: v })} />
            <ChonNgay id="c-cb" nhan="Ngày công bố dự kiến" gia={n.ngayCongBoDuKien} doi={(v) => dat({ ngayCongBoDuKien: v })} goiY="Để trống: app dùng hạn công bố theo quy trình" />
          </div>
          <XemTruoc n={n} cu={cu} />
        </div>
      )}

      {buoc === 1 && loiBuoc1 && n.mst && <p class="phu" aria-live="polite">Cần: {loiBuoc1}</p>}
      <div class="hang-nut" style={{ justifyContent: 'space-between', marginTop: 16 }}>
        <button type="button" class="nut" onClick={() => (buoc === 1 ? dongBang(idBang) : setBuoc(buoc - 1))}>
          {buoc === 1 ? 'Hủy' : '‹ Quay lại'}
        </button>
        {buoc < 3 ? (
          <button type="button" class="nut nut-chinh" onClick={tiep} disabled={buoc === 1 && !!loiBuoc1}>
            Tiếp ›
          </button>
        ) : (
          <button type="button" class="nut nut-chinh" onClick={() => void luu()} disabled={dang || !!loiBuoc1}>
            {dang ? 'Đang lưu…' : cu ? 'Lưu thay đổi' : 'Lưu cuộc'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Mở form thêm cuộc (không tham số) hoặc sửa cuộc (truyền id). */
export function moFormCuoc(cuocId?: string): void {
  const id = `form-cuoc-${cuocId ?? 'moi'}`;
  moBang({ id, tieuDe: cuocId ? 'Sửa cuộc kiểm tra' : 'Thêm cuộc kiểm tra', rong: true, noiDung: () => <FormCuoc cuocId={cuocId} idBang={id} /> });
}
