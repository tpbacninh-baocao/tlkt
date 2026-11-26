// Kế hoạch ngày (UI §4.10) – theo phiếu “KẾ HOẠCH MỖI NGÀY”: Việc cần làm, Mục tiêu (≤ 3), Nhắc nhở, Lịch, Ghi chú, Cho ngày mai, Cảm nhận.
import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { KeHoachNgay, NgayISO } from '../../core/kieu';
import { congNLV, congNgayThuan, dinhDangNgayThu, ngayDauTuan, thuNgan, laNgayLamViec } from '../../core/lich';
import { sinhLichNhac } from '../../core/nhacViec';
import { cacMucViecDangMo } from '../../core/tomTat';
import { luuKeHoachNgay, luuViec } from '../hanhDong';
import { menuMuc, xongMuc } from '../muc';
import { duLieuTomTat, dsKeHoachNgay, dsKhoiThoiGian, homNay, lich, phanTichMap, toast, viecConHieuLuc } from '../store';
import { duLieuNhacHienTai } from '../xuat';
import { TheViec } from '../thanhPhan';

const ngayKHN = signal<NgayISO>(homNay.value);
const CAM_NHAN = ['😀', '🙂', '😐', '🙁', '😣'] as const;

function layKHN(ngay: NgayISO): KeHoachNgay {
  return dsKeHoachNgay.value.find((k) => k.ngay === ngay) ?? { ngay, mucTieu: [], nhacNho: '', ghiChu: '', choNgayMai: '' };
}

/** Lưu tự động sau 600 ms kể từ lần gõ cuối. */
function useTuLuu(ngay: NgayISO, k: KeHoachNgay) {
  const [nhap, setNhap] = useState<KeHoachNgay>(k);
  const tm = useRef<number>();
  const luuMoi = useRef(false);
  useEffect(() => {
    setNhap(k);
    luuMoi.current = false;
  }, [ngay]);
  const doi = (p: Partial<KeHoachNgay>) => {
    const moi = { ...nhap, ...p, ngay };
    setNhap(moi);
    clearTimeout(tm.current);
    tm.current = window.setTimeout(() => void luuKeHoachNgay(moi), 600);
  };
  useEffect(() => () => clearTimeout(tm.current), []);
  return [nhap, doi] as const;
}

function Tam({ tieuDe, children, lop = '' }: { tieuDe: string; children: preact.ComponentChildren; lop?: string }) {
  return (
    <section class={`o-phieu ${lop}`} aria-label={tieuDe}>
      <h3>{tieuDe}</h3>
      {children}
    </section>
  );
}

