// Tab “Dòng thời gian” của chi tiết cuộc (UI §4.6): các bước theo giai đoạn, trạng thái SLA, nút Xong…/Sửa/Bỏ.
import type { CuocKiemTra, MocTinh } from '../../core/kieu';
import { BUOC_TRUOC, mucSLA, type KetQuaTinhMoc } from '../../core/vuViec';
import type { PhanTichCuoc } from '../../core/tomTat';
import { KIEU_SLA, nhanSLAChiTiet } from '../chuoi';
import { boDanhDau } from '../hanhDongCuoc';
import { moGhiLyDo } from '../muc';
import { diDen, toast, xacNhan } from '../store';
import { linkGoogleLich, nhanCuoc } from '../../core/nhacViec';
import { caiDat } from '../store';
import { NhanSLA, chuNgay, conLaiNLVChu } from '../thanhPhan';
import { moFormXongBuoc } from './formXong';

const TIEU_DE_GD: Record<string, string> = {
  CHUAN_BI: 'Giai đoạn 1 – Chuẩn bị',
  CHO_CONG_BO: 'Giai đoạn 2 – Sau khi có QĐ kiểm tra',
  DANG_KIEM_TRA: 'Giai đoạn 3 – Kiểm tra tại trụ sở NNT',
  BIEN_BAN: 'Giai đoạn 4 – Biên bản, báo cáo',
  CHO_QD_XU_LY: 'Giai đoạn 5 – Quyết định xử phạt / Kết luận',
  SAU_QD: 'Giai đoạn 6 – Sau quyết định',
  BAT_KY: 'Bất kỳ lúc nào',
};
const THU_TU = ['CHUAN_BI', 'CHO_CONG_BO', 'DANG_KIEM_TRA', 'BIEN_BAN', 'CHO_QD_XU_LY', 'SAU_QD', 'BAT_KY'];

/** Lý do chưa thể đánh dấu xong bước này (undefined = được phép). */
export function lyDoChuaDanhDau(c: CuocKiemTra, kq: KetQuaTinhMoc, m: MocTinh): string | undefined {
  if (kq.baiBo) return 'Cuộc đã bị bãi bỏ';
  const t = BUOC_TRUOC[m.ma];
  if (t && !c.buoc[t.can]?.xong) return `Cần xong trước: ${t.ten}`;
  if (m.loai === 'dieuKien' && m.trangThai === 'KHONG_AP_DUNG') return 'Chưa phát sinh điều kiện áp dụng';
  return undefined;
}

function moBoDanhDau(cuocId: string, m: MocTinh) {
  void (async () => {
    const dongY = await xacNhan({
      tieuDe: 'Bỏ đánh dấu bước này?',
      moTa: `Bước “${m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '').split(/[:;]/)[0]}” sẽ trở lại trạng thái chưa xong và các hạn phía sau được tính lại.`,
      nutChinh: 'Bỏ đánh dấu',
    });
    if (!dongY) return;
    const r = await boDanhDau(cuocId, m.ma);
    if (!r.hopLe) toast(r.loi[0], 'loi');
    else toast('Đã bỏ đánh dấu');
  })();
}

