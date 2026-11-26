// Tab “Tài liệu & vướng mắc”: đồng hồ 06 giờ làm việc cho yêu cầu tài liệu; 3 đồng hồ 02 NLV cho vướng mắc.
import { useState } from 'preact/hooks';
import type { VuongMac, YeuCauTaiLieu } from '../../core/kieu';
import { bayGioTuDate, dinhDangNgayGio } from '../../core/lich';
import { changDangChay, dongHoVuongMac, dongHoYeuCau, datVuongMacVaoCuoc, danhDauNhanTaiLieu, themYeuCauVaoCuoc, xoaVuongMacKhoiCuoc, xoaYeuCauKhoiCuoc } from '../../core/vuViec';
import type { PhanTichCuoc } from '../../core/tomTat';
import { capNhatCuoc } from '../hanhDongCuoc';
import { bayGio, homNay, lich, toast, xacNhan } from '../store';
import { ChonNgay, NhanSLA, Truong, TrangThaiRong, chuNgay } from '../thanhPhan';
import { nhanTheoTrangThai } from '../chuoi';
import { moFormSuKien } from './formSuKien';

function FormYeuCau({ pt }: { pt: PhanTichCuoc }) {
  const [noiDung, setNoiDung] = useState('');
  const [ngay, setNgay] = useState(homNay.value);
  const [gio, setGio] = useState(bayGio.value.slice(11, 16));
  return (
    <div class="hang" style={{ alignItems: 'flex-end' }}>
      <Truong nhan="Tài liệu yêu cầu NNT cung cấp" id="yc-nd">
        <input id="yc-nd" type="text" value={noiDung} onInput={(e) => setNoiDung((e.target as HTMLInputElement).value)} />
      </Truong>
      <ChonNgay id="yc-ngay" nhan="Gửi ngày" gia={ngay} doi={(v) => v && setNgay(v)} canhBaoNghi={false} />
      <Truong nhan="Lúc" id="yc-gio">
        <input id="yc-gio" type="time" value={gio} onInput={(e) => setGio((e.target as HTMLInputElement).value)} />
      </Truong>
      <div class="truong">
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!noiDung.trim() || !ngay}
          onClick={async () => {
            const y: YeuCauTaiLieu = { id: crypto.randomUUID(), noiDung: noiDung.trim(), guiLuc: `${ngay}T${gio}` };
            await capNhatCuoc(pt.cuoc.id, (c) => themYeuCauVaoCuoc(c, y));
            setNoiDung('');
            toast('Đã ghi yêu cầu – đồng hồ 06 giờ làm việc bắt đầu chạy');
          }}
        >
          ＋ Thêm yêu cầu
        </button>
      </div>
    </div>
  );
}

function DongYeuCau({ pt, y }: { pt: PhanTichCuoc; y: YeuCauTaiLieu }) {
  const d = dongHoYeuCau(lich.value, pt.bo, y, bayGio.value);
  const quaHan = d.trangThai === 'QUA_HAN';
  return (
    <li class={`dong-yc ${quaHan ? 'qua-han' : ''}`}>
      <div>
        <div class="dam">{y.noiDung}</div>
        <div class="phu">Gửi {dinhDangNgayGio(y.guiLuc)} · hạn {dinhDangNgayGio(d.han)}</div>
        <div>
          <NhanSLA
            muc={y.nhanLuc ? (d.trangThai === 'DA_NHAN_TRE' ? 'XONG_TRE' : 'XONG_DUNG_HAN') : quaHan ? 'QUA_HAN' : d.trangThai === 'SAP_HET' ? 'HOM_NAY_NGAY_MAI' : 'CON_LAU'}
            chu={y.nhanLuc ? `${d.nhan} (${dinhDangNgayGio(y.nhanLuc)})` : d.nhan}
          />
        </div>
        {quaHan && d.goiY && <p class="the loi" style={{ padding: 8, marginTop: 8 }}>⚠ Gợi ý lập biên bản VPHC: {d.goiY}</p>}
      </div>
      <div class="hang-nut">
        {y.nhanLuc ? (
          <button type="button" class="nut nut-nho" onClick={() => void capNhatCuoc(pt.cuoc.id, (c) => danhDauNhanTaiLieu(c, y.id, undefined))}>Bỏ “đã nhận”</button>
        ) : (
          <button type="button" class="nut nut-nho nut-chinh" onClick={() => void capNhatCuoc(pt.cuoc.id, (c) => danhDauNhanTaiLieu(c, y.id, bayGioTuDate()))}>Đã nhận</button>
        )}
        <button
          type="button"
          class="nut nut-nho"
          aria-label={`Xóa yêu cầu ${y.noiDung}`}
          onClick={async () => {
            if (!(await xacNhan({ tieuDe: 'Xóa yêu cầu này?', nutChinh: 'Xóa', nguyHiem: true }))) return;
            await capNhatCuoc(pt.cuoc.id, (c) => xoaYeuCauKhoiCuoc(c, y.id));
            toast('Đã xóa yêu cầu', 'thanhCong', () => void capNhatCuoc(pt.cuoc.id, (c) => themYeuCauVaoCuoc(c, y)));
          }}
        >
          Xóa
        </button>
      </div>
    </li>
  );
}

