// Màn Lịch (UI §4.8): Tháng / Tuần / Ngày; chấm màu theo SLA; ngày nghỉ nền xám; khối thời gian và gợi ý “Tại DN”.
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import type { KhoiThoiGian, NgayISO } from '../../core/kieu';
import { congNgayThuan, congThangThuan, dinhDangNgay, dinhDangNgayNgan, dinhDangNgayThu, gioSangPhut, laNgayLamViec, ngayDauTuan, tachNgay, tenNgayNghi, tenThu, thuNgan } from '../../core/lich';
import { goiYKhoiThoiGian, gomMucTheoNgay, luoiThang, trangThaiNangNhat, xepLanKhoi, type GoiYKhoi } from '../../core/tomTat';
import { luuKhoiThoiGian, xoaKhoiThoiGian } from '../hanhDong';
import { menuMuc, xongMuc } from '../muc';
import { bayGio, caiDat, dongBang, dsCuoc, dsKhoiThoiGian, homNay, lich, moBang, phanTichMap, toast, tongHop } from '../store';
import { xuatIcs } from '../xuat';
import { ChonNgay, MenuNoi, TheViec, Truong } from '../thanhPhan';

type CheDo = 'THANG' | 'TUAN' | 'NGAY';
const cheDo = signal<CheDo>('THANG');
const ngayLich = signal<NgayISO>(homNay.value);
const ngayChon = signal<NgayISO>(homNay.value);

const GIO_DAU = 7;
const GIO_CUOI = 18;
const CAO_GIO = 48;

const phutSangTop = (p: number) => ((Math.min(Math.max(p, GIO_DAU * 60), GIO_CUOI * 60) - GIO_DAU * 60) / 60) * CAO_GIO;
const lamTron30 = (p: number) => Math.round(p / 30) * 30;
const gio = (p: number) => `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`;

function FormKhoi({ khoi, idBang }: { khoi: Partial<KhoiThoiGian> & { ngay: NgayISO }; idBang: string }) {
  const [tieuDe, setTieuDe] = useState(khoi.tieuDe ?? '');
  const [ngay, setNgay] = useState<NgayISO | ''>(khoi.ngay);
  const [tu, setTu] = useState(khoi.tu ?? '09:00');
  const [den, setDen] = useState(khoi.den ?? '10:00');
  const [cuocId, setCuocId] = useState(khoi.cuocId ?? '');
  const loi = !tieuDe.trim() ? 'Nhập tiêu đề.' : !ngay ? 'Chọn ngày.' : den <= tu ? 'Giờ kết thúc phải sau giờ bắt đầu.' : '';
  return (
    <div>
      <Truong nhan="Tiêu đề" id="kh-td" batBuoc>
        <input id="kh-td" type="text" value={tieuDe} onInput={(e) => setTieuDe((e.target as HTMLInputElement).value)} />
      </Truong>
      <ChonNgay id="kh-ngay" nhan="Ngày" gia={ngay} doi={setNgay} canhBaoNghi={false} />
      <div class="hang">
        <Truong nhan="Từ" id="kh-tu"><input id="kh-tu" type="time" step={900} value={tu} onInput={(e) => setTu((e.target as HTMLInputElement).value)} /></Truong>
        <Truong nhan="Đến" id="kh-den"><input id="kh-den" type="time" step={900} value={den} onInput={(e) => setDen((e.target as HTMLInputElement).value)} /></Truong>
      </div>
      <Truong nhan="Liên quan cuộc (nếu có)" id="kh-cuoc">
        <select id="kh-cuoc" value={cuocId} onChange={(e) => setCuocId((e.target as HTMLSelectElement).value)}>
          <option value="">(Không)</option>
          {dsCuoc.value.filter((c) => !c.xoaLuc).map((c) => (
            <option key={c.id} value={c.id}>{c.ma} – {caiDat.value.anDanh ? `…${c.mst.slice(-4)}` : c.tenNNT}</option>
          ))}
        </select>
      </Truong>
      {loi && <p class="loi-truong">{loi}</p>}
      <div class="hang-nut phai">
        {khoi.id && (
          <button type="button" class="nut nut-nguy-hiem" onClick={async () => { await xoaKhoiThoiGian(khoi.id!); dongBang(idBang); toast('Đã xóa khối'); }}>
            Xóa
          </button>
        )}
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>Hủy</button>
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!!loi}
          onClick={async () => {
            await luuKhoiThoiGian({ id: khoi.id ?? crypto.randomUUID(), ngay: ngay as NgayISO, tu, den, tieuDe: tieuDe.trim(), cuocId: cuocId || undefined, viecId: khoi.viecId });
            dongBang(idBang);
            toast('Đã lưu khối thời gian');
          }}
        >
          Lưu
        </button>
      </div>
    </div>
  );
}

