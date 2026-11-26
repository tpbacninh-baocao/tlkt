// Màn Việc (UI §4.9): Hộp thu · Đang làm · Lặp lại · Mẫu · Đã xong; thu nhanh + form chi tiết.
import { linkGoogleLich } from '../../core/nhacViec';
import { congPhutNgayGio } from '../../core/lich';
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import type { CongViec, NgayISO } from '../../core/kieu';
import { dinhDangNgayNgan, thuNgan } from '../../core/lich';
import { MAU_VIEC, NHOM_DOT_XUAT, cacLanLap, docLap, laLapHopLe, moTaLap, nhomViec, sapXepViec, trangThaiViec } from '../../core/viec';
import { nhanTheoTrangThai } from '../chuoi';
import { boHoanThanhViecUI, dongBoViecMauUI, hoanThanhViecUI, luuViec, suaCaiDat, xoaMem } from '../hanhDong';
import { caiDat, dongBang, dsCuoc, homNay, lich, moBang, toast, viecConHieuLuc } from '../store';
import { OThuNhanh } from '../thuNhanh';
import { ChonNgay, MenuNoi, NhanSLA, Tabs, Truong, TrangThaiRong, conLaiNLVChu } from '../thanhPhan';
import { congNgayThuan, demNLV } from '../../core/lich';

type Tab = 'HOP_THU' | 'DANG_LAM' | 'LAP_LAI' | 'MAU' | 'DA_XONG';
const tab = signal<Tab>('DANG_LAM');

const KIEU_LAP = [
  { ma: '', ten: 'Không lặp' },
  { ma: 'NGAY', ten: 'Mỗi ngày làm việc' },
  { ma: 'TUAN', ten: 'Hằng tuần (chọn thứ)' },
  { ma: 'THANG', ten: 'Hằng tháng (chọn ngày)' },
  { ma: 'THANG_CUOI', ten: 'Cuối tháng (trừ n ngày)' },
  { ma: 'QUY_CUOI', ten: 'Cuối quý (trừ n ngày)' },
  { ma: 'NAM', ten: 'Hằng năm (chọn ngày/tháng)' },
] as const;

function tachLap(lap?: string): { kieu: string; so: string; thang: string } {
  const k = docLap(lap);
  if (!k) return { kieu: '', so: '', thang: '' };
  switch (k.kieu) {
    case 'NGAY':
      return { kieu: 'NGAY', so: '', thang: '' };
    case 'TUAN':
      return { kieu: 'TUAN', so: String(k.thu), thang: '' };
    case 'THANG':
      return { kieu: 'THANG', so: String(k.ngay), thang: '' };
    case 'THANG_CUOI':
      return { kieu: 'THANG_CUOI', so: String(k.tru), thang: '' };
    case 'QUY_CUOI':
      return { kieu: 'QUY_CUOI', so: String(k.tru), thang: '' };
    case 'NAM':
      return { kieu: 'NAM', so: String(k.ngay), thang: String(k.thang) };
  }
}
function ghepLap(kieu: string, so: string, thang: string): string | undefined {
  const p2 = (x: string) => x.padStart(2, '0');
  switch (kieu) {
    case 'NGAY':
      return 'NGAY';
    case 'TUAN':
      return `TUAN:${so || '5'}`;
    case 'THANG':
      return `THANG:${so || '1'}`;
    case 'THANG_CUOI':
      return `THANG:CUOI${Number(so) > 0 ? '-' + Number(so) : ''}`;
    case 'QUY_CUOI':
      return `QUY:CUOI${Number(so) > 0 ? '-' + Number(so) : ''}`;
    case 'NAM':
      return `NAM:${p2(thang || '1')}-${p2(so || '1')}`;
    default:
      return undefined;
  }
}