function CardVuongMac({ pt, v }: { pt: PhanTichCuoc; v: VuongMac }) {
  const chang = dongHoVuongMac(lich.value, pt.bo, v, homNay.value);
  const dang = changDangChay(chang);
  const luu = (p: Partial<VuongMac>) => capNhatCuoc(pt.cuoc.id, (c) => datVuongMacVaoCuoc(c, { ...v, ...p }));
  const THUOC: { truong: 'ngayLanhDaoBaoCao' | 'ngayNhanYKien' | 'ngayTongHop'; nhan: string }[] = [
    { truong: 'ngayLanhDaoBaoCao', nhan: 'Lãnh đạo bộ phận đã chỉ đạo/xin ý kiến người ra QĐ' },
    { truong: 'ngayNhanYKien', nhan: 'Đã nhận ý kiến (văn bản lấy ý kiến đã gửi)' },
    { truong: 'ngayTongHop', nhan: 'Đoàn đã tổng hợp báo cáo' },
  ];
  return (
    <section class="the" aria-label={`Vướng mắc: ${v.noiDung}`}>
      <div class="hang-nut" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{v.noiDung}</h3>
        <span class="phu">Báo cáo {chuNgay(v.ngayBaoCao)}</span>
      </div>
      <ol class="chang-vm">
        {chang.map((c, i) => (
          <li key={c.ma}>
            <div>
              <span class="dam">{c.ten}</span>
              <div class="phu">
                {c.tu ? `Từ ${chuNgay(c.tu)} · hạn ${chuNgay(c.han)}` : 'Chưa bắt đầu'}
                {c.ngayXong ? ` · xong ${chuNgay(c.ngayXong)}` : ''}
              </div>
              {c.tu && <NhanSLA muc={nhanTheoTrangThai(c.trangThai)} chu={c.trangThai === 'XONG_TRE' ? 'Xong trễ' : c.trangThai === 'XONG_DUNG_HAN' ? 'Đúng hạn' : undefined} />}
            </div>
            {c.tu && !v.daXong && (
              <ChonNgay
                id={`vm-${v.id}-${i}`}
                nhan={THUOC[i].nhan}
                gia={(v[THUOC[i].truong] as string | undefined) ?? ''}
                doi={(d) => void luu({ [THUOC[i].truong]: d || undefined, ...(i === 2 && d ? { daXong: true } : {}) })}
                canhBaoNghi={false}
                goiY={dang?.ma === c.ma ? 'Chặng đang chạy' : undefined}
              />
            )}
          </li>
        ))}
      </ol>
      <div class="hang-nut">
        <button type="button" class="nut nut-nho" onClick={() => moFormSuKien(pt.cuoc.id, 'PHU_LUC_BB')}>Lập phụ lục biên bản (16/KTT)</button>
        <button type="button" class="nut nut-nho" onClick={() => void luu({ daXong: !v.daXong })}>{v.daXong ? 'Mở lại' : 'Đóng vướng mắc'}</button>
        <button
          type="button"
          class="nut nut-nho"
          onClick={async () => {
            if (!(await xacNhan({ tieuDe: 'Xóa vướng mắc này?', nutChinh: 'Xóa', nguyHiem: true }))) return;
            await capNhatCuoc(pt.cuoc.id, (c) => xoaVuongMacKhoiCuoc(c, v.id));
            toast('Đã xóa vướng mắc', 'thanhCong', () => void capNhatCuoc(pt.cuoc.id, (c) => datVuongMacVaoCuoc(c, v)));
          }}
        >
          Xóa
        </button>
      </div>
    </section>
  );
}

