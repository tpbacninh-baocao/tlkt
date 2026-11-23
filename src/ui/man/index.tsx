// Bảng ánh xạ route → màn hình.
import { route } from '../store';
import { ManTam } from './manTam';
import { ManHomNay } from './homNay';
import { ManCuoc } from './dsCuoc';
import { ManChiTietCuoc } from './chiTietCuoc';
import { ManNhapLieu } from './nhapLieu';
import { ManLich } from './lich';

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
    default:
      return <ManTam ten={r.man} />;
  }
}
