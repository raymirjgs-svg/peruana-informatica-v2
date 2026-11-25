// Diagnostico: que ve realmente el navegador en las estanterias de la portada.
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const reqs = [];
  page.on('requestfinished', (r) => {
    const u = r.url();
    if (/api\/products|quick-categories|company-settings|carousel|brand/i.test(u)) reqs.push('OK   ' + u.replace(BASE, '').slice(0, 90));
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/api\/products|quick-categories|company-settings|carousel|brand/i.test(u)) reqs.push('FAIL ' + u.replace(BASE, '').slice(0, 90) + ' :: ' + (r.failure() || {}).errorText);
  });
  const consoleMsgs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push(m.type() + ': ' + m.text().slice(0, 140)); });
  page.on('pageerror', (e) => consoleMsgs.push('PAGEERROR: ' + e.message.slice(0, 140)));

  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);

  const dom = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('section')].map((s, i) => {
      const h2 = s.querySelector('h2');
      const cards = s.querySelectorAll('a[href^="/products/"]').length;
      const skeletons = s.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length;
      return { i, titulo: h2 ? h2.innerText.slice(0, 40) : '(sin h2)', cards, skeletons };
    });
    return {
      sections,
      totalCards: document.querySelectorAll('a[href^="/products/"]').length,
      gridText: (document.querySelector('section') || {}).innerText?.slice(0, 120) || '',
    };
  });

  console.log('=== PETICIONES RELEVANTES ===');
  console.log(reqs.join('\n') || '(ninguna)');
  console.log('\n=== CONSOLA ===');
  console.log([...new Set(consoleMsgs)].join('\n') || '(limpia)');
  console.log('\n=== SECCIONES ===');
  console.log(JSON.stringify(dom.sections, null, 1));
  console.log('tarjetas de producto en total:', dom.totalCards);
  console.log('tiempo total:', ((Date.now() - t0) / 1000).toFixed(1) + 's');

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });