// Tab “Nhật ký”: các ngày làm việc từ công bố đến kết thúc tại DN, dạng lưới theo tuần (UI §4.6).
import { useEffect, useRef, useState } from 'preact/hooks';
import { congNgayThuan, dinhDangNgay, dinhDangNgayNgan, laNgayLamViec, ngayDauTuan, tenThu } from '../../core/lich';
import type { PhanTichCuoc } from '../../core/tomTat';
import { laNgayTaiDN, ngayThuMayTaiDN } from '../../core/vuViec';
import type { NgayISO } from '../../core/kieu';
import { coHoTroGiongNoi, nghe, thongBaoLoiGiongNoi, type PhienGiongNoi } from '../giongNoi';
import { datKhongXuongDN, datNhatKy } from '../hanhDongCuoc';
import { homNay, lich, toast } from '../store';
import { NutSaoChep, TrangThaiRong, ThanhTienDo } from '../thanhPhan';

function HangNhatKy({ pt, ngay }: { pt: PhanTichCuoc; ngay: NgayISO }) {
  const c = pt.cuoc;
  const nk = c.nhatKy[ngay];
  const [ghiChu, setGhiChu] = useState(nk?.ghiChu ?? '');
  const [nghenhe, setNghe] = useState(false);
  const phien = useRef<PhienGiongNoi | null>(null);
  useEffect(() => setGhiChu(nk?.ghiChu ?? ''), [nk?.ghiChu]);
  useEffect(() => () => phien.current?.dung(), []);
  const taiDN = laNgayTaiDN(c, pt.kq, lich.value, ngay);
  const khongXuong = c.ngayKhongLamTaiDN.includes(ngay);
  const tamDung = c.suKien.some((s) => s.loai === 'TAM_DUNG' && ngay >= (s.tuNgay as string) && ngay <= (s.denNgay as string));
  const tuongLai = ngay > homNay.value;
  const luuGhiChu = () => {
    if ((nk?.ghiChu ?? '') !== ghiChu) void datNhatKy(c.id, ngay, !!nk?.daGhiITNK, ghiChu);
  };
  const giongNoi = () => {
    if (nghenhe) return phien.current?.dung();
    setNghe(true);
    const goc = ghiChu ? ghiChu + ' ' : '';
    phien.current = nghe(
      (chu) => setGhiChu(goc + chu),
      (loi) => {
        setNghe(false);
        const t = thongBaoLoiGiongNoi(loi);
        if (t) toast(t, 'loi');
      },
    );
    if (!phien.current) setNghe(false);
  };

  return (
    <li class={`hang-nk ${ngay === homNay.value ? 'hom-nay' : ''}`}>
      <div class="ngay-nk">
        <b>{tenThu(ngay)}</b>
        <span class="phu"> {dinhDangNgay(ngay)}</span>
        {taiDN && <span class="phu"> · ngày thứ {ngayThuMayTaiDN(c, pt.kq, lich.value, ngay)} tại DN</span>}
        {khongXuong && <span class="nhan nhan-vang">Không xuống DN</span>}
        {tamDung && <span class="nhan nhan-vang">Tạm dừng</span>}
        {tuongLai && <span class="nhan">Chưa tới</span>}
      </div>
      {taiDN ? (
        <div class="noi-dung-nk">
          <label class="o-tich">
            <input type="checkbox" checked={!!nk?.daGhiITNK} disabled={tuongLai} onChange={(e) => void datNhatKy(c.id, ngay, (e.target as HTMLInputElement).checked, ghiChu)} />
            <span>Đã ghi nhật ký iTNK</span>
          </label>
          <textarea rows={2} aria-label={`Ghi chú nhanh ${dinhDangNgayNgan(ngay)}`} placeholder="Ghi chú nhanh công việc trong ngày…" value={ghiChu} onInput={(e) => setGhiChu((e.target as HTMLTextAreaElement).value)} onBlur={luuGhiChu} />
          <div class="hang-nut">
            {coHoTroGiongNoi() && (
              <button type="button" class={`nut nut-nho ${nghenhe ? 'nut-chinh' : ''}`} aria-pressed={nghenhe} onClick={giongNoi}>
                🎤 {nghenhe ? 'Đang nghe…' : 'Nói'}
              </button>
            )}
            {ghiChu && <NutSaoChep lay={() => ghiChu} nhan="Sao chép ghi chú" />}
            <button type="button" class="nut nut-nho" onClick={() => void datKhongXuongDN(c.id, ngay, true)}>
              Đánh dấu không xuống DN
            </button>
          </div>
        </div>
      ) : (
        <div class="noi-dung-nk phu">
          {khongXuong ? (
            <button type="button" class="nut nut-nho" onClick={() => void datKhongXuongDN(c.id, ngay, false)}>
              Bỏ đánh dấu (có xuống DN)
            </button>
          ) : tamDung ? (
            'Ngày tạm dừng kiểm tra – không ghi nhật ký.'
          ) : null}
        </div>
      )}
    </li>
  );
}

export function TabNhatKy({ pt }: { pt: PhanTichCuoc }) {
  const c = pt.cuoc;
  const C = pt.kq.moc.C;
  if (!C || C.duKien) {
    return <TrangThaiRong tieuDe="Chưa công bố QĐ kiểm tra" moTa="Nhật ký iTNK bắt đầu từ ngày công bố QĐ. Hãy đánh dấu xong bước công bố (Q5) trước." />;
  }
  const cuoi = [c.buoc.T7?.xong ? c.buoc.T7.ngay : pt.kq.moc.E?.ngay, homNay.value].filter(Boolean).sort()[0] as NgayISO;
  const cacNgay: NgayISO[] = [];
  for (let d = C.ngay; d <= cuoi; d = congNgayThuan(d, 1)) if (laNgayLamViec(lich.value, d)) cacNgay.push(d);
  const tai = cacNgay.filter((d) => laNgayTaiDN(c, pt.kq, lich.value, d));
  const daGhi = tai.filter((d) => c.nhatKy[d]?.daGhiITNK).length;
  const tuan = new Map<NgayISO, NgayISO[]>();
  for (const d of cacNgay) {
    const t = ngayDauTuan(d);
    tuan.set(t, [...(tuan.get(t) ?? []), d]);
  }
  return (
    <div>
      <section class="the">
        <ThanhTienDo xong={daGhi} tong={tai.length} nhan={`${daGhi}/${tai.length} ngày đã ghi iTNK`} />
        <p class="phu" style={{ margin: '8px 0 0' }}>Nhắc ghi nhật ký lúc 16:30 mỗi ngày làm việc tại DN. Ngày đoàn không xuống doanh nghiệp hãy đánh dấu để không bị nhắc.</p>
      </section>
      {[...tuan.entries()].map(([dau, ds]) => (
        <section key={dau} class="the" aria-label={`Tuần từ ${dinhDangNgay(dau)}`}>
          <h3>Tuần {dinhDangNgayNgan(dau)} – {dinhDangNgayNgan(congNgayThuan(dau, 6))}</h3>
          <ul class="ds-nk">
            {ds.map((d) => (
              <HangNhatKy key={d} pt={pt} ngay={d} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
