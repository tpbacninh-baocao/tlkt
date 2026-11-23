// Màn “Hôm nay” (UI §4.3): tóm tắt, KPI, việc theo mức khẩn, tại doanh nghiệp, nhập liệu thiếu, lịch trong ngày.
import { canNhacSaoLuu } from '../../core/nhacViec';
import { dinhDangNgay, dinhDangNgayThu, laNgayLamViec, namChuaXacNhanNgayNghi, tenNgayNghi, tenThu } from '../../core/lich';
import { dongHoYeuCau } from '../../core/vuViec';
import { datNhatKy } from '../hanhDongCuoc';
import { FormNgayNghiNam } from '../ngayNghiForm';
import { menuMuc, xongMuc } from '../muc';
import { bayGio, caiDat, dsKhoiThoiGian, homNay, lich, moBang, phanTichMap, saoLuuCuoi, tongHop, trangThaiApp, cuocConHieuLuc, toast, napDuLieu, kho_ } from '../store';
import { Kpi, NhomViec, TheViec, TrangThaiRong, NhanHeThong } from '../thanhPhan';
import { moFormCuoc } from './themCuoc';
import { moNhapKeHoach } from './nhapExcel';
import { themDuLieuMau } from '../../data/mau';
import { tickViec } from '../hanhDongCuoc';