function FormVuongMac({ pt }: { pt: PhanTichCuoc }) {
  const [nd, setNd] = useState('');
  const [ngay, setNgay] = useState(homNay.value);
  return (
    <div class="hang" style={{ alignItems: 'flex-end' }}>
      <Truong nhan="Nội dung vướng mắc cần xin ý kiến" id="vm-nd">
        <input id="vm-nd" type="text" value={nd} onInput={(e) => setNd((e.target as HTMLInputElement).value)} />
      </Truong>
      <ChonNgay id="vm-ngay" nhan="Ngày đoàn báo cáo lãnh đạo bộ phận" gia={ngay} doi={(v) => v && setNgay(v)} canhBaoNghi={false} />
      <div class="truong">
        <button
          type="button"
          class="nut nut-chinh"
          disabled={!nd.trim() || !ngay}
          onClick={async () => {
            await capNhatCuoc(pt.cuoc.id, (c) => datVuongMacVaoCuoc(c, { id: crypto.randomUUID(), noiDung: nd.trim(), ngayBaoCao: ngay, daXong: false }));
            setNd('');
            toast('Đã ghi vướng mắc – 3 đồng hồ 02 ngày làm việc bắt đầu chạy');
          }}
        >
          ＋ Thêm vướng mắc
        </button>
      </div>
    </div>
  );
}

export function TabTaiLieu({ pt }: { pt: PhanTichCuoc }) {
  const c = pt.cuoc;
  const gio = pt.bo.dongHo.YEU_CAU_TAI_LIEU.so;
  return (
    <div>
      <section class="the" aria-label="Yêu cầu tài liệu">
        <h3>Yêu cầu NNT cung cấp tài liệu</h3>
        <p class="phu">NNT phải cung cấp trong <b>{String(gio).padStart(2, '0')} giờ làm việc</b> (theo giờ làm việc trong Cài đặt) kể từ lúc gửi yêu cầu. Quá hạn: gợi ý lập biên bản vi phạm hành chính.</p>
        <FormYeuCau pt={pt} />
        {c.yeuCauTaiLieu.length === 0 ? <TrangThaiRong tieuDe="Chưa có yêu cầu tài liệu nào" /> : <ul class="ds-yc">{c.yeuCauTaiLieu.map((y) => <DongYeuCau key={y.id} pt={pt} y={y} />)}</ul>}
      </section>
      <h3 style={{ margin: '16px 0 8px' }}>Vướng mắc cần xin ý kiến</h3>
      <section class="the">
        <p class="phu">Lãnh đạo bộ phận chỉ đạo/xin ý kiến người ra QĐ ≤ 02 NLV; gửi văn bản lấy ý kiến ≤ 02 NLV; đoàn tổng hợp báo cáo sau khi nhận ý kiến ≤ 02 NLV.</p>
        <FormVuongMac pt={pt} />
      </section>
      {c.vuongMac.length === 0 ? <TrangThaiRong tieuDe="Chưa có vướng mắc nào" /> : c.vuongMac.map((v) => <CardVuongMac key={v.id} pt={pt} v={v} />)}
    </div>
  );
}
