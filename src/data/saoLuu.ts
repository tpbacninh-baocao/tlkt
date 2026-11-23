// Sao lưu / khôi phục bằng tệp `.tlkt.json` (ARCHITECTURE §9): mã hóa nếu đã bật mật mã; nhập Thay thế hoặc Gộp theo `suaLuc`.
import type { NgayGio, NgayISO } from '../core/kieu';
import { chuanHoaCuoc, chuanHoaKeHoach, chuanHoaViec } from './chuanHoa';
import type { Kho } from './kho';
import { giaiMa, moKhoaBangMatMa, type CauHinhMatMa, type GoiMaHoa } from './mat';

export const DINH_DANG_SAO_LUU = 'tlkt-sao-luu';
export const PHIEN_BAN_TEP = 1;

type BanGhi = { id: string; suaLuc?: NgayGio } & Record<string, unknown>;

export interface NoiDungSaoLuu {
  caiDat?: Record<string, unknown>;
  keHoach: BanGhi[];
  cuoc: BanGhi[];
  viec: BanGhi[];
  khoiThoiGian: BanGhi[];
  keHoachNgay: BanGhi[];
}

export interface GoiSaoLuu {
  dinhDang: typeof DINH_DANG_SAO_LUU;
  phienBan: number;
  taoLuc: NgayGio;
  daMaHoa: boolean;
  matMa?: CauHinhMatMa;
  duLieu?: NoiDungSaoLuu;
  ban?: GoiMaHoa;
}

export class LoiSaoLuu extends Error {
  constructor(
    message: string,
    readonly ma: 'KHONG_PHAI_TEP' | 'PHIEN_BAN_MOI' | 'CAN_MAT_MA' | 'MAT_MA_SAI' | 'HONG',
  ) {
    super(message);
    this.name = 'LoiSaoLuu';
  }
}

const CAC_KHO_SAO_LUU = ['keHoach', 'cuoc', 'viec', 'khoiThoiGian', 'keHoachNgay'] as const;

export function tenTepSaoLuu(homNay: NgayISO): string {
  return `TLKT-sao-luu-${homNay.replaceAll('-', '')}.tlkt.json`;
}

async function docNoiDung(kho: Kho): Promise<NoiDungSaoLuu> {
  const nd: NoiDungSaoLuu = { keHoach: [], cuoc: [], viec: [], khoiThoiGian: [], keHoachNgay: [] };
  for (const k of CAC_KHO_SAO_LUU) nd[k] = await kho.tatCa<BanGhi>(k);
  const cd = await kho.lay<Record<string, unknown>>('caiDat', 'caiDat');
  if (cd) nd.caiDat = cd;
  return nd;
}

/** Dựng tệp sao lưu (chưa đánh dấu “đã sao lưu”). */
export async function taoSaoLuu(kho: Kho, bayGio: NgayGio): Promise<{ noiDung: string; goi: GoiSaoLuu }> {
  const du = await docNoiDung(kho);
  let goi: GoiSaoLuu;
  if (kho.daMaHoa()) {
    const ban = await kho.maHoaGoi(du);
    const matMa = await kho.layCauHinhMatMa();
    if (!ban || !matMa) throw new LoiSaoLuu('Không mã hóa được bản sao lưu.', 'HONG');
    goi = { dinhDang: DINH_DANG_SAO_LUU, phienBan: PHIEN_BAN_TEP, taoLuc: bayGio, daMaHoa: true, matMa, ban };
  } else {
    goi = { dinhDang: DINH_DANG_SAO_LUU, phienBan: PHIEN_BAN_TEP, taoLuc: bayGio, daMaHoa: false, duLieu: du };
  }
  return { noiDung: JSON.stringify(goi), goi };
}

/** Xuất sao lưu: trả về tên tệp + nội dung, ghi nhận ngày sao lưu gần nhất và nhật ký. */
export async function xuatSaoLuu(kho: Kho, homNay: NgayISO, bayGio: NgayGio): Promise<{ tenTep: string; noiDung: string }> {
  const { noiDung } = await taoSaoLuu(kho, bayGio);
  await kho.ghiMeta('saoLuuCuoi', homNay);
  await kho.ghiNhatKy({ luc: bayGio, hanhDong: 'XUAT', doiTuong: 'saoLuu', sau: { daMaHoa: kho.daMaHoa() } });
  return { tenTep: tenTepSaoLuu(homNay), noiDung };
}

export async function docNgaySaoLuuCuoi(kho: Kho): Promise<NgayISO | undefined> {
  return kho.docMeta<NgayISO>('saoLuuCuoi');
}

/** Đọc và kiểm tra khung tệp (chưa giải mã). */
export function docTepSaoLuu(text: string): GoiSaoLuu {
  let g: unknown;
  try {
    g = JSON.parse(text);
  } catch {
    throw new LoiSaoLuu('Tệp không phải là tệp sao lưu TLKT (không đọc được nội dung).', 'KHONG_PHAI_TEP');
  }
  const o = g as Partial<GoiSaoLuu>;
  if (!o || typeof o !== 'object' || o.dinhDang !== DINH_DANG_SAO_LUU) {
    throw new LoiSaoLuu('Tệp không phải là tệp sao lưu TLKT.', 'KHONG_PHAI_TEP');
  }
  if (typeof o.phienBan !== 'number' || o.phienBan > PHIEN_BAN_TEP) {
    throw new LoiSaoLuu('Tệp sao lưu được tạo bởi phiên bản mới hơn – hãy cập nhật app trước khi khôi phục.', 'PHIEN_BAN_MOI');
  }
  if (o.daMaHoa ? !o.ban || !o.matMa : !o.duLieu) throw new LoiSaoLuu('Tệp sao lưu bị thiếu nội dung.', 'HONG');
  return o as GoiSaoLuu;
}

