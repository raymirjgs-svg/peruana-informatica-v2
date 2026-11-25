const { chromium } = require('playwright');
const fs = require('fs');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';
const EMAIL = 'probe_tmp@peruanadeinformatica.com.pe';
const PASS = 'ProbeTmp!2026';

const ROUTES = [
  '/admin', '/admin/orders', '/admin/quotations', '/admin/reports',
  '/admin/products', '/admin/categories', '/admin/taxonomy', '/admin/inventory',
  '/admin/reviews', '/admin/wishlists', '/admin/coupons', '/admin/discounts',
  '/admin/promo-banners', '/admin/marketing', '/admin/media', '/admin/blog',
  '/admin/carousel', '/admin/brands', '/admin/quick-categories', '/admin/announcements',
  '/admin/pages', '/admin/company-settings', '/admin/payment-settings',
  '/admin/customers', '/admin/users', '/admin/roles', '/admin/settings',
  '/admin/system', '/admin/contacts', '/admin/seo',
];

(async () => {
  const dir = process.argv[2] || 'C:/temp/admin-shots';
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASS);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
  await page.waitForTimeout(2000);

  const report = [];
  for (const route of ROUTES) {
    const errors = [];
    const onErr = e => errors.push('JS:' + e.message.slice(0, 80));
    const onResp = r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 70)); };
    page.on('pageerror', onErr);
    page.on('response', onResp);

    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2200);
      const name = route.replace('/admin', '').replace(/\//g, '_') || '_dashboard';
      await page.screenshot({ path: `${dir}${name}.png`, fullPage: false });
      const body = await page.locator('body').innerText();
      report.push({ route, len: body.length, errores: [...new Set(errors)].slice(0, 4) });
    } catch (e) {
      report.push({ route, error: e.message.slice(0, 90) });
    }
    page.off('pageerror', onErr);
    page.off('response', onResp);
  }

  fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.filter(r => r.errores?.length || r.error), null, 2));
  console.log('capturas:', fs.readdirSync(dir).filter(f => f.endsWith('.png')).length);
  await browser.close();
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
