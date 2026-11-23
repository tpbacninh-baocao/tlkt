// Tab “Kết quả & nộp tiền”: số liệu truy thu/phạt…, loại văn bản xử lý (quyết định chế độ X1/X4), các lần nộp tiền.
import { useState } from 'preact/hooks';
import type { KetQuaCuoc, LanNop, NgayISO } from '../../core/kieu';
import { dinhDangNgay, dinhDangSo } from '../../core/lich';
import { datKetQuaVaoCuoc, datLanNopVaoCuoc, tinhHinhNop, xoaLanNopKhoiCuoc } from '../../core/vuViec';
import type { PhanTichCuoc } from '../../core/tomTat';
import { capNhatCuoc } from '../hanhDongCuoc';
import { toast, xacNhan } from '../store';
import { ChonNgay, OSo, ThanhTienDo, Truong, TrangThaiRong } from '../thanhPhan';

const SO_LIEU: { k: keyof KetQuaCuoc; nhan: string }[] = [
  { k: 'truyThu', nhan: 'Thuế truy thu' },
  { k: 'phat', nhan: 'Tiền phạt' },
  { k: 'chamNop', nhan: 'Tiền chậm nộp' },
  { k: 'giamKhauTru', nhan: 'Giảm số thuế được khấu trừ' },
  { k: 'giamLo', nhan: 'Giảm số lỗ' },
  { k: 'thuHoiHoan', nhan: 'Thu hồi số thuế đã hoàn' },
];

function FormKetQua({ pt }: { pt: PhanTichCuoc }) {
  const goc = pt.cuoc.ketQua;
  const [kq, setKq] = useState<KetQuaCuoc>({ ...goc });
  const sua = JSON.stringify(kq) !== JSON.stringify(goc);
  const dat = (p: Partial<KetQuaCuoc>) => setKq((x) => ({ ...x, ...p }));
  const che = pt.kq.cheDoX;
  const cheTen = (pt.bo.cheDoX[che] as { ten?: string } | undefined)?.ten ?? '';
  const x = pt.kq.danhSach.find((m) => m.ma === 'X');
  return (
    <section class="the" aria-label="Kết quả kiểm tra">
      <h3>Kết quả kiểm tra</h3>
      <div class="luoi-2">
        {SO_LIEU.map((s) => (
          <OSo key={s.k} nhan={`${s.nhan} (đồng)`} id={`kq-${s.k}`} gia={kq[s.k] as number} doi={(n) => dat({ [s.k]: n })} />
        ))}
      </div>
      <label class="o-tich">
        <input type="checkbox" checked={kq.coXuLy} onChange={(e) => dat({ coXuLy: (e.target as HTMLInputElement).checked })} />
        <span><b>Có truy thu/xử phạt</b> (ban hành QĐ xử phạt; không chọn = chỉ ban hành Kết luận kiểm tra)</span>
      </label>
      <p class="phu" style={{ margin: '4px 0 12px' }}>
        Chế độ ban hành hiện tại: <b>{che}</b> – {cheTen}
        {x?.hanPhapLy ? ` · hạn ${dinhDangNgay(x.hanPhapLy)}` : ''}. {pt.cuoc.suKien.some((s) => s.loai === 'GIAI_TRINH' || s.loai === 'PHUC_TAP') ? 'Đã có sự kiện giải trình/phức tạp nên chế độ do sự kiện quyết định.' : ''}
      </p>
      <div class="luoi-2">
        <Truong nhan="Loại văn bản xử lý" id="kq-loai">
          <select id="kq-loai" value={kq.loaiVanBanXL ?? ''} onChange={(e) => dat({ loaiVanBanXL: ((e.target as HTMLSelectElement).value || undefined) as KetQuaCuoc['loaiVanBanXL'] })}>
            <option value="">(Tự theo “có truy thu/xử phạt”)</option>
            <option value="QD_XU_PHAT">Quyết định xử phạt</option>
            <option value="KET_LUAN">Kết luận kiểm tra</option>
          </select>
        </Truong>
        <Truong nhan="Số QĐ xử phạt / Kết luận" id="kq-so">
          <input id="kq-so" type="text" value={kq.soQDXL ?? ''} onInput={(e) => dat({ soQDXL: (e.target as HTMLInputElement).value || undefined })} />
        </Truong>
      </div>
      <Truong nhan="Hành vi vi phạm (tóm tắt, dùng khi nhập TTR)" id="kq-hv">
        <textarea id="kq-hv" rows={2} value={kq.hanhViViPham ?? ''} onInput={(e) => dat({ hanhViViPham: (e.target as HTMLTextAreaElement).value || undefined })} />
      </Truong>
      <div class="hang-nut phai">
        <button type="button" class="nut" disabled={!sua} onClick={() => setKq({ ...goc })}>Hoàn lại</button>
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!sua}
          onClick={async () => {
            await capNhatCuoc(pt.cuoc.id, (c) => datKetQuaVaoCuoc(c, kq));
            toast('Đã lưu kết quả – các hạn được tính lại');
          }}
        >
          Lưu kết quả
        </button>
      </div>
    </section>
  );
}

