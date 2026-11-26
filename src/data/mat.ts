// Mã hóa bằng mật mã: PBKDF2-SHA256 (≥ 210.000 vòng) → AES-GCM 256 (ARCHITECTURE §9).
// Khóa không xuất được (non-extractable), chỉ nằm trong bộ nhớ khi đã mở khóa.

export const SO_VONG_MAC_DINH = 210_000;
export const DO_DAI_MAT_MA_TOI_THIEU = 6;
const CHUOI_KIEM_TRA = 'TLKT-KIEM-TRA-MAT-MA';

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface GoiMaHoa {
  iv: string; // base64
  ct: string; // base64
}

export interface CauHinhMatMa {
  salt: string; // base64
  soVong: number;
  kiemTra: GoiMaHoa;
}

export function sangBase64(b: Uint8Array | ArrayBuffer): string {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
}

export function tuBase64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

function nganNgau(n: number): Uint8Array<ArrayBuffer> {
  const u = new Uint8Array(n);
  crypto.getRandomValues(u);
  return u;
}

/** Suy ra khóa AES-GCM 256 từ mật mã. */
export async function suyRaKhoa(matMa: string, salt: Uint8Array<ArrayBuffer>, soVong: number): Promise<CryptoKey> {
  const goc = await crypto.subtle.importKey('raw', enc.encode(matMa), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: soVong },
    goc,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function maHoa(khoa: CryptoKey, giaTri: unknown): Promise<GoiMaHoa> {
  const iv = nganNgau(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, khoa, enc.encode(JSON.stringify(giaTri)));
  return { iv: sangBase64(iv), ct: sangBase64(ct) };
}

/** Giải mã; ném lỗi nếu sai khóa hoặc dữ liệu bị sửa (AES-GCM có xác thực). */
export async function giaiMa<T>(khoa: CryptoKey, goi: GoiMaHoa): Promise<T> {
  const thuan = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: tuBase64(goi.iv) }, khoa, tuBase64(goi.ct));
  return JSON.parse(dec.decode(thuan)) as T;
}

export function laGoiMaHoa(x: unknown): x is GoiMaHoa {
  return typeof x === 'object' && x !== null && typeof (x as GoiMaHoa).iv === 'string' && typeof (x as GoiMaHoa).ct === 'string';
}

export function kiemTraDoDaiMatMa(matMa: string): string | undefined {
  return matMa.length < DO_DAI_MAT_MA_TOI_THIEU ? `Mật mã cần từ ${DO_DAI_MAT_MA_TOI_THIEU} ký tự trở lên.` : undefined;
}

/** Tạo cấu hình mật mã mới (salt ngẫu nhiên) + khóa. */
export async function taoCauHinhMatMa(matMa: string, soVong = SO_VONG_MAC_DINH): Promise<{ cauHinh: CauHinhMatMa; khoa: CryptoKey }> {
  const loi = kiemTraDoDaiMatMa(matMa);
  if (loi) throw new Error(loi);
  if (soVong < SO_VONG_MAC_DINH) throw new Error(`Số vòng PBKDF2 tối thiểu là ${SO_VONG_MAC_DINH}.`);
  const salt = nganNgau(16);
  const khoa = await suyRaKhoa(matMa, salt, soVong);
  const kiemTra = await maHoa(khoa, CHUOI_KIEM_TRA);
  return { cauHinh: { salt: sangBase64(salt), soVong, kiemTra }, khoa };
}

/** Mở khóa: đúng mật mã → CryptoKey, sai → null. */
export async function moKhoaBangMatMa(matMa: string, cauHinh: CauHinhMatMa): Promise<CryptoKey | null> {
  try {
    const khoa = await suyRaKhoa(matMa, tuBase64(cauHinh.salt), cauHinh.soVong);
    const v = await giaiMa<string>(khoa, cauHinh.kiemTra);
    return v === CHUOI_KIEM_TRA ? khoa : null;
  } catch {
    return null;
  }
}

// ---------- Chống đoán mật mã: sai 5 lần → chờ 30 giây ----------
export class BoChanSai {
  private soLanSai = 0;
  private khoaDen = 0;
  constructor(
    private toiDa = 5,
    private choGiay = 30,
  ) {}

  /** Còn phải chờ bao nhiêu giây (0 = được thử). `bayGioMs`: Date.now() */
  conCho(bayGioMs: number): number {
    return Math.max(0, Math.ceil((this.khoaDen - bayGioMs) / 1000));
  }

  thatBai(bayGioMs: number): void {
    this.soLanSai++;
    if (this.soLanSai >= this.toiDa) {
      this.khoaDen = bayGioMs + this.choGiay * 1000;
      this.soLanSai = 0;
    }
  }

  thanhCong(): void {
    this.soLanSai = 0;
    this.khoaDen = 0;
  }

  lanSaiHienTai(): number {
    return this.soLanSai;
  }
}

// ---------- Khóa tự động ----------
/**
 * Khóa app sau `phut` phút không thao tác, hoặc khi tab bị ẩn quá `phut` phút.
 * Thuần logic (nhận thời gian vào) để kiểm thử; giao diện gọi hoatDong()/anTab()/hienTab()/kiemTra() theo sự kiện.
 */
export class KhoaTuDong {
  private lanCuoi: number;
  private lucAn: number | null = null;
  constructor(
    private phut: number,
    batDauMs: number,
  ) {
    this.lanCuoi = batDauMs;
  }

  datPhut(phut: number): void {
    this.phut = phut;
  }

  hoatDong(bayGioMs: number): void {
    this.lanCuoi = bayGioMs;
  }

  anTab(bayGioMs: number): void {
    this.lucAn = bayGioMs;
  }

  /** Trả về true nếu cần khóa ngay khi tab hiện lại. */
  hienTab(bayGioMs: number): boolean {
    const an = this.lucAn;
    this.lucAn = null;
    if (this.phut <= 0) return false;
    if (an !== null && bayGioMs - an >= this.phut * 60_000) return true;
    return this.kiemTra(bayGioMs);
  }

  /** Quá `phut` phút kể từ thao tác cuối? (phut = 0: không tự khóa) */
  kiemTra(bayGioMs: number): boolean {
    return this.phut > 0 && bayGioMs - this.lanCuoi >= this.phut * 60_000;
  }
}
