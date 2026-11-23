// Nhập bằng giọng nói tiếng Việt qua Web Speech API (nếu trình duyệt có; không có thì ẩn nút).
interface KetQuaNhanDang {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface BoNhanDang {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: KetQuaNhanDang) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type HamTaoNhanDang = new () => BoNhanDang;

function layHamTao(): HamTaoNhanDang | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: HamTaoNhanDang; webkitSpeechRecognition?: HamTaoNhanDang };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function coHoTroGiongNoi(): boolean {
  return !!layHamTao();
}

export interface PhienGiongNoi {
  dung(): void;
}

/** Bắt đầu nghe; `khiCoChu` được gọi nhiều lần với văn bản đang nhận; `khiKetThuc(loi?)` khi dừng. */
export function nghe(khiCoChu: (chu: string, xong: boolean) => void, khiKetThuc: (loi?: string) => void): PhienGiongNoi | null {
  const Ham = layHamTao();
  if (!Ham) return null;
  const r = new Ham();
  r.lang = 'vi-VN';
  r.interimResults = true;
  r.continuous = false;
  let loi: string | undefined;
  r.onresult = (e) => {
    let chu = '';
    let xong = false;
    for (let i = 0; i < e.results.length; i++) {
      chu += e.results[i][0].transcript;
      xong = e.results[i].isFinal;
    }
    khiCoChu(chu, xong);
  };
  r.onerror = (e) => {
    loi = e.error;
  };
  r.onend = () => khiKetThuc(loi);
  try {
    r.start();
  } catch {
    khiKetThuc('khong-bat-dau-duoc');
    return null;
  }
  return { dung: () => r.stop() };
}

export function thongBaoLoiGiongNoi(loi?: string): string | undefined {
  switch (loi) {
    case undefined:
    case 'no-speech':
    case 'aborted':
      return undefined;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Chưa cho phép dùng micro. Hãy cấp quyền micro cho trình duyệt.';
    case 'network':
      return 'Nhập giọng nói cần kết nối mạng (do trình duyệt cung cấp).';
    default:
      return 'Không nhận dạng được giọng nói.';
  }
}
