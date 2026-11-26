// Chạy kịch bản kiểm thử hạn (tests/kich-ban-han.json) – dùng chung cho vitest và màn “Kiểm thử” trong app.
// Hàm thuần: nhận dữ liệu kịch bản, trả về kết quả từng ca. KHÔNG sửa kỳ vọng ở đây.
import { congGioLV, lichTronTru, taoLich } from '../lich';
import { chonBoQuyTac, giaiBoQuyTac, type VaQuyTac } from '../quyTac';
import { nhanDienHan } from '../viec';
import { taoCuocRong, tinhMoc, timMoc } from '../vuViec';
import type { CuocKiemTra, SuKien } from '../kieu';

const MOC_SANG_BUOC: Record<string, string> = { D0: 'P5', C: 'Q5', K: 'T7', B: 'B1', R: 'B4', X: 'X' };
export const HOM_NAY_KICH_BAN = '2026-10-01';

export type Ca = { id: string; moTa?: string; dauVao: Record<string, any>; buoc?: string; ketQua?: unknown; cheDoX?: string; boQuyTacMongDoi?: string; cau?: string; gioLamViec?: number };
export type Nhom = { ten: string; boQuyTac?: string; ngayNghi?: string[]; ngayGoc?: string; ca: Ca[] };
export interface KichBan {
  ngayNghiMacDinh: string[];
  nhom: Nhom[];
}

export interface KetQuaCa {
  id: string;
  nhom: string;
  moTa: string;
  dat: boolean;
  thucTe: unknown;
  kyVong: unknown;
  loi?: string;
}

function dungCuoc(dauVao: Record<string, any>): CuocKiemTra {
  const cuoc = taoCuocRong({ id: 'c', ma: 'KT-TEST', taoLuc: '2026-01-01T00:00' });
  for (const [moc, buoc] of Object.entries(MOC_SANG_BUOC)) {
    if (dauVao[moc]) cuoc.buoc[buoc] = { xong: true, ngay: dauVao[moc] };
  }
  cuoc.coGDLK = !!dauVao.coGDLK;
  if (dauVao.ketQua) Object.assign(cuoc.ketQua, dauVao.ketQua);
  cuoc.suKien = (dauVao.suKien ?? []).map(
    (s: Record<string, unknown>, i: number) => ({ id: 'sk' + i, taoLuc: `2026-01-01T08:0${i}`, ...s }) as SuKien,
  );
  return cuoc;
}

/** Tính một ca → { thucTe, kyVong, ghiChu }. Ném lỗi nếu không tính được (ví dụ thiếu mốc). */
export function tinhCa(kb: KichBan, nhom: Nhom, ca: Ca, va: VaQuyTac = {}): { thucTe: unknown; kyVong: unknown; them?: { ten: string; thucTe: unknown; kyVong: unknown } } {
  const lich = taoLich({ ngayNghiThem: [...kb.ngayNghiMacDinh, ...(nhom.ngayNghi ?? [])] });
  if (ca.cau !== undefined) {
    return { thucTe: nhanDienHan(ca.cau, nhom.ngayGoc!, lichTronTru()).han ?? null, kyVong: ca.ketQua };
  }
  if (ca.gioLamViec !== undefined) {
    return { thucTe: congGioLV(lichTronTru(), ca.dauVao.luc, ca.gioLamViec), kyVong: ca.ketQua };
  }
  if (ca.boQuyTacMongDoi) {
    const ma = chonBoQuyTac(ca.dauVao.D0, HOM_NAY_KICH_BAN, undefined, va).ma;
    if (!ca.buoc) return { thucTe: ma, kyVong: ca.boQuyTacMongDoi };
    if (ma !== ca.boQuyTacMongDoi) return { thucTe: ma, kyVong: ca.boQuyTacMongDoi };
  }
  const cuoc = dungCuoc(ca.dauVao);
  const bo = nhom.boQuyTac ? giaiBoQuyTac(nhom.boQuyTac, va) : chonBoQuyTac(ca.dauVao.D0, HOM_NAY_KICH_BAN, undefined, va);
  const kq = tinhMoc(cuoc, { lich, homNay: HOM_NAY_KICH_BAN, bo });
  const m = timMoc(kq, ca.buoc!);
  if (!m) throw new Error(`không có mốc ${ca.buoc}`);
  const han = m.noiBo ? m.hanMucTieu : m.hanPhapLy;
  if (ca.cheDoX && kq.cheDoX !== ca.cheDoX) return { thucTe: kq.cheDoX, kyVong: ca.cheDoX };
  return { thucTe: han, kyVong: ca.ketQua };
}

/** Chạy toàn bộ kịch bản. `va` = bản vá quy tắc người dùng (mặc định không vá = kiểm tra bản gốc). */
export function chayKichBan(kb: KichBan, va: VaQuyTac = {}): KetQuaCa[] {
  const ra: KetQuaCa[] = [];
  for (const nhom of kb.nhom) {
    for (const ca of nhom.ca) {
      const moTa = ca.moTa ?? ca.cau ?? '';
      try {
        const r = tinhCa(kb, nhom, ca, va);
        ra.push({ id: ca.id, nhom: nhom.ten, moTa, dat: r.thucTe === r.kyVong, thucTe: r.thucTe, kyVong: r.kyVong });
      } catch (e) {
        ra.push({ id: ca.id, nhom: nhom.ten, moTa, dat: false, thucTe: undefined, kyVong: ca.ketQua, loi: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  return ra;
}
