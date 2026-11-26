// Chụp ảnh mọi màn hình ở 390×844 (điện thoại) và 1440×900 (máy tính) vào docs/anh-chup/.
// Chạy:  npm run build && npx vite preview --port 4173 &   rồi   node e2e/chup-anh.cjs [http://localhost:4173/]
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const GOC = process.argv[2] || 'http://localhost:4173/';
const RA = path.join(__dirname, '..', 'docs', 'anh-chup');
fs.mkdirSync(RA, { recursive: true });

const MAN = [
  ['01-hom-nay', '#hom-nay'],
  ['02-cuoc-danh-sach', '#cuoc'],
  ['03-cuoc-kanban', '#cuoc', 'Kanban'],
  ['04-cuoc-dong-thoi-gian', '#cuoc', 'Dòng thời gian'],
  ['05-lich', '#lich'],
  ['06-viec', '#viec'],
  ['07-ke-hoach-ngay', '#ke-hoach-ngay'],
  ['08-ke-hoach-nam', '#ke-hoach-nam'],
  ['09-nhap-lieu', '#nhap-lieu'],
  ['10-bao-cao', '#bao-cao'],
  ['11-cai-dat-ho-so', '#cai-dat/ho-so'],
  ['12-cai-dat-quy-tac', '#cai-dat/quy-tac'],
  ['13-cai-dat-nhac-viec', '#cai-dat/nhac-viec'],
  ['14-cai-dat-bao-mat', '#cai-dat/bao-mat'],
  ['15-cai-dat-giao-dien', '#cai-dat/giao-dien'],
  ['16-cai-dat-sao-luu', '#cai-dat/sao-luu'],
  ['17-can-cu', '#can-cu'],
  ['18-thung-rac', '#thung-rac'],
  ['19-gioi-thieu', '#gioi-thieu'],
  ['20-kiem-thu', '#kiem-thu'],
];

(async () => {
  const b = await chromium.launch();
  const loi = [];
  for (const [ten, rong, cao] of [['dien-thoai', 390, 844], ['may-tinh', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: rong, height: cao }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => loi.push(`${ten}: ${e}`));
    p.on('console', (m) => m.type() === 'error' && loi.push(`${ten}: ${m.text()}`));
    const di = async (h) => { await p.evaluate((x) => { location.hash = x; }, h); await p.waitForTimeout(500); };
    const an = async () => { for (let i = 0; i < 6; i++) { const n = p.locator('.vung-nhac-noi button:has-text("Ẩn")'); if (!(await n.count())) break; await n.first().click(); } };
    const chup = async (t) => { await an(); await p.screenshot({ path: path.join(RA, `${ten}-${t}.png`) }); };

    await p.goto(GOC); await p.waitForTimeout(1200);
    await chup('00-chao');
    await p.getByLabel(/Họ và tên/).fill('Nguyễn Văn A');
    for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /Tiếp/ }).click();
    await p.getByRole('button', { name: /dữ liệu mẫu/i }).click(); await p.waitForTimeout(2000);
    await p.evaluate(() => { window.__nhac = document.querySelectorAll('.vung-nhac-noi .the-nhac').length; });
    await p.screenshot({ path: path.join(RA, `${ten}-01a-hom-nay-co-nhac-noi.png`) });
    for (const [t, h, nut] of MAN) {
      await di(h);
      if (nut) await p.getByRole('button', { name: nut, exact: true }).click().then(() => p.waitForTimeout(500)).catch(() => undefined);
      await chup(t);
      if (nut) await p.getByRole('button', { name: 'Danh sách', exact: true }).click().catch(() => undefined);
    }
    // chi tiết cuộc: cuộc đầu tiên trong danh sách
    await di('#cuoc');
    const href = await p.locator('a[href^="#cuoc-"]').first().getAttribute('href');
    await di(href); await chup('21-cuoc-chi-tiet');
    for (const [tab, slug] of [['Sự kiện', 'su-kien'], ['Nhập hệ thống', 'nhap-he-thong'], ['Nhật ký', 'nhat-ky'], ['Kết quả & nộp tiền', 'ket-qua-nop-tien']]) {
      await p.getByRole('tab', { name: new RegExp('^' + tab) }).first().click().catch(() => undefined);
      await p.waitForTimeout(300);
      await chup('22-cuoc-' + slug);
    }
    // các bảng trượt
    await di('#cuoc');
    await p.getByRole('button', { name: /Thêm cuộc/ }).first().click(); await p.waitForTimeout(400); await chup('30-form-them-cuoc');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.locator('header button[aria-label^="Nhắc việc"]').click(); await p.waitForTimeout(400); await chup('31-chuong-nhac');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.getByRole('button', { name: /Thu nhanh/ }).click(); await p.waitForTimeout(400); await chup('32-thu-nhanh');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await di('#cuoc'); await p.getByRole('button', { name: /Nhập (kế hoạch từ )?Excel/ }).first().click(); await p.waitForTimeout(400); await chup('33-nhap-excel');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    // chế độ tối
    await di('#cai-dat/giao-dien'); await p.getByLabel('Tối').check(); await p.waitForTimeout(300);
    await di('#hom-nay'); await chup('40-hom-nay-toi');
    await di('#cuoc'); await chup('41-cuoc-toi');
    await ctx.close();
  }
  await b.close();
  if (loi.length) { console.log('Lỗi:\n' + loi.join('\n')); process.exit(1); }
  console.log('Xong. Ảnh ở', RA, '-', fs.readdirSync(RA).length, 'tệp');
})();
