// Hành động gắn với một mục việc (ThẻViệc): ✓ Xong, Mở cuộc, Thêm Google Lịch, Ghi lý do trễ…
import { useState } from 'preact/hooks';
import type { MucViec } from '../core/tomTat';
import { linkGoogleLich } from '../core/nhacViec';
import { dinhDangNgay } from '../core/lich';
import { moFormXongBuoc } from './chiTiet/formXong';
import { ghiLyDoTre, tickViec } from './hanhDongCuoc';
import { hoanThanhViecUI } from './hanhDong';
import { dongBang, moBang, phanTichMap } from './store';
import { Truong, type HanhDongThe } from './thanhPhan';

function FormLyDo({ cuocId, ma, idBang }: { cuocId: string; ma: string; idBang: string }) {
  const [ly, setLy] = useState('');
  return (
    <div>
      <p class="phu">Ghi lý do để giải trình khi nhập iTNK (ví dụ: NNT đề nghị lùi lịch công bố, chờ ý kiến lãnh đạo…).</p>
      <Truong nhan="Lý do trễ" id="ly-do-tre">
        <textarea id="ly-do-tre" rows={3} value={ly} onInput={(e) => setLy((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>
          Hủy
        </button>
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!ly.trim()}
          onClick={async () => {
            await ghiLyDoTre(cuocId, ma, ly);
            dongBang(idBang);
          }}
        >
          Lưu lý do
        </button>
      </div>
    </div>
  );
}

export function moGhiLyDo(cuocId: string, ma: string): void {
  const id = `ly-do-${cuocId}-${ma}`;
  moBang({ id, tieuDe: 'Ghi lý do trễ', noiDung: () => <FormLyDo cuocId={cuocId} ma={ma} idBang={id} /> });
}

export function xongMuc(m: MucViec): void {
  if (m.loai === 'BUOC' && m.cuocId && m.maBuoc) {
    moFormXongBuoc(m.cuocId, m.maBuoc);
  } else if (m.loai === 'CHECKLIST' && m.cuocId && m.checklistKhoa) {
    const v = phanTichMap.value.get(m.cuocId)?.checklist.find((x) => x.khoa === m.checklistKhoa);
    if (v) void tickViec(m.cuocId, v);
  } else if (m.loai === 'VIEC' && m.viecId) {
    void hoanThanhViecUI(m.viecId);
  }
}

export function menuMuc(m: MucViec): HanhDongThe[] {
  const ds: HanhDongThe[] = [];
  if (m.cuocId) ds.push({ nhan: 'Mở cuộc', chay: () => {}, href: `#cuoc-${m.cuocId}` });
  const ngay = m.hanMucTieu ?? m.han;
  if (ngay) {
    ds.push({
      nhan: 'Thêm vào Google Lịch',
      chay: () => {},
      href: linkGoogleLich({ ngay, tieuDe: `${m.nhanCuoc ? m.nhanCuoc + ' – ' : ''}${m.tieuDe}`, moTa: `${m.canCu ?? ''}${m.han ? ' · hạn ' + dinhDangNgay(m.han) : ''}`.trim() }),
    });
  }
  if (m.loai === 'BUOC' && m.quaHanChuaGiaiTrinh && m.cuocId && m.maBuoc) {
    const cuocId = m.cuocId;
    const ma = m.maBuoc;
    ds.push({ nhan: 'Ghi lý do trễ…', chay: () => moGhiLyDo(cuocId, ma) });
  }
  return ds;
}
