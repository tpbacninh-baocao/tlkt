// Kiểm tra truy cập tự động bằng axe-core (WCAG 2.1 A/AA) trên mọi màn hình ở 2 khổ và 2 giao diện + thử bàn phím.
// Chạy:  npm run build && npx vite preview --port 4173 &   rồi   node e2e/truy-cap.cjs [http://localhost:4173/]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const GOC = process.argv[2] || 'http://localhost:4173/';
const AXE = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const MAN = ['#hom-nay', '#cuoc', '#lich', '#viec', '#ke-hoach-ngay', '#ke-hoach-nam', '#nhap-lieu', '#bao-cao', '#cai-dat/ho-so', '#cai-dat/quy-tac', '#cai-dat/nhac-viec', '#cai-dat/bao-mat', '#cai-dat/giao-dien', '#cai-dat/sao-luu', '#can-cu', '#thung-rac', '#gioi-thieu', '#kiem-thu'];
const loi = [];
const kiem = (dk, mo) => { console.log((dk ? '✓ ' : '✗ ') + mo); if (!dk) loi.push(mo); };

(async () => {
  const b = await chromium.launch();
  for (const [ten, w, h] of [['điện thoại', 390, 844], ['máy tính', 1440, 900]]) {
    for (const giaoDien of ['sang', 'toi']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: giaoDien === 'toi' ? 'dark' : 'light' });
      const p = await ctx.newPage();
      await p.goto(GOC); await p.waitForTimeout(1000);
      await p.getByLabel(/Họ và tên/).fill('Nguyễn Văn A');
      for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /Tiếp/ }).click();
      await p.getByRole('button', { name: /dữ liệu mẫu/i }).click(); await p.waitForTimeout(1800);
      if (giaoDien === 'toi') { await p.evaluate(() => { location.hash = '#cai-dat/giao-dien'; }); await p.waitForTimeout(300); await p.getByLabel('Tối').check(); }
      await p.addScriptTag({ content: AXE });
      const man = [...MAN];
      for (const hash of man) {
        await p.evaluate((x) => { location.hash = x; }, hash); await p.waitForTimeout(450);
        await p.evaluate(() => document.querySelectorAll('.vung-nhac-noi button').forEach((n) => n.textContent === 'Ẩn' && n.click()));
        const kq = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })).violations.map((v) => ({ id: v.id, tacDong: v.impact, so: v.nodes.length, vd: v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]), })));
        kiem(kq.length === 0, `${ten}/${giaoDien} ${hash}${kq.length ? ' → ' + JSON.stringify(kq) : ''}`);
      }
      await ctx.close();
    }
  }

  // Bàn phím trên máy tính
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(GOC); await p.waitForTimeout(1000);
  await p.getByText('Bỏ qua, dùng ngay').click(); await p.waitForTimeout(500);
  await p.reload(); await p.waitForTimeout(1000);
  await p.keyboard.press('Tab');
  kiem(await p.evaluate(() => /bỏ qua/i.test(document.activeElement?.textContent || '')), 'Tab đầu tiên rơi vào liên kết “Bỏ qua tới nội dung”');
  // Mở form thêm cuộc bằng bàn phím, Esc đóng, focus quay về
  await p.evaluate(() => { location.hash = '#cuoc'; }); await p.waitForTimeout(500);
  const nut = p.getByRole('button', { name: /Thêm cuộc/ }).first();
  await nut.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  kiem(await p.locator('[role=dialog]').count() > 0, 'Enter trên nút mở hộp thoại');
  kiem(await p.evaluate(() => !!document.activeElement?.closest('[role=dialog]')), 'Focus nằm trong hộp thoại khi mở');
  for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
  kiem(await p.evaluate(() => !!document.activeElement?.closest('[role=dialog]')), 'Tab không thoát khỏi hộp thoại (bẫy focus)');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  kiem(await p.locator('[role=dialog]').count() === 0, 'Esc đóng hộp thoại');
  kiem(await p.evaluate(() => document.activeElement && document.activeElement !== document.body), 'Sau khi đóng, focus không rơi về body');
  // Vòng focus nhìn thấy được
  await p.keyboard.press('Tab');
  const vien = await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  kiem(vien, 'Phần tử đang focus có viền ≥ 2px');
  // Phóng chữ 200%
  await p.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => { location.hash = '#hom-nay'; }); await p.waitForTimeout(500);
  kiem(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Phóng chữ 200% ở 390 px: không tràn ngang trang');
  await b.close();
  console.log(loi.length ? `\n${loi.length} mục chưa đạt` : '\nTất cả đạt');
  process.exit(loi.length ? 1 : 0);
})();