function loiChao(gio: number): string {
  if (gio < 11) return 'Chào buổi sáng';
  if (gio < 13) return 'Chào buổi trưa';
  if (gio < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function tomTatYeuCau(cuocId: string): string | undefined {
  const pt = phanTichMap.value.get(cuocId);
  if (!pt) return undefined;
  const cho = pt.cuoc.yeuCauTaiLieu.filter((y) => !y.nhanLuc);
  if (!cho.length) return undefined;
  const ds = cho.map((y) => dongHoYeuCau(lich.value, pt.bo, y, bayGio.value));
  const qua = ds.filter((d) => d.trangThai === 'QUA_HAN').length;
  const sap = ds.filter((d) => d.conLaiPhut !== undefined && d.conLaiPhut >= 0).sort((a, b) => a.conLaiPhut! - b.conLaiPhut!)[0];
  const phu = qua ? `${qua} quá hạn` : sap ? `1 ${sap.nhan.toLowerCase()}` : '';
  return `Yêu cầu tài liệu: ${cho.length} đang chờ${phu ? ` (${phu})` : ''}`;
}

export function ManHomNay() {
  const th = tongHop.value;
  const cd = caiDat.value;
  const gio = Number(bayGio.value.slice(11, 13));
  const nam = Number(homNay.value.slice(0, 4));
  const chuaNghi = namChuaXacNhanNgayNghi(cd, nam, Number(homNay.value.slice(5, 7)));
  const lv = laNgayLamViec(lich.value, homNay.value);
  const khoiHomNay = dsKhoiThoiGian.value.filter((k) => k.ngay === homNay.value).sort((a, b) => (a.tu < b.tu ? -1 : 1));
  const tenChao = cd.canBo.hoTen.trim();
  const k = th.kpi;
  const tatCaKhong = k.quaHan === 0 && k.homNay === 0 && k.baNLV === 0 && k.nhapLieuThieu === 0;

  const dongTomTat: string[] = [];
  if (k.quaHan || k.homNay) dongTomTat.push(`${k.quaHan} việc quá hạn · ${k.homNay} việc đến hạn hôm nay`);
  for (const t of th.taiDN) dongTomTat.push(`Đang kiểm tra tại DN: ${t.nhanCuoc}${t.ngayThu ? ` (ngày ${t.ngayThu.n}/${t.ngayThu.tong})` : ''}`);
  if (k.nhapLieuThieu) dongTomTat.push(`${k.nhapLieuThieu} mục nhập liệu chưa làm`);

  const chuaCoCuoc = cuocConHieuLuc.value.length === 0;
  const theGoiY = chuaCoCuoc ? (
    <section class="the" aria-label="Bắt đầu">
      <TrangThaiRong tieuDe="Chưa có cuộc kiểm tra nào" moTa="Thêm cuộc đầu tiên, nhập kế hoạch từ Excel hoặc dùng dữ liệu mẫu để xem thử.">
        <button type="button" class="nut nut-chinh" onClick={moFormCuoc}>＋ Thêm cuộc</button>
        <button type="button" class="nut" onClick={moNhapKeHoach}>Nhập kế hoạch từ Excel</button>
        <button
          type="button"
          class="nut"
          onClick={async () => {
            const r = await themDuLieuMau(kho_(), homNay.value, lich.value, bayGio.value, cd);
            await napDuLieu();
            toast(`Đã thêm dữ liệu mẫu: ${r.soCuoc} cuộc, ${r.soViec} việc`);
          }}
        >
          Dùng dữ liệu mẫu
        </button>
      </TrangThaiRong>
    </section>
  ) : null;

  return (
    <div>
      <header style={{ marginBottom: 12 }}>
        <h2>
          {loiChao(gio)}
          {tenChao ? `, ${tenChao}` : ''}
        </h2>
        <p class="phu" style={{ margin: 0 }}>
          {dinhDangNgayThu(homNay.value)}
          {!lv && ` · ${tenNgayNghi(lich.value, homNay.value) ?? tenThu(homNay.value)} – không phải ngày làm việc`}
        </p>
      </header>

      {chuaNghi.map((n) => (
        <div key={n} class="the canh-bao" role="alert">
          <b>Chưa nhập lịch nghỉ Tết {n}</b> – hạn có thể tính sai nếu thiếu ngày nghỉ lễ.{' '}
          <button
            type="button"
            class="nut nut-nho"
            onClick={() => moBang({ id: `ngay-nghi-${n}`, tieuDe: `Lịch nghỉ năm ${n}`, noiDung: () => <FormNgayNghiNam nam={n} idBang={`ngay-nghi-${n}`} /> })}
          >
            Nhập ngay
          </button>
        </div>
      ))}
      {trangThaiApp.value === 'SAN_SANG' && cd.nhac.bat && canNhacSaoLuu(homNay.value, saoLuuCuoi.value) && (
        <div class="the canh-bao">
          <b>Đã đến lúc sao lưu dữ liệu</b> {saoLuuCuoi.value ? `(lần gần nhất ${dinhDangNgay(saoLuuCuoi.value)})` : '(chưa sao lưu lần nào)'}.{' '}
          <a class="nut nut-nho" href="#cai-dat/sao-luu">Sao lưu ngay</a>
        </div>
      )}

      {theGoiY}
      <section class="the" aria-label="Tóm tắt">
        <h3>Tóm tắt</h3>
        {dongTomTat.length ? dongTomTat.map((d) => <p key={d} style={{ margin: '4px 0' }}>{d}</p>) : <p style={{ margin: 0 }}>Hôm nay chưa có việc đến hạn.</p>}
      </section>

      <div class="luoi-kpi">
        <Kpi so={k.quaHan} nhan="Quá hạn" mau={k.quaHan ? 'do' : undefined} href="#qua-han" />
        <Kpi so={k.homNay} nhan="Đến hạn hôm nay" mau={k.homNay ? 'cam' : undefined} href="#den-han-hom-nay" />
        <Kpi so={k.baNLV} nhan="3 ngày LV tới" mau={k.baNLV ? 'vang' : undefined} href="#ba-ngay-toi" />
        <Kpi so={k.nhapLieuThieu} nhan="Nhập liệu thiếu" href="#nhap-lieu" />
      </div>

      {tatCaKhong && <div class="rong xanh" style={{ padding: 16, marginBottom: 12 }}>✓ Không có việc gấp – xem kế hoạch tuần.</div>}

      {k.quaHan > 0 && (
        <div id="qua-han">
          <NhomViec tieuDe="QUÁ HẠN" dem={k.quaHan} kieu="do">
            {th.quaHan.map((m) => <TheViec key={m.khoa} m={m} onXong={xongMuc} menu={menuMuc(m)} />)}
          </NhomViec>
        </div>
      )}
      {k.homNay > 0 && (
        <div id="den-han-hom-nay">
          <NhomViec tieuDe="HÔM NAY" dem={k.homNay}>
            {th.homNay.map((m) => <TheViec key={m.khoa} m={m} onXong={xongMuc} menu={menuMuc(m)} />)}
          </NhomViec>
        </div>
      )}
      {k.baNLV > 0 && (
        <div id="ba-ngay-toi">
          <NhomViec tieuDe="3 NGÀY LÀM VIỆC TỚI" dem={k.baNLV}>
            {th.baNLVToi.map((m) => <TheViec key={m.khoa} m={m} onXong={xongMuc} menu={menuMuc(m)} />)}
          </NhomViec>
        </div>
      )}

      {th.taiDN.length > 0 && (
        <NhomViec tieuDe="TẠI DOANH NGHIỆP HÔM NAY" dem={th.taiDN.length}>
          {th.taiDN.map((t) => {
            const yc = tomTatYeuCau(t.cuocId);
            return (
              <div key={t.cuocId} class="the" style={{ marginBottom: 8 }}>
                <a href={`#cuoc-${t.cuocId}`} class="dam" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {t.nhanCuoc}
                  {t.ngayThu ? ` – ngày ${t.ngayThu.n}/${t.ngayThu.tong}` : ''}
                  {t.hanE ? ` – hạn E ${dinhDangNgay(t.hanE).slice(0, 5)}` : ''}
                </a>
                <label class="o-tich">
                  <input type="checkbox" checked={t.daGhiITNK} onChange={(e) => void datNhatKy(t.cuocId, homNay.value, (e.target as HTMLInputElement).checked)} />
                  <span>Đã ghi nhật ký iTNK hôm nay</span>
                </label>
                {yc && <p class="phu" style={{ margin: 0 }}>{yc}</p>}
              </div>
            );
          })}
        </NhomViec>
      )}

      {th.nhapLieuThieu.length > 0 && (
        <NhomViec tieuDe="NHẬP LIỆU CÒN THIẾU" dem={th.nhapLieuThieu.length} mo={false}>
          {th.nhapLieuThieu.slice(0, 6).map((n) => (
            <div key={n.viec.khoa + n.cuocId} class="the-viec" style={{ gridTemplateColumns: '1fr auto' }}>
              <div>
                <span class="ten">{n.viec.chucNang}</span>
                <div class="phu-dong">
                  <NhanHeThong ma={n.viec.heThong} />
                  <span>{n.nhanCuoc}</span>
                </div>
              </div>
              <button type="button" class="nut nut-nho" disabled={!!n.viec.chanTick} title={n.viec.chanTick} onClick={() => void tickViec(n.cuocId, n.viec)}>
                ✓ Xong
              </button>
            </div>
          ))}
          <a class="nut nut-nhe" href="#nhap-lieu">Xem tất cả ({th.nhapLieuThieu.length}) →</a>
        </NhomViec>
      )}

      {khoiHomNay.length > 0 && (
        <section class="the" aria-label="Lịch hôm nay">
          <h3>Lịch hôm nay</h3>
          {khoiHomNay.map((b) => (
            <p key={b.id} style={{ margin: '4px 0' }}>
              <span class="so dam">{b.tu}–{b.den}</span> {b.tieuDe}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
