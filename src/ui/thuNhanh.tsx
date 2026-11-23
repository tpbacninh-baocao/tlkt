// Nút nổi “Thu nhanh”: gõ (hoặc nói) một dòng, app tự nhận diện hạn (“thứ Sáu tuần sau”, “trước 15/12”, “sau 3 ngày làm việc”).
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CongViec, NgayISO } from '../core/kieu';
import { nhanDienHan } from '../core/viec';
import { coHoTroGiongNoi, nghe, thongBaoLoiGiongNoi, type PhienGiongNoi } from './giongNoi';
import { luuViec } from './hanhDong';
import { bayGio, homNay, lich, moBang, dongBang, toast } from './store';
import { chuNgay } from './thanhPhan';
import { moFormCuoc } from './man/themCuoc';

export function taoViecMoi(tieuDe: string, han: NgayISO | undefined, them: Partial<CongViec> = {}): CongViec {
  return {
    id: crypto.randomUUID(),
    tieuDe,
    nguon: 'TU_DAT',
    han,
    viecCon: [],
    taoLuc: bayGio.value,
    suaLuc: bayGio.value,
    ...them,
  };
}

export function OThuNhanh({ khiThem, tuNhan = false }: { khiThem?: (v: CongViec) => void; tuNhan?: boolean }) {
  const [chu, setChu] = useState('');
  const [bo, setBo] = useState(false); // người dùng đã bỏ hạn nhận diện
  const [dangNghe, setDangNghe] = useState(false);
  const phien = useRef<PhienGiongNoi | null>(null);
  useEffect(() => () => phien.current?.dung(), []);

  const kq = chu.trim() ? nhanDienHan(chu, homNay.value, lich.value) : undefined;
  const han = bo ? undefined : kq?.han;
  const tieuDe = (kq?.han && !bo ? kq.phanConLai : chu).trim();

  const them = async () => {
    if (!tieuDe) return;
    const v = await luuViec(taoViecMoi(tieuDe, han));
    toast(han ? `Đã thêm việc – hạn ${chuNgay(han)}` : 'Đã thêm vào Hộp thu');
    setChu('');
    setBo(false);
    khiThem?.(v);
  };

  const batGiongNoi = () => {
    if (dangNghe) {
      phien.current?.dung();
      return;
    }
    setDangNghe(true);
    phien.current = nghe(
      (c) => {
        setChu(c);
        setBo(false);
      },
      (loi) => {
        setDangNghe(false);
        const t = thongBaoLoiGiongNoi(loi);
        if (t) toast(t, 'loi');
      },
    );
    if (!phien.current) setDangNghe(false);
  };

  return (
    <div>
      <div class="hang" style={{ alignItems: 'flex-end' }}>
        <div class="truong" style={{ marginBottom: 0 }}>
          <label for="thu-nhanh">Việc cần làm</label>
          <input
            id="thu-nhanh"
            type="text"
            value={chu}
            autoFocus={tuNhan}
            placeholder="Ví dụ: trả lời văn bản 123 trước 15/12"
            onInput={(e) => {
              setChu((e.target as HTMLInputElement).value);
              setBo(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && void them()}
          />
        </div>
        {coHoTroGiongNoi() && (
          <button type="button" class={`nut ${dangNghe ? 'nut-chinh' : ''}`} aria-pressed={dangNghe} aria-label={dangNghe ? 'Đang nghe – bấm để dừng' : 'Nhập bằng giọng nói'} onClick={batGiongNoi}>
            🎤
          </button>
        )}
        <button type="button" class="nut nut-chinh" disabled={!tieuDe} onClick={() => void them()}>
          Thêm
        </button>
      </div>
      {han && (
        <p style={{ marginTop: 8 }}>
          <span class="nhan nhan-vang">
            Hạn: {chuNgay(han)}
            <button type="button" class="nut-bieu-tuong" style={{ minWidth: 28, minHeight: 28, fontSize: 14 }} aria-label="Bỏ hạn nhận diện" onClick={() => setBo(true)}>
              ✕
            </button>
          </span>
        </p>
      )}
      {!han && chu.trim() && <p class="phu" style={{ marginTop: 8 }}>Không có hạn – việc sẽ vào Hộp thu.</p>}
    </div>
  );
}

export function moThuNhanh(): void {
  moBang({
    id: 'thu-nhanh',
    tieuDe: 'Thu nhanh',
    noiDung: () => (
      <div>
        <OThuNhanh tuNhan />
        <hr style={{ border: 0, borderTop: '1px solid var(--vien)', margin: '16px 0' }} />
        <div class="hang-nut">
          <button
            type="button"
            class="nut"
            onClick={() => {
              dongBang('thu-nhanh');
              moFormCuoc();
            }}
          >
            📁 Thêm cuộc kiểm tra
          </button>
        </div>
      </div>
    ),
  });
}
