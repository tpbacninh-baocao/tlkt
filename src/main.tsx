import { render } from 'preact';
// Phông chữ cài sẵn trong app (không tải từ mạng) để dùng được offline
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import './ui/tokens.css';
import './ui/app.css';
import { UngDung } from './ui/app';
import { khoiDong } from './ui/store';
import { khoiDongPwa } from './ui/pwa';

render(<UngDung />, document.getElementById('app')!);
void khoiDong();
khoiDongPwa();
