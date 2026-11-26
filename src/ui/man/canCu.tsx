// Căn cứ & hướng dẫn (UI §4.14): văn bản căn cứ, bảng quy trình theo giai đoạn, chuyển tiếp, biểu mẫu, điểm chưa xác nhận, hướng dẫn.
import { useState } from 'preact/hooks';
import { giaiBoQuyTac, laBoChuyenTiep, DANH_SACH_BO_GOC, laCheDoX } from '../../core/quyTac';
import { TEN_GIAI_DOAN } from '../../core/vuViec';
import { dinhDangNgay } from '../../core/lich';
import type { BoQuyTac, HanDacTa } from '../../core/kieu';
import { caiDat } from '../store';
import { Truong } from '../thanhPhan';
import { HuongDanCaiDatApp } from './huongDan';

const DON_VI: Record<string, string> = { NLV: 'ngày làm việc', N: 'ngày', THANG: 'tháng', GIO_LV: 'giờ làm việc' };

export function chuHan(h: HanDacTa | null | undefined, bo: BoQuyTac): string {
  if (!h) return 'Không có hạn';
  if (h.truoc) return `Trước mốc ${h.truoc}${h.macDinhNeuChuaCoK ? ` (chưa có thì lấy ${h.macDinhNeuChuaCoK})` : ''}`;
  if (h.theoCheDo) return 'Theo chế độ X1–X4 (xem bảng dưới)';
  const so = h.thamSo ? bo.thamSo[h.thamSo] : h.so;
  if (so === undefined) return '—';
  const dv = DON_VI[h.donVi ?? 'NLV'];
  const gdlk = h.soNeuGDLK !== undefined ? ` (${h.soNeuGDLK} nếu có giao dịch liên kết)` : '';
  const tu = h.tu ? ` ${h.huong === '-' ? 'trước' : 'kể từ'} ${h.tu}` : '';
  const them = [h.vaTruoc ? `và trước mốc ${h.vaTruoc}` : '', h.congTamDung ? 'cộng thời gian tạm dừng' : '', h.giaHan ? `gia hạn tối đa ${h.giaHan.toiDa}${h.giaHan.toiDaGDLK ? `/${h.giaHan.toiDaGDLK}` : ''} ${DON_VI[h.giaHan.donVi]}, ${h.giaHan.soLan} lần` : '', h.noiBo ? 'mục tiêu nội bộ' : ''].filter(Boolean);
  return `${so} ${dv}${gdlk}${tu}${them.length ? ` – ${them.join('; ')}` : ''}`;
}

const VAN_BAN = [
  ['QĐ 1161/QĐ-CT ngày 14/8/2026 của Cục Thuế', 'Quy trình kiểm tra thuế (Điều 9–18: tổ chức; Điều 22–28: hộ, cá nhân kinh doanh; Điều 32: kiểm tra bằng phương thức điện tử; Điều 33–35: nhập dữ liệu, báo cáo, lưu trữ). Biểu mẫu xx/QTKT-TC, xx/QTKT-MC.'],
  ['Thông tư 89/2026/TT-BTC ngày 30/6/2026', 'Biểu mẫu xx/KTT.'],
  ['Nghị định 252/2026/NĐ-CP', 'Hướng dẫn Luật Quản lý thuế.'],
  ['Luật Quản lý thuế 108/2025/QH15', 'Căn cứ pháp lý về thời hạn kiểm tra, ban hành quyết định xử lý.'],
  ['QĐ 970/QĐ-TCT ngày 14/7/2023', 'Quy trình cũ – chỉ áp dụng cho cuộc chuyển tiếp (xem bảng chuyển tiếp).'],
];

const CHUA_XAC_NHAN = [
  'Thời hạn 20 ngày tại trụ sở (Đ17.2.b) được ghi là “ngày”, không ghi “ngày làm việc” → app mặc định tính ngày theo lịch; nếu đơn vị/TTR tính khác thì đổi đơn vị trong Cài đặt → Quy tắc thời hạn.',
  'Quy chế giám sát mới của Cục trưởng Cục Thuế (nếu đã ban hành) thay cho QĐ 1614/QĐ-TCT.',
  'Mã chức năng TMS (4.1; 1.4.1) và tên chức năng TTR/iTNK theo phiên bản đang dùng tại đơn vị.',
  'Hạn giải quyết hồ sơ hoàn thuế (loại TH) và hạn nộp tiền theo QĐ xử phạt – người dùng nhập theo văn bản hiện hành.',
  'Tham số bộ quy tắc chuyển tiếp QTKT-970.',
];

