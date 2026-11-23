// Danh sách cuộc (UI §4.4): tìm/lọc/sắp xếp, 3 chế độ xem Danh sách | Kanban | Dòng thời gian.
import { signal } from '@preact/signals';
import { useMemo } from 'preact/hooks';
import type { GiaiDoan } from '../../core/kieu';
import { dinhDangNgayNgan, thuNgan } from '../../core/lich';
import { nhanCuoc } from '../../core/nhacViec';
import { locCuocDS, sapXepCuocDS, taoDongCuoc, type BoLocCuoc, type DongCuoc, type KieuSapXep } from '../../core/tomTat';
import { namCuaCuoc } from '../../core/keHoach';
import { TEN_GIAI_DOAN, THU_TU_GIAI_DOAN, tienDoGiaiDoan, type MucSLA } from '../../core/vuViec';
import { TEN_LOAI_CUOC } from '../chuoi';
import { caiDat, cuocConHieuLuc, dsKeHoach, duLieuTomTat, moBang, phanTichMap } from '../store';
import { NhanGiaiDoan, NhanLoai, NhanSLA, TrangThaiRong, conLaiNLVChu } from '../thanhPhan';
import { Gantt } from './gantt';
import { Kanban } from './kanban';
import { moFormCuoc } from './themCuoc';
import { moNhapKeHoach } from './nhapExcel';

type CheDo = 'DANH_SACH' | 'KANBAN' | 'GANTT';

function docCheDo(): CheDo {
  try {
    const v = localStorage.getItem('tlkt-che-do-cuoc');
    if (v === 'KANBAN' || v === 'GANTT') return v;
  } catch {
    /* bỏ qua */
  }
  return 'DANH_SACH';
}

const cheDo = signal<CheDo>(docCheDo());
const loc = signal<BoLocCuoc>({});
const sapXep = signal<KieuSapXep>('UU_TIEN');

function datCheDo(c: CheDo) {
  cheDo.value = c;
  try {
    localStorage.setItem('tlkt-che-do-cuoc', c);
  } catch {
    /* bỏ qua */
  }
}

const SLA_LOC: { ma: MucSLA[]; ten: string }[] = [
  { ma: ['QUA_HAN', 'QUA_HAN_CHUA_GIAI_TRINH'], ten: 'Quá hạn' },
  { ma: ['HOM_NAY_NGAY_MAI'], ten: 'Hôm nay/ngày mai' },
  { ma: ['SAP_DEN'], ten: 'Sắp đến hạn' },
  { ma: ['CON_LAU', 'DU_KIEN'], ten: 'Còn thời gian' },
];

function demLoc(l: BoLocCuoc): number {
  return [l.giaiDoan?.length, l.loai?.length, l.keHoachId, l.nam, l.sla?.length, l.truongDoan, l.coHanNgoai].filter(Boolean).length;
}

