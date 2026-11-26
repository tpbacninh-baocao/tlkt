// Cài đặt → Sao lưu & dữ liệu: xuất/khôi phục, dữ liệu mẫu, thùng rác, xóa toàn bộ.
import { useEffect, useState } from 'preact/hooks';
import { dinhDangNgay } from '../../core/lich';
import { coDuLieuMau, themDuLieuMau, xoaDuLieuMau } from '../../data/mau';
import { docTepSaoLuu, nhapSaoLuu, tepCanMatMa, xuatSaoLuu, LoiSaoLuu, type CheDoNhap } from '../../data/saoLuu';
import { bayGio, caiDat, homNay, kho_, lich, napDuLieu, saoLuuCuoi, toast, xacNhan, hoanTatMoKhoa } from '../store';
import { Truong } from '../thanhPhan';
import { taiXuong } from '../xuat';

export function CaiDatSaoLuu() {
  const [coMau, setCoMau] = useState(false);
  const [ban, setBan] = useState(false);
  const [tep, setTep] = useState<{ ten: string; text: string; canMatMa: boolean } | null>(null);
  const [cheDo, setCheDo] = useState<CheDoNhap>('GOP');
  const [matMa, setMatMa] = useState('');
  const [loi, setLoi] = useState('');
  const lamMoiMau = () => void coDuLieuMau(kho_()).then(setCoMau);
  useEffect(lamMoiMau, []);

  const sao = async () => {
    setBan(true);
    try {
      const r = await xuatSaoLuu(kho_(), homNay.value, bayGio.value);
      taiXuong(r.tenTep, r.noiDung, 'application/json');
      saoLuuCuoi.value = homNay.value;
      toast('Đã tải tệp sao lưu. Hãy cất tệp ở nơi an toàn (USB, Google Drive cá nhân…)');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không sao lưu được', 'loi');
    } finally {
      setBan(false);
    }
  };

  const chonTep = async (f: File | undefined) => {
    setLoi('');
    setTep(null);
    if (!f) return;
    try {
      const text = await f.text();
      const goi = docTepSaoLuu(text);
      setTep({ ten: f.name, text, canMatMa: tepCanMatMa(goi) });
    } catch (e) {
      setLoi(e instanceof LoiSaoLuu ? e.message : 'Không đọc được tệp.');
    }
  };

  const khoiPhuc = async () => {
    if (!tep) return;
    if (cheDo === 'THAY_THE' && !(await xacNhan({ tieuDe: 'Thay thế toàn bộ dữ liệu?', moTa: 'Dữ liệu hiện có trên thiết bị sẽ bị xóa và thay bằng nội dung tệp.', nutChinh: 'Thay thế', nguyHiem: true }))) return;
    setBan(true);
    setLoi('');
    try {
      const bc = await nhapSaoLuu(kho_(), tep.text, cheDo, bayGio.value, tep.canMatMa ? matMa : undefined);
      await napDuLieu();
      setTep(null);
      setMatMa('');
      toast(`Đã khôi phục: thêm ${bc.them}, cập nhật ${bc.capNhat}, giữ nguyên ${bc.giuNguyen}${bc.boQua ? `, bỏ qua ${bc.boQua} bản ghi lỗi` : ''}`);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không khôi phục được.');
    } finally {
      setBan(false);
    }
  };

  const ngayCuoi = saoLuuCuoi.value;

  return (
    <div>
      <section class="the">
        <h3>Sao lưu</h3>
        <p class="phu">
          Lần sao lưu gần nhất: <b>{ngayCuoi ? dinhDangNgay(ngayCuoi) : 'chưa có'}</b>. Nên sao lưu mỗi tuần – xóa dữ liệu trình duyệt sẽ mất hết nếu chưa sao lưu.
          {kho_().daMaHoa() ? ' Tệp sao lưu được mã hóa bằng mật mã hiện tại.' : ''}
        </p>
        <button type="button" class="nut nut-chinh" disabled={ban} onClick={() => void sao()}>Tải tệp sao lưu</button>
      </section>

      <section class="the">
        <h3>Khôi phục từ tệp</h3>
        <Truong nhan="Chọn tệp .tlkt.json" id="kp-tep">
          <input id="kp-tep" type="file" accept=".json,application/json" onChange={(e) => void chonTep((e.target as HTMLInputElement).files?.[0])} />
        </Truong>
        {tep && (
          <div>
            <p class="phu">Tệp: {tep.ten}</p>
            <label class="o-tich" style={{ display: 'flex', gap: 8 }}>
              <input type="radio" name="kp-che-do" checked={cheDo === 'GOP'} onChange={() => setCheDo('GOP')} />
              <span><b>Gộp</b> – giữ dữ liệu hiện có, thêm mục mới và lấy bản sửa mới hơn</span>
            </label>
            <label class="o-tich" style={{ display: 'flex', gap: 8 }}>
              <input type="radio" name="kp-che-do" checked={cheDo === 'THAY_THE'} onChange={() => setCheDo('THAY_THE')} />
              <span><b>Thay thế</b> – xóa dữ liệu hiện có, dùng đúng nội dung tệp</span>
            </label>
            {tep.canMatMa && (
              <Truong nhan="Mật mã của tệp sao lưu" id="kp-mm"><input id="kp-mm" type="password" value={matMa} onInput={(e) => setMatMa((e.target as HTMLInputElement).value)} /></Truong>
            )}
            <button type="button" class="nut nut-chinh" disabled={ban || (tep.canMatMa && !matMa)} onClick={() => void khoiPhuc()}>{ban ? 'Đang khôi phục…' : 'Khôi phục'}</button>
          </div>
        )}
        {loi && <p class="loi-truong" role="alert">{loi}</p>}
      </section>

      <section class="the">
        <h3>Dữ liệu mẫu</h3>
        <p class="phu">Một số cuộc kiểm tra và việc mẫu (MST giả 0100000xxx) để làm quen với app. Có thể xóa riêng mà không ảnh hưởng dữ liệu thật.</p>
        <div class="hang-nut">
          <button type="button" class="nut" disabled={ban} onClick={async () => {
            const r = await themDuLieuMau(kho_(), homNay.value, lich.value, bayGio.value, caiDat.value);
            await napDuLieu();
            lamMoiMau();
            toast(`Đã thêm ${r.soCuoc} cuộc và ${r.soViec} việc mẫu`);
          }}>Thêm dữ liệu mẫu</button>
          <button type="button" class="nut" disabled={ban || !coMau} onClick={async () => {
            if (!(await xacNhan({ tieuDe: 'Xóa dữ liệu mẫu?', moTa: 'Chỉ xóa các mục mẫu, dữ liệu bạn nhập vẫn giữ nguyên.', nutChinh: 'Xóa dữ liệu mẫu' }))) return;
            const n = await xoaDuLieuMau(kho_(), bayGio.value);
            await napDuLieu();
            lamMoiMau();
            toast(`Đã xóa ${n} mục mẫu`);
          }}>Xóa dữ liệu mẫu</button>
        </div>
      </section>

      <section class="the">
        <h3>Thùng rác</h3>
        <p class="phu">Cuộc và việc đã xóa được giữ 30 ngày trước khi xóa hẳn.</p>
        <a class="nut" href="#thung-rac">Mở thùng rác</a>
      </section>

      <section class="the nguy-hiem">
        <h3>Xóa toàn bộ dữ liệu</h3>
        <p class="phu">Xóa sạch cuộc, việc, kế hoạch, cài đặt và mật mã trên thiết bị này. Không thể hoàn tác – hãy sao lưu trước.</p>
        <button type="button" class="nut nut-nguy-hiem" disabled={ban} onClick={async () => {
          if (!(await xacNhan({ tieuDe: 'Xóa toàn bộ dữ liệu?', moTa: 'Mọi dữ liệu trên thiết bị này sẽ bị xóa vĩnh viễn.', nutChinh: 'Tiếp tục', nguyHiem: true }))) return;
          if (!(await xacNhan({ tieuDe: 'Xác nhận lần cuối', moTa: 'Gõ XOA để xác nhận xóa sạch dữ liệu.', nutChinh: 'Xóa sạch', nguyHiem: true, gocXacNhan: 'XOA' }))) return;
          await kho_().xoaToanBo();
          await hoanTatMoKhoa();
          toast('Đã xóa toàn bộ dữ liệu');
        }}>Xóa toàn bộ dữ liệu…</button>
      </section>
    </div>
  );
}
