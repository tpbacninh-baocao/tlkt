// Tab “Sự kiện”: lưới 11 nút (mờ kèm lý do khi không hợp lệ ở giai đoạn hiện tại) + danh sách sự kiện đã có (sửa/xóa).
import { moTaSuKien, lyDoKhongChoPhep, TEN_SU_KIEN } from '../../core/vuViec';
import type { PhanTichCuoc } from '../../core/tomTat';
import { dinhDangNgay } from '../../core/lich';
import { luuSuKien, xoaSuKien } from '../hanhDongCuoc';
import { toast, xacNhan } from '../store';
import { TrangThaiRong } from '../thanhPhan';
import { FORM_SU_KIEN, THU_TU_SU_KIEN, moFormSuKien } from './formSuKien';

const BIEU_TUONG: Record<string, string> = {
  HOAN: '⏸', TAM_DUNG: '⏯', GIA_HAN: '⏩', DIEU_CHINH: '✏️', BAI_BO: '🚫', GIAI_TRINH: '🗣', PHUC_TAP: '🧩', TOI_PHAM: '⚖️', KHONG_NHAN_QD: '✋', TAM_GIU_TL: '📦', PHU_LUC_BB: '📎',
};

export function TabSuKien({ pt }: { pt: PhanTichCuoc }) {
  const c = pt.cuoc;
  return (
    <div>
      <section class="the" aria-label="Ghi nhận sự kiện">
        <h3>Ghi nhận sự kiện</h3>
        <p class="phu">Mỗi sự kiện tự tính lại các hạn và sinh việc nhập hệ thống tương ứng.</p>
        <div class="luoi-su-kien">
          {THU_TU_SU_KIEN.map((loai) => {
            const chan = lyDoKhongChoPhep(c, loai);
            return (
              <button key={loai} type="button" class="nut-su-kien" disabled={!!chan} aria-disabled={!!chan} title={chan ?? FORM_SU_KIEN[loai].tieuDe} onClick={() => moFormSuKien(c.id, loai)}>
                <span class="bt" aria-hidden="true">{BIEU_TUONG[loai]}</span>
                <span class="dam">{TEN_SU_KIEN[loai]}</span>
                {chan && <span class="phu">{chan}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section class="the" aria-label="Sự kiện đã ghi nhận">
        <h3>Đã ghi nhận ({c.suKien.length})</h3>
        {c.suKien.length === 0 ? (
          <TrangThaiRong tieuDe="Chưa có sự kiện nào" moTa="Hoãn, tạm dừng, gia hạn… sẽ hiện ở đây." />
        ) : (
          <ul class="ds-su-kien">
            {c.suKien.map((s) => (
              <li key={s.id}>
                <div>
                  <span class="dam">{TEN_SU_KIEN[s.loai]}</span> <span class="phu">ghi lúc {dinhDangNgay(s.taoLuc.slice(0, 10))}</span>
                  <div>{moTaSuKien(s)}</div>
                  {s.loai === 'DIEU_CHINH' && s.truoc ? <div class="phu">Giá trị trước điều chỉnh: {Object.entries(s.truoc as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v ?? '—')}`).join('; ')}</div> : null}
                </div>
                <div class="hang-nut">
                  <button type="button" class="nut nut-nho" onClick={() => moFormSuKien(c.id, s.loai, s.id)}>Sửa</button>
                  <button
                    type="button"
                    class="nut nut-nho"
                    onClick={async () => {
                      const dongY = await xacNhan({ tieuDe: 'Xóa sự kiện này?', moTa: `${TEN_SU_KIEN[s.loai]} – các hạn sẽ được tính lại như chưa có sự kiện.`, nutChinh: 'Xóa', nguyHiem: true });
                      if (!dongY) return;
                      const da = await xoaSuKien(c.id, s.id);
                      toast(`Đã xóa: ${TEN_SU_KIEN[s.loai]}`, 'thanhCong', da ? () => luuSuKien(c.id, da) : undefined);
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
