// Form sự kiện (11 loại): kiểm tra hợp lệ ngay khi nhập và hiện “hạn sẽ đổi từ … thành …” trước khi lưu (UI §4.6).
import { useState } from 'preact/hooks';
import type { LoaiSuKien, NgayISO, SuKien } from '../../core/kieu';
import { dinhDangNgay } from '../../core/lich';
import { kiemTraSuKien, lyDoKhongChoPhep, TEN_SU_KIEN, xemTruocSuKien } from '../../core/vuViec';
import { layCuoc, luuSuKien } from '../hanhDongCuoc';
import { bayGio, diDen, dongBang, homNay, lich, moBang, phanTichMap, toast, xacNhan } from '../store';
import { ChonNgay, Truong } from '../thanhPhan';

type Kieu = 'ngay' | 'chu' | 'dai' | 'so' | 'chon';
interface TruongForm {
  ten: string;
  nhan: string;
  kieu: Kieu;
  batBuoc?: boolean;
  goiY?: string;
  chon?: string[];
  macDinhHomNay?: boolean;
}

interface CauHinhForm {
  tieuDe: string;
  huongDan?: string;
  truong: TruongForm[];
}

export const FORM_SU_KIEN: Record<LoaiSuKien, CauHinhForm> = {
  HOAN: {
    tieuDe: 'Hoãn thời gian tiến hành kiểm tra',
    huongDan: 'Chỉ hoãn được trước khi công bố QĐ (NNT có lý do chính đáng, hoặc CQT bất khả kháng/nhiệm vụ cấp thiết). Mẫu 10/KTT. Hạn công bố sẽ chuyển sang ngày dự kiến công bố lại.',
    truong: [
      { ten: 'ngay', nhan: 'Ngày ra thông báo hoãn', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'denNgay', nhan: 'Hoãn đến ngày (công bố lại dự kiến)', kieu: 'ngay', batBuoc: true },
      { ten: 'lyDo', nhan: 'Lý do', kieu: 'dai', batBuoc: true },
      { ten: 'soVB', nhan: 'Số thông báo', kieu: 'chu' },
    ],
  },
  TAM_DUNG: {
    tieuDe: 'Tạm dừng kiểm tra',
    huongDan: 'Chỉ khi đang kiểm tra tại trụ sở. Hạn kết thúc được cộng thêm số ngày tạm dừng (ngày lịch). Mẫu 10/QTKT-TC. Nhớ nhập TTR “Tạm dừng thanh tra kiểm tra” và iTNK “Tạm dừng cuộc”.',
    truong: [
      { ten: 'tuNgay', nhan: 'Từ ngày', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'denNgay', nhan: 'Đến ngày (tính cả ngày này)', kieu: 'ngay', batBuoc: true },
      { ten: 'lyDo', nhan: 'Lý do', kieu: 'dai', batBuoc: true },
      { ten: 'soVB', nhan: 'Số thông báo tạm dừng', kieu: 'chu' },
    ],
  },
  GIA_HAN: {
    tieuDe: 'Gia hạn kiểm tra',
    huongDan: 'Chỉ 1 lần; tối đa 20 ngày (có giao dịch liên kết: 40 ngày). Đề nghị chậm nhất 03 ngày làm việc trước hạn kết thúc. Mẫu 07/KTT.',
    truong: [
      { ten: 'ngayDeNghi', nhan: 'Ngày báo cáo lãnh đạo đề nghị gia hạn', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'ngayQD', nhan: 'Ngày QĐ gia hạn', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'soNgay', nhan: 'Số ngày gia hạn', kieu: 'so', batBuoc: true },
      { ten: 'soQD', nhan: 'Số QĐ gia hạn', kieu: 'chu' },
    ],
  },
  DIEU_CHINH: {
    tieuDe: 'Điều chỉnh QĐ kiểm tra',
    huongDan: 'Đổi trưởng đoàn, thành viên, nội dung, thời kỳ (mẫu 11, 12, 13/KTT). Không đổi hạn. Điền ô “mới” để app cập nhật thông tin cuộc và lưu lại giá trị cũ.',
    truong: [
      { ten: 'ngayQD', nhan: 'Ngày QĐ điều chỉnh', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'soQD', nhan: 'Số QĐ điều chỉnh', kieu: 'chu' },
      { ten: 'noiDung', nhan: 'Nội dung điều chỉnh', kieu: 'dai', batBuoc: true },
      { ten: 'truongDoanMoi', nhan: 'Trưởng đoàn mới (nếu đổi)', kieu: 'chu' },
      { ten: 'noiDungMoi', nhan: 'Nội dung kiểm tra mới (nếu đổi)', kieu: 'dai' },
      { ten: 'thoiKyMoi', nhan: 'Thời kỳ kiểm tra mới (nếu đổi)', kieu: 'chu' },
    ],
  },
  BAI_BO: {
    tieuDe: 'Bãi bỏ QĐ kiểm tra',
    huongDan: 'Cuộc chuyển sang trạng thái “Bãi bỏ”, các bước chưa xong không còn áp dụng (chỉ còn việc nhập TTR/iTNK về bãi bỏ). Mẫu 09/KTT.',
    truong: [
      { ten: 'ngayQD', nhan: 'Ngày QĐ bãi bỏ', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'soQD', nhan: 'Số QĐ bãi bỏ', kieu: 'chu' },
      { ten: 'lyDo', nhan: 'Lý do', kieu: 'dai', batBuoc: true },
    ],
  },
  GIAI_TRINH: {
    tieuDe: 'NNT giải trình sau biên bản',
    huongDan: 'Có giải trình trong thời hạn luật định thì thời hạn ban hành QĐ xử phạt chuyển từ X1 sang X2 (01 tháng kể từ ngày ký biên bản).',
    truong: [
      { ten: 'ngay', nhan: 'Ngày NNT giải trình', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'hinhThuc', nhan: 'Hình thức', kieu: 'chon', chon: ['Trực tiếp', 'Văn bản'] },
      { ten: 'ghiChu', nhan: 'Ghi chú', kieu: 'dai' },
    ],
  },
  PHUC_TAP: {
    tieuDe: 'Vụ việc đặc biệt nghiêm trọng / phức tạp',
    huongDan: 'Thời hạn ban hành QĐ xử phạt chuyển sang X3 (02 tháng kể từ ngày ký biên bản). Bắt buộc ghi lý do.',
    truong: [
      { ten: 'ngay', nhan: 'Ngày xác định', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'lyDo', nhan: 'Lý do (tình tiết đặc biệt nghiêm trọng, nhiều tình tiết phức tạp…)', kieu: 'dai', batBuoc: true },
    ],
  },
  TOI_PHAM: {
    tieuDe: 'Phát hiện dấu hiệu tội phạm',
    huongDan: 'Sinh bước S7: báo cáo đề xuất chuyển hồ sơ sang cơ quan điều tra trong 05 ngày làm việc kể từ ngày phát hiện.',
    truong: [
      { ten: 'ngayPhatHien', nhan: 'Ngày phát hiện', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'noiDung', nhan: 'Nội dung (tóm tắt, không ghi chi tiết tài liệu của NNT)', kieu: 'dai' },
    ],
  },
  KHONG_NHAN_QD: {
    tieuDe: 'NNT không nhận QĐ / không ký biên bản công bố / trốn tránh',
    huongDan: 'Hướng dẫn: lập biên bản vi phạm hành chính, xử phạt (Điều 15 NĐ 125/2020 sửa đổi), cưỡng chế, ấn định thuế (Đ16.5 QĐ 1161). Sự kiện này chỉ để ghi nhận.',
    truong: [
      { ten: 'ngay', nhan: 'Ngày xảy ra', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'ghiChu', nhan: 'Ghi chú', kieu: 'dai' },
    ],
  },
  TAM_GIU_TL: {
    tieuDe: 'Tạm giữ tài liệu (hành vi trốn thuế)',
    huongDan: 'Ghi nhận việc tạm giữ và ngày dự kiến trả lại để được nhắc.',
    truong: [
      { ten: 'ngay', nhan: 'Ngày tạm giữ', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'noiDung', nhan: 'Tài liệu tạm giữ (mô tả ngắn)', kieu: 'dai', batBuoc: true },
      { ten: 'ngayTraDuKien', nhan: 'Ngày trả dự kiến', kieu: 'ngay' },
    ],
  },
  PHU_LUC_BB: {
    tieuDe: 'Lập phụ lục biên bản',
    huongDan: 'Khi có trả lời nội dung vướng mắc đã ghi mục riêng trong biên bản. Mẫu 16/KTT. Nhớ nhập TTR “Nhập phụ lục biên bản”.',
    truong: [
      { ten: 'ngay', nhan: 'Ngày lập phụ lục', kieu: 'ngay', batBuoc: true, macDinhHomNay: true },
      { ten: 'noiDung', nhan: 'Nội dung', kieu: 'dai', batBuoc: true },
    ],
  },
};