export function ManKeHoachNgay() {
  const ngay = ngayKHN.value;
  const k = layKHN(ngay);
  const [nhap, doi] = useTuLuu(ngay, k);
  const d = duLieuTomTat.value;
  const dangMo = cacMucViecDangMo(d, [...phanTichMap.value.values()]);
  const viecNgay = dangMo.filter((m) => m.han && m.han <= ngay);
  const hopThu = viecConHieuLuc.value.filter((v) => !v.xong && !v.han);
  const khoi = dsKhoiThoiGian.value.filter((x) => x.ngay === ngay).sort((a, b) => (a.tu < b.tu ? -1 : 1));
  const nhac = sinhLichNhac(duLieuNhacHienTai(), ngay, ngay)
    .filter((n) => !n.khoa.startsWith('nhip:') && !n.khoa.includes(':NK|') && n.mucDo !== 'QUA_HAN')
    .slice(0, 8);
  const ngayMai = congNLV(lich.value, ngay, 1);
  const choMai = viecConHieuLuc.value.filter((v) => !v.xong && v.han === ngayMai);
  const dauTuan = ngayDauTuan(ngay);
  const tuan = Array.from({ length: 7 }, (_, i) => congNgayThuan(dauTuan, i));
  const viecChuaXongNgoaiCuoc = viecConHieuLuc.value.filter((v) => !v.xong && v.han && v.han <= ngay);

  const chuyenSang = async () => {
    const ds = viecChuaXongNgoaiCuoc;
    if (!ds.length) {
      toast('Không có việc ngoài cuộc nào chưa xong để chuyển.', 'thongTin');
      return;
    }
    const cu = ds.map((v) => ({ id: v.id, han: v.han }));
    for (const v of ds) await luuViec({ ...v, han: ngayMai });
    toast(`Đã chuyển ${ds.length} việc sang ${dinhDangNgayThu(ngayMai)}`, 'thanhCong', async () => {
      for (const c of cu) {
        const v = viecConHieuLuc.value.find((x) => x.id === c.id);
        if (v) await luuViec({ ...v, han: c.han });
      }
    });
  };

  return (
    <div class="phieu">
      <header class="dau-phieu">
        <h2>KẾ HOẠCH MỖI NGÀY</h2>
        <div class="hang-nut">
          <button type="button" class="nut nut-nho" aria-label="Ngày trước" onClick={() => (ngayKHN.value = congNgayThuan(ngay, -1))}>‹</button>
          <b aria-live="polite">{dinhDangNgayThu(ngay)}</b>
          <button type="button" class="nut nut-nho" aria-label="Ngày sau" onClick={() => (ngayKHN.value = congNgayThuan(ngay, 1))}>›</button>
          {ngay !== homNay.value && <button type="button" class="nut nut-nho" onClick={() => (ngayKHN.value = homNay.value)}>Hôm nay</button>}
        </div>
        <div class="tuan-chip" role="group" aria-label="Chọn ngày trong tuần">
          {tuan.map((n) => (
            <button key={n} type="button" class={`chip-ngay ${n === ngay ? 'chon' : ''} ${!laNgayLamViec(lich.value, n) ? 'nghi' : ''}`} aria-pressed={n === ngay} onClick={() => (ngayKHN.value = n)}>
              {thuNgan(n)}
              <small>{n.slice(8, 10)}</small>
            </button>
          ))}
        </div>
      </header>

      <div class="luoi-phieu">
        <Tam tieuDe="VIỆC CẦN LÀM" lop="rong2">
          {viecNgay.length === 0 && <p class="phu">Không có hạn nào đến {ngay === homNay.value ? 'hôm nay' : 'ngày này'}.</p>}
          {viecNgay.slice(0, 20).map((m) => (
            <TheViec key={m.khoa} m={m} onXong={xongMuc} menu={menuMuc(m)} />
          ))}
          {viecNgay.length > 20 && <p class="phu">… và {viecNgay.length - 20} việc khác (xem ở màn Hôm nay).</p>}
          {hopThu.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary class="dam">Kéo từ Hộp thu ({hopThu.length})</summary>
              {hopThu.slice(0, 10).map((v) => (
                <div key={v.id} class="hang-nut" style={{ margin: '4px 0' }}>
                  <button type="button" class="nut nut-nho" onClick={() => void luuViec({ ...v, han: ngay }).then(() => toast('Đã đưa vào ngày này'))}>＋</button>
                  <span>{v.tieuDe}</span>
                </div>
              ))}
            </details>
          )}
        </Tam>

        <Tam tieuDe="MỤC TIÊU (tối đa 3)">
          {[0, 1, 2].map((i) => (
            <div key={i} class="muc-tieu">
              <span aria-hidden="true">{i + 1}.</span>
              <input type="text" aria-label={`Mục tiêu ${i + 1}`} value={nhap.mucTieu[i] ?? ''} onInput={(e) => doi({ mucTieu: [0, 1, 2].map((j) => (j === i ? (e.target as HTMLInputElement).value : nhap.mucTieu[j] ?? '')).filter((x, j, a) => x || a.slice(j).some(Boolean)) })} />
            </div>
          ))}
        </Tam>

        <Tam tieuDe="NHẮC NHỞ">
          {nhac.length > 0 ? (
            <ul class="ds-nhac-ngay">
              {nhac.map((n) => (
                <li key={n.khoa}>
                  <span class="so dam">{n.luc.slice(11)}</span> <a href={n.lienKet}>{n.tieuDe}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p class="phu">Không có nhắc tự động trong ngày.</p>
          )}
          <textarea aria-label="Nhắc nhở của bạn" rows={2} placeholder="Ghi thêm nhắc nhở…" value={nhap.nhacNho} onInput={(e) => doi({ nhacNho: (e.target as HTMLTextAreaElement).value })} />
        </Tam>

        <Tam tieuDe="LỊCH TRONG NGÀY">
          {khoi.length === 0 ? <p class="phu">Chưa có khối thời gian. <a href="#lich">Mở Lịch</a> để thêm.</p> : khoi.map((x) => <p key={x.id} style={{ margin: '4px 0' }}><span class="so dam">{x.tu}–{x.den}</span> {x.tieuDe}</p>)}
        </Tam>

        <Tam tieuDe="GHI CHÚ">
          <textarea aria-label="Ghi chú" rows={4} value={nhap.ghiChu} onInput={(e) => doi({ ghiChu: (e.target as HTMLTextAreaElement).value })} />
        </Tam>

        <Tam tieuDe="CHO NGÀY MAI">
          <p class="phu">Ngày làm việc kế tiếp: {dinhDangNgayThu(ngayMai)}</p>
          {choMai.map((v) => (
            <p key={v.id} style={{ margin: '2px 0' }}>• {v.tieuDe}</p>
          ))}
          <textarea aria-label="Cho ngày mai" rows={2} placeholder="Việc cần nhớ cho ngày mai…" value={nhap.choNgayMai} onInput={(e) => doi({ choNgayMai: (e.target as HTMLTextAreaElement).value })} />
          <button type="button" class="nut nut-nho" onClick={() => void chuyenSang()} disabled={!viecChuaXongNgoaiCuoc.length}>
            Chuyển việc chưa xong sang ngày làm việc kế tiếp ({viecChuaXongNgoaiCuoc.length}) ➜
          </button>
          <p class="phu" style={{ marginTop: 4 }}>Chỉ chuyển việc ngoài cuộc; hạn pháp lý của cuộc kiểm tra không đổi được.</p>
        </Tam>

        <Tam tieuDe="CẢM NHẬN CUỐI NGÀY">
          <div class="hang-nut" role="radiogroup" aria-label="Cảm nhận cuối ngày">
            {CAM_NHAN.map((e, i) => (
              <button key={e} type="button" role="radio" aria-checked={nhap.camNhan === i + 1} aria-label={`Mức ${i + 1}/5`} class={`nut-cam ${nhap.camNhan === i + 1 ? 'chon' : ''}`} onClick={() => doi({ camNhan: nhap.camNhan === i + 1 ? undefined : ((i + 1) as KeHoachNgay['camNhan']) })}>
                {e}
              </button>
            ))}
          </div>
        </Tam>
      </div>
    </div>
  );
}
