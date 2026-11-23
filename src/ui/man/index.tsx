// Bảng ánh xạ route → màn hình.
import { route } from '../store';
import { ManTam } from './manTam';
import { ManHomNay } from './homNay';

export function ManHienTai() {
  const r = route.value;
  switch (r.man) {
    case 'hom-nay':
      return <ManHomNay />;
    default:
      return <ManTam ten={r.man} />;
  }
}
