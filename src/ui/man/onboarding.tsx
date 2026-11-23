// Lần đầu mở (UI §4.1) – 4 bước, bỏ qua được.
import { useState } from 'preact/hooks';
import { namChuaXacNhanNgayNghi } from '../../core/lich';
import { themDuLieuMau } from '../../data/mau';
import { kiemTraDoDaiMatMa } from '../../data/mat';
import { FormNgayNghiNam } from '../ngayNghiForm';
import { dongBoViecMauUI, suaCaiDat } from '../hanhDong';
import { bayGio, caiDat, diDen, homNay, kho_, lich, moBang, napDuLieu, toast, trangThaiApp } from '../store';
import { Truong } from '../thanhPhan';
import { moFormCuoc } from './themCuoc';
import { moNhapKeHoach } from './nhapExcel';

type Buoc = 1 | 2 | 3 | 4;

export function Onboarding() {
  const [buoc, setBuoc] = useState<Buoc>(1);
  const cd0 = caiDat.value;
  const [hoTen, setHoTen] = useState(cd0.canBo.hoTen);
  const [chucVu, setChucVu] = useState(cd0.canBo.chucVu ?? '');
  const [donVi, setDonVi] = useState(cd0.canBo.donVi);
  const [gio, setGio] = useState({ s1: cd0.gioLamViec[0][0], s2: cd0.gioLamViec[0][1], c1: cd0.gioLamViec[1][0], c2: cd0.gioLamViec[1][1] });
  const [matMa, setMatMa] = useState('');
  const [lai, setLai] = useState('');
  const [anDanh, setAnDanh] = useState(true);
  const [dang, setDang] = useState(false);
  const nam = Number(homNay.value.slice(0, 4));
  // đọc caiDat.value để cập nhật khi người dùng vừa nhập lịch nghỉ
  const chuaXacNhan = namChuaXacNhanNgayNghi(caiDat.value, nam, Number(homNay.value.slice(5, 7)));

  const luuBuoc1 = () => suaCaiDat((c) => ({ ...c, canBo: { hoTen: hoTen.trim(), chucVu: chucVu.trim(), donVi: donVi.trim() } }));
  const luuBuoc2 = () => suaCaiDat((c) => ({ ...c, gioLamViec: [[gio.s1, gio.s2], [gio.c1, gio.c2]] }));

  const loiMatMa = matMa ? kiemTraDoDaiMatMa(matMa) ?? (matMa !== lai ? 'Hai ô mật mã chưa giống nhau.' : undefined) : undefined;

  const ketThuc = async (viec: 'THEM_CUOC' | 'EXCEL' | 'MAU' | 'TRONG') => {
    setDang(true);
    try {
      await suaCaiDat((c) => ({ ...c, anDanh: buoc >= 3 ? anDanh : c.anDanh, coDaOnboarding: true }));
      if (matMa && !loiMatMa && !kho_().daMaHoa()) await kho_().datMatMa(matMa);
      if (viec === 'MAU') {
        const r = await themDuLieuMau(kho_(), homNay.value, lich.value, bayGio.value, caiDat.value);
        toast(`Đã thêm dữ liệu mẫu: ${r.soCuoc} cuộc, ${r.soViec} việc`);
        await napDuLieu();
      }
      await dongBoViecMauUI();
      trangThaiApp.value = 'SAN_SANG';
      if (viec === 'THEM_CUOC') {
        diDen('#cuoc');
        moFormCuoc();
      } else if (viec === 'EXCEL') {
        diDen('#cuoc');
        moNhapKeHoach();
      } else diDen('#hom-nay');
    } catch (e) {
      toast(`Không hoàn tất được: ${e instanceof Error ? e.message : e}`, 'loi');
    } finally {
      setDang(false);
    }
  };

  const bo = async () => {
    await ketThuc('TRONG');
  };

  const tiep = async () => {
    if (buoc === 1) await luuBuoc1();
    if (buoc === 2) await luuBuoc2();
    if (buoc < 4) setBuoc((buoc + 1) as Buoc);
  };

  return (
    <main class="onboarding">
      <div class="hop">
        <div class="hang-nut" style={{ justifyContent: 'space-between' }}>
          <span class="phu">Bước {buoc}/4</span>
          <button type="button" class="nut nut-nhe" onClick={() => void bo()} disabled={dang}>
            Bỏ qua, dùng ngay
          </button>
        </div>
        <div class="buoc" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <i key={i} class={i <= buoc ? 'da' : ''} />
          ))}
        </div>

        {buoc === 1 && (
          <section class="the" aria-labelledby="ob1">
            <h1 id="ob1">Chào bạn, mình là Trợ lý Đoàn kiểm tra</h1>
            <p>Mình giúp bạn theo dõi mọi mốc thời hạn của cuộc kiểm tra và nhắc đúng lúc. Trước hết, cho mình biết đôi chút:</p>
            <Truong nhan="Họ và tên cán bộ" id="ob-ten">
              <input id="ob-ten" type="text" autoComplete="name" value={hoTen} onInput={(e) => setHoTen((e.target as HTMLInputElement).value)} />
            </Truong>
            <Truong nhan="Chức vụ" id="ob-cv">
              <input id="ob-cv" type="text" value={chucVu} onInput={(e) => setChucVu((e.target as HTMLInputElement).value)} />
            </Truong>
            <Truong nhan="Đơn vị (Phòng/Tổ Kiểm tra…)" id="ob-dv">
              <input id="ob-dv" type="text" value={donVi} onInput={(e) => setDonVi((e.target as HTMLInputElement).value)} />
            </Truong>
          </section>
        )}

        {buoc === 2 && (
          <section class="the" aria-labelledby="ob2">
            <h1 id="ob2">Giờ làm việc và lịch nghỉ</h1>
            <p class="phu">Dùng để tính ngày làm việc và đồng hồ “06 giờ làm việc” khi yêu cầu NNT cung cấp tài liệu.</p>
            <div class="hang">
              <Truong nhan="Sáng từ" id="g-s1"><input id="g-s1" type="time" value={gio.s1} onInput={(e) => setGio({ ...gio, s1: (e.target as HTMLInputElement).value })} /></Truong>
              <Truong nhan="đến" id="g-s2"><input id="g-s2" type="time" value={gio.s2} onInput={(e) => setGio({ ...gio, s2: (e.target as HTMLInputElement).value })} /></Truong>
            </div>
            <div class="hang">
              <Truong nhan="Chiều từ" id="g-c1"><input id="g-c1" type="time" value={gio.c1} onInput={(e) => setGio({ ...gio, c1: (e.target as HTMLInputElement).value })} /></Truong>
              <Truong nhan="đến" id="g-c2"><input id="g-c2" type="time" value={gio.c2} onInput={(e) => setGio({ ...gio, c2: (e.target as HTMLInputElement).value })} /></Truong>
            </div>
            {chuaXacNhan.map((n) => (
              <div key={n} class="the canh-bao" style={{ marginTop: 12 }}>
                <p class="dam">Chưa nhập lịch nghỉ Tết {n}</p>
                <p>Ngày nghỉ Tết, Giỗ Tổ và nghỉ bù thay đổi mỗi năm nên cần bạn nhập để hạn được tính đúng.</p>
                <div class="hang-nut">
                  <button
                    type="button"
                    class="nut nut-chinh"
                    onClick={() => moBang({ id: `ngay-nghi-${n}`, tieuDe: `Lịch nghỉ năm ${n}`, noiDung: () => <FormNgayNghiNam nam={n} idBang={`ngay-nghi-${n}`} /> })}
                  >
                    Nhập ngay
                  </button>
                  <span class="phu">hoặc để sau (nhắc lại ở Cài đặt)</span>
                </div>
              </div>
            ))}
            {chuaXacNhan.length === 0 && <p class="the thanh-cong" style={{ marginTop: 12 }}>✓ Đã nhập lịch nghỉ năm {nam} và {nam + 1}.</p>}
          </section>
        )}

        {buoc === 3 && (
          <section class="the" aria-labelledby="ob3">
            <h1 id="ob3">Bảo mật dữ liệu</h1>
            <p>Dữ liệu chỉ nằm trên thiết bị này, không gửi đi đâu. Nên đặt mật mã để mã hóa.</p>
            <Truong nhan="Mật mã (từ 6 ký tự, để trống nếu chưa muốn đặt)" id="ob-mm" loi={loiMatMa && matMa.length < 6 ? loiMatMa : undefined}>
              <input id="ob-mm" type="password" autoComplete="new-password" value={matMa} onInput={(e) => setMatMa((e.target as HTMLInputElement).value)} />
            </Truong>
            {matMa && (
              <Truong nhan="Nhập lại mật mã" id="ob-mm2" loi={matMa.length >= 6 ? loiMatMa : undefined}>
                <input id="ob-mm2" type="password" autoComplete="new-password" value={lai} onInput={(e) => setLai((e.target as HTMLInputElement).value)} />
              </Truong>
            )}
            {matMa && (
              <p class="the canh-bao">
                ⚠ <b>Quên mật mã = mất toàn bộ dữ liệu</b> (không có cách khôi phục). Hãy ghi nhớ và thường xuyên sao lưu ra tệp.
              </p>
            )}
            <label class="o-tich">
              <input type="checkbox" checked={anDanh} onChange={(e) => setAnDanh((e.target as HTMLInputElement).checked)} />
              <span>Ẩn danh trong thông báo (chỉ hiện “KT …1234”, không hiện tên người nộp thuế)</span>
            </label>
          </section>
        )}

        {buoc === 4 && (
          <section aria-labelledby="ob4">
            <h1 id="ob4" style={{ marginBottom: 12 }}>Bắt đầu thôi!</h1>
            <button type="button" class="chon-lon" disabled={dang || !!loiMatMa} onClick={() => void ketThuc('THEM_CUOC')}>
              <span class="bt" aria-hidden="true">📁</span>
              <span><b>Thêm cuộc kiểm tra đầu tiên</b><br /><span class="phu">Nhập MST, loại cuộc, ngày nhận phân công…</span></span>
            </button>
            <button type="button" class="chon-lon" disabled={dang || !!loiMatMa} onClick={() => void ketThuc('EXCEL')}>
              <span class="bt" aria-hidden="true">📊</span>
              <span><b>Nhập kế hoạch từ Excel</b><br /><span class="phu">Danh sách NNT theo mẫu 06/QTKT-TC</span></span>
            </button>
            <button type="button" class="chon-lon" disabled={dang || !!loiMatMa} onClick={() => void ketThuc('MAU')}>
              <span class="bt" aria-hidden="true">🧪</span>
              <span><b>Dùng dữ liệu mẫu để xem thử</b><br /><span class="phu">6 cuộc ở các giai đoạn khác nhau; xóa riêng được trong Cài đặt</span></span>
            </button>
            <button type="button" class="chon-lon" disabled={dang || !!loiMatMa} onClick={() => void ketThuc('TRONG')}>
              <span class="bt" aria-hidden="true">🚀</span>
              <span><b>Vào luôn</b><br /><span class="phu">Bắt đầu với màn hình trống</span></span>
            </button>
            {loiMatMa && <p class="loi-truong">{loiMatMa} Quay lại bước 3 để sửa.</p>}
          </section>
        )}

        <div class="hang-nut" style={{ justifyContent: 'space-between', marginTop: 16 }}>
          <button type="button" class="nut" onClick={() => setBuoc((buoc - 1) as Buoc)} disabled={buoc === 1 || dang}>
            ‹ Quay lại
          </button>
          {buoc < 4 && (
            <button type="button" class="nut nut-chinh" onClick={() => void tiep()} disabled={dang || (buoc === 3 && !!loiMatMa)}>
              Tiếp ›
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