function moFormKhoi(khoi: Partial<KhoiThoiGian> & { ngay: NgayISO }): void {
  const id = `khoi-${khoi.id ?? 'moi'}`;
  moBang({ id, tieuDe: khoi.id ? 'Sửa khối thời gian' : 'Thêm khối thời gian', noiDung: () => <FormKhoi khoi={khoi} idBang={id} /> });
}

function TieuDeKy(): string {
  const n = ngayLich.value;
  const { nam, thang } = tachNgay(n);
  if (cheDo.value === 'THANG') return `Tháng ${thang}/${nam}`;
  if (cheDo.value === 'TUAN') {
    const d = ngayDauTuan(n);
    return `Tuần ${dinhDangNgayNgan(d)} – ${dinhDangNgay(congNgayThuan(d, 6))}`;
  }
  return dinhDangNgayThu(n);
}

function dichKy(huong: 1 | -1) {
  const n = ngayLich.value;
  ngayLich.value = cheDo.value === 'THANG' ? congThangThuan(`${n.slice(0, 7)}-01`, huong) : congNgayThuan(n, huong * (cheDo.value === 'TUAN' ? 7 : 1));
  if (cheDo.value === 'THANG') ngayChon.value = ngayLich.value;
}

function ChamMau({ ds }: { ds: ReturnType<typeof tongHop.peek>['tatCa'] }) {
  const tt = trangThaiNangNhat(ds);
  if (!tt) return null;
  const lop = tt === 'QUA_HAN' ? 'sla-do' : tt === 'HOM_NAY' ? 'sla-cam' : tt === 'SAP_DEN' ? 'sla-vang' : 'sla-xanh';
  return (
    <span class={`cham-lich ${lop}`} aria-hidden="true">
      ●{ds.length > 1 ? <small>{ds.length}</small> : null}
    </span>
  );
}

function DanhSachNgay({ ngay, theoNgay }: { ngay: NgayISO; theoNgay: Map<NgayISO, ReturnType<typeof tongHop.peek>['tatCa']> }) {
  const ds = theoNgay.get(ngay) ?? [];
  const khoi = dsKhoiThoiGian.value.filter((k) => k.ngay === ngay).sort((a, b) => (a.tu < b.tu ? -1 : 1));
  const nghi = tenNgayNghi(lich.value, ngay);
  return (
    <section class="the" aria-label={`Chi tiết ${dinhDangNgay(ngay)}`}>
      <h3>{dinhDangNgayThu(ngay)}</h3>
      {!laNgayLamViec(lich.value, ngay) && <p class="phu">{nghi ?? tenThu(ngay)} – không phải ngày làm việc</p>}
      {ds.length === 0 && khoi.length === 0 && <p class="phu">Không có hạn hay khối thời gian nào.</p>}
      {ds.map((m) => (
        <TheViec key={m.khoa} m={m} onXong={xongMuc} menu={menuMuc(m)} />
      ))}
      {khoi.map((k) => (
        <p key={k.id} style={{ margin: '4px 0' }}>
          <button type="button" class="nut nut-nho" onClick={() => moFormKhoi(k)}>✎</button> <span class="so dam">{k.tu}–{k.den}</span> {k.tieuDe}
        </p>
      ))}
      <div class="hang-nut">
        <button type="button" class="nut nut-nho" onClick={() => moFormKhoi({ ngay })}>＋ Khối thời gian</button>
        <button type="button" class="nut nut-nho" onClick={() => { cheDo.value = 'NGAY'; ngayLich.value = ngay; }}>Xem theo giờ</button>
      </div>
    </section>
  );
}

