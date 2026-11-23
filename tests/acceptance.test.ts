// Kiểm thử chấp nhận: đọc TRỰC TIẾP tests/kich-ban-han.json – mỗi ca một it(). KHÔNG sửa kỳ vọng trong JSON.
import { describe, it, expect } from 'vitest';
import kichBan from './kich-ban-han.json';
import { congGioLV, lichTronTru, taoLich } from '../src/core/lich';
import { chonBoQuyTac, giaiBoQuyTac } from '../src/core/quyTac';
import { nhanDienHan } from '../src/core/viec';
import { taoCuocRong, tinhMoc, timMoc } from '../src/core/vuViec';
import type { CuocKiemTra, SuKien } from '../src/core/kieu';

const MOC_SANG_BUOC: Record<string, string> = { D0: 'P5', C: 'Q5', K: 'T7', B: 'B1', R: 'B4', X: 'X' };

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

type Ca = { id: string; moTa: string; dauVao: Record<string, any>; buoc?: string; ketQua?: unknown; cheDoX?: string; boQuyTacMongDoi?: string; cau?: string; gioLamViec?: number };
type Nhom = { ten: string; boQuyTac?: string; ngayNghi?: string[]; ngayGoc?: string; ca: Ca[] };

const HOM_NAY = '2026-10-01';

for (const nhom of kichBan.nhom as Nhom[]) {
  describe(nhom.ten, () => {
    const lich = taoLich({ ngayNghiThem: [...(kichBan.ngayNghiMacDinh as string[]), ...(nhom.ngayNghi ?? [])] });
    for (const ca of nhom.ca) {
      it(`${ca.id}: ${ca.moTa ?? ca.cau}`, () => {
        if (ca.cau !== undefined) {
          expect(nhanDienHan(ca.cau, nhom.ngayGoc!, lichTronTru()).han ?? null).toBe(ca.ketQua);
          return;
        }
        if (ca.gioLamViec !== undefined) {
          expect(congGioLV(lichTronTru(), ca.dauVao.luc, ca.gioLamViec)).toBe(ca.ketQua);
          return;
        }
        if (ca.boQuyTacMongDoi) {
          expect(chonBoQuyTac(ca.dauVao.D0, HOM_NAY).ma).toBe(ca.boQuyTacMongDoi);
          if (!ca.buoc) return;
        }
        const cuoc = dungCuoc(ca.dauVao);
        // Bộ quy tắc: theo nhóm nếu chỉ định; ngược lại chọn theo D0 của ca
        const bo = nhom.boQuyTac ? giaiBoQuyTac(nhom.boQuyTac) : chonBoQuyTac(ca.dauVao.D0, HOM_NAY);
        const kq = tinhMoc(cuoc, { lich, homNay: HOM_NAY, bo });
        const m = timMoc(kq, ca.buoc!)!;
        expect(m, `không có mốc ${ca.buoc}`).toBeDefined();
        const han = m.noiBo ? m.hanMucTieu : m.hanPhapLy;
        expect(han).toBe(ca.ketQua);
        if (ca.cheDoX) expect(kq.cheDoX).toBe(ca.cheDoX);
      });
    }
  });
}
