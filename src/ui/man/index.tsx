// Bảng ánh xạ route → màn hình.
import { route } from '../store';
import { ManHomNay } from './homNay';
import { ManCuoc } from './dsCuoc';
import { ManChiTietCuoc } from './chiTietCuoc';
import { ManNhapLieu } from './nhapLieu';
import { ManLich } from './lich';
import { ManViec } from './viec';
import { ManKeHoachNgay } from './keHoachNgay';
import { ManKeHoachNam } from './keHoachNam';
import { ManBaoCao } from './baoCao';
import { ManCaiDat } from './caiDat';
import { ManCanCu } from './canCu';
import { ManGioiThieu } from './gioiThieu';
import { ManKiemThu } from './kiemThu';
import { ManThungRac } from './thungRac';

export function ManHienTai() {
  const r = route.value;
  switch (r.man) {
    case 'hom-nay':
      return <ManHomNay />;
    case 'cuoc':
      return <ManCuoc />;
    case 'cuoc-chi-tiet':
      return <ManChiTietCuoc id={r.id} tab={r.tab} />;
    case 'nhap-lieu':
      return <ManNhapLieu />;
    case 'lich':
      return <ManLich />;
    case 'viec':
      return <ManViec />;
    case 'ke-hoach-ngay':
      return <ManKeHoachNgay />;
    case 'ke-hoach-nam':
      return <ManKeHoachNam />;
    case 'bao-cao':
      return <ManBaoCao />;
    case 'cai-dat':
      return <ManCaiDat />;
    case 'can-cu':
      return <ManCanCu />;
    case 'gioi-thieu':
      return <ManGioiThieu />;
    case 'kiem-thu':
      return <ManKiemThu />;
    case 'thung-rac':
      return <ManThungRac />;
  }
}
