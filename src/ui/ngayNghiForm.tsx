// Nhập lịch nghỉ (Tết, Giỗ Tổ, nghỉ bù) và ngày làm bù của một năm bằng cách dán danh sách.
import { useState } from 'preact/hooks';
import { dinhDangNgay, docDanhSachNgay, ngayNghiCuaNam, tenThu } from '../core/lich';
import { caiDat, dongBang, lich, toast } from './store';
import { luuNgayNghiNam } from './hanhDong';
import { Truong } from './thanhPhan';
import { docTep } from '../data/excel';

export function FormNgayNghiNam({ nam, khiXong, idBang }: { nam: number; khiXong?: () => void; idBang?: string }) {
  const nghiHienCo = caiDat.value.ngayNghiThem.filter((d) => d.startsWith(`${nam}-`)).map(dinhDangNgay).join('\n');
  const lamBuHienCo = caiDat.value.ngayLamBu.filter((d) => d.startsWith(`${nam}-`)).map(dinhDangNgay).join('\n');
  const [nghi, setNghi] = useState(nghiHienCo);
  const [lamBu, setLamBu] = useState(lamBuHienCo);
  const [dangLuu, setDangLuu] = useState(false);
  const rN = docDanhSachNgay(nghi, nam);
  const rB = docDanhSachNgay(lamBu, nam);
  const sai = (r: { ngay: string[] }) => r.ngay.filter((d) => !d.startsWith(`${nam}-`));
  const loi = [...rN.loi, ...rB.loi];
  const ngoaiNam = [...sai(rN), ...sai(rB)];
  const coThe = loi.length === 0 && ngoaiNam.length === 0;
  const cacLeCoDinh = ngayNghiCuaNam(lich.value, nam).filter((d) => !caiDat.value.ngayNghiThem.includes(d.ngay));

  const nhapTuTep = async (f: File | undefined) => {
    if (!f) return;
    try {
      const ds = await docTep(f);
      const ngay = ds.flatMap((t) => t.rows.flat()).map((x) => x.trim()).filter(Boolean);
      const hop = docDanhSachNgay(ngay.join('\n'), nam);
      if (!hop.ngay.length) throw new Error('Không thấy ngày nào trong tệp (cần định dạng dd/mm/yyyy).');
      setNghi([...new Set([...docDanhSachNgay(nghi, nam).ngay, ...hop.ngay])].sort().map(dinhDangNgay).join('\n'));
      toast(`Đã đọc ${hop.ngay.length} ngày từ tệp – kiểm tra rồi bấm Lưu`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không đọc được tệp', 'loi');
    }
  };

  const luu = async () => {
    setDangLuu(true);
    try {
      await luuNgayNghiNam(nam, rN.ngay, rB.ngay);
      toast(`Đã lưu lịch nghỉ năm ${nam}: ${rN.ngay.length} ngày nghỉ, ${rB.ngay.length} ngày làm bù`);
      if (idBang) dongBang(idBang);
      khiXong?.();
    } finally {
      setDangLuu(false);
    }
  };
  return (
    <div>
      <p class="phu">
        Dán danh sách ngày, mỗi ngày một dòng hoặc cách nhau dấu phẩy: <b>dd/mm/yyyy</b>. Khoảng ngày viết dạng <b>06/02/2027 - 14/02/2027</b>. Ngày lễ dương lịch cố định (01/01, 30/04, 01/05, 02/09) đã có sẵn.
      </p>
      {cacLeCoDinh.length > 0 && (
        <p class="phu">
          Đã có sẵn: {cacLeCoDinh.map((d) => `${dinhDangNgay(d.ngay).slice(0, 5)} (${d.ten})`).join(', ')}
        </p>
      )}
      <Truong nhan={`Ngày nghỉ năm ${nam} (Tết Nguyên đán, Giỗ Tổ, nghỉ bù…)`} id="nghi-nam">
        <textarea id="nghi-nam" value={nghi} rows={5} placeholder={'06/02/2027 - 14/02/2027\n18/04/2027'} onInput={(e) => setNghi((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      <Truong nhan="Ngày làm bù (thứ Bảy/Chủ nhật đi làm)" id="lam-bu-nam">
        <textarea id="lam-bu-nam" value={lamBu} rows={3} onInput={(e) => setLamBu((e.target as HTMLTextAreaElement).value)} />
      </Truong>
      <Truong nhan="Hoặc nhập từ tệp Excel/CSV (cột chứa ngày nghỉ)" id="nghi-tep">
        <input id="nghi-tep" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void nhapTuTep((e.target as HTMLInputElement).files?.[0])} />
      </Truong>
      {rN.ngay.length > 0 && (
        <p class="phu">
          Đọc được {rN.ngay.length} ngày nghỉ: {rN.ngay.slice(0, 6).map((d) => `${dinhDangNgay(d).slice(0, 5)} (${tenThu(d)})`).join(', ')}
          {rN.ngay.length > 6 ? '…' : ''}
        </p>
      )}
      {loi.length > 0 && <p class="loi-truong">Không đọc được: {loi.join(', ')}</p>}
      {ngoaiNam.length > 0 && <p class="loi-truong">Có ngày không thuộc năm {nam}: {ngoaiNam.map(dinhDangNgay).join(', ')}</p>}
      <div class="hang-nut phai">
        <button type="button" class="nut" onClick={() => (idBang ? dongBang(idBang) : khiXong?.())}>
          Để sau
        </button>
        <button type="button" class="nut nut-chinh" disabled={!coThe || dangLuu} onClick={() => void luu()}>
          {dangLuu ? 'Đang lưu…' : 'Lưu lịch nghỉ'}
        </button>
      </div>
    </div>
  );
}
