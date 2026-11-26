// Cài đặt → Quy tắc thời hạn: bảng sửa số ngày/đơn vị/đệm có trích dẫn; Khôi phục mặc định; chế độ thận trọng; tên chức năng hệ thống.
import { useState } from 'preact/hooks';
import { DANH_MUC_CHECKLIST, TEN_HE_THONG } from '../../core/checklist';
import { DANH_SACH_BO_GOC, datVaBuocTruong, datVaCheDoX, datVaThamSoTruong, demMucDaSua, giaiBoQuyTac, khoiPhucMacDinh, laCheDoX, laBoChuyenTiep, type VaQuyTac } from '../../core/quyTac';
import { suaCaiDat } from '../hanhDong';
import { caiDat, toast, xacNhan } from '../store';
import { tenNgan } from '../../core/tomTat';
import { Truong } from '../thanhPhan';

type DonVi = 'NLV' | 'N' | 'THANG';
const DON_VI: { ma: DonVi; ten: string }[] = [
  { ma: 'NLV', ten: 'ngày làm việc' },
  { ma: 'N', ten: 'ngày (lịch)' },
  { ma: 'THANG', ten: 'tháng' },
];

const TEN_THAM_SO: Record<string, string> = {
  demMacDinhNLV: 'Đệm an toàn mặc định (ngày làm việc)',
  hanNhapLieuNLV: 'Hạn nhập liệu hệ thống sau khi phát sinh (ngày làm việc)',
  hanNopTienNgay: 'Hạn nộp tiền sau khi nhận QĐ xử phạt (ngày)',
  nhacTruocLuuTruNgay: 'Nhắc trước hạn bàn giao lưu trữ (ngày)',
};

function So({ gia, doi, nhan }: { gia: number; doi: (n: number) => void; nhan: string }) {
  return <input type="number" min={0} aria-label={nhan} value={gia} onInput={(e) => { const v = Number((e.target as HTMLInputElement).value); if (Number.isFinite(v) && v >= 0) doi(v); }} style={{ width: 80, minHeight: 36 }} />;
}

