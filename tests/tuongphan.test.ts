// Độ tương phản chữ/nền theo WCAG AA (≥ 4,5:1) cho các cặp màu trong src/ui/tokens.css – cả giao diện Sáng và Tối.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/ui/tokens.css', 'utf8');

function khoi(sel: RegExp): Record<string, string> {
  const m = sel.exec(css);
  if (!m) throw new Error('Không thấy khối ' + sel);
  const ra: Record<string, string> = {};
  for (const [, k, v] of m[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) ra[k] = v;
  return ra;
}
const sang = khoi(/:root,\s*:root\[data-theme='sang'\]\s*\{([^}]*)\}/);
const toi = { ...sang, ...khoi(/:root\[data-theme='toi'\]\s*\{([^}]*)\}/) };

function sangTuongDoi(hex: string): number {
  const h = hex.replace('#', '');
  const c = (i: number) => parseInt(h.length === 3 ? h[i] + h[i] : h.slice(i * 2, i * 2 + 2), 16) / 255;
  const f = (x: number) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c(0)) + 0.7152 * f(c(1)) + 0.0722 * f(c(2));
}
function tyLe(a: string, b: string): number {
  const [x, y] = [sangTuongDoi(a), sangTuongDoi(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const CAP: [string, string][] = [
  ['chu', 'nen'],
  ['chu', 'be-mat-2'],
  ['chu-phu', 'nen'],
  ['chu-phu', 'be-mat-2'],
  ['tren-chinh', 'chinh'],
  ['chinh', 'nen'],
  ['sla-xanh-chu', 'nen'],
  ['sla-vang-chu', 'nen'],
  ['sla-cam-chu', 'nen'],
  ['sla-do-chu', 'nen'],
  ['sla-tre-chu', 'nen'],
  ['sla-xam-chu', 'nen'],
  ['sla-do-dam', 'sla-do-dam-nen'],
  ['chu-canh-bao', 'nen-canh-bao'],
];
const CAP_SANG_THEM: [string, string][] = [
  ['chu', 'be-mat'],
  ['chu-phu', 'be-mat'],
  ['sla-xanh-chu', 'be-mat'],
  ['sla-vang-chu', 'be-mat'],
  ['sla-cam-chu', 'be-mat'],
  ['sla-do-chu', 'be-mat'],
];

describe('Tương phản WCAG AA (≥ 4,5:1)', () => {
  for (const [ten, bang, ds] of [['Sáng', sang, [...CAP, ...CAP_SANG_THEM]], ['Tối', toi, CAP]] as const) {
    for (const [fg, bg] of ds) {
      it(`${ten}: --${fg} trên --${bg}`, () => {
        if (!bang[fg] || !bang[bg]) throw new Error(`Thiếu biến --${fg} hoặc --${bg}`);
        const r = tyLe(bang[fg], bang[bg]);
        expect(r, `${bang[fg]} / ${bang[bg]} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
