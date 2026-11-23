// Áp dụng giao diện Sáng/Tối/Theo hệ thống và cỡ chữ.
import type { CaiDat } from '../core/kieu';

export function laTroiToi(g: CaiDat['giaoDien']): boolean {
  if (g === 'toi') return true;
  if (g === 'sang') return false;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function apDungGiaoDien(g: CaiDat['giaoDien'], chuLon?: boolean): void {
  if (typeof document === 'undefined') return;
  const toi = laTroiToi(g);
  const el = document.documentElement;
  el.dataset.theme = toi ? 'toi' : 'sang';
  if (chuLon) el.dataset.coChu = 'lon';
  else delete el.dataset.coChu;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', toi ? '#0B1220' : '#FAF7F2');
}