function DongBuoc({ pt, m }: { pt: PhanTichCuoc; m: MocTinh }) {
  const c = pt.cuoc;
  const bt = c.buoc[m.ma];
  const xong = !!bt?.xong;
  const muc = mucSLA(m);
  const k = KIEU_SLA[muc];
  const lyDo = xong ? undefined : lyDoChuaDanhDau(c, pt.kq, m);
  const coNut = ['moc', 'buoc', 'dieuKien', 'theoDoiNopTien'].includes(m.loai);
  const lop = [m.tuyChon || m.dieuKien || m.loai === 'theoDoi' ? 'dut' : '', m.duKien && !xong ? 'mo-dan' : '', m.trangThai === 'KHONG_AP_DUNG' && !xong ? 'mo-dan' : ''].join(' ');
  const ghiChuTrangThai = m.trangThai === 'KHONG_AP_DUNG' ? m.ghiChu : undefined;
  return (
    <li class={`buoc-dong ${lop}`} id={`buoc-${m.ma}`}>
      <span class={`bt-sla ${k.lop}`} aria-label={k.nhan} title={k.nhan}>
        {k.bieuTuong}
      </span>
      <div>
        <div class="dam">
          <span class="phu">{m.ma}</span> {m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '')}
        </div>
        <div class="phu-dong">
          <span>Người thực hiện: {m.nguoi}</span>
          {m.bieuMau.map((b) => (
            <span key={b} class="nhan">{b}</span>
          ))}
          {m.tuyChon && <span class="nhan nhan-vang">Tùy chọn</span>}
          {m.dieuKien && <span class="nhan nhan-vang">Có điều kiện</span>}
        </div>
        <div class="phu-dong">
          {m.hanPhapLy && (
            <span>
              Hạn pháp lý {chuNgay(m.hanPhapLy)}
              {m.duKien ? ' (dự kiến)' : ''}
            </span>
          )}
          {m.hanMucTieu && m.hanMucTieu !== m.hanPhapLy && (
            <span>
              · {m.noiBo ? 'Hạn nội bộ' : 'hạn mục tiêu'} {chuNgay(m.hanMucTieu)}
            </span>
          )}
          {!xong && m.nlvConLai !== undefined && m.trangThai !== 'KHONG_AP_DUNG' && !m.duKien && <span>· {conLaiNLVChu(m.nlvConLai)}</span>}
          {m.thieuMoc && !m.hanPhapLy && !m.hanMucTieu && <span>Chưa tính được hạn – cần mốc {m.thieuMoc}</span>}
        </div>
        {xong && (
          <div class="phu-dong" style={{ color: 'var(--chu)' }}>
            <span class="dam">✓ Xong {bt.ngay ? chuNgay(bt.ngay) : ''}</span>
            {bt.soVB && <span>· Số {bt.soVB}</span>}
            {bt.ghiChu && <span>· {bt.ghiChu}</span>}
            <NhanSLA muc={muc} chu={nhanSLAChiTiet(m, muc)} />
          </div>
        )}
        {bt?.lyDoTre && (
          <div class="phu-dong">
            <span>Lý do trễ: {bt.lyDoTre}</span>
          </div>
        )}
        {ghiChuTrangThai && <div class="phu-dong"><span>{ghiChuTrangThai}</span></div>}
        <details class="can-cu">
          <summary>Căn cứ</summary>
          <p style={{ margin: '4px 0' }}>{m.canCu}</p>
        </details>
      </div>
      <div class="hanh-dong" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        {coNut && !xong && (
          <button type="button" class="nut nut-nho nut-chinh" disabled={!!lyDo} title={lyDo} aria-label={lyDo ? `${lyDo}` : `Đánh dấu xong ${m.ma}`} onClick={() => moFormXongBuoc(c.id, m.ma)}>
            Xong…
          </button>
        )}
        {lyDo && !xong && coNut && <span class="phu" style={{ maxWidth: 140 }}>{lyDo}</span>}
        {!xong && !m.duKien && (m.hanMucTieu ?? m.hanPhapLy) && m.trangThai !== 'KHONG_AP_DUNG' && (
          <a
            class="nut nut-nho"
            target="_blank"
            rel="noopener noreferrer"
            href={linkGoogleLich({ ngay: (m.hanMucTieu ?? m.hanPhapLy)!, tieuDe: `${nhanCuoc(c, caiDat.value.anDanh)} – ${m.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '')}`, moTa: `Căn cứ: ${m.canCu}` })}
          >
            Thêm Google Lịch
          </a>
        )}
        {xong && (
          <>
            <button type="button" class="nut nut-nho" onClick={() => moFormXongBuoc(c.id, m.ma)}>
              Sửa
            </button>
            <button type="button" class="nut nut-nho" onClick={() => moBoDanhDau(c.id, m)}>
              Bỏ đánh dấu
            </button>
          </>
        )}
        {!xong && m.quaHanChuaGiaiTrinh && (
          <button type="button" class="nut nut-nho" onClick={() => moGhiLyDo(c.id, m.ma)}>
            Ghi lý do trễ
          </button>
        )}
        {m.ma === 'T2' && (
          <button type="button" class="nut nut-nho" onClick={() => diDen(`#cuoc-${c.id}/nhat-ky`)}>
            Mở nhật ký
          </button>
        )}
      </div>
    </li>
  );
}

export function TabDongThoiGian({ pt }: { pt: PhanTichCuoc }) {
  const nhom = THU_TU.map((g) => ({ g, ds: pt.kq.danhSach.filter((m) => m.giaiDoan === g) })).filter((x) => x.ds.length);
  return (
    <div>
      {pt.kq.baiBo && <p class="the loi" role="status">Cuộc này đã bị bãi bỏ – các bước chưa xong không còn áp dụng.</p>}
      <p class="phu">
        Bộ quy tắc <b>{pt.bo.ma}</b>
        {pt.bo.keThua ? ' · chuyển tiếp – chưa xác nhận tham số' : ''} · Chế độ X: <b>{pt.kq.cheDoX}</b> ({String((pt.bo.cheDoX[pt.kq.cheDoX] as { ten?: string } | undefined)?.ten ?? '')}). Bước nghiêng, mờ là ước tính từ mốc chưa có ngày thực tế.
      </p>
      {nhom.map(({ g, ds }) => (
        <section key={g} aria-labelledby={`gd-${g}`} class="the">
          <h3 id={`gd-${g}`}>{TIEU_DE_GD[g]}</h3>
          <ol class="ds-buoc">
            {ds.map((m) => (
              <DongBuoc key={m.ma} pt={pt} m={m} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