function FormLanNop({ pt }: { pt: PhanTichCuoc }) {
  const [ngay, setNgay] = useState<NgayISO | ''>('');
  const [soTien, setSoTien] = useState(0);
  const [ghiChu, setGhiChu] = useState('');
  return (
    <div class="hang" style={{ alignItems: 'flex-end' }}>
      <ChonNgay id="nop-ngay" nhan="Ngày nộp" gia={ngay} doi={setNgay} canhBaoNghi={false} />
      <OSo nhan="Số tiền (đồng)" id="nop-tien" gia={soTien} doi={setSoTien} />
      <Truong nhan="Ghi chú" id="nop-gc">
        <input id="nop-gc" type="text" value={ghiChu} onInput={(e) => setGhiChu((e.target as HTMLInputElement).value)} />
      </Truong>
      <div class="truong">
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!ngay || soTien <= 0}
          onClick={async () => {
            const l: LanNop = { id: crypto.randomUUID(), ngay: ngay as NgayISO, soTien, ghiChu: ghiChu.trim() || undefined, daNhapTTR: false };
            await capNhatCuoc(pt.cuoc.id, (c) => datLanNopVaoCuoc(c, l));
            setNgay('');
            setSoTien(0);
            setGhiChu('');
            toast('Đã ghi lần nộp – nhớ nhập TTR “Nhập số thu nộp sau TTKT”');
          }}
        >
          ＋ Thêm lần nộp
        </button>
      </div>
    </div>
  );
}

export function TabKetQua({ pt }: { pt: PhanTichCuoc }) {
  const c = pt.cuoc;
  const n = tinhHinhNop(c);
  return (
    <div>
      <FormKetQua pt={pt} />
      <section class="the" aria-label="Thu nộp sau kiểm tra">
        <h3>Thu nộp sau kiểm tra</h3>
        {n.phaiNop > 0 ? (
          <>
            <ThanhTienDo xong={n.phanTram} tong={100} nhan={`Đã nộp ${n.phanTram}% – còn ${dinhDangSo(n.conLai)} đ`} />
            <p class="phu">
              Phải nộp {dinhDangSo(n.phaiNop)} đ (truy thu + phạt + chậm nộp) · đã nộp {dinhDangSo(n.daNop)} đ
            </p>
          </>
        ) : (
          <p class="phu">Chưa có số tiền phải nộp – nhập số liệu ở trên.</p>
        )}
        <FormLanNop pt={pt} />
        {c.nopTien.length === 0 ? (
          <TrangThaiRong tieuDe="Chưa có lần nộp nào" />
        ) : (
          <div class="cuon-ngang">
            <table class="bang">
              <thead>
                <tr>
                  <th>Ngày nộp</th>
                  <th class="so">Số tiền</th>
                  <th>Ghi chú</th>
                  <th>Đã nhập TTR</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {c.nopTien.map((l) => (
                  <tr key={l.id}>
                    <td>{dinhDangNgay(l.ngay)}</td>
                    <td class="so">{dinhDangSo(l.soTien)}</td>
                    <td>{l.ghiChu ?? ''}</td>
                    <td>
                      <input type="checkbox" aria-label={`Đã nhập TTR lần nộp ${dinhDangNgay(l.ngay)}`} checked={l.daNhapTTR} onChange={(e) => void capNhatCuoc(c.id, (x) => datLanNopVaoCuoc(x, { ...l, daNhapTTR: (e.target as HTMLInputElement).checked }))} />
                    </td>
                    <td>
                      <button
                        type="button"
                        class="nut nut-nho"
                        onClick={async () => {
                          if (!(await xacNhan({ tieuDe: 'Xóa lần nộp này?', nutChinh: 'Xóa', nguyHiem: true }))) return;
                          await capNhatCuoc(c.id, (x) => xoaLanNopKhoiCuoc(x, l.id));
                          toast('Đã xóa lần nộp', 'thanhCong', () => void capNhatCuoc(c.id, (x) => datLanNopVaoCuoc(x, l)));
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
