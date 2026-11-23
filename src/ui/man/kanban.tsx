// Kanban 9 cột theo giai đoạn. Kéo thả CHỈ để mở form xác nhận mốc tương ứng (không tự đổi dữ liệu).
import { useState } from 'preact/hooks';
import { dinhDangNgayNgan, thuNgan } from '../../core/lich';
import { TEN_GIAI_DOAN, THU_TU_GIAI_DOAN } from '../../core/vuViec';
import { xuLyKeoTha, type DongCuoc } from '../../core/tomTat';
import { MAU_GIAI_DOAN } from '../chuoi';
import { moFormSuKien } from '../chiTiet/formSuKien';
import { moFormXongBuoc } from '../chiTiet/formXong';
import { caiDat, toast } from '../store';
import { NhanLoai, NhanSLA, conLaiNLVChu } from '../thanhPhan';
import { nhanCuoc } from '../../core/nhacViec';

export function Kanban({ rows }: { rows: DongCuoc[] }) {
  const [dangKeo, setDangKeo] = useState<string | null>(null);
  const [cotDich, setCotDich] = useState<string | null>(null);
  const an = caiDat.value.anDanh;

  const tha = (gd: (typeof THU_TU_GIAI_DOAN)[number]) => {
    const id = dangKeo;
    setDangKeo(null);
    setCotDich(null);
    const r = rows.find((x) => x.cuoc.id === id);
    if (!r) return;
    const kq = xuLyKeoTha(r.pt.giaiDoan, gd);
    if (kq.kieu === 'KHONG') toast(kq.lyDo, 'thongTin');
    else if (kq.kieu === 'SU_KIEN') moFormSuKien(r.cuoc.id, kq.loai);
    else moFormXongBuoc(r.cuoc.id, kq.ma);
  };

  return (
    <div class="kanban" role="list" aria-label="Bảng Kanban theo giai đoạn">
      {THU_TU_GIAI_DOAN.map((gd) => {
        const ds = rows.filter((r) => r.pt.giaiDoan === gd);
        return (
          <section
            key={gd}
            class={`cot-kanban ${cotDich === gd ? 'dang-tha' : ''}`}
            role="listitem"
            aria-label={`${TEN_GIAI_DOAN[gd]}: ${ds.length} cuộc`}
            onDragOver={(e) => {
              e.preventDefault();
              if (cotDich !== gd) setCotDich(gd);
            }}
            onDragLeave={() => setCotDich(null)}
            onDrop={(e) => {
              e.preventDefault();
              tha(gd);
            }}
          >
            <h3 style={{ borderTopColor: MAU_GIAI_DOAN[gd] }}>
              {TEN_GIAI_DOAN[gd]} <span class="so-dem">{ds.length}</span>
            </h3>
            {ds.length === 0 && <p class="phu can-giua">—</p>}
            {ds.map((r) => {
              const t = r.pt.tiepTheo;
              const han = t ? (t.noiBo ? t.hanMucTieu : t.hanPhapLy) : undefined;
              return (
                <a
                  key={r.cuoc.id}
                  class="the-kanban"
                  href={`#cuoc-${r.cuoc.id}`}
                  draggable
                  onDragStart={(e) => {
                    setDangKeo(r.cuoc.id);
                    e.dataTransfer?.setData('text/plain', r.cuoc.id);
                  }}
                  onDragEnd={() => {
                    setDangKeo(null);
                    setCotDich(null);
                  }}
                >
                  <div class="dong1">
                    <NhanLoai loai={r.cuoc.loai} />
                    <span class="dam">{nhanCuoc(r.cuoc, an)}</span>
                  </div>
                  {t && (
                    <div class="phu">
                      {t.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '').split(/[:;]/)[0].slice(0, 60)}
                      {han ? ` – hạn ${dinhDangNgayNgan(han)} (${thuNgan(han)})` : ''}
                    </div>
                  )}
                  <div class="hang-nut" style={{ marginTop: 4 }}>
                    <NhanSLA muc={r.sla} chu={t ? conLaiNLVChu(t.nlvConLai) || undefined : undefined} />
                  </div>
                </a>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
