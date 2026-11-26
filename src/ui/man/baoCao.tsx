// Báo cáo & tóm tắt (UI §4.12): bản tin sáng, báo cáo tiến độ đoàn, báo cáo tuần, tóm tắt một cuộc; sao chép, soạn email, in, xuất Excel.
import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import type { NgayISO } from '../../core/kieu';
import { banTinSang, baoCaoTienDoDoan, baoCaoTuan, tomTatMotCuoc } from '../../core/tomTat';
import { TEN_EXCEL, xuatExcel, type LoaiExcel } from '../excel';
import { cuocConHieuLuc, duLieuTomTat, homNay, caiDat, phanTichMap } from '../store';
import { ChonNgay, KhoiVanBan, NutSaoChep, TrangThaiRong, Truong } from '../thanhPhan';

type Loai = 'BAN_TIN' | 'TIEN_DO' | 'TUAN' | 'MOT_CUOC';
const loai = signal<Loai>('BAN_TIN');
const hienDayDu = signal(false);

const THE: { ma: Loai; ten: string; mota: string; bieuTuong: string }[] = [
  { ma: 'BAN_TIN', ten: 'Bản tin sáng', mota: 'Việc quá hạn, đến hạn, tại DN, nhập liệu thiếu', bieuTuong: '🌅' },
  { ma: 'TIEN_DO', ten: 'Báo cáo tiến độ đoàn', mota: 'Gửi lãnh đạo (dán Zalo/email)', bieuTuong: '📋' },
  { ma: 'TUAN', ten: 'Báo cáo tuần', mota: 'Kết quả, tồn đọng, kế hoạch tuần sau', bieuTuong: '🗓' },
  { ma: 'MOT_CUOC', ten: 'Tóm tắt một cuộc', mota: 'Một đoạn văn theo tình trạng hiện tại', bieuTuong: '📝' },
];

function mailto(tieuDe: string, noiDung: string): string {
  return `mailto:?subject=${encodeURIComponent(tieuDe)}&body=${encodeURIComponent(noiDung)}`;
}

export function ManBaoCao() {
  const ds = cuocConHieuLuc.value;
  const [cuocId, setCuocId] = useState(ds[0]?.id ?? '');
  const [ngayTuan, setNgayTuan] = useState<NgayISO>(homNay.value);
  const d = { ...duLieuTomTat.value, hienDayDu: hienDayDu.value };
  const c = ds.find((x) => x.id === cuocId) ?? ds[0];
  const pt = c ? phanTichMap.value.get(c.id) : undefined;

  let van = '';
  let tieuDe = '';
  const can = loai.value === 'TIEN_DO' || loai.value === 'MOT_CUOC';
  if (loai.value === 'BAN_TIN') {
    van = banTinSang(d);
    tieuDe = `Bản tin sáng ${homNay.value}`;
  } else if (loai.value === 'TUAN') {
    van = baoCaoTuan(d, ngayTuan);
    tieuDe = 'Báo cáo tuần';
  } else if (c && pt) {
    van = loai.value === 'TIEN_DO' ? baoCaoTienDoDoan(c, d, pt) : tomTatMotCuoc(c, d, pt);
    tieuDe = loai.value === 'TIEN_DO' ? `Báo cáo tiến độ đoàn ${c.ma}` : `Tóm tắt ${c.ma}`;
  }

  return (
    <div>
      <div class="luoi-the-bc khong-in" role="tablist" aria-label="Loại báo cáo">
        {THE.map((t) => (
          <button key={t.ma} type="button" role="tab" aria-selected={loai.value === t.ma} class="the-bc" onClick={() => (loai.value = t.ma)}>
            <span class="bt" aria-hidden="true">{t.bieuTuong}</span>
            <span class="dam">{t.ten}</span>
            <span class="phu">{t.mota}</span>
          </button>
        ))}
      </div>

      <section class="the khong-in" aria-label="Tùy chọn">
        <div class="hang">
          {can && (
            <Truong nhan="Chọn cuộc" id="bc-cuoc">
              <select id="bc-cuoc" value={c?.id ?? ''} onChange={(e) => setCuocId((e.target as HTMLSelectElement).value)}>
                {ds.map((x) => (
                  <option key={x.id} value={x.id}>{x.ma} – {caiDat.value.anDanh && !hienDayDu.value ? `…${x.mst.slice(-4)}` : x.tenNNT}</option>
                ))}
              </select>
            </Truong>
          )}
          {loai.value === 'TUAN' && <ChonNgay id="bc-tuan" nhan="Một ngày trong tuần cần báo cáo" gia={ngayTuan} doi={(v) => v && setNgayTuan(v)} canhBaoNghi={false} />}
        </div>
        {caiDat.value.anDanh && (
          <label class="o-tich">
            <input type="checkbox" checked={hienDayDu.value} onChange={(e) => (hienDayDu.value = (e.target as HTMLInputElement).checked)} />
            <span>Hiện đầy đủ tên và MST lần này (đang bật chế độ ẩn danh)</span>
          </label>
        )}
      </section>

      {can && ds.length === 0 ? (
        <TrangThaiRong tieuDe="Chưa có cuộc kiểm tra nào" moTa="Thêm một cuộc để tạo báo cáo." />
      ) : (
        <section class="the in-van-ban" aria-label="Xem trước">
          <KhoiVanBan text={van} />
        </section>
      )}

      <div class="hang-nut khong-in">
        <NutSaoChep lay={() => van} nhan="Sao chép (dán Zalo/email)" nho={false} />
        <a class="nut" href={mailto(tieuDe, van)}>✉ Soạn email</a>
        <button type="button" class="nut" onClick={() => window.print()}>🖨 In / Lưu PDF</button>
      </div>
      {van.length > 1800 && <p class="phu khong-in">Văn bản dài, một số ứng dụng email có thể cắt bớt – nên dùng nút Sao chép rồi dán.</p>}

      <section class="the khong-in" style={{ marginTop: 16 }} aria-label="Xuất Excel">
        <h3>Xuất Excel</h3>
        <div class="hang-nut">
          {(Object.keys(TEN_EXCEL) as LoaiExcel[]).map((k) => (
            <button key={k} type="button" class="nut nut-nho" onClick={() => void xuatExcel(k)}>
              ⬇ {TEN_EXCEL[k]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
