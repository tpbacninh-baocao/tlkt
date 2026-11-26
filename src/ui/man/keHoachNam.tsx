// Kế hoạch năm (UI §4.11): chỉ tiêu, tiến độ theo giai đoạn, tiền, biểu đồ, cảnh báo; quản lý danh sách kế hoạch.
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import type { KeHoach, NgayISO } from '../../core/kieu';
import { hanCuaKeHoach, thongKeKeHoach } from '../../core/keHoach';
import { chonBoQuyTac } from '../../core/quyTac';
import { dinhDangNgay, dinhDangSo, tachNgay } from '../../core/lich';
import { luuKeHoach, xoaMem } from '../hanhDong';
import { moNhapKeHoach } from './nhapExcel';
import { BieuDoGiaiDoan, BieuDoTichLuy } from './bieuDo';
import { caiDat, cuocConHieuLuc, dongBang, dsKeHoach, homNay, lich, moBang, toast } from '../store';
import { ChonNgay, Kpi, NhanSLA, OSo, TrangThaiRong, Truong } from '../thanhPhan';
import { nhanTheoTrangThai } from '../chuoi';

const nam = signal<number>(tachNgay(homNay.value).nam);
const khId = signal<string>('');
const chiCuaToi = signal(false);

const TEN_LOAI_KH: Record<KeHoach['loai'], string> = { KH_NAM: 'Kế hoạch năm', CD_DAU_NAM: 'Chuyên đề đầu năm', CD_PHAT_SINH: 'Chuyên đề phát sinh', DOT_XUAT: 'Đột xuất' };