function Chon({ nhan, ds, chon, doi }: { nhan: string; ds: { ma: string; ten: string }[]; chon: string[]; doi: (v: string[]) => void }) {
  return (
    <fieldset class="truong" style={{ border: 0, padding: 0 }}>
      <legend class="nhan-truong">{nhan}</legend>
      <div class="hang-nut">
        {ds.map((d) => {
          const bat = chon.includes(d.ma);
          return (
            <button key={d.ma} type="button" class={`nut nut-nho ${bat ? 'nut-chinh' : ''}`} aria-pressed={bat} onClick={() => doi(bat ? chon.filter((x) => x !== d.ma) : [...chon, d.ma])}>
              {d.ten}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function BangLoc() {
  const l = loc.value;
  const namCo = [...new Set(cuocConHieuLuc.value.map((c) => namCuaCuoc(c, dsKeHoach.value)))].sort();
  const truongDoan = [...new Set(cuocConHieuLuc.value.map((c) => c.truongDoan).filter(Boolean))].sort();
  const dat = (p: Partial<BoLocCuoc>) => (loc.value = { ...loc.value, ...p });
  const loaiCo = [...new Set(cuocConHieuLuc.value.map((c) => c.loai))];
  return (
    <div>
      <Chon nhan="Giai đoạn" ds={THU_TU_GIAI_DOAN.map((g) => ({ ma: g, ten: TEN_GIAI_DOAN[g] }))} chon={l.giaiDoan ?? []} doi={(v) => dat({ giaiDoan: v as GiaiDoan[] })} />
      <Chon nhan="Loại cuộc" ds={loaiCo.map((x) => ({ ma: x, ten: `${x} – ${(TEN_LOAI_CUOC[x] ?? x).slice(0, 28)}` }))} chon={l.loai ?? []} doi={(v) => dat({ loai: v })} />
      <Chon nhan="Tình trạng hạn" ds={SLA_LOC.map((s) => ({ ma: s.ma[0], ten: s.ten }))} chon={(l.sla ?? []).filter((x) => SLA_LOC.some((s) => s.ma[0] === x))} doi={(v) => dat({ sla: SLA_LOC.filter((s) => v.includes(s.ma[0])).flatMap((s) => s.ma) })} />
      <div class="luoi-2">
        <div class="truong">
          <label for="loc-kh">Kế hoạch</label>
          <select id="loc-kh" value={l.keHoachId ?? ''} onChange={(e) => dat({ keHoachId: (e.target as HTMLSelectElement).value || undefined })}>
            <option value="">Tất cả</option>
            {dsKeHoach.value.filter((k) => !k.xoaLuc).map((k) => (
              <option key={k.id} value={k.id}>{k.ten}</option>
            ))}
          </select>
        </div>
        <div class="truong">
          <label for="loc-nam">Năm</label>
          <select id="loc-nam" value={l.nam ?? ''} onChange={(e) => dat({ nam: Number((e.target as HTMLSelectElement).value) || undefined })}>
            <option value="">Tất cả</option>
            {namCo.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div class="truong">
          <label for="loc-td">Trưởng đoàn</label>
          <select id="loc-td" value={l.truongDoan ?? ''} onChange={(e) => dat({ truongDoan: (e.target as HTMLSelectElement).value || undefined })}>
            <option value="">Tất cả</option>
            {truongDoan.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <label class="o-tich">
        <input type="checkbox" checked={!!l.coHanNgoai} onChange={(e) => dat({ coHanNgoai: (e.target as HTMLInputElement).checked || undefined })} />
        <span>Chỉ cuộc có hạn ngoài (ví dụ hạn giải quyết hồ sơ hoàn)</span>
      </label>
      <div class="hang-nut phai" style={{ marginTop: 12 }}>
        <button type="button" class="nut" onClick={() => (loc.value = { tim: loc.value.tim })}>Xóa lọc</button>
      </div>
    </div>
  );
}

function DongCuocUI({ r }: { r: DongCuoc }) {
  const c = r.cuoc;
  const t = r.pt.tiepTheo;
  const han = t ? (t.noiBo ? t.hanMucTieu : t.hanPhapLy) : undefined;
  const { daQua, tong } = tienDoGiaiDoan(r.pt.giaiDoan);
  const moc = r.pt.kq.moc;
  return (
    <a class="the dong-cuoc" href={`#cuoc-${c.id}`}>
      <div class="dong1">
        <NhanLoai loai={c.loai} />
        <span class="ten-cuoc">
          {c.ma} · {nhanCuoc(c, caiDat.value.anDanh)}
        </span>
        <NhanGiaiDoan gd={r.pt.giaiDoan} />
      </div>
      <div class="dong2">
        {t ? (
          <>
            <span>
              Việc tiếp theo: <b>{t.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '').split(/[:;]/)[0].slice(0, 70)}</b>
              {han ? ` – hạn ${dinhDangNgayNgan(han)} (${thuNgan(han)})` : ''}
            </span>
            <NhanSLA muc={r.sla} chu={conLaiNLVChu(t.nlvConLai) || undefined} />
          </>
        ) : (
          <span class="phu">Không còn việc tiếp theo</span>
        )}
      </div>
      <div class="dong3">
        <span>Trưởng đoàn: {c.truongDoan || '—'}</span>
        {moc.D0 && !moc.D0.duKien && <span>· QĐ {c.soQD ? c.soQD + ' ' : ''}{dinhDangNgayNgan(moc.D0.ngay)}</span>}
        {moc.C && !moc.C.duKien && <span>· Công bố {dinhDangNgayNgan(moc.C.ngay)}</span>}
        <span style={{ marginLeft: 'auto' }}>
          <span class="thanh-gd" aria-hidden="true">
            {Array.from({ length: tong }, (_, i) => <i key={i} class={i < daQua ? 'da' : ''} />)}
          </span>{' '}
          {daQua}/{tong} giai đoạn
        </span>
      </div>
    </a>
  );
}

export function ManCuoc() {
  const tatCa = cuocConHieuLuc.value;
  const d = duLieuTomTat.value;
  const pt = phanTichMap.value;
  const rows = useMemo(() => tatCa.map((c) => taoDongCuoc(c, d, pt.get(c.id))), [tatCa, d, pt]);
  const l = loc.value;
  const ketQua = sapXepCuocDS(locCuocDS(rows, l, dsKeHoach.value), sapXep.value);
  const nLoc = demLoc(l);

  return (
    <div>
      <div class="thanh-loc" role="search">
        <input
          type="search"
          aria-label="Tìm theo MST, tên, số QĐ"
          placeholder="Tìm MST, tên, số QĐ…"
          value={l.tim ?? ''}
          onInput={(e) => (loc.value = { ...loc.value, tim: (e.target as HTMLInputElement).value })}
        />
        <button type="button" class={`nut ${nLoc ? 'nut-chinh' : ''}`} onClick={() => moBang({ id: 'loc-cuoc', tieuDe: 'Lọc cuộc kiểm tra', noiDung: () => <BangLoc /> })}>
          ⚙ Lọc{nLoc ? ` (${nLoc})` : ''}
        </button>
        <select aria-label="Sắp xếp" value={sapXep.value} onChange={(e) => (sapXep.value = (e.target as HTMLSelectElement).value as KieuSapXep)} style={{ minWidth: 150 }}>
          <option value="UU_TIEN">Ưu tiên cao trước</option>
          <option value="HAN">Hạn gần nhất</option>
          <option value="NGAY_TAO">Mới tạo</option>
          <option value="TEN">Tên A→Z</option>
        </select>
      </div>
      <div class="thanh-loc">
        <div class="doi-che-do" role="group" aria-label="Chế độ xem">
          {([['DANH_SACH', 'Danh sách'], ['KANBAN', 'Kanban'], ['GANTT', 'Dòng thời gian']] as const).map(([ma, ten]) => (
            <button key={ma} type="button" aria-pressed={cheDo.value === ma} onClick={() => datCheDo(ma)}>
              {ten}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button type="button" class="nut nut-chinh" onClick={() => moFormCuoc()}>＋ Thêm cuộc</button>
        <button type="button" class="nut" onClick={moNhapKeHoach}>Nhập Excel</button>
      </div>

      <p class="phu" aria-live="polite">{ketQua.length}/{rows.length} cuộc</p>

      {rows.length === 0 ? (
        <TrangThaiRong tieuDe="Chưa có cuộc kiểm tra nào" moTa="Thêm cuộc đầu tiên hoặc nhập kế hoạch từ Excel.">
          <button type="button" class="nut nut-chinh" onClick={() => moFormCuoc()}>＋ Thêm cuộc</button>
          <button type="button" class="nut" onClick={moNhapKeHoach}>Nhập kế hoạch từ Excel</button>
        </TrangThaiRong>
      ) : ketQua.length === 0 ? (
        <TrangThaiRong tieuDe="Không có cuộc nào khớp bộ lọc">
          <button type="button" class="nut" onClick={() => (loc.value = {})}>Xóa lọc</button>
        </TrangThaiRong>
      ) : cheDo.value === 'DANH_SACH' ? (
        ketQua.map((r) => <DongCuocUI key={r.cuoc.id} r={r} />)
      ) : cheDo.value === 'KANBAN' ? (
        <Kanban rows={ketQua} />
      ) : (
        <Gantt rows={ketQua} />
      )}
    </div>
  );
}
