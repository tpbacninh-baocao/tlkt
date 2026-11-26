import { moBang, soNhacChuaXem } from './store';
import { TrangThaiRong } from './thanhPhan';

/** Danh sách nhắc ở chuông 🔔 – bản đầy đủ ở T33. */
export function moChuongNhac(): void {
  soNhacChuaXem.value = 0;
  moBang({
    id: 'chuong-nhac',
    tieuDe: 'Nhắc việc',
    noiDung: () => <TrangThaiRong tieuDe="Chưa có nhắc nào" moTa="Các nhắc đến giờ sẽ hiện ở đây." />,
  });
}