export function CaiDatQuyTac() {
  const [maBo, setMaBo] = useState('QTKT-1161');
  const va = caiDat.value.vaQuyTac as VaQuyTac;
  const goc = giaiBoQuyTac(maBo, {});
  const hien = giaiBoQuyTac(maBo, va);
  const daSua = demMucDaSua(va, maBo);
  const luuVa = (moi: VaQuyTac) => suaCaiDat((c) => ({ ...c, vaQuyTac: moi }));

  const buocSua = hien.buoc.filter((b) => b.han && b.han.so !== undefined && !b.han.theoCheDo && !b.han.truoc);
  const daSuaBuoc = (ma: string) => Object.keys(va[maBo]?.buoc?.[ma] ?? {}).length > 0;

  return (
    <div>
      <section class="the">
        <h3>Quy tắc thời hạn</h3>
        <p class="phu">Số ngày lấy từ quy trình (QĐ 1161). Chỉ sửa khi đơn vị bạn tính khác (ví dụ 20 ngày tại trụ sở tính theo ngày làm việc). Mọi thay đổi được ghi vào Lịch sử và áp dụng ngay cho mọi cuộc.</p>
        <div class="hang">
          <Truong nhan="Bộ quy tắc" id="qt-bo">
            <select id="qt-bo" value={maBo} onChange={(e) => setMaBo((e.target as HTMLSelectElement).value)}>
              {DANH_SACH_BO_GOC.map((b) => (
                <option key={b.ma} value={b.ma}>{b.ma}{b.keThua ? ' (chuyển tiếp)' : ''}</option>
              ))}
            </select>
          </Truong>
          <div class="truong">
            <button
              type="button"
              class="nut"
              disabled={!daSua}
              onClick={async () => {
                if (!(await xacNhan({ tieuDe: `Khôi phục mặc định bộ ${maBo}?`, moTa: `${daSua} mục đã sửa sẽ trở về giá trị gốc.`, nutChinh: 'Khôi phục' }))) return;
                await luuVa(khoiPhucMacDinh(va, maBo));
                toast('Đã khôi phục mặc định');
              }}
            >
              Khôi phục mặc định{daSua ? ` (${daSua})` : ''}
            </button>
          </div>
        </div>
        {laBoChuyenTiep(hien) && <p class="the canh-bao" style={{ padding: 8 }}>Chuyển tiếp – chưa xác nhận: {hien.ghiChuApDung}</p>}
        {(hien.chuaXacNhan ?? []).map((t) => <p key={t} class="the canh-bao" style={{ padding: 8 }}>Chưa xác nhận: {t}</p>)}
      </section>

      <section class="the" aria-label="Bảng thời hạn các bước">
        <h3>Thời hạn từng bước</h3>
        <div class="cuon-ngang" tabIndex={0} role="region" aria-label="Bảng (cuộn ngang bằng phím mũi tên)">
          <table class="bang">
            <thead>
              <tr><th>Bước</th><th>Số</th><th>Đơn vị</th><th>GDLK</th><th>Đệm (NLV)</th><th>Căn cứ</th><th /></tr>
            </thead>
            <tbody>
              {buocSua.map((b) => {
                const g = goc.buoc.find((x) => x.ma === b.ma)!;
                const h = b.han!;
                const hg = g.han!;
                const so = h.thamSo ? undefined : h.so ?? 0;
                return (
                  <tr key={b.ma} class={daSuaBuoc(b.ma) ? 'da-sua' : ''}>
                    <td><b>{b.ma}</b> {tenNgan(b.ten)}{h.noiBo ? ' (nội bộ)' : ''}</td>
                    <td>
                      {h.thamSo ? (
                        <span class="phu">tham số</span>
                      ) : (
                        <So nhan={`Số của ${b.ma}`} gia={so!} doi={(n) => luuVa(datVaBuocTruong(va, maBo, b.ma, 'so', n, hg.so))} />
                      )}
                    </td>
                    <td>
                      <select aria-label={`Đơn vị của ${b.ma}`} value={h.donVi ?? 'NLV'} onChange={(e) => luuVa(datVaBuocTruong(va, maBo, b.ma, 'donVi', (e.target as HTMLSelectElement).value as DonVi, hg.donVi as DonVi))} style={{ minHeight: 36 }}>
                        {DON_VI.map((d) => <option key={d.ma} value={d.ma}>{d.ten}</option>)}
                      </select>
                    </td>
                    <td>{h.soNeuGDLK !== undefined ? <So nhan={`Số nếu có GDLK của ${b.ma}`} gia={h.soNeuGDLK} doi={(n) => luuVa(datVaBuocTruong(va, maBo, b.ma, 'soNeuGDLK', n, hg.soNeuGDLK))} /> : '—'}</td>
                    <td>{h.noiBo || b.dem === undefined ? '—' : <So nhan={`Đệm của ${b.ma}`} gia={b.dem} doi={(n) => luuVa(datVaBuocTruong(va, maBo, b.ma, 'dem', n, g.dem))} />}</td>
                    <td class="phu">{b.canCu}</td>
                    <td>{daSuaBuoc(b.ma) && <button type="button" class="nut nut-nho" aria-label={`Khôi phục ${b.ma}`} onClick={() => luuVa(khoiPhucMacDinh(va, maBo, b.ma))}>↺</button>}</td>
                  </tr>
                );
              })}
              {Object.entries(hien.cheDoX).filter(([, c]) => laCheDoX(c)).map(([che, c]) => {
                if (!laCheDoX(c)) return null;
                const cg = goc.cheDoX[che];
                const hg = laCheDoX(cg) ? cg.han : c.han;
                return (
                  <tr key={che} class={va[maBo]?.cheDoX?.[che] ? 'da-sua' : ''}>
                    <td><b>{che}</b> {c.ten}</td>
                    <td><So nhan={`Số của ${che}`} gia={c.han.so ?? 0} doi={(n) => luuVa(datVaCheDoX(va, maBo, che, 'so', n, hg.so))} /></td>
                    <td>
                      <select aria-label={`Đơn vị của ${che}`} value={c.han.donVi ?? 'NLV'} onChange={(e) => luuVa(datVaCheDoX(va, maBo, che, 'donVi', (e.target as HTMLSelectElement).value as DonVi, hg.donVi as DonVi))} style={{ minHeight: 36 }}>
                        {DON_VI.map((d) => <option key={d.ma} value={d.ma}>{d.ten}</option>)}
                      </select>
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td class="phu">{c.canCu}</td>
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section class="the" aria-label="Tham số chung">
        <h3>Tham số chung</h3>
        {Object.entries(hien.thamSo).map(([k, v]) => (
          <div key={k} class="hang-nut" style={{ marginBottom: 4 }}>
            <So nhan={TEN_THAM_SO[k] ?? k} gia={v} doi={(n) => luuVa(datVaThamSoTruong(va, maBo, k, n, goc.thamSo[k]))} />
            <span>{TEN_THAM_SO[k] ?? k}</span>
            {va[maBo]?.thamSo?.[k] !== undefined && <span class="nhan nhan-vang">đã sửa (gốc {goc.thamSo[k]})</span>}
          </div>
        ))}
      </section>

      <section class="the" aria-label="Chế độ đếm thận trọng">
        <h3>Chế độ đếm thận trọng</h3>
        <label class="o-tich">
          <input type="checkbox" checked={caiDat.value.cheDoThanTrong} onChange={(e) => void suaCaiDat((c) => ({ ...c, cheDoThanTrong: (e.target as HTMLInputElement).checked }))} />
          <span>Bật chế độ thận trọng</span>
        </label>
        <p class="phu">Tính cả ngày xảy ra sự kiện là ngày thứ nhất và không lùi hạn qua ngày nghỉ – cho hạn sớm hơn, an toàn tối đa. Mặc định tắt (đếm theo Điều 147, 148 Bộ luật Dân sự).</p>
      </section>

      <TenChucNang />
    </div>
  );
}

function TenChucNang() {
  const ghiDe = caiDat.value.tenChucNangHeThong;
  return (
    <section class="the" aria-label="Tên chức năng trên hệ thống">
      <h3>Tên chức năng TTR / iTNK / TMS</h3>
      <p class="phu">Danh mục này để bạn đối chiếu và sửa khi phiên bản hệ thống tại đơn vị gọi tên khác (mã chức năng TMS “4.1; 1.4.1” cũng nằm trong tên). Chỉ ảnh hưởng nhãn hiển thị và nội dung Sao chép.</p>
      {(['TTR', 'ITNK', 'TMS'] as const).map((h) => (
        <details key={h}>
          <summary class="dam">{h === 'ITNK' ? 'iTNK' : h} – {TEN_HE_THONG[h]}</summary>
          {DANH_MUC_CHECKLIST.filter((m) => m.heThong === h).map((m) => (
            <div key={m.ma} class="truong" style={{ marginTop: 8 }}>
              <label for={`cn-${m.ma}`}>{m.ma}</label>
              <div class="hang-nut">
                <input id={`cn-${m.ma}`} type="text" value={ghiDe[m.ma] ?? m.chucNang} style={{ flex: 1 }} onChange={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  void suaCaiDat((c) => {
                    const t = { ...c.tenChucNangHeThong };
                    if (!v || v === m.chucNang) delete t[m.ma];
                    else t[m.ma] = v;
                    return { ...c, tenChucNangHeThong: t };
                  });
                }} />
                {ghiDe[m.ma] && <button type="button" class="nut nut-nho" onClick={() => void suaCaiDat((c) => { const t = { ...c.tenChucNangHeThong }; delete t[m.ma]; return { ...c, tenChucNangHeThong: t }; })}>↺</button>}
              </div>
            </div>
          ))}
        </details>
      ))}
    </section>
  );
}
