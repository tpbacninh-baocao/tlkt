// E2E bằng Playwright: khởi động lần đầu → dữ liệu mẫu → tạo cuộc mới → đi hết cuộc đến hoàn thành → kiểm tra không lỗi console.
// Chạy:  npm run build && npx vite preview --port 4173 &   rồi   node e2e/luong-chinh.cjs [http://localhost:4173/]
// Cần Playwright + Chromium cài sẵn trong máy (không phải thư viện của dự án).
const { chromium } = require('playwright');
const GOC = process.argv[2] || 'http://localhost:4173/';
const loi = [];
const ghi = (s) => console.log(s);
const kiem = (dk, mo) => {
  if (!dk) { loi.push(mo); ghi('✗ ' + mo); } else ghi('✓ ' + mo);
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => loi.push('pageerror: ' + e));
  p.on('console', (m) => { if (m.type() === 'error') loi.push('console: ' + m.text()); });
  const di = async (h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(500); };
  const anNhac = async () => { for (let i = 0; i < 5; i++) { const n = p.locator('.vung-nhac-noi button:has-text("Ẩn")'); if (!(await n.count())) break; await n.first().click(); } };

  // 1. Khởi động lần đầu – onboarding
  await p.goto(GOC); await p.waitForTimeout(1200);
  kiem(await p.getByText('Chào bạn, mình là Trợ lý Đoàn kiểm tra').count() > 0, 'Lần đầu mở: hiện màn chào');
  await p.getByLabel(/Họ và tên/).fill('Nguyễn Văn A');
  await p.getByLabel(/Chức vụ/).fill('Chuyên viên');
  await p.getByLabel(/Đơn vị/).fill('Phòng Kiểm tra');
  for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /Tiếp/ }).click();
  await p.waitForTimeout(300);
  await p.getByRole('button', { name: /dữ liệu mẫu/i }).click();
  await p.waitForTimeout(1800);
  kiem((await p.locator('h1').first().textContent()) === 'Hôm nay', 'Vào màn Hôm nay sau onboarding');
  await anNhac();

  // 2. Dữ liệu mẫu đã nạp
  await di('#cuoc');
  const soMau = await p.locator('a[href^="#cuoc-"]').count();
  kiem(soMau >= 6, `Dữ liệu mẫu: ${soMau} cuộc`);

  // 3. Tạo cuộc mới
  await p.getByRole('button', { name: /Thêm cuộc/ }).first().click(); await p.waitForTimeout(400);
  await p.fill('#c-mst', '0100009999');
  await p.fill('#c-ten', 'Công ty E2E Thử nghiệm');
  await p.getByRole('button', { name: /Tiếp/ }).click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: /Tiếp/ }).click(); await p.waitForTimeout(200);
  await p.fill('#c-td', 'Nguyễn Văn A');
  await p.getByRole('button', { name: /Lưu cuộc/ }).click(); await p.waitForTimeout(800);
  kiem(/#cuoc-/.test(await p.evaluate(() => location.hash)), 'Lưu cuộc mới → mở chi tiết cuộc');
  const idCuoc = (await p.evaluate(() => location.hash)).slice(1);
  await di('#cuoc');
  kiem(await p.locator(`a[href="#${idCuoc}"]`).count() > 0, 'Cuộc mới có trong danh sách');
  await di('#' + idCuoc);

  // 4. Đi hết cuộc: bấm “Xong…” bước đầu tiên còn bấm được cho đến khi hết
  let soBuoc = 0;
  const nhatKy = [];
  for (let vong = 0; vong < 60; vong++) {
    await anNhac();
    const nut = p.locator('.buoc-dong button:has-text("Xong…"):not([disabled])').first();
    if (!(await nut.count())) break;
    const ten = (await nut.locator('xpath=ancestor::li').locator('.dam').first().textContent()) || '';
    await nut.click(); await p.waitForTimeout(250);
    const lyDo = p.locator('#xong-ly-do');
    if (await lyDo.count()) await lyDo.fill('Lý do trễ thử nghiệm');
    if (await p.locator('input[name="loai-vb"]').count()) await p.locator('input[name="loai-vb"]').first().check();
    const luu = p.getByRole('button', { name: 'Lưu', exact: true });
    if (await luu.isDisabled()) { nhatKy.push(`Không lưu được: ${ten.trim()}`); await p.getByRole('button', { name: 'Hủy' }).click(); break; }
    await luu.click(); await p.waitForTimeout(350);
    soBuoc++;
    nhatKy.push(ten.trim());
  }
  ghi('  Các bước đã đánh dấu: ' + nhatKy.join(' → '));
  kiem(soBuoc >= 8, `Đã đánh dấu xong ${soBuoc} bước`);
  kiem((await p.locator('body').innerText()).includes('Giai đoạn: Hoàn thành'), 'Cuộc ở giai đoạn Hoàn thành');
  const conLai = await p.locator('.buoc-dong button:has-text("Xong…"):not([disabled])').count();
  kiem(conLai === 0, 'Không còn bước nào bấm được');
  await p.screenshot({ path: '/tmp/e2e-cuoi.png', fullPage: true });

  // 5. Các màn chính mở được, không lỗi
  for (const h of ['#hom-nay', '#cuoc', '#lich', '#viec', '#ke-hoach-ngay', '#ke-hoach-nam', '#nhap-lieu', '#bao-cao', '#cai-dat/ho-so', '#cai-dat/quy-tac', '#can-cu', '#thung-rac', '#gioi-thieu', '#kiem-thu']) {
    await di(h);
    kiem((await p.locator('main, #noi-dung').first().innerText().catch(() => 'x')).length > 5, `Màn ${h} có nội dung`);
  }
  await di('#kiem-thu');
  kiem((await p.locator('#kq-tong').textContent()).includes('Đạt'), 'Kiểm thử trong app đạt');

  kiem(loi.length === 0 || loi.every((x) => x.startsWith('✗')), 'Không có lỗi console/trang');
  const that = loi.filter((x) => !x.startsWith('✗'));
  if (that.length) ghi('Lỗi: ' + that.join('\n'));
  await b.close();
  process.exit(loi.length ? 1 : 0);
})();
