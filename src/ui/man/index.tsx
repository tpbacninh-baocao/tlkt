// Bảng ánh xạ route → màn hình.
import { route } from '../store';
import { ManTam } from './manTam';
import { ManHomNay } from './homNay';
import { ManCuoc } from './dsCuoc';

export function ManHienTai() {
  const r = route.value;
  switch (r.man) {
    case 'hom-nay':
      return <ManHomNay />;
    case 'cuoc':
      return <ManCuoc />;
    default:
      return <ManTam ten={r.man} />;
  }
}