function LuoiThang({ theoNgay }: { theoNgay: Map<NgayISO, ReturnType<typeof tongHop.peek>['tatCa']> }) {
  const { nam, thang } = tachNgay(ngayLich.value);
  const tuan = luoiThang(nam, thang, lich.value);
  const tenCot = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  return (
    <div class="luoi-thang" role="grid" aria-label={`Tháng ${thang} năm ${nam}`}>
      <div class="hang-thang tieu" role="row">
        {tenCot.map((t) => (
          <div key={t} role="columnheader">{t}</div>
        ))}
      </div>
      {tuan.map((h) => (
        <div key={h[0].ngay} class="hang-thang" role="row">
          {h.map((o) => {
            const ds = theoNgay.get(o.ngay) ?? [];
            const co = dsKhoiThoiGian.value.some((k) => k.ngay === o.ngay);
            return (
              <button
                key={o.ngay}
                type="button"
                role="gridcell"
                class={`o-lich ${o.thuocThang ? '' : 'ngoai'} ${o.nghi ? 'nghi' : ''} ${o.ngay === homNay.value ? 'hom-nay' : ''} ${o.ngay === ngayChon.value ? 'chon' : ''}`}
                aria-label={`${dinhDangNgayThu(o.ngay)}${o.tenNghi ? ', ' + o.tenNghi : ''}${ds.length ? `, ${ds.length} hạn` : ''}`}
                aria-pressed={o.ngay === ngayChon.value}
                onClick={() => (ngayChon.value = o.ngay)}
                onDblClick={() => { cheDo.value = 'NGAY'; ngayLich.value = o.ngay; }}
              >
                <span class="so-ngay">{tachNgay(o.ngay).ngay}</span>
                {o.tenNghi && <span class="ten-le">{o.tenNghi}</span>}
                {o.lamBu && <span class="ten-le">Làm bù</span>}
                <span class="cham-hang">
                  <ChamMau ds={ds} />
                  {co && <span class="cham-lich" aria-hidden="true" style={{ color: 'var(--chinh)' }}>▪</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function LuoiGio({ ngays, theoNgay, goiY }: { ngays: NgayISO[]; theoNgay: Map<NgayISO, ReturnType<typeof tongHop.peek>['tatCa']>; goiY: GoiYKhoi[] }) {
  const gioDS = Array.from({ length: GIO_CUOI - GIO_DAU + 1 }, (_, i) => GIO_DAU + i);
  const [keo, setKeo] = useState<{ ngay: NgayISO; a: number; b: number } | null>(null);
  const phutTuY = (e: PointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return lamTron30(GIO_DAU * 60 + ((e.clientY - r.top) / CAO_GIO) * 60);
  };
  return (
    <div class="luoi-gio" style={{ ['--so-cot' as string]: ngays.length }}>
      <div class="hang-dau-gio">
        <div class="cot-gio" />
        {ngays.map((n) => {
          const ds = theoNgay.get(n) ?? [];
          return (
            <div key={n} class={`dau-cot ${n === homNay.value ? 'hom-nay' : ''} ${!laNgayLamViec(lich.value, n) ? 'nghi' : ''}`}>
              <button type="button" class="nut nut-nhe nut-nho" onClick={() => { ngayLich.value = n; cheDo.value = 'NGAY'; }}>
                {thuNgan(n)} {dinhDangNgayNgan(n)}
              </button>
              {tenNgayNghi(lich.value, n) && <div class="phu">{tenNgayNghi(lich.value, n)}</div>}
              {ds.length > 0 && <div><ChamMau ds={ds} /> <span class="phu">{ds.length} hạn</span></div>}
            </div>
          );
        })}
      </div>
      <div class="than-gio">
        <div class="cot-gio">
          {gioDS.map((g) => (
            <div key={g} class="nhan-gio" style={{ height: CAO_GIO }}>{String(g).padStart(2, '0')}:00</div>
          ))}
        </div>
        {ngays.map((n) => {
          const khoi = dsKhoiThoiGian.value.filter((k) => k.ngay === n);
          const gy = goiY.filter((x) => x.ngay === n);
          return (
            <div
              key={n}
              class={`cot-ngay ${!laNgayLamViec(lich.value, n) ? 'nghi' : ''}`}
              style={{ height: gioDS.length * CAO_GIO }}
              role="group"
              aria-label={`Khối thời gian ${dinhDangNgayThu(n)}`}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('.khoi')) return;
                const a = phutTuY(e, e.currentTarget as HTMLElement);
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                setKeo({ ngay: n, a, b: a + 30 });
              }}
              onPointerMove={(e) => keo && keo.ngay === n && setKeo({ ...keo, b: Math.max(keo.a + 30, phutTuY(e, e.currentTarget as HTMLElement) + 30) })}
              onPointerUp={() => {
                if (keo && keo.ngay === n) {
                  moFormKhoi({ ngay: n, tu: gio(keo.a), den: gio(Math.min(keo.b, GIO_CUOI * 60)) });
                  setKeo(null);
                }
              }}
            >
              {gioDS.map((g) => (
                <div key={g} class="vach-gio" style={{ top: (g - GIO_DAU) * CAO_GIO }} />
              ))}
              {n === homNay.value && <div class="vach-bay-gio" style={{ top: phutSangTop(gioSangPhut(bayGio.value.slice(11, 16))) }} />}
              {xepLanKhoi([
                ...gy.map((x) => ({ tu: x.tu, den: x.den, loai: 'GOI_Y' as const, gy: x, khoi: undefined as KhoiThoiGian | undefined })),
                ...khoi.map((k) => ({ tu: k.tu, den: k.den, loai: 'KHOI' as const, gy: undefined as GoiYKhoi | undefined, khoi: k })),
              ]).map((x) => {
                const kieu = { top: phutSangTop(gioSangPhut(x.tu)), height: Math.max(22, phutSangTop(gioSangPhut(x.den)) - phutSangTop(gioSangPhut(x.tu))), left: `calc(${(x.lan / x.soLan) * 100}% + 2px)`, width: `calc(${100 / x.soLan}% - 4px)`, right: 'auto' };
                return x.gy ? (
                  <button
                    key={x.gy.khoa}
                    type="button"
                    class="khoi goi-y"
                    style={kieu}
                    title="Gợi ý – bấm để tạo khối"
                    onClick={() => void luuKhoiThoiGian({ id: crypto.randomUUID(), ngay: x.gy!.ngay, tu: x.gy!.tu, den: x.gy!.den, tieuDe: x.gy!.tieuDe, cuocId: x.gy!.cuocId }).then(() => toast('Đã tạo khối từ gợi ý'))}
                  >
                    <span class="phu">gợi ý</span> {x.gy.tieuDe}
                  </button>
                ) : (
                  <button key={x.khoi!.id} type="button" class="khoi" style={kieu} onClick={() => moFormKhoi(x.khoi!)}>
                    <b>{x.khoi!.tu}</b> {x.khoi!.tieuDe}
                  </button>
                );
              })}
              {keo && keo.ngay === n && <div class="khoi dang-keo" style={{ top: phutSangTop(keo.a), height: phutSangTop(keo.b) - phutSangTop(keo.a) }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ManLich() {
  const n = ngayLich.value;
  const { nam, thang } = tachNgay(n);
  const [tu, den] =
    cheDo.value === 'THANG'
      ? [luoiThang(nam, thang, lich.value)[0][0].ngay, luoiThang(nam, thang, lich.value).at(-1)![6].ngay]
      : cheDo.value === 'TUAN'
        ? [ngayDauTuan(n), congNgayThuan(ngayDauTuan(n), 6)]
        : [n, n];
  const theoNgay = gomMucTheoNgay(tongHop.value.tatCa, tu, den);
  const ngays = cheDo.value === 'TUAN' ? Array.from({ length: 7 }, (_, i) => congNgayThuan(tu, i)) : [n];
  const goiY = cheDo.value === 'THANG' ? [] : goiYKhoiThoiGian([...phanTichMap.value.values()], lich.value, tu, den, dsKhoiThoiGian.value, caiDat.value.anDanh);

  return (
    <div>
      <div class="thanh-loc">
        <button type="button" class="nut nut-nho" aria-label="Kỳ trước" onClick={() => dichKy(-1)}>‹</button>
        <button type="button" class="nut nut-nho" onClick={() => { ngayLich.value = homNay.value; ngayChon.value = homNay.value; }}>Hôm nay</button>
        <button type="button" class="nut nut-nho" aria-label="Kỳ sau" onClick={() => dichKy(1)}>›</button>
        <h2 style={{ flex: 1, fontSize: 'var(--co-the)' }} aria-live="polite">{TieuDeKy()}</h2>
        <div class="doi-che-do" role="group" aria-label="Chế độ xem lịch">
          {([['THANG', 'Tháng'], ['TUAN', 'Tuần'], ['NGAY', 'Ngày']] as const).map(([m, ten]) => (
            <button key={m} type="button" aria-pressed={cheDo.value === m} onClick={() => (cheDo.value = m)}>{ten}</button>
          ))}
        </div>
      </div>
      <div class="hang-nut" style={{ marginBottom: 12 }}>
        <button type="button" class="nut nut-nho" onClick={() => moFormKhoi({ ngay: cheDo.value === 'THANG' ? ngayChon.value : n })}>＋ Khối</button>
        <MenuNoi
          nhan="Xuất lịch"
          hanhDong={[
            { nhan: 'Xuất .ics – 30 ngày tới', chay: () => void xuatIcs({ loai: '30_NGAY' }) },
            { nhan: 'Xuất .ics – tất cả hạn', chay: () => void xuatIcs({ loai: 'TAT_CA' }) },
          ]}
        />
        <span class="phu">Xuất .ics rồi mở trên điện thoại để có báo thức thật. <a href="#cai-dat/nhac-viec">Hướng dẫn</a></span>
      </div>

      {cheDo.value === 'THANG' ? (
        <>
          <LuoiThang theoNgay={theoNgay} />
          <p class="phu">● màu theo mức khẩn của hạn · ▪ có khối thời gian · nhấn đúp một ngày để xem theo giờ</p>
          <DanhSachNgay ngay={ngayChon.value} theoNgay={theoNgay} />
        </>
      ) : (
        <>
          <div class="cuon-ngang">
            <LuoiGio ngays={ngays} theoNgay={theoNgay} goiY={goiY} />
          </div>
          <p class="phu">Kéo trên cột ngày (máy tính) hoặc nhấn “＋ Khối” để tạo khối thời gian. Khối viền đứt là gợi ý.</p>
          {cheDo.value === 'NGAY' && <DanhSachNgay ngay={n} theoNgay={theoNgay} />}
        </>
      )}
    </div>
  );
}