export function ManCanCu() {
  const [maBo, setMaBo] = useState('QTKT-1161');
  const bo = giaiBoQuyTac(maBo, caiDat.value.vaQuyTac as never);
  const cacGd = [...new Set(bo.buoc.map((b) => b.giaiDoan))];
  const bieuMau = [...new Set([...bo.buoc.flatMap((b) => b.bieuMau), ...Object.values(bo.suKien).flatMap((s) => s.bieuMau ?? [])])].sort();
  const tenGd = (g: string) => (TEN_GIAI_DOAN as Record<string, string>)[g] ?? (g === 'BAT_KY' ? 'Bất kỳ lúc nào' : g);
  return (
    <div class="trang-can-cu">
      <section class="the">
        <h3>Văn bản căn cứ</h3>
        <ul>{VAN_BAN.map(([t, m]) => <li key={t}><b>{t}</b> – {m}</li>)}</ul>
        <p class="phu">Mọi thời hạn trong app lấy từ các văn bản trên, ghi kèm trích dẫn điều khoản. App chỉ là công cụ nhắc việc, không thay thế văn bản và quyết định của người có thẩm quyền.</p>
      </section>

      <section class="the" aria-label="Hướng dẫn sử dụng nhanh">
        <h3>Dùng app trong 5 bước</h3>
        <ol>
          <li>Vào <a href="#cai-dat/ho-so">Cài đặt</a>: nhập họ tên, đơn vị và lịch nghỉ Tết của năm.</li>
          <li>Bấm <b>＋ Cuộc mới</b>: nhập MST, tên NNT, ngày ban hành QĐ kiểm tra – app tự dự kiến mọi mốc.</li>
          <li>Mỗi lần xong một bước, mở cuộc → bấm <b>Xong</b> ở bước đó và nhập ngày thực tế; các hạn sau tự tính lại.</li>
          <li>Xem <a href="#hom-nay">Hôm nay</a> mỗi sáng: việc quá hạn, đến hạn, sắp đến hạn và việc nhập liệu còn thiếu.</li>
          <li>Mỗi tuần <a href="#cai-dat/sao-luu">sao lưu</a> một lần; xuất lịch <b>.ics</b> để có báo thức trên điện thoại.</li>
        </ol>
      </section>

      <section class="the">
        <h3>Bảng quy trình theo giai đoạn</h3>
        <Truong nhan="Bộ quy tắc" id="cc-bo">
          <select id="cc-bo" value={maBo} onChange={(e) => setMaBo((e.target as HTMLSelectElement).value)}>
            {DANH_SACH_BO_GOC.map((b) => <option key={b.ma} value={b.ma}>{b.ma} – {b.ten}</option>)}
          </select>
        </Truong>
        {laBoChuyenTiep(bo) && <p class="the canh-bao" style={{ padding: 8 }}><span class="nhan nhan-vang">Chuyển tiếp – chưa xác nhận</span> {bo.ghiChuApDung}</p>}
        {cacGd.map((g) => (
          <details key={g} open={g === 'DANG_KIEM_TRA' || g === 'CHO_CONG_BO'}>
            <summary class="dam">{tenGd(g)}</summary>
            <div class="cuon-ngang">
              <table class="bang">
                <thead><tr><th>Mã</th><th>Bước</th><th>Hạn</th><th>Căn cứ / biểu mẫu</th></tr></thead>
                <tbody>
                  {bo.buoc.filter((b) => b.giaiDoan === g).map((b) => (
                    <tr key={b.ma}>
                      <td><b>{b.ma}</b></td>
                      <td>{b.ten}<div class="phu">{b.nguoi}</div></td>
                      <td>{chuHan(b.han, bo)}</td>
                      <td>{b.canCu}{b.bieuMau.length ? <div class="phu">{b.bieuMau.join(', ')}</div> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        <details>
          <summary class="dam">Chế độ ban hành kết luận / quyết định xử lý (X1–X4)</summary>
          <div class="cuon-ngang">
            <table class="bang">
              <thead><tr><th>Mã</th><th>Trường hợp</th><th>Hạn</th><th>Căn cứ</th></tr></thead>
              <tbody>
                {Object.entries(bo.cheDoX).map(([k, c]) => (laCheDoX(c) ? <tr key={k}><td><b>{k}</b></td><td>{c.ten}</td><td>{chuHan(c.han, bo)}</td><td>{c.canCu}</td></tr> : null))}
              </tbody>
            </table>
          </div>
        </details>
        <details>
          <summary class="dam">Đồng hồ, kế hoạch và báo cáo định kỳ</summary>
          <ul>
            {Object.values(bo.dongHo).map((d) => <li key={d.ten}>{d.ten}: {d.so} {DON_VI[d.donVi]} – {d.canCu}</li>)}
            {Object.values(bo.keHoach).map((k) => <li key={k.ten}>{k.ten}: {k.so} {DON_VI[k.donVi]} kể từ {k.tu} – {k.canCu}</li>)}
            {bo.baoCaoDinhKy.map((r) => <li key={r.ma}>{r.ten}: {r.lich} – {r.canCu}</li>)}
          </ul>
        </details>
      </section>

      <section class="the">
        <h3>Bảng chuyển tiếp (chọn bộ quy tắc theo ngày QĐ kiểm tra)</h3>
        <div class="cuon-ngang">
          <table class="bang">
            <thead><tr><th>Bộ quy tắc</th><th>QĐ kiểm tra ban hành</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {DANH_SACH_BO_GOC.map((b) => (
                <tr key={b.ma}>
                  <td><b>{b.ma}</b></td>
                  <td>{b.apDung.ngayQDTu ? `từ ${dinhDangNgay(b.apDung.ngayQDTu)}` : ''}{b.apDung.ngayQDTu && b.apDung.ngayQDDen ? ' ' : ''}{b.apDung.ngayQDDen ? `đến ${dinhDangNgay(b.apDung.ngayQDDen)}` : b.apDung.ngayQDTu ? ' trở đi' : ''}</td>
                  <td>{(b as { ghiChuApDung?: string }).ghiChuApDung}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="phu">Có thể chọn bộ khác riêng cho từng cuộc khi tạo/sửa cuộc.</p>
      </section>

      <section class="the">
        <h3>Danh mục biểu mẫu ({maBo})</h3>
        <p>{bieuMau.join(' · ') || 'Không có'}</p>
      </section>

      <section class="the canh-bao" aria-label="Điểm chưa xác nhận">
        <h3><span class="nhan nhan-vang">Chưa xác nhận</span> Điểm cần đối chiếu tại đơn vị</h3>
        <ol>{CHUA_XAC_NHAN.map((t) => <li key={t}>{t}</li>)}</ol>
        {bo.chuaXacNhan?.map((t) => <p key={t} class="phu">Riêng bộ {maBo}: {t}</p>)}
      </section>

      <HuongDanCaiDatApp />
    </div>
  );
}

