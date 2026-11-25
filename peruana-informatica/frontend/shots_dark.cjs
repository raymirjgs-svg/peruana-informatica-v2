const { chromium } = require('playwright');
const fs = require('fs');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';
const EMAIL = 'probe_tmp@peruanadeinformatica.com.pe';
const PASS = 'ProbeTmp!2026';

const ROUTES = process.argv[3]
  ? process.argv[3].split(',')
  : ['/admin', '/admin/orders', '/admin/products', '/admin/quotations', '/admin/reports',
     '/admin/blog', '/admin/customers', '/admin/users', '/admin/settings', '/admin/roles',
     '/admin/inventory', '/admin/coupons', '/admin/reviews', '/admin/company-settings',
     '/admin/contacts', '/admin/seo', '/admin/wishlists', '/admin/categories'];

(async () => {
  const dir = process.argv[2] || 'C:/temp/admin-dark';
  const mode = process.argv[4] || 'dark';
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASS);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
  await page.waitForTimeout(1500);

  // Fijar el tema antes de navegar (evita depender del toggle)
  await page.evaluate((m) => {
    localStorage.setItem('theme', m);
    localStorage.setItem('adminTheme', m);
    document.documentElement.classList.toggle('dark', m === 'dark');
  }, mode);
  await page.waitForTimeout(300);

  const report = [];
  for (const route of ROUTES) {
    const errors = [];
    const onErr = e => errors.push('JS:' + e.message.slice(0, 80));
    const onResp = r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 60)); };
    page.on('pageerror', onErr);
    page.on('response', onResp);
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 40000 });
      await page.waitForTimeout(1800);
      const name = route.replace('/admin', '').replace(/\//g, '_') || '_dashboard';
      await page.screenshot({ path: `${dir}${name}.png`, fullPage: false });
      const body = await page.locator('body').innerText();
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      report.push({ route, len: body.length, dark: isDark, errores: [...new Set(errors)].slice(0, 3) });
    } catch (e) {
      report.push({ route, error: e.message.slice(0, 80) });
    }
    page.off('pageerror', onErr);
    page.off('response', onResp);
  }

  fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.filter(r => r.errores?.length || r.error || !r.dark), null, 2));
  console.log('capturas:', fs.readdirSync(dir).filter(f => f.endsWith('.png')).length);
  await browser.close();
})().catch(e => { console.error('FALLO:', e.message); process.exit(1); });
