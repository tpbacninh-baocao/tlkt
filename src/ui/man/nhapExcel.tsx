// Nhập kế hoạch từ Excel/CSV (UI §4.x, ARCH §10): chọn tệp → ghép cột → xem trước (lỗi/trùng) → xác nhận tạo kế hoạch và cuộc.
import { useState } from 'preact/hooks';
import mauCsv from '../../../samples/mau-ke-hoach.csv?raw';
import { boDauChu, docDongKeHoach, goiYGhepCot, TEN_TRUONG_KH, timDongTieuDe, type DongKeHoach, type TruongKH } from '../../core/nhapXuat';
import { taoCuocRong } from '../../core/vuViec';
import { taoMaCuoc } from '../../core/vuViec/nhapCuoc';
import type { CuocKiemTra, KeHoach } from '../../core/kieu';
import { docCsv, docTep as docTepNguoiDung, taoTepMauXlsx, type TrangTinh } from '../../data/excel';
import { luuCuoc, luuKeHoach } from '../hanhDong';
import { bayGio, caiDat, dongBang, dsCuoc, dsKeHoach, homNay, moBang, toast } from '../store';
import { Truong } from '../thanhPhan';
import { taiXuong } from '../xuat';

const ID_BANG = 'nhap-ke-hoach';
const TRUONG: (TruongKH | null)[] = [null, 'stt', 'ten', 'mst', 'diaChi', 'noiDung', 'chuyenDe', 'thoiGian', 'truongDoan'];

export function moNhapKeHoach(): void {
  moBang({ id: ID_BANG, tieuDe: 'Nhập kế hoạch từ Excel', rong: true, noiDung: () => <FormNhapKeHoach /> });
}