function FormViec({ viec, idBang }: { viec?: CongViec; idBang: string }) {
  const lap0 = tachLap(viec?.lap);
  const [tieuDe, setTieuDe] = useState(viec?.tieuDe ?? '');
  const [nguon, setNguon] = useState<CongViec['nguon']>(viec?.nguon ?? 'TU_DAT');
  const [nhom, setNhom] = useState(viec?.nhom ?? '');
  const [soVB, setSoVB] = useState(viec?.soVB ?? '');
  const [nguoiGiao, setNguoiGiao] = useState(viec?.nguoiGiao ?? '');
  const [han, setHan] = useState<NgayISO | ''>(viec?.han ?? '');
  const [gio, setGio] = useState(viec?.gio ?? '');
  const [kieu, setKieu] = useState(lap0.kieu);
  const [so, setSo] = useState(lap0.so);
  const [thang, setThang] = useState(lap0.thang);
  const [cuocId, setCuocId] = useState(viec?.cuocId ?? '');
  const [con, setCon] = useState(viec?.viecCon ?? []);
  const [ghiChu, setGhiChu] = useState(viec?.ghiChu ?? '');
  const lap = ghepLap(kieu, so, thang);
  const lapSai = !!kieu && !laLapHopLe(lap);
  const xem = lap && !lapSai ? cacLanLap(lich.value, lap, homNay.value, congNgayThuan(homNay.value, 730)).slice(0, 3) : [];
  const loi = !tieuDe.trim() ? 'Nhập tiêu đề việc.' : lapSai ? 'Kiểu lặp chưa hợp lệ.' : '';

  const luu = async () => {
    const v: CongViec = {
      id: viec?.id ?? crypto.randomUUID(),
      tieuDe: tieuDe.trim(),
      nguon,
      nhom: nhom || undefined,
      soVB: soVB.trim() || undefined,
      nguoiGiao: nguoiGiao.trim() || undefined,
      han: han || undefined,
      gio: gio || undefined,
      lap,
      mauMa: viec?.mauMa,
      cuocId: cuocId || undefined,
      viecCon: con.filter((c) => c.tieuDe.trim()),
      xong: viec?.xong,
      ghim: viec?.ghim,
      ghiChu: ghiChu.trim() || undefined,
      laDuLieuMau: viec?.laDuLieuMau,
      taoLuc: viec?.taoLuc ?? '',
      suaLuc: viec?.suaLuc ?? '',
    };
    await luuViec(v);
    dongBang(idBang);
    toast(viec ? 'Đã lưu việc' : 'Đã thêm việc');
  };

  return (
    <div>
      <Truong nhan="Tiêu đề" id="v-td" batBuoc>
        <input id="v-td" type="text" value={tieuDe} onInput={(e) => setTieuDe((e.target as HTMLInputElement).value)} />
      </Truong>
      <div class="luoi-2">
        <Truong nhan="Nguồn" id="v-nguon">
          <select id="v-nguon" value={nguon} onChange={(e) => setNguon((e.target as HTMLSelectElement).value as CongViec['nguon'])}>
            <option value="TU_DAT">Tự đặt</option>
            <option value="LANH_DAO">Lãnh đạo giao</option>
            <option value="VAN_BAN">Văn bản đến</option>
            <option value="THUONG_XUYEN">Thường xuyên</option>
          </select>
        </Truong>
        <Truong nhan="Nhóm (đột xuất theo nhiệm vụ Phòng/Tổ)" id="v-nhom">
          <select id="v-nhom" value={nhom} onChange={(e) => setNhom((e.target as HTMLSelectElement).value)}>
            <option value="">(Không)</option>
            {NHOM_DOT_XUAT.map((n) => (
              <option key={n}>{n}</option>
            ))}
            {nhom && !NHOM_DOT_XUAT.includes(nhom) && <option>{nhom}</option>}
          </select>
        </Truong>
        <Truong nhan="Số/ký hiệu văn bản" id="v-so">
          <input id="v-so" type="text" value={soVB} onInput={(e) => setSoVB((e.target as HTMLInputElement).value)} />
        </Truong>
        <Truong nhan="Người giao" id="v-giao">
          <input id="v-giao" type="text" value={nguoiGiao} onInput={(e) => setNguoiGiao((e.target as HTMLInputElement).value)} />
        </Truong>
        <ChonNgay id="v-han" nhan="Hạn" gia={han} doi={setHan} />
        <Truong nhan="Giờ" id="v-gio">
          <input id="v-gio" type="time" value={gio} onInput={(e) => setGio((e.target as HTMLInputElement).value)} />
        </Truong>
      </div>
      <fieldset class="truong" style={{ border: 0, padding: 0 }}>
        <legend class="nhan-truong">Lặp lại</legend>
        <div class="hang">
          <select aria-label="Kiểu lặp" value={kieu} onChange={(e) => { setKieu((e.target as HTMLSelectElement).value); setSo(''); setThang(''); }} style={{ flex: '2 1 200px' }}>
            {KIEU_LAP.map((k) => (
              <option key={k.ma} value={k.ma}>{k.ten}</option>
            ))}
          </select>
          {kieu === 'TUAN' && (
            <select aria-label="Thứ" value={so || '5'} onChange={(e) => setSo((e.target as HTMLSelectElement).value)} style={{ flex: '1 1 120px' }}>
              {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'].map((t, i) => (
                <option key={t} value={i + 1}>{t}</option>
              ))}
            </select>
          )}
          {(kieu === 'THANG' || kieu === 'NAM') && (
            <input aria-label="Ngày trong tháng" type="number" min={1} max={31} placeholder="Ngày" value={so} onInput={(e) => setSo((e.target as HTMLInputElement).value)} style={{ flex: '1 1 90px' }} />
          )}
          {kieu === 'NAM' && <input aria-label="Tháng" type="number" min={1} max={12} placeholder="Tháng" value={thang} onInput={(e) => setThang((e.target as HTMLInputElement).value)} style={{ flex: '1 1 90px' }} />}
          {(kieu === 'THANG_CUOI' || kieu === 'QUY_CUOI') && (
            <input aria-label="Trừ bao nhiêu ngày" type="number" min={0} max={30} placeholder="Trừ n ngày" value={so} onInput={(e) => setSo((e.target as HTMLInputElement).value)} style={{ flex: '1 1 110px' }} />
          )}
        </div>
        {lap && !lapSai && (
          <span class="goi-y">
            {moTaLap(lap)}. Các lần tới: {xem.map((d) => dinhDangNgayNgan(d)).join(', ')}. Ngày rơi vào ngày nghỉ được lùi về ngày làm việc trước.
          </span>
        )}
      </fieldset>
      <Truong nhan="Liên kết cuộc kiểm tra" id="v-cuoc">
        <select id="v-cuoc" value={cuocId} onChange={(e) => setCuocId((e.target as HTMLSelectElement).value)}>
          <option value="">(Không)</option>
          {dsCuoc.value.filter((c) => !c.xoaLuc).map((c) => (
            <option key={c.id} value={c.id}>{c.ma} – {caiDat.value.anDanh ? `…${c.mst.slice(-4)}` : c.tenNNT}</option>
          ))}
        </select>
      </Truong>
      <fieldset class="truong" style={{ border: 0, padding: 0 }}>
        <legend class="nhan-truong">Việc con</legend>
        {con.map((c, i) => (
          <div key={c.id} class="hang" style={{ alignItems: 'center', marginBottom: 4 }}>
            <input type="checkbox" aria-label={`Việc con ${i + 1} đã xong`} checked={c.xong} onChange={(e) => setCon(con.map((x, j) => (j === i ? { ...x, xong: (e.target as HTMLInputElement).checked } : x)))} />
            <input type="text" aria-label={`Việc con ${i + 1}`} value={c.tieuDe} onInput={(e) => setCon(con.map((x, j) => (j === i ? { ...x, tieuDe: (e.target as HTMLInputElement).value } : x)))} style={{ flex: 1 }} />
            <button type="button" class="nut nut-nho" aria-label={`Xóa việc con ${i + 1}`} onClick={() => setCon(con.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <div><button type="button" class="nut nut-nho" onClick={() => setCon([...con, { id: crypto.randomUUID(), tieuDe: '', xong: false }])}>＋ Thêm việc con</button></div>
      </fieldset>
      <Truong nhan="Ghi chú" id="v-gc">
        <textarea id="v-gc" rows={2} value={ghiChu} onInput={(e) => setGhiChu((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      {loi && <p class="loi-truong">{loi}</p>}
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>Hủy</button>
        <button type="button" class="nut nut-chinh" disabled={!!loi} onClick={() => void luu()}>Lưu</button>
      </div>
    </div>
  );
}

export function moFormViec(viec?: CongViec): void {
  const id = `form-viec-${viec?.id ?? 'moi'}`;
  moBang({ id, tieuDe: viec ? 'Sửa việc' : 'Thêm việc', rong: true, noiDung: () => <FormViec viec={viec} idBang={id} /> });
}

function DongViec({ v }: { v: CongViec }) {
  const tt = trangThaiViec(v, lich.value, homNay.value);
  const nlv = v.han && !v.xong ? demNLV(lich.value, homNay.value, v.han) : undefined;
  const conXong = v.viecCon.filter((c) => c.xong).length;
  return (
    <div class={`the-viec ${tt === 'QUA_HAN' ? 'qua-han' : tt === 'HOM_NAY' ? 'hom-nay' : ''}`} style={{ gridTemplateColumns: 'auto 1fr auto' }}>
      <input
        type="checkbox"
        aria-label={`${v.xong ? 'Bỏ đánh dấu xong' : 'Đánh dấu xong'}: ${v.tieuDe}`}
        checked={!!v.xong}
        onChange={(e) => ((e.target as HTMLInputElement).checked ? void hoanThanhViecUI(v.id) : void boHoanThanhViecUI(v.id))}
      />
      <div style={{ minWidth: 0 }}>
        <button type="button" class="ten nut-nhe" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit', fontWeight: 600, textDecoration: v.xong ? 'line-through' : 'none' }} onClick={() => moFormViec(v)}>
          {v.ghim ? '📌 ' : ''}
          {v.tieuDe}
        </button>
        <div class="phu-dong">
          {v.han && (
            <span>
              Hạn {dinhDangNgayNgan(v.han)} ({thuNgan(v.han)}){v.gio ? ` ${v.gio}` : ''}
            </span>
          )}
          {nlv !== undefined && <span>· {conLaiNLVChu(nlv)}</span>}
          {v.lap && <span title={moTaLap(v.lap)}>🔁 {moTaLap(v.lap)}</span>}
          {v.nhom && <span class="nhan">{v.nhom}</span>}
          {v.soVB && <span>· {v.soVB}</span>}
          {v.viecCon.length > 0 && <span>· {conXong}/{v.viecCon.length} việc con</span>}
          {!v.xong && v.han && tt !== 'CHUA_DEN' && <NhanSLA muc={nhanTheoTrangThai(tt)} />}
        </div>
      </div>
      <MenuNoi
        hanhDong={[
          { nhan: 'Sửa', chay: () => moFormViec(v) },
          { nhan: v.ghim ? 'Bỏ ghim' : 'Ghim lên đầu', chay: () => void luuViec({ ...v, ghim: !v.ghim }) },
          ...(v.han && !v.xong ? [{ nhan: 'Thêm vào Google Lịch', chay: () => {}, href: linkGoogleLich({ ngay: v.han, gioTu: v.gio, gioDen: v.gio ? congPhutNgayGio(`${v.han}T${v.gio}`, 30).slice(11) : undefined, tieuDe: v.tieuDe, moTa: [v.soVB && `Văn bản: ${v.soVB}`, v.ghiChu].filter(Boolean).join('\n') }) }] : []),
          { nhan: 'Xóa', chay: () => void xoaMem('viec', v.id, 'việc') },
        ]}
      />
    </div>
  );
}

function TabMau() {
  const bat = caiDat.value.mauViecDaBat;
  return (
    <div>
      <p class="phu">Bật mẫu nào thì app tự tạo việc lặp lại tương ứng. Tắt mẫu thì việc đang mở được giữ lại nhưng không sinh lần mới.</p>
      {MAU_VIEC.map((m) => (
        <div key={m.ma} class="the" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="checkbox"
            id={`mau-${m.ma}`}
            checked={bat.includes(m.ma)}
            onChange={async (e) => {
              const b = (e.target as HTMLInputElement).checked;
              await suaCaiDat((c) => ({ ...c, mauViecDaBat: b ? [...new Set([...c.mauViecDaBat, m.ma])] : c.mauViecDaBat.filter((x) => x !== m.ma) }));
              if (b) {
                const n = await dongBoViecMauUI();
                if (n) toast('Đã tạo việc từ mẫu');
              }
            }}
          />
          <label for={`mau-${m.ma}`} style={{ flex: 1 }}>
            <span class="dam">{m.tieuDe}</span>
            <br />
            <span class="phu">{moTaLap(m.lap)}{m.gio ? ` · ${m.gio}` : ''}{m.nhom ? ` · ${m.nhom}` : ''}</span>
          </label>
        </div>
      ))}
    </div>
  );
}

export function ManViec() {
  const ds = viecConHieuLuc.value;
  const sx = (a: CongViec[]) => sapXepViec(a, lich.value, homNay.value);
  const nhom = (g: ReturnType<typeof nhomViec>) => sx(ds.filter((v) => nhomViec(v, lich.value, homNay.value) === g));
  const hopThu = nhom('HOP_THU');
  const quaHan = nhom('QUA_HAN');
  const homNayDS = nhom('HOM_NAY');
  const tuanNay = nhom('TUAN_NAY');
  const sau = nhom('SAU');
  const xong = ds.filter((v) => v.xong).sort((a, b) => (b.xong! < a.xong! ? -1 : 1));
  const lapLai = sx(ds.filter((v) => v.lap && !v.xong));
  const dem = { HOP_THU: hopThu.length, DANG_LAM: quaHan.length + homNayDS.length + tuanNay.length + sau.length, LAP_LAI: lapLai.length, MAU: undefined, DA_XONG: xong.length };

  const Nhom = ({ ten, dsx, mau }: { ten: string; dsx: CongViec[]; mau?: boolean }) =>
    dsx.length ? (
      <details class={`nhom-viec ${mau ? 'do' : ''}`} open>
        <summary>
          {ten} <span class="so-dem">({dsx.length})</span>
        </summary>
        {dsx.map((v) => <DongViec key={v.id} v={v} />)}
      </details>
    ) : null;

  return (
    <div>
      <section class="the" aria-label="Thu nhanh">
        <OThuNhanh />
      </section>
      <div class="hang-nut" style={{ marginBottom: 8 }}>
        <button type="button" class="nut nut-chinh nut-nho" onClick={() => moFormViec()}>＋ Việc chi tiết</button>
      </div>
      <Tabs
        nhan="Nhóm việc"
        dang={tab.value}
        doi={(m) => (tab.value = m)}
        cac={[
          { ma: 'HOP_THU', ten: 'Hộp thu', dem: dem.HOP_THU },
          { ma: 'DANG_LAM', ten: 'Đang làm', dem: dem.DANG_LAM },
          { ma: 'LAP_LAI', ten: 'Lặp lại', dem: dem.LAP_LAI },
          { ma: 'MAU', ten: 'Mẫu' },
          { ma: 'DA_XONG', ten: 'Đã xong', dem: dem.DA_XONG },
        ]}
      />
      {tab.value === 'HOP_THU' &&
        (hopThu.length ? hopThu.map((v) => <DongViec key={v.id} v={v} />) : <TrangThaiRong tieuDe="Hộp thu trống" moTa="Gõ nhanh một dòng ở trên – việc chưa có hạn sẽ nằm ở đây." xanh />)}
      {tab.value === 'DANG_LAM' &&
        (dem.DANG_LAM === 0 ? (
          <TrangThaiRong tieuDe="Không có việc đang làm" moTa="Việc có hạn sẽ hiện ở đây, chia theo mức khẩn." xanh />
        ) : (
          <>
            <Nhom ten="QUÁ HẠN" dsx={quaHan} mau />
            <Nhom ten="HÔM NAY" dsx={homNayDS} />
            <Nhom ten="TUẦN NÀY (≤ 5 ngày LV)" dsx={tuanNay} />
            <Nhom ten="SAU ĐÓ" dsx={sau} />
          </>
        ))}
      {tab.value === 'LAP_LAI' && (lapLai.length ? lapLai.map((v) => <DongViec key={v.id} v={v} />) : <TrangThaiRong tieuDe="Chưa có việc lặp lại" moTa="Bật mẫu ở tab Mẫu hoặc đặt “Lặp lại” khi tạo việc." />)}
      {tab.value === 'MAU' && <TabMau />}
      {tab.value === 'DA_XONG' && (xong.length ? xong.slice(0, 100).map((v) => <DongViec key={v.id} v={v} />) : <TrangThaiRong tieuDe="Chưa có việc nào hoàn thành" />)}
    </div>
  );
}
