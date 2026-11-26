// Cài đặt → Nhắc việc và Giao diện.
import { useState } from 'preact/hooks';
import { suaCaiDat } from '../hanhDong';
import { thuNhac, xinQuyenThongBao } from '../boPhatNhac';
import { caiDat } from '../store';
import { Truong } from '../thanhPhan';
import { apDungGiaoDien } from '../giaoDien';
import { xuatIcs } from '../xuat';
import { HuongDanLich } from './huongDan';

function Gio({ nhan, khoa, id }: { nhan: string; khoa: 'gioYenLangTu' | 'gioYenLangDen' | 'banTinSang' | 'nhatKy' | 'nhatKyBaoThuc'; id: string }) {
  return (
    <Truong nhan={nhan} id={id}>
      <input id={id} type="time" value={caiDat.value.nhac[khoa]} onChange={(e) => { const v = (e.target as HTMLInputElement).value; if (v) void suaCaiDat((c) => ({ ...c, nhac: { ...c.nhac, [khoa]: v } })); }} />
    </Truong>
  );
}

export function CaiDatNhacViec() {
  const n = caiDat.value.nhac;
  const [quyen, setQuyen] = useState<string>(typeof Notification === 'undefined' ? 'khong-ho-tro' : Notification.permission);
  const xin = async () => setQuyen(await xinQuyenThongBao());
  return (
    <div>
      <section class="the">
        <h3>Nhắc việc trong app</h3>
        <label class="o-tich">
          <input type="checkbox" checked={n.bat} onChange={(e) => void suaCaiDat((c) => ({ ...c, nhac: { ...c.nhac, bat: (e.target as HTMLInputElement).checked } }))} />
          <span>Bật nhắc việc</span>
        </label>
        <label class="o-tich">
          <input type="checkbox" checked={n.amThanh} onChange={(e) => void suaCaiDat((c) => ({ ...c, nhac: { ...c.nhac, amThanh: (e.target as HTMLInputElement).checked } }))} />
          <span>Phát âm báo khi có nhắc</span>
        </label>
        <p class="phu">
          Thông báo trên màn hình: {quyen === 'granted' ? 'đã cho phép' : quyen === 'denied' ? 'bị chặn (mở cài đặt trình duyệt để cho phép)' : quyen === 'khong-ho-tro' ? 'trình duyệt này không hỗ trợ' : 'chưa cho phép'}
        </p>
        {quyen === 'default' && <button type="button" class="nut" onClick={() => void xin()}>Cho phép thông báo</button>}
        <p class="phu">App chỉ nhắc được khi đang mở. Muốn có báo thức khi đóng app, hãy xuất lịch .ics rồi nhập vào lịch điện thoại (xem “Lịch” → Xuất).</p>
      </section>
      <section class="the">
        <h3>Giờ yên lặng & giờ nhắc cố định</h3>
        <Gio nhan="Yên lặng từ" khoa="gioYenLangTu" id="nh-yl-tu" />
        <Gio nhan="Yên lặng đến" khoa="gioYenLangDen" id="nh-yl-den" />
        <Gio nhan="Bản tin buổi sáng" khoa="banTinSang" id="nh-sang" />
        <Gio nhan="Nhắc ghi nhật ký iTNK" khoa="nhatKy" id="nh-nk" />
        <Gio nhan="Nhắc lần 2 nếu chưa ghi nhật ký" khoa="nhatKyBaoThuc" id="nh-nk2" />
        <button type="button" class="nut" onClick={thuNhac}>Thử một nhắc</button>
      </section>
      <section class="the">
        <h3>Tải lịch .ics</h3>
        <p class="phu">Mỗi hạn chưa xong là một sự kiện lúc 07:30 ngày hạn, kèm báo thức trước 2 ngày và 1 ngày.</p>
        <div class="hang-nut">
          <button type="button" class="nut nut-chinh" onClick={() => void xuatIcs({ loai: '30_NGAY' })}>Tải lịch 30 ngày tới</button>
          <button type="button" class="nut" onClick={() => void xuatIcs({ loai: 'TAT_CA' })}>Tải tất cả hạn</button>
        </div>
        <p class="phu">Muốn xuất riêng một cuộc: mở cuộc → ⋯ → Xuất lịch .ics.</p>
      </section>
      <HuongDanLich />
    </div>
  );
}

export function CaiDatGiaoDien() {
  const cd = caiDat.value;
  const chon = (g: 'sang' | 'toi' | 'heThong') => void suaCaiDat((c) => ({ ...c, giaoDien: g })).then(() => apDungGiaoDien(g, caiDat.value.coChuLon));
  return (
    <div>
      <section class="the">
        <h3>Giao diện</h3>
        {([['heThong', 'Theo thiết bị'], ['sang', 'Sáng'], ['toi', 'Tối']] as const).map(([g, ten]) => (
          <label key={g} class="o-tich" style={{ display: 'flex', gap: 8 }}>
            <input type="radio" name="giao-dien" checked={cd.giaoDien === g} onChange={() => chon(g)} />
            <span>{ten}</span>
          </label>
        ))}
        <label class="o-tich" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={!!cd.coChuLon}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).checked;
              void suaCaiDat((c) => ({ ...c, coChuLon: v })).then(() => apDungGiaoDien(caiDat.value.giaoDien, v));
            }}
          />
          <span>Cỡ chữ lớn</span>
        </label>
      </section>
    </div>
  );
}
