import { render } from 'preact';

function App() {
  return <main style={{ fontFamily: 'system-ui', padding: 24 }}><h1>TLKT</h1><p>Trợ lý Đoàn kiểm tra</p></main>;
}

render(<App />, document.getElementById('app')!);
