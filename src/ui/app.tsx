import { useEffect } from 'preact/hooks';
import { KhoaTuDong } from '../data/mat';
import { apDungGiaoDien } from './giaoDien';
import { KhungUngDung } from './khung';
import { VungNhacNoi } from './chuongNhac';
import { chayBoPhat } from './boPhatNhac';
import { BangTruotHost, HopXacNhanHost, VungToast } from './lopPhu';
import { ManHienTai } from './man';
import { ManKhoa } from './man/manKhoa';
import { Onboarding } from './man/onboarding';
import { TrangThaiRong } from './thanhPhan';
import { capNhatDongHo, caiDat, diaChi, dsCuoc, dsViec, khoaApp, kho, loiKhoiDong, trangThaiApp } from './store';

function hookHeThong() {
  useEffect(() => {
    const doiHash = () => {
      diaChi.value = location.hash;
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', doiHash);
    const tick = window.setInterval(() => capNhatDongHo(), 15_000);
    const khiHienLai = () => document.visibilityState === 'visible' && capNhatDongHo();
    document.addEventListener('visibilitychange', khiHienLai);
    return () => {
      window.removeEventListener('hashchange', doiHash);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', khiHienLai);
    };
  }, []);
}

function hookGiaoDien() {
  const cd = caiDat.value;
  useEffect(() => {
    apDungGiaoDien(cd.giaoDien, cd.coChuLon);
    if (cd.giaoDien !== 'heThong' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const doi = () => apDungGiaoDien('heThong', cd.coChuLon);
    mq.addEventListener('change', doi);
    return () => mq.removeEventListener('change', doi);
  }, [cd.giaoDien, cd.coChuLon]);
}

/** Bộ phát nhắc: chạy khi app sẵn sàng, mỗi 30 giây, khi tab hiện lại và khi dữ liệu/cài đặt đổi. */
function hookBoPhatNhac() {
  const san = trangThaiApp.value === 'SAN_SANG';
  const cd = caiDat.value;
  const nhiVu = dsCuoc.value.length + dsViec.value.length;
  useEffect(() => {
    if (!san) return;
    void chayBoPhat();
    const t = window.setInterval(() => void chayBoPhat(), 30_000);
    const hien = () => document.visibilityState === 'visible' && void chayBoPhat();
    document.addEventListener('visibilitychange', hien);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', hien);
    };
  }, [san]);
  useEffect(() => {
    if (san) void chayBoPhat();
  }, [san, cd.nhac, cd.anDanh, nhiVu]);
}

/** Khóa tự động sau N phút không thao tác hoặc khi ẩn tab quá N phút (chỉ khi đã đặt mật mã). */
function hookKhoaTuDong() {
  const phut = caiDat.value.khoaTuDongPhut;
  const san = trangThaiApp.value === 'SAN_SANG' && (kho.value?.daMaHoa() ?? false);
  useEffect(() => {
    if (!san) return;
    const k = new KhoaTuDong(phut, Date.now());
    const hd = () => k.hoatDong(Date.now());
    const an = () => {
      if (document.visibilityState === 'hidden') k.anTab(Date.now());
      else if (k.hienTab(Date.now())) khoaApp();
    };
    for (const s of ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const) window.addEventListener(s, hd, { passive: true });
    document.addEventListener('visibilitychange', an);
    const tick = window.setInterval(() => k.kiemTra(Date.now()) && khoaApp(), 10_000);
    return () => {
      for (const s of ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const) window.removeEventListener(s, hd);
      document.removeEventListener('visibilitychange', an);
      clearInterval(tick);
    };
  }, [san, phut]);
}

export function UngDung() {
  hookHeThong();
  hookGiaoDien();
  hookKhoaTuDong();
  hookBoPhatNhac();
  const t = trangThaiApp.value;
  let noiDung;
  if (t === 'DANG_TAI') noiDung = <div class="rong" role="status">Đang mở dữ liệu…</div>;
  else if (t === 'LOI')
    noiDung = (
      <div style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
        <TrangThaiRong tieuDe="Không mở được dữ liệu">
          <p class="phu">{loiKhoiDong.value}</p>
        </TrangThaiRong>
      </div>
    );
  else if (t === 'KHOA') noiDung = <ManKhoa />;
  else if (t === 'ONBOARD') noiDung = <Onboarding />;
  else
    noiDung = (
      <KhungUngDung>
        <ManHienTai />
      </KhungUngDung>
    );
  return (
    <>
      <a class="bo-qua" href="#noi-dung" onClick={(e) => { e.preventDefault(); document.getElementById('noi-dung')?.focus(); }}>
        Bỏ qua tới nội dung
      </a>
      {noiDung}
      <BangTruotHost />
      <HopXacNhanHost />
      <VungNhacNoi />
      <VungToast />
    </>
  );
}
