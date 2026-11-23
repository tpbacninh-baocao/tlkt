// Bảng ánh xạ route → màn hình.
import { route } from '../store';
import { ManTam } from './manTam';

export function ManHienTai() {
  const r = route.value;
  switch (r.man) {
    case 'hom-nay':
      return <ManTam ten="Hôm nay" />;
    default:
      return <ManTam ten={r.man} />;
  }
}
