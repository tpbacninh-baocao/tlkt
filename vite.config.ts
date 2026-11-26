/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  plugins: [preact()],
  define: {
    __PHIEN_BAN__: JSON.stringify(pkg.version),
    __NGAY_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
  },
});