export const THU_TU_SU_KIEN: LoaiSuKien[] = ['HOAN', 'TAM_DUNG', 'GIA_HAN', 'DIEU_CHINH', 'BAI_BO', 'GIAI_TRINH', 'PHUC_TAP', 'TOI_PHAM', 'KHONG_NHAN_QD', 'TAM_GIU_TL', 'PHU_LUC_BB'];

function FormSuKien({ cuocId, loai, suaId, idBang }: { cuocId: string; loai: LoaiSuKien; suaId?: string; idBang: string }) {
  const cuoc = layCuoc(cuocId);
  const pt = phanTichMap.value.get(cuocId);
  const cu = suaId ? cuoc?.suKien.find((s) => s.id === suaId) : undefined;
  const cauHinh = FORM_SU_KIEN[loai];
  const [id] = useState(() => suaId ?? crypto.randomUUID());
  const [gia, setGia] = useState<Record<string, string>>(() => {
    const g: Record<string, string> = {};
    for (const t of cauHinh.truong) {
      const v = cu?.[t.ten];
      g[t.ten] = v !== undefined && v !== null ? String(v) : t.macDinhHomNay && !cu ? homNay.value : '';
    }
    return g;
  });
  const [dang, setDang] = useState(false);
  if (!cuoc || !pt) return <p>Không tìm thấy cuộc.</p>;

  const nc = { lich: lich.value, homNay: homNay.value };
  const du: Record<string, unknown> = { ...(cu ?? {}) };
  for (const t of cauHinh.truong) {
    const v = gia[t.ten]?.trim();
    du[t.ten] = t.kieu === 'so' ? (v ? Number(v) : undefined) : v === '' ? undefined : v;
  }
  const sk = { ...du, id, loai, taoLuc: cu?.taoLuc ?? bayGio.value } as SuKien;
  const kt = kiemTraSuKien(cuoc, pt.kq, sk, nc, suaId);
  const doi = kt.hopLe ? xemTruocSuKien(cuoc, sk, nc, suaId) : [];
  const doiE = doi.find((d) => d.ma === 'T1');
  const doiKhac = doi.filter((d) => d.ma !== 'T1');

  const luu = async () => {
    if (kt.canhBao.length) {
      const dongY = await xacNhan({ tieuDe: 'Vẫn lưu sự kiện này?', moTa: kt.canhBao.join(' '), nutChinh: 'Vẫn lưu' });
      if (!dongY) return;
    }
    setDang(true);
    try {
      await luuSuKien(cuocId, sk);
      dongBang(idBang);
      toast(`${cu ? 'Đã sửa' : 'Đã ghi nhận'}: ${TEN_SU_KIEN[loai]}`);
    } finally {
      setDang(false);
    }
  };

  const dat = (ten: string, v: string) => setGia((g) => ({ ...g, [ten]: v }));

  return (
    <div>
      {cauHinh.huongDan && <p class="phu">{cauHinh.huongDan}</p>}
      <p class="phu">{cuoc.ma} · {cuoc.tenNNT}</p>
      {cauHinh.truong.map((t) => {
        const id2 = `sk-${t.ten}`;
        if (t.kieu === 'ngay') return <ChonNgay key={t.ten} id={id2} nhan={t.nhan} batBuoc={t.batBuoc} gia={(gia[t.ten] as NgayISO) ?? ''} doi={(v) => dat(t.ten, v)} canhBaoNghi={false} />;
        if (t.kieu === 'dai')
          return (
            <Truong key={t.ten} nhan={t.nhan} id={id2} batBuoc={t.batBuoc}>
              <textarea id={id2} rows={2} value={gia[t.ten]} onInput={(e) => dat(t.ten, (e.target as HTMLTextAreaElement).value)} />
            </Truong>
          );
        if (t.kieu === 'chon')
          return (
            <Truong key={t.ten} nhan={t.nhan} id={id2}>
              <select id={id2} value={gia[t.ten]} onChange={(e) => dat(t.ten, (e.target as HTMLSelectElement).value)}>
                <option value="">(Chưa chọn)</option>
                {t.chon!.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Truong>
          );
        return (
          <Truong key={t.ten} nhan={t.nhan} id={id2} batBuoc={t.batBuoc}>
            <input id={id2} type={t.kieu === 'so' ? 'number' : 'text'} inputMode={t.kieu === 'so' ? 'numeric' : undefined} min={t.kieu === 'so' ? 1 : undefined} value={gia[t.ten]} onInput={(e) => dat(t.ten, (e.target as HTMLInputElement).value)} />
          </Truong>
        );
      })}

      {kt.hopLe && doiE && (
        <p class="the thanh-cong" role="status" style={{ padding: 12 }}>
          <b>Hạn kết thúc kiểm tra tại trụ sở sẽ đổi từ {doiE.truoc ? dinhDangNgay(doiE.truoc) : '—'} thành {doiE.sau ? dinhDangNgay(doiE.sau) : '—'}</b>
        </p>
      )}
      {kt.hopLe && doiKhac.length > 0 && (
        <details class="the" open={!doiE}>
          <summary class="dam">Các hạn khác thay đổi ({doiKhac.length})</summary>
          <table class="bang">
            <tbody>
              {doiKhac.map((d) => (
                <tr key={d.ma}>
                  <td>{d.ma}</td>
                  <td>{d.ten.replace(/\s*\(= [A-Z0-9]+\)/g, '').split(/[:;]/)[0].slice(0, 60)}</td>
                  <td class="so">
                    {d.truoc ? dinhDangNgay(d.truoc) : '—'} → <b>{d.sau ? dinhDangNgay(d.sau) : '—'}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      {kt.hopLe && doi.length === 0 && <p class="phu">Sự kiện này không làm thay đổi hạn nào.</p>}
      {kt.canhBao.map((c) => (
        <p key={c} class="the canh-bao" style={{ padding: 8 }}>{c}</p>
      ))}
      {kt.loi.map((l) => (
        <p key={l} class="loi-truong">{l}</p>
      ))}
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => dongBang(idBang)}>Hủy</button>
        <button type="button" class="nut nut-chinh" disabled={!kt.hopLe || dang} onClick={() => void luu()}>Lưu sự kiện</button>
      </div>
    </div>
  );
}

/** Mở form sự kiện. Nếu loại chưa hợp lệ ở giai đoạn hiện tại → chuyển tới tab Sự kiện để xem lý do. */
export function moFormSuKien(cuocId: string, loai?: LoaiSuKien, suaId?: string): void {
  const c = layCuoc(cuocId);
  if (!loai || !c) {
    diDen(`#cuoc-${cuocId}/su-kien`);
    return;
  }
  const chan = lyDoKhongChoPhep(c, loai, suaId);
  if (chan) {
    toast(chan, 'thongTin');
    diDen(`#cuoc-${cuocId}/su-kien`);
    return;
  }
  const id = `sk-${cuocId}-${loai}-${suaId ?? 'moi'}`;
  moBang({ id, tieuDe: `${suaId ? 'Sửa: ' : ''}${FORM_SU_KIEN[loai].tieuDe}`, rong: true, noiDung: () => <FormSuKien cuocId={cuocId} loai={loai} suaId={suaId} idBang={id} /> });
}

