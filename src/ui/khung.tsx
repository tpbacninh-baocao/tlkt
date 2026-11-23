// Khung ứng dụng (UI §2): thanh trên, thanh dưới (điện thoại), cột trái (máy tính), cột phải “Việc tiếp theo”, nút nổi Thu nhanh.
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { DIEU_HUONG, TEN_APP, TIEU_DE_MAN } from './chuoi';
import { MenuNoi, TheViec, TrangThaiRong } from './thanhPhan';
import { caiDat, kho, khoaApp, route, soNhacChuaXem, tongHop, diDen } from './store';
import { moThuNhanh } from './thuNhanh';
import { moChuongNhac } from './chuongNhac';
import { CotPhaiChiTiet } from './chiTiet/cotPhai';

function HuyHieu({ so }: { so: number }) {
  return so > 0 ? (
    <span class="huy-hieu" aria-label={`${so} mục`}>
      {so > 99 ? '99+' : so}
    </span>
  ) : null;
}

export function CotTrai() {
  const r = route.value;
  const hienTai = '#' + (r.man === 'cuoc-chi-tiet' ? 'cuoc' : r.man);
  const quaHan = tongHop.value.kpi.quaHan;
  return (
    <aside class="cot-trai" aria-label="Menu chính">
      <div class="logo">
        <img src="./icon.svg" alt="" />
        <span>TLKT</span>
      </div>
      <nav aria-label="Điều hướng">
        {DIEU_HUONG.map((m) => (
          <a key={m.hash} href={m.hash} aria-current={hienTai === m.hash ? 'page' : undefined} title={m.ten}>
            <span aria-hidden="true">{m.bieuTuong}</span>
            <span class="ten">{m.ten}</span>
            {m.hash === '#hom-nay' && <HuyHieu so={quaHan} />}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function CotPhai() {
  const r = route.value;
  if (r.man === 'cuoc-chi-tiet') return <aside class="cot-phai" aria-label="Dòng thời gian mốc"><CotPhaiChiTiet id={r.id} /></aside>;
  const ds = tongHop.value.tatCa.filter((m) => m.trangThai !== 'CHUA_DEN').slice(0, 8);
  return (
    <aside class="cot-phai" aria-label="Việc tiếp theo">
      <h2>Việc tiếp theo</h2>
      {ds.length === 0 ? (
        <TrangThaiRong tieuDe="Không có việc gấp" moTa="Các hạn trong vài ngày tới sẽ hiện ở đây." xanh />
      ) : (
        ds.map((m) => <TheViec key={m.khoa} m={m} />)
      )}
    </aside>
  );
}

function MenuThem({ dong }: { dong: () => void }) {
  const r = route.value;
  const hienTai = '#' + (r.man === 'cuoc-chi-tiet' ? 'cuoc' : r.man);
  const phu = DIEU_HUONG.filter((m) => !m.chinh);
  return (
    <div class="menu-them" onClick={(e) => e.target === e.currentTarget && dong()} role="dialog" aria-modal="true" aria-label="Thêm">
      <div>
        {phu.map((m) => (
          <a key={m.hash} href={m.hash} aria-current={hienTai === m.hash ? 'page' : undefined} onClick={dong}>
            <span aria-hidden="true">{m.bieuTuong}</span>
            {m.ten}
          </a>
        ))}
      </div>
    </div>
  );
}

export function KhungUngDung({ children }: { children: ComponentChildren }) {
  const [moThem, setMoThem] = useState(false);
  const r = route.value;
  const hienTai = '#' + (r.man === 'cuoc-chi-tiet' ? 'cuoc' : r.man);
  const quaHan = tongHop.value.kpi.quaHan;
  const tieuDe = r.man === 'cai-dat' && r.muc ? TIEU_DE_MAN['cai-dat'] : TIEU_DE_MAN[r.man] ?? TEN_APP;
  const daMaHoa = kho.value?.daMaHoa() ?? false;
  const chinh = DIEU_HUONG.filter((m) => m.chinh);
  return (
    <div class="khung">
      <CotTrai />
      <div class="giua">
        <header class="thanh-tren">
          <button type="button" class="nut-bieu-tuong" aria-label="Mở menu" onClick={() => setMoThem(true)} style={{ display: 'var(--hien-menu-dt, inline-flex)' }}>
            ☰
          </button>
          <h1>{tieuDe}</h1>
          <button type="button" class="nut-bieu-tuong" aria-label={`Nhắc việc${soNhacChuaXem.value ? ` – ${soNhacChuaXem.value} chưa xem` : ''}`} onClick={moChuongNhac}>
            🔔
            <HuyHieu so={soNhacChuaXem.value} />
          </button>
          <button
            type="button"
            class="nut-bieu-tuong"
            aria-label={daMaHoa ? 'Khóa ứng dụng' : 'Chưa đặt mật mã – bấm để đặt'}
            title={daMaHoa ? 'Khóa ngay' : 'Chưa đặt mật mã'}
            onClick={() => (daMaHoa ? khoaApp() : diDen('#cai-dat/bao-mat'))}
          >
            {daMaHoa ? '🔒' : '🔓'}
          </button>
        </header>
        <main class="noi-dung" id="noi-dung" tabIndex={-1}>
          {children}
        </main>
        <nav class="thanh-duoi" aria-label="Điều hướng chính">
          {chinh.map((m) => (
            <a key={m.hash} href={m.hash} aria-current={hienTai === m.hash ? 'page' : undefined}>
              <span class="bt" aria-hidden="true">{m.bieuTuong}</span>
              {m.ten === 'Cuộc kiểm tra' ? 'Cuộc' : m.ten}
              {m.hash === '#hom-nay' && <HuyHieu so={quaHan} />}
            </a>
          ))}
          <button type="button" class={chinh.every((m) => m.hash !== hienTai) ? 'dang-chon' : ''} onClick={() => setMoThem(true)} aria-haspopup="dialog">
            <span class="bt" aria-hidden="true">⋯</span>
            Thêm
          </button>
        </nav>
      </div>
      <CotPhai />
      <button type="button" class="nut-noi" aria-label="Thu nhanh: thêm việc hoặc cuộc" title="Thu nhanh" onClick={moThuNhanh}>
        ＋
      </button>
      {moThem && <MenuThem dong={() => setMoThem(false)} />}
    </div>
  );
}

export { MenuNoi, caiDat };
