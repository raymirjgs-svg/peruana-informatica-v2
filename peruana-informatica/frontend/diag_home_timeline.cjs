// Linea de tiempo: cuando llega el HTML, cuando hidrata, cuando aparecen los productos.
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const t0 = Date.now();
  const events = [];
  const mark = (l) => events.push(((Date.now() - t0) / 1000).toFixed(2) + 's  ' + l);

  page.on('domcontentloaded', () => mark('DOM listo'));
  page.on('load', () => mark('load completo'));
  page.on('response', async (r) => {
    const u = r.url();
    if (/\/api\/products/.test(u)) {
      let n = 0;
      try { n = (await r.json()).products?.length ?? -1; } catch {}
      mark('API productos OK (' + n + ' productos) ' + u.replace(BASE, '').slice(0, 45));
    }
  });

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // esperar a la primera tarjeta real
  let firstCard = null;
  for (let i = 0; i < 60; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('a[href^="/products/"]').length);
    if (n > 0) { firstCard = (Date.now() - t0) / 1000; mark('primera tarjeta visible (' + n + ')'); break; }
    await page.waitForTimeout(250);
  }
  if (firstCard === null) mark('NUNCA aparecieron tarjetas');

  // LCP / CLS desde el navegador
  const vitals = await page.evaluate(() => new Promise((res) => {
    const out = {};
    try {
      new PerformanceObserver((l) => { out.lcp = l.getEntries().at(-1)?.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((l) => { out.cls = l.getEntries().reduce((a, e) => a + e.value, 0); }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    setTimeout(() => res(out), 2500);
  }));

  // el HTML servido trae productos?
  const htmlHasProducts = await page.evaluate(() => /href="\/products\//.test(document.documentElement.outerHTML));

  console.log('=== LINEA DE TIEMPO ===');
  console.log(events.join('\n'));
  console.log('\nLCP:', vitals.lcp ? (vitals.lcp / 1000).toFixed(2) + 's' : 'n/d');
  console.log('CLS:', vitals.cls !== undefined ? vitals.cls.toFixed(3) : 'n/d');
  console.log('HTML servido trae enlaces a productos:', htmlHasProducts ? 'si' : 'NO (se pintan solo tras JS)');

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });