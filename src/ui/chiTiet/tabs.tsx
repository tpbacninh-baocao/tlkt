import { TrangThaiRong } from '../thanhPhan';
import type { PhanTichCuoc } from '../../core/tomTat';

function Tam({ ten }: { ten: string }) {
  return <TrangThaiRong tieuDe={ten} moTa="Mục này đang được xây dựng." />;
}
export const TabNhapHeThong = (_: { pt: PhanTichCuoc }) => <Tam ten="Nhập hệ thống" />;
export const TabNhatKy = (_: { pt: PhanTichCuoc }) => <Tam ten="Nhật ký" />;
export const TabTaiLieu = (_: { pt: PhanTichCuoc }) => <Tam ten="Tài liệu & vướng mắc" />;
export const TabKetQua = (_: { pt: PhanTichCuoc }) => <Tam ten="Kết quả & nộp tiền" />;
export const TabLuuTru = (_: { pt: PhanTichCuoc }) => <Tam ten="Hồ sơ lưu trữ" />;
export const TabLichSu = (_: { pt: PhanTichCuoc }) => <Tam ten="Lịch sử sửa" />;
