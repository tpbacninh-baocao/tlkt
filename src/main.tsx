import { render } from 'preact';
import './ui/tokens.css';
import './ui/app.css';
import { UngDung } from './ui/app';
import { khoiDong } from './ui/store';

render(<UngDung />, document.getElementById('app')!);
void khoiDong();