async function taiTepMau(dinhDang: 'csv' | 'xlsx') {
  if (dinhDang === 'csv') taiXuong('mau-ke-hoach.csv', '﻿' + mauCsv.replace(/^﻿/, ''), 'text/csv;charset=utf-8');
  else taiXuong('mau-ke-hoach.xlsx', await taoTepMauXlsx(docCsv(mauCsv)), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function namMacDinh(): number {
  const n = Number(homNay.value.slice(0, 4));
  return Number(homNay.value.slice(5, 7)) >= 10 ? n + 1 : n;
}

function FormNhapKeHoach() {
  const [trang, setTrang] = useState<TrangTinh[]>([]);
  const [chon, setChon] = useState(0);
  const [tenTep, setTenTep] = useState('');
  const [loi, setLoi] = useState('');
  const [nam, setNam] = useState(namMacDinh());
  const [khId, setKhId] = useState('');
  const [ghep, setGhep] = useState<(TruongKH | null)[]>([]);
  const [dongTieuDe, setDongTieuDe] = useState(0);
  const [boChon, setBoChon] = useState<Record<number, boolean>>({});
  const [dangLuu, setDangLuu] = useState(false);

  const rows = trang[chon]?.rows ?? [];
  const soCot = rows.reduce((t, r) => Math.max(t, r.length), 0);
  const khCuaNam = dsKeHoach.value.filter((k) => !k.xoaLuc && k.nam === nam && (k.loai === 'KH_NAM' || k.loai === 'CD_DAU_NAM'));

  const dat = (ds: TrangTinh[], i: number) => {
    const r = ds[i]?.rows ?? [];
    const hd = timDongTieuDe(r);
    setChon(i);
    setDongTieuDe(Math.max(0, hd));
    setGhep(hd >= 0 ? goiYGhepCot(r[hd]) : Array.from({ length: r.reduce((t, x) => Math.max(t, x.length), 0) }, () => null));
    setBoChon({});
  };

  const docTep = async (f: File | undefined) => {
    setLoi('');
    if (!f) return;
    try {
      const ds = (await docTepNguoiDung(f)).filter((t) => t.rows.some((r) => r.some(Boolean)));
      if (!ds.length) throw new Error('Tệp không có dữ liệu.');
      setTrang(ds);
      setTenTep(f.name);
      dat(ds, 0);
    } catch (e) {
      setTrang([]);
      setLoi(e instanceof Error ? e.message : 'Không đọc được tệp. Hãy dùng tệp .xlsx hoặc .csv.');
    }
  };

  const dong: DongKeHoach[] = rows.length ? docDongKeHoach(rows, ghep, dongTieuDe + 1, { nam, cuocDaCo: dsCuoc.value, keHoach: dsKeHoach.value }) : [];
  const duocChon = (d: DongKeHoach) => boChon[d.dong] ?? (d.loi.length === 0 && !d.trung);
  const nhap = dong.filter((d) => d.loi.length === 0 && duocChon(d));
  const thieuCot = !ghep.includes('ten') || !ghep.includes('mst');

  const xacNhan = async () => {
    setDangLuu(true);
    try {
      let kh: KeHoach | undefined = khCuaNam.find((k) => k.id === khId);
      if (!kh) {
        kh = await luuKeHoach({ id: crypto.randomUUID(), nam, loai: 'KH_NAM', ten: `Kế hoạch kiểm tra năm ${nam}`, chiTieuSoCuoc: nhap.length } as KeHoach);
      }
      const ds: Pick<CuocKiemTra, 'ma'>[] = [...dsCuoc.value];
      const hoTen = boDauChu(caiDat.value.canBo.hoTen);
      let n = 0;
      for (const d of nhap) {
        const ma = taoMaCuoc(ds, nam);
        ds.push({ ma });
        const c = taoCuocRong({ id: crypto.randomUUID(), ma, taoLuc: bayGio.value, loai: 'KH', keHoachId: kh.id, mst: d.mst, tenNNT: d.ten, diaChi: d.diaChi || undefined, noiDung: d.noiDung || undefined, thangDuKien: d.thangDuKien, truongDoan: d.truongDoan, nhan: d.chuyenDe ? [d.chuyenDe] : undefined });
        if (hoTen && boDauChu(d.truongDoan) === hoTen) c.buoc.P1 = { xong: true, ngay: homNay.value };
        await luuCuoc(c);
        n++;
      }
      toast(`Đã nhập ${n} cuộc vào “${kh.ten}”`);
      dongBang(ID_BANG);
      location.hash = '#cuoc';
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không nhập được', 'loi');
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <div>
      <p class="phu">Chọn tệp danh sách theo mẫu 06/QTKT-TC (.xlsx hoặc .csv). Tệp được đọc ngay trên máy bạn, không gửi đi đâu.</p>
      <div class="hang-nut" style={{ marginBottom: 8 }}>
        <button type="button" class="nut nut-nho" onClick={() => void taiTepMau('xlsx')}>⬇ Tệp mẫu .xlsx</button>
        <button type="button" class="nut nut-nho" onClick={() => void taiTepMau('csv')}>⬇ Tệp mẫu .csv</button>
      </div>
      <Truong nhan="Tệp danh sách" id="nk-tep">
        <input id="nk-tep" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void docTep((e.target as HTMLInputElement).files?.[0])} />
      </Truong>
      {loi && <p class="loi-truong" role="alert">{loi}</p>}

      {trang.length > 0 && (
        <>
          <p class="phu">Tệp: <b>{tenTep}</b> – {rows.length} dòng</p>
          <div class="hang">
            <Truong nhan="Năm kế hoạch" id="nk-nam">
              <input id="nk-nam" type="number" min={2000} max={2100} value={nam} onChange={(e) => { setNam(Number((e.target as HTMLInputElement).value) || nam); setKhId(''); }} />
            </Truong>
            <Truong nhan="Thêm vào kế hoạch" id="nk-kh">
              <select id="nk-kh" value={khId} onChange={(e) => setKhId((e.target as HTMLSelectElement).value)}>
                <option value="">Tạo mới: Kế hoạch kiểm tra năm {nam}</option>
                {khCuaNam.map((k) => <option key={k.id} value={k.id}>{k.ten}</option>)}
              </select>
            </Truong>
            {trang.length > 1 && (
              <Truong nhan="Trang tính" id="nk-sheet">
                <select id="nk-sheet" value={chon} onChange={(e) => dat(trang, Number((e.target as HTMLSelectElement).value))}>
                  {trang.map((t, i) => <option key={t.ten} value={i}>{t.ten}</option>)}
                </select>
              </Truong>
            )}
            <Truong nhan="Dòng tiêu đề" id="nk-hd">
              <select id="nk-hd" value={dongTieuDe} onChange={(e) => { const v = Number((e.target as HTMLSelectElement).value); setDongTieuDe(v); setGhep(goiYGhepCot(rows[v] ?? [])); }}>
                {rows.slice(0, 10).map((r, i) => <option key={i} value={i}>Dòng {i + 1}: {r.filter(Boolean).slice(0, 3).join(' | ')}</option>)}
              </select>
            </Truong>
          </div>

          <h4>Ghép cột</h4>
          <div class="cuon-ngang" tabIndex={0} role="region" aria-label="Bảng (cuộn ngang bằng phím mũi tên)">
            <table class="bang">
              <thead><tr><th>Cột</th><th>Tiêu đề trong tệp</th><th>Ví dụ</th><th>Là</th></tr></thead>
              <tbody>
                {Array.from({ length: soCot }, (_, j) => (
                  <tr key={j}>
                    <td>{String.fromCharCode(65 + (j % 26))}</td>
                    <td>{rows[dongTieuDe]?.[j]}</td>
                    <td class="phu">{rows[dongTieuDe + 1]?.[j]}</td>
                    <td>
                      <select aria-label={`Cột ${j + 1} là`} value={ghep[j] ?? ''} onChange={(e) => { const v = ((e.target as HTMLSelectElement).value || null) as TruongKH | null; setGhep(ghep.map((g, k) => (k === j ? v : g === v && v ? null : g))); }} style={{ minHeight: 36 }}>
                        <option value="">(bỏ qua)</option>
                        {TRUONG.filter(Boolean).map((t) => <option key={t} value={t!}>{TEN_TRUONG_KH[t!]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {thieuCot && <p class="loi-truong" role="alert">Cần ghép ít nhất hai cột: Tên người nộp thuế và Mã số thuế.</p>}

          {!thieuCot && (
            <>
              <h4>Xem trước ({dong.length} dòng – nhập {nhap.length})</h4>
              <div class="cuon-ngang" tabIndex={0} role="region" aria-label="Bảng (cuộn ngang bằng phím mũi tên)">
                <table class="bang" aria-label="Xem trước kế hoạch">
                  <thead><tr><th>Nhập</th><th>Dòng</th><th>Tên NNT</th><th>MST</th><th>Dự kiến</th><th>Trưởng đoàn</th><th>Ghi chú</th></tr></thead>
                  <tbody>
                    {dong.map((d) => (
                      <tr key={d.dong} class={d.loi.length ? 'da-sua' : ''}>
                        <td><input type="checkbox" aria-label={`Nhập dòng ${d.dong}`} disabled={d.loi.length > 0} checked={d.loi.length === 0 && duocChon(d)} onChange={(e) => setBoChon({ ...boChon, [d.dong]: (e.target as HTMLInputElement).checked })} /></td>
                        <td>{d.dong}</td>
                        <td>{d.ten}</td>
                        <td>{d.mst}</td>
                        <td>{d.thangDuKien ? `${d.thangDuKien.slice(5)}/${d.thangDuKien.slice(0, 4)}` : ''}</td>
                        <td>{d.truongDoan}</td>
                        <td>
                          {d.loi.map((t) => <div key={t} class="loi-truong">⛔ {t}</div>)}
                          {d.canhBao.map((t) => <div key={t} class="phu">⚠ {t}</div>)}
                          {d.trung && d.loi.length === 0 && <div class="phu">Mặc định không nhập (trùng) – tick để vẫn nhập.</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div class="hang-nut phai" style={{ marginTop: 12 }}>
                <button type="button" class="nut" onClick={() => dongBang(ID_BANG)}>Hủy</button>
                <button type="button" class="nut nut-chinh" disabled={!nhap.length || dangLuu} onClick={() => void xacNhan()}>
                  {dangLuu ? 'Đang nhập…' : `Nhập ${nhap.length} cuộc`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