function FormKeHoach({ kh, idBang }: { kh?: KeHoach; idBang: string }) {
  const [loai, setLoai] = useState<KeHoach['loai']>(kh?.loai ?? 'KH_NAM');
  const [ten, setTen] = useState(kh?.ten ?? '');
  const [namKH, setNamKH] = useState(kh?.nam ?? nam.value);
  const [soQD, setSoQD] = useState(kh?.soQD ?? '');
  const [pheDuyet, setPheDuyet] = useState<NgayISO | ''>(kh?.ngayPheDuyet ?? '');
  const [congKhai, setCongKhai] = useState<NgayISO | ''>(kh?.ngayCongKhai ?? '');
  const [baoCao, setBaoCao] = useState<NgayISO | ''>(kh?.ngayBaoCaoCapTren ?? '');
  const [tongKet, setTongKet] = useState<NgayISO | ''>(kh?.ngayTongKet ?? '');
  const [baoCaoKT, setBaoCaoKT] = useState<NgayISO | ''>(kh?.ngayBaoCaoKetThuc ?? '');
  const [chiTieu, setChiTieu] = useState(kh?.chiTieuSoCuoc ?? 0);
  const [ghiChu, setGhiChu] = useState(kh?.ghiChu ?? '');
  const loi = !ten.trim() ? 'Nhập tên kế hoạch.' : namKH < 2000 || namKH > 2100 ? 'Năm không hợp lệ.' : '';
  return (
    <div>
      <Truong nhan="Tên kế hoạch / chuyên đề" id="kh-ten" batBuoc>
        <input id="kh-ten" type="text" value={ten} onInput={(e) => setTen((e.target as HTMLInputElement).value)} />
      </Truong>
      <div class="luoi-2">
        <Truong nhan="Loại" id="kh-loai">
          <select id="kh-loai" value={loai} onChange={(e) => setLoai((e.target as HTMLSelectElement).value as KeHoach['loai'])}>
            {Object.entries(TEN_LOAI_KH).map(([m, t]) => (
              <option key={m} value={m}>{t}</option>
            ))}
          </select>
        </Truong>
        <Truong nhan="Năm" id="kh-nam">
          <input id="kh-nam" type="number" min={2000} max={2100} value={namKH} onInput={(e) => setNamKH(Number((e.target as HTMLInputElement).value))} />
        </Truong>
        <Truong nhan="Số QĐ phê duyệt" id="kh-qd">
          <input id="kh-qd" type="text" value={soQD} onInput={(e) => setSoQD((e.target as HTMLInputElement).value)} />
        </Truong>
        <OSo nhan="Chỉ tiêu số cuộc được giao" id="kh-ct" gia={chiTieu} doi={setChiTieu} />
        <ChonNgay id="kh-pd" nhan="Ngày phê duyệt" gia={pheDuyet} doi={setPheDuyet} canhBaoNghi={false} goiY="Công khai kế hoạch trong 30 ngày kể từ ngày phê duyệt (Đ14)" />
        <ChonNgay id="kh-ck" nhan="Ngày đã công khai" gia={congKhai} doi={setCongKhai} canhBaoNghi={false} />
        {loai === 'CD_PHAT_SINH' && (
          <>
            <ChonNgay id="kh-bc" nhan="Ngày báo cáo cấp trên (chuyên đề phát sinh)" gia={baoCao} doi={setBaoCao} canhBaoNghi={false} goiY="Trong 15 ngày kể từ ngày phê duyệt (Đ11.a)" />
            <ChonNgay id="kh-tk" nhan="Ngày tổng kết chuyên đề" gia={tongKet} doi={setTongKet} canhBaoNghi={false} />
            <ChonNgay id="kh-bckt" nhan="Ngày báo cáo kết thúc chuyên đề" gia={baoCaoKT} doi={setBaoCaoKT} canhBaoNghi={false} goiY="Trong 15 ngày làm việc kể từ ngày tổng kết (Đ11.b)" />
          </>
        )}
      </div>
      <Truong nhan="Ghi chú" id="kh-gc">
        <textarea id="kh-gc" rows={2} value={ghiChu} onInput={(e) => setGhiChu((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      {loi && <p class="loi-truong">{loi}</p>}
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>Hủy</button>
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!!loi}
          onClick={async () => {
            await luuKeHoach({
              ...(kh ?? { id: crypto.randomUUID() }),
              nam: namKH,
              loai,
              ten: ten.trim(),
              soQD: soQD.trim() || undefined,
              ngayPheDuyet: pheDuyet || undefined,
              ngayCongKhai: congKhai || undefined,
              ngayBaoCaoCapTren: baoCao || undefined,
              ngayTongKet: tongKet || undefined,
              ngayBaoCaoKetThuc: baoCaoKT || undefined,
              chiTieuSoCuoc: chiTieu || undefined,
              ghiChu: ghiChu.trim() || undefined,
            });
            nam.value = namKH;
            dongBang(idBang);
            toast('Đã lưu kế hoạch');
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}

export function moFormKeHoach(kh?: KeHoach): void {
  const id = `form-kh-${kh?.id ?? 'moi'}`;
  moBang({ id, tieuDe: kh ? 'Sửa kế hoạch' : 'Thêm kế hoạch / chuyên đề', rong: true, noiDung: () => <FormKeHoach kh={kh} idBang={id} /> });
}

export function ManKeHoachNam() {
  const dsKH = dsKeHoach.value.filter((k) => !k.xoaLuc);
  const namCo = [...new Set([...dsKH.map((k) => k.nam), tachNgay(homNay.value).nam, nam.value])].sort((a, b) => b - a);
  const khNam = dsKH.filter((k) => k.nam === nam.value);
  const kh = khNam.find((k) => k.id === khId.value);
  const d = { homNay: homNay.value, lich: lich.value, cuoc: cuocConHieuLuc.value, keHoach: dsKH, va: caiDat.value.vaQuyTac as never };
  const hoTen = caiDat.value.canBo.hoTen.trim();
  const tk = thongKeKeHoach(d, { nam: nam.value, keHoachId: kh?.id, truongDoan: chiCuaToi.value && hoTen ? hoTen : undefined });
  const bo = chonBoQuyTac(undefined, homNay.value, undefined, caiDat.value.vaQuyTac as never);

  return (
    <div>
      <div class="thanh-loc">
        <div class="truong" style={{ margin: 0 }}>
          <label for="kn-nam">Năm</label>
          <select id="kn-nam" value={nam.value} onChange={(e) => { nam.value = Number((e.target as HTMLSelectElement).value); khId.value = ''; }}>
            {namCo.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div class="truong" style={{ margin: 0, minWidth: 220 }}>
          <label for="kn-kh">Kế hoạch</label>
          <select id="kn-kh" value={khId.value} onChange={(e) => (khId.value = (e.target as HTMLSelectElement).value)}>
            <option value="">Tất cả kế hoạch năm {nam.value}</option>
            {khNam.map((k) => <option key={k.id} value={k.id}>{k.ten}</option>)}
          </select>
        </div>
        {hoTen && (
          <label class="o-tich" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={chiCuaToi.value} onChange={(e) => (chiCuaToi.value = (e.target as HTMLInputElement).checked)} />
            <span>Chỉ cuộc của tôi (trưởng đoàn: {hoTen})</span>
          </label>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" class="nut nut-chinh" onClick={() => moFormKeHoach()}>＋ Kế hoạch</button>
        <button type="button" class="nut" onClick={moNhapKeHoach}>Nhập Excel</button>
      </div>

      <div class="luoi-kpi sau">
        <Kpi so={`${tk.soCuoc}/${tk.chiTieu}`} nhan="Được giao" />
        <Kpi so={tk.daBanHanhQD} nhan="Đã ban hành QĐ" />
        <Kpi so={tk.daCongBo} nhan="Đã công bố" />
        <Kpi so={tk.daKetThucTaiDN} nhan="Đã kết thúc tại DN" />
        <Kpi so={tk.daCoQDXuLy} nhan="Đã có QĐ xử lý/KL" mau={tk.daCoQDXuLy ? 'xanh' : undefined} />
        <Kpi so={tk.baiBo} nhan="Bãi bỏ" />
      </div>

      <div class="luoi-kpi tien">
        <Kpi so={dinhDangSo(tk.tien.truyThu)} nhan="Truy thu (đ)" />
        <Kpi so={dinhDangSo(tk.tien.phat)} nhan="Phạt (đ)" />
        <Kpi so={dinhDangSo(tk.tien.chamNop)} nhan="Chậm nộp (đ)" />
        <Kpi so={dinhDangSo(tk.tien.giamKhauTru)} nhan="Giảm khấu trừ (đ)" />
        <Kpi so={dinhDangSo(tk.tien.giamLo)} nhan="Giảm lỗ (đ)" />
        <Kpi so={`${dinhDangSo(tk.tien.daNop)}/${dinhDangSo(tk.tien.phaiNop)}`} nhan="Đã nộp / Phải nộp (đ)" />
      </div>

      {tk.canhBao.length > 0 && (
        <section class="the" aria-label="Cảnh báo">
          <h3>Cảnh báo ({tk.canhBao.length})</h3>
          <ul class="ds-canh-bao">
            {tk.canhBao.map((c, i) => (
              <li key={i} class={c.muc === 'KHAN' ? 'khan' : ''}>
                {c.muc === 'KHAN' ? '⚠ ' : '• '}
                {c.noiDung}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div class="luoi-2">
        <section class="the" aria-label="Biểu đồ tích lũy">
          <h3>Tích lũy theo tháng</h3>
          <BieuDoTichLuy du={tk.tichLuyThang} nam={nam.value} />
        </section>
        <section class="the" aria-label="Biểu đồ theo giai đoạn">
          <h3>Số cuộc theo giai đoạn</h3>
          <BieuDoGiaiDoan du={tk.theoGiaiDoan} />
          <p class="phu">Tồn chuyển sang năm sau (chưa có QĐ xử lý/KL, không tính bãi bỏ): <b>{tk.tonChuyenNamSau}</b> cuộc.</p>
        </section>
      </div>

      <h3 style={{ margin: '16px 0 8px' }}>Kế hoạch năm {nam.value}</h3>
      {khNam.length === 0 ? (
        <TrangThaiRong tieuDe="Chưa có kế hoạch cho năm này" moTa="Thêm kế hoạch/chuyên đề để gắn các cuộc kiểm tra và theo dõi hạn công khai, báo cáo.">
          <button type="button" class="nut nut-chinh" onClick={() => moFormKeHoach()}>＋ Thêm kế hoạch</button>
        </TrangThaiRong>
      ) : (
        khNam.map((k) => {
          const han = hanCuaKeHoach(lich.value, bo, k, homNay.value);
          const soCuoc = cuocConHieuLuc.value.filter((c) => c.keHoachId === k.id).length;
          return (
            <section key={k.id} class="the" aria-label={k.ten}>
              <div class="hang-nut" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{k.ten}</h3>
                <span class="nhan">{TEN_LOAI_KH[k.loai]}</span>
              </div>
              <p class="phu" style={{ margin: '4px 0' }}>
                {k.soQD ? `QĐ ${k.soQD} · ` : ''}{k.ngayPheDuyet ? `phê duyệt ${dinhDangNgay(k.ngayPheDuyet)} · ` : ''}chỉ tiêu {k.chiTieuSoCuoc ?? '—'} · đang có {soCuoc} cuộc
              </p>
              {han.map((h) => (
                <p key={h.ma} style={{ margin: '2px 0' }}>
                  {h.ten}: {h.han ? <b>{dinhDangNgay(h.han)}</b> : <span class="phu">chưa đủ dữ liệu</span>} <NhanSLA muc={nhanTheoTrangThai(h.trangThai)} chu={h.ngayXong ? `Xong ${dinhDangNgay(h.ngayXong)}` : undefined} />
                </p>
              ))}
              <div class="hang-nut" style={{ marginTop: 8 }}>
                <button type="button" class="nut nut-nho" onClick={() => moFormKeHoach(k)}>Sửa</button>
                <button type="button" class="nut nut-nho" onClick={() => void xoaMem('keHoach', k.id, `kế hoạch “${k.ten}”`)}>Xóa</button>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
