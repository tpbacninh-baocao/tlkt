// Màn khóa (UI §4.2): nhập mật mã; sai 5 lần → chờ 30 giây; “Quên mật mã?” giải thích không khôi phục được.
import { useEffect, useRef, useState } from 'preact/hooks';
import { BoChanSai } from '../../data/mat';
import { hoanTatMoKhoa, kho, kho_, trangThaiApp, xacNhan } from '../store';
import { moBang, dongBang } from '../store';

const boChan = new BoChanSai();

export function ManKhoa() {
  const [matMa, setMatMa] = useState('');
  const [loi, setLoi] = useState('');
  const [cho, setCho] = useState(0);
  const [dang, setDang] = useState(false);
  const o = useRef<HTMLInputElement>(null);
  useEffect(() => o.current?.focus(), []);
  useEffect(() => {
    if (cho <= 0) return;
    const t = window.setInterval(() => setCho(boChan.conCho(Date.now())), 500);
    return () => clearInterval(t);
  }, [cho > 0]);

  const mo = async (e: Event) => {
    e.preventDefault();
    const doi = boChan.conCho(Date.now());
    if (doi > 0) {
      setCho(doi);
      return;
    }
    if (!matMa) return;
    setDang(true);
    try {
      const ok = await kho_().moKhoa(matMa);
      if (ok) {
        boChan.thanhCong();
        setMatMa('');
        await hoanTatMoKhoa();
      } else {
        boChan.thatBai(Date.now());
        const d = boChan.conCho(Date.now());
        setCho(d);
        setLoi(d > 0 ? 'Sai 5 lần liên tiếp. Vui lòng chờ rồi thử lại.' : `Mật mã chưa đúng (đã sai ${boChan.lanSaiHienTai()}/5 lần).`);
        setMatMa('');
        o.current?.focus();
      }
    } finally {
      setDang(false);
    }
  };

  const quen = () =>
    moBang({
      id: 'quen-mat-ma',
      tieuDe: 'Quên mật mã?',
      noiDung: () => (
        <div>
          <p>
            Mật mã <b>không thể khôi phục</b>: dữ liệu được mã hóa ngay trên máy này và không ai (kể cả người làm ra ứng dụng) có thể mở nếu không có mật mã.
          </p>
          <p>Bạn có hai cách:</p>
          <ul>
            <li>Nhớ lại mật mã và thử lại (phân biệt chữ hoa/thường).</li>
            <li>
              Xóa dữ liệu trên máy này và bắt đầu lại; sau đó dùng <b>tệp sao lưu</b> (.tlkt.json) để nhập lại dữ liệu cũ.
            </li>
          </ul>
          <div class="hang-nut phai">
            <button type="button" class="nut" onClick={() => dongBang('quen-mat-ma')}>
              Quay lại
            </button>
            <button
              type="button"
              class="nut nut-nguy-hiem"
              onClick={async () => {
                dongBang('quen-mat-ma');
                const dongY = await xacNhan({
                  tieuDe: 'Xóa toàn bộ dữ liệu trên máy này?',
                  moTa: 'Mọi cuộc kiểm tra, việc, cài đặt và mật mã sẽ bị xóa. Việc này không thể hoàn tác. Chỉ làm nếu bạn có tệp sao lưu hoặc chấp nhận mất dữ liệu.',
                  nutChinh: 'Xóa dữ liệu',
                  nguyHiem: true,
                  gocXacNhan: 'XOA',
                });
                if (!dongY) return;
                await kho_().xoaToanBo();
                location.reload();
              }}
            >
              Xóa dữ liệu và bắt đầu lại
            </button>
          </div>
        </div>
      ),
    });

  void kho;
  void trangThaiApp;
  return (
    <main class="man-khoa">
      <form class="the" onSubmit={mo} aria-labelledby="khoa-tieu-de">
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1 id="khoa-tieu-de">Trợ lý Đoàn kiểm tra</h1>
        <p class="phu">Nhập mật mã để mở dữ liệu</p>
        <div class="truong">
          <label for="mat-ma">Mật mã</label>
          <input id="mat-ma" ref={o} type="password" autoComplete="current-password" value={matMa} onInput={(e) => setMatMa((e.target as HTMLInputElement).value)} disabled={cho > 0 || dang} aria-describedby="khoa-loi" />
        </div>
        <div id="khoa-loi" role="alert" class="loi-truong" style={{ minHeight: 22 }}>
          {cho > 0 ? `Chờ ${cho} giây rồi thử lại.` : loi}
        </div>
        <button type="submit" class="nut nut-chinh" style={{ width: '100%' }} disabled={cho > 0 || dang || !matMa}>
          {dang ? 'Đang mở…' : 'Mở'}
        </button>
        <p style={{ marginTop: 16 }}>
          <button type="button" class="nut nut-nhe" onClick={quen}>
            Quên mật mã?
          </button>
        </p>
      </form>
    </main>
  );
}