export function tepCanMatMa(goi: GoiSaoLuu): boolean {
  return goi.daMaHoa;
}

/** Giải mã (nếu cần) và làm sạch nội dung. */
export async function giaiNoiDungSaoLuu(goi: GoiSaoLuu, matMa?: string): Promise<{ noiDung: NoiDungSaoLuu; boQua: number }> {
  let raw: unknown;
  if (goi.daMaHoa) {
    if (!matMa) throw new LoiSaoLuu('Tệp sao lưu đã mã hóa – cần nhập mật mã lúc tạo tệp.', 'CAN_MAT_MA');
    const khoa = await moKhoaBangMatMa(matMa, goi.matMa!);
    if (!khoa) throw new LoiSaoLuu('Mật mã không đúng.', 'MAT_MA_SAI');
    try {
      raw = await giaiMa(khoa, goi.ban!);
    } catch {
      throw new LoiSaoLuu('Tệp sao lưu bị hỏng hoặc đã bị sửa.', 'HONG');
    }
  } else raw = goi.duLieu;
  const nd = raw as Partial<NoiDungSaoLuu>;
  let boQua = 0;
  const sach = (a: unknown): BanGhi[] => {
    if (!Array.isArray(a)) return [];
    return a.filter((x): x is BanGhi => {
      const ok = typeof x === 'object' && x !== null && typeof (x as BanGhi).id === 'string' && (x as BanGhi).id !== '';
      if (!ok) boQua++;
      return ok;
    });
  };
  const ra: NoiDungSaoLuu = {
    keHoach: sach(nd.keHoach).map((x) => chuanHoaKeHoach(x as never) as unknown as BanGhi),
    cuoc: sach(nd.cuoc).map((x) => chuanHoaCuoc(x as never) as unknown as BanGhi),
    viec: sach(nd.viec).map((x) => chuanHoaViec(x as never) as unknown as BanGhi),
    khoiThoiGian: sach(nd.khoiThoiGian),
    keHoachNgay: sach(nd.keHoachNgay),
  };
  if (nd.caiDat && typeof nd.caiDat === 'object') ra.caiDat = nd.caiDat;
  return { noiDung: ra, boQua };
}

export type CheDoNhap = 'THAY_THE' | 'GOP';

export interface BaoCaoNhap {
  cheDo: CheDoNhap;
  them: number;
  capNhat: number;
  giuNguyen: number;
  boQua: number;
}

/**
 * Khôi phục từ tệp. THAY_THE: xóa dữ liệu hiện có rồi nạp tệp. GOP: theo `id`, giữ bản có `suaLuc` mới hơn
 * (mục chỉ có ở một bên thì thêm vào; khối thời gian, kế hoạch ngày, cài đặt đã có thì giữ bản hiện tại).
 */
export async function nhapSaoLuu(kho: Kho, text: string, cheDo: CheDoNhap, bayGio: NgayGio, matMa?: string): Promise<BaoCaoNhap> {
  const goi = docTepSaoLuu(text);
  const { noiDung, boQua } = await giaiNoiDungSaoLuu(goi, matMa);
  const bc: BaoCaoNhap = { cheDo, them: 0, capNhat: 0, giuNguyen: 0, boQua };

  if (cheDo === 'THAY_THE') {
    const du: Parameters<Kho['thayTheDuLieu']>[0] = {};
    for (const k of CAC_KHO_SAO_LUU) {
      du[k] = noiDung[k];
      bc.them += noiDung[k].length;
    }
    if (noiDung.caiDat) {
      du.caiDat = [{ id: 'caiDat', ...noiDung.caiDat }];
    } else {
      du.caiDat = (await kho.tatCa<BanGhi>('caiDat')).filter(Boolean); // tệp không có cài đặt → giữ cài đặt hiện tại
    }
    await kho.thayTheDuLieu(du);
  } else {
    for (const k of CAC_KHO_SAO_LUU) {
      const hienCo = new Map((await kho.tatCa<BanGhi>(k)).map((d) => [d.id, d]));
      for (const moi of noiDung[k]) {
        const cu = hienCo.get(moi.id);
        if (!cu) {
          await kho.ghiTho(k, moi);
          bc.them++;
        } else if (typeof moi.suaLuc === 'string' && typeof cu.suaLuc === 'string' && moi.suaLuc > cu.suaLuc) {
          await kho.ghiTho(k, moi);
          bc.capNhat++;
        } else if (typeof moi.suaLuc === 'string' && typeof cu.suaLuc !== 'string') {
          await kho.ghiTho(k, moi);
          bc.capNhat++;
        } else bc.giuNguyen++;
      }
    }
    if (noiDung.caiDat && !(await kho.lay('caiDat', 'caiDat'))) {
      await kho.ghiTho('caiDat', { id: 'caiDat', ...noiDung.caiDat });
      bc.them++;
    }
  }
  await kho.ghiNhatKy({ luc: bayGio, hanhDong: 'NHAP', doiTuong: 'saoLuu', sau: { cheDo, them: bc.them, capNhat: bc.capNhat, giuNguyen: bc.giuNguyen } });
  return bc;
}
