// Cài đặt → Bảo mật: mật mã (AES-GCM), khóa tự động, ẩn danh.
import { useState } from 'preact/hooks';
import { kiemTraDoDaiMatMa } from '../../data/mat';
import { suaCaiDat } from '../hanhDong';
import { caiDat, kho_, kho, phienMatMa, toast, xacNhan, napDuLieu } from '../store';
import { Truong } from '../thanhPhan';

export function CaiDatBaoMat() {
  void phienMatMa.value;
  const k = kho.value;
  const coMatMa = k?.daMaHoa() ?? false;
  const [cu, setCu] = useState('');
  const [moi, setMoi] = useState('');
  const [lai, setLai] = useState('');
  const [loi, setLoi] = useState('');
  const [ban, setBan] = useState(false);

  const lamMoi = () => {
    setCu(''); setMoi(''); setLai(''); setLoi('');
    phienMatMa.value++;
  };
  const kiem = (): string => {
    const e = kiemTraDoDaiMatMa(moi);
    if (e) return e;
    if (moi !== lai) return 'Hai lần nhập mật mã chưa khớp.';
    return '';
  };
  const chay = async (f: () => Promise<string | void>) => {
    setBan(true);
    setLoi('');
    try {
      const r = await f();
      if (r) setLoi(r);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
    } finally {
      setBan(false);
    }
  };

  const dat = () => chay(async () => {
    const e = kiem();
    if (e) return e;
    if (!(await xacNhan({ tieuDe: 'Đặt mật mã?', moTa: 'Mật mã không thể khôi phục. Nếu quên, dữ liệu trên thiết bị này sẽ không mở lại được – chỉ còn cách khôi phục từ tệp sao lưu.', nutChinh: 'Đặt mật mã' }))) return;
    await kho_().datMatMa(moi);
    await napDuLieu();
    toast('Đã bật mật mã – dữ liệu được mã hóa');
    lamMoi();
  });
  const doi = () => chay(async () => {
    const e = kiem();
    if (e) return e;
    const ok = await kho_().doiMatMa(cu, moi);
    if (!ok) return 'Mật mã hiện tại không đúng.';
    toast('Đã đổi mật mã');
    lamMoi();
  });
  const tat = () => chay(async () => {
    if (!cu) return 'Nhập mật mã hiện tại để tắt.';
    if (!(await xacNhan({ tieuDe: 'Tắt mật mã?', moTa: 'Dữ liệu sẽ được lưu không mã hóa trên thiết bị này.', nutChinh: 'Tắt mật mã', nguyHiem: true }))) return;
    const ok = await kho_().tatMatMa(cu);
    if (!ok) return 'Mật mã hiện tại không đúng.';
    toast('Đã tắt mật mã');
    lamMoi();
  });

  return (
    <div>
      <section class="the">
        <h3>Mật mã bảo vệ dữ liệu</h3>
        <p class="phu">
          Dữ liệu chỉ nằm trong trình duyệt của thiết bị này, không gửi đi đâu. {coMatMa ? 'Mật mã đang BẬT – dữ liệu được mã hóa (AES-256).' : 'Mật mã đang TẮT – nên bật nếu dùng máy chung.'}
        </p>
        {coMatMa && (
          <Truong nhan="Mật mã hiện tại" id="mm-cu"><input id="mm-cu" type="password" autocomplete="current-password" value={cu} onInput={(e) => setCu((e.target as HTMLInputElement).value)} /></Truong>
        )}
        <Truong nhan={coMatMa ? 'Mật mã mới' : 'Mật mã (tối thiểu 6 ký tự)'} id="mm-moi"><input id="mm-moi" type="password" autocomplete="new-password" value={moi} onInput={(e) => setMoi((e.target as HTMLInputElement).value)} /></Truong>
        <Truong nhan="Nhập lại mật mã" id="mm-lai"><input id="mm-lai" type="password" autocomplete="new-password" value={lai} onInput={(e) => setLai((e.target as HTMLInputElement).value)} /></Truong>
        {loi && <p class="loi-truong" role="alert">{loi}</p>}
        <div class="hang-nut">
          {!coMatMa && <button type="button" class="nut nut-chinh" disabled={ban || !moi} onClick={() => void dat()}>{ban ? 'Đang mã hóa…' : 'Đặt mật mã'}</button>}
          {coMatMa && <button type="button" class="nut nut-chinh" disabled={ban || !cu || !moi} onClick={() => void doi()}>{ban ? 'Đang xử lý…' : 'Đổi mật mã'}</button>}
          {coMatMa && <button type="button" class="nut" disabled={ban || !cu} onClick={() => void tat()}>Tắt mật mã</button>}
        </div>
      </section>

      {coMatMa && (
        <section class="the">
          <h3>Khóa tự động</h3>
          <Truong nhan="Tự khóa sau (phút không thao tác; 0 = không tự khóa)" id="mm-khoa">
            <input id="mm-khoa" type="number" min={0} max={240} value={caiDat.value.khoaTuDongPhut} onChange={(e) => { const v = Math.max(0, Math.min(240, Number((e.target as HTMLInputElement).value) || 0)); void suaCaiDat((c) => ({ ...c, khoaTuDongPhut: v })); }} />
          </Truong>
        </section>
      )}

      <section class="the">
        <h3>Ẩn danh khi sao chép</h3>
        <label class="o-tich" style={{ display: 'flex', gap: 8 }}>
          <input type="checkbox" checked={caiDat.value.anDanh} onChange={(e) => void suaCaiDat((c) => ({ ...c, anDanh: (e.target as HTMLInputElement).checked }))} />
          <span>Che MST và tên người nộp thuế trong nội dung sao chép/chia sẻ (hiện “Cuộc 03”…)</span>
        </label>
      </section>
    </div>
  );
}
