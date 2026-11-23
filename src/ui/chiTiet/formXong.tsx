// Form “Xong…” một bước: ngày thực tế (mặc định hôm nay), số văn bản, ghi chú, lý do trễ (bắt buộc nếu sau hạn pháp lý).
import { useState } from 'preact/hooks';
import type { NgayISO } from '../../core/kieu';
import { checklistDu, viecConThieu } from '../../core/checklist';
import { tenNgan } from '../../core/tomTat';
import { dinhDangNgay } from '../../core/lich';
import { boDanhDau, danhDauXong, kiemTraXong, layCuoc } from '../hanhDongCuoc';
import { dongBang, homNay, moBang, phanTichMap, toast } from '../store';
import { ChonNgay, NhanSLA, Truong } from '../thanhPhan';
import { mucSLA } from '../../core/vuViec';

const NHAN_SO_VB: Record<string, string> = {
  P5: 'Số quyết định kiểm tra',
  X: 'Số QĐ xử phạt / Kết luận',
  B1: 'Số biên bản (nếu có)',
};

function FormXong({ cuocId, ma, idBang }: { cuocId: string; ma: string; idBang: string }) {
  const cuoc = layCuoc(cuocId);
  const pt = phanTichMap.value.get(cuocId);
  const m = pt?.kq.danhSach.find((x) => x.ma === ma);
  const cu = cuoc?.buoc[ma]?.xong ? cuoc.buoc[ma] : undefined; // đang sửa mốc đã đánh dấu
  const [ngay, setNgay] = useState<NgayISO | ''>(cu?.ngay ?? homNay.value);
  const [soVB, setSoVB] = useState(cu?.soVB ?? (ma === 'X' ? cuoc?.ketQua.soQDXL ?? '' : ''));
  const [ghiChu, setGhiChu] = useState(cu?.ghiChu ?? '');
  const [lyDo, setLyDo] = useState(cuoc?.buoc[ma]?.lyDoTre ?? '');
  const [loai, setLoai] = useState<'QD_XU_PHAT' | 'KET_LUAN'>(cuoc?.ketQua.loaiVanBanXL ?? (pt && pt.kq.cheDoX === 'X4' ? 'KET_LUAN' : 'QD_XU_PHAT'));
  const [dang, setDang] = useState(false);
  if (!cuoc || !pt || !m) return <p>Không tìm thấy bước này.</p>;

  const kt = ngay ? kiemTraXong(cuoc, ma, { ngay, lyDoTre: lyDo }) : { hopLe: false, loi: ['Chọn ngày thực tế.'], canhBao: [], canLyDoTre: false };
  const thieu = ma === 'S5' ? viecConThieu(pt.checklist.filter((v) => !v.hangNgay)) : [];
  const han = m.noiBo ? m.hanMucTieu : m.hanPhapLy;

  const luu = async () => {
    if (!ngay) return;
    setDang(true);
    try {
      const f = {
        ngay,
        soVB,
        ghiChu,
        lyDoTre: kt.canLyDoTre ? lyDo : undefined,
        ...(ma === 'X' ? { soQDXL: soVB, loaiVanBanXL: loai, coXuLy: loai === 'QD_XU_PHAT' } : {}),
      };
      const r = await danhDauXong(cuocId, ma, f);
      if (!r.hopLe) {
        toast(r.loi[0], 'loi');
        return;
      }
      dongBang(idBang);
      toast(cu ? `Đã sửa: ${tenNgan(m.ten)}` : `Đã đánh dấu xong: ${tenNgan(m.ten)}`, 'thanhCong', cu ? undefined : () => boDanhDau(cuocId, ma).then(() => undefined));
    } finally {
      setDang(false);
    }
  };

  return (
    <div>
      <p class="phu">
        {cuoc.ma} · {cuoc.tenNNT || 'Chưa có tên'} · {m.canCu}
        {m.bieuMau.length ? ` · Biểu mẫu ${m.bieuMau.join(', ')}` : ''}
      </p>
      {han && (
        <p>
          {m.noiBo ? 'Hạn nội bộ' : 'Hạn pháp lý'}: <b>{dinhDangNgay(han)}</b> <NhanSLA muc={mucSLA(m)} />
          {m.hanMucTieu && !m.noiBo && m.hanMucTieu !== m.hanPhapLy && <span class="phu"> · hạn mục tiêu {dinhDangNgay(m.hanMucTieu)}</span>}
        </p>
      )}
      <ChonNgay id="xong-ngay" nhan="Ngày thực tế" gia={ngay} doi={setNgay} batBuoc />
      <Truong nhan={NHAN_SO_VB[ma] ?? 'Số/ngày văn bản (nếu có)'} id="xong-so">
        <input id="xong-so" type="text" value={soVB} onInput={(e) => setSoVB((e.target as HTMLInputElement).value)} />
      </Truong>
      {ma === 'X' && (
        <fieldset class="truong" style={{ border: 0, padding: 0 }}>
          <legend class="nhan-truong">Loại văn bản</legend>
          <label class="o-tich">
            <input type="radio" name="loai-vb" checked={loai === 'QD_XU_PHAT'} onChange={() => setLoai('QD_XU_PHAT')} /> Quyết định xử phạt (MQĐ02)
          </label>
          <label class="o-tich">
            <input type="radio" name="loai-vb" checked={loai === 'KET_LUAN'} onChange={() => setLoai('KET_LUAN')} /> Kết luận kiểm tra (17/KTT)
          </label>
        </fieldset>
      )}
      <Truong nhan="Ghi chú" id="xong-gc">
        <textarea id="xong-gc" value={ghiChu} rows={2} onInput={(e) => setGhiChu((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      {kt.canLyDoTre && (
        <Truong nhan="Lý do trễ (bắt buộc)" id="xong-ly-do" batBuoc>
          <textarea id="xong-ly-do" value={lyDo} rows={2} onInput={(e) => setLyDo((e.target as HTMLTextAreaElement).value)} />
        </Truong>
      )}
      {kt.canhBao.map((c) => (
        <p key={c} class="the canh-bao" style={{ padding: 8 }}>
          {c}
        </p>
      ))}
      {thieu.length > 0 && (
        <p class="the canh-bao" style={{ padding: 8 }}>
          Còn {thieu.length} việc nhập liệu hệ thống chưa tích – nên hoàn tất trước khi “Hoàn thành cuộc” trên iTNK.
        </p>
      )}
      {ma === 'S5' && checklistDu(pt.checklist) && <p class="phu">✓ Checklist nhập liệu đã đủ.</p>}
      {kt.loi.filter((l) => l !== 'Bắt buộc ghi lý do trễ.').map((l) => (
        <p key={l} class="loi-truong">
          {l}
        </p>
      ))}
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>
          Hủy
        </button>
        <button type="button" class="nut nut-chinh" disabled={!kt.hopLe || dang} onClick={() => void luu()}>
          Lưu
        </button>
      </div>
    </div>
  );
}

export function moFormXongBuoc(cuocId: string, ma: string): void {
  const pt = phanTichMap.value.get(cuocId);
  const m = pt?.kq.danhSach.find((x) => x.ma === ma);
  const id = `xong-${cuocId}-${ma}`;
  moBang({ id, tieuDe: `${pt?.cuoc.buoc[ma]?.xong ? 'Sửa' : 'Xong'}: ${m ? tenNgan(m.ten) : ma}`, noiDung: () => <FormXong cuocId={cuocId} ma={ma} idBang={id} /> });
}
