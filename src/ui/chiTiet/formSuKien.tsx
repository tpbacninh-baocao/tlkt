import type { LoaiSuKien } from '../../core/kieu';
import { diDen } from '../store';

/** Mở tab Sự kiện của cuộc (form chi tiết 11 loại ở T23). */
export function moFormSuKien(cuocId: string, _loai?: LoaiSuKien): void {
  diDen(`#cuoc-${cuocId}/su-kien`);
}
