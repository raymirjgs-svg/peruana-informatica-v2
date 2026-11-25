// Vuelca TODOS los elementos del carrusel (sin filtrar) + captura hi-res del hero.
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const r = await page.evaluate(() => {
    const ctrl = document.querySelector('button[aria-label*="iguiente"], [class*="next"]');
    let root = null;
    for (let n = ctrl; n; n = n.parentElement) if (n.getBoundingClientRect().height > 200) { root = n; break; }
    if (!root) return { error: 'no root' };
    const rr = root.getBoundingClientRect();
    const out = [...root.querySelectorAll('*')].map((e) => {
      const b = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      const txt = (e.innerText || '').trim().replace(/\s+/g, ' ');
      return {
        tag: e.tagName.toLowerCase(),
        cls: (e.className || '').toString().slice(0, 70),
        txt: txt.slice(0, 45),
        x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
        fs: s.fontSize, fw: s.fontWeight, color: s.color, op: s.opacity, ov: s.overflow,
        stroked: s.webkitTextStrokeWidth !== '0px' && s.webkitTextStrokeWidth !== '',
        stroke: s.webkitTextStrokeColor,
        // se sale del contenedor visible?
        saleX: b.right > rr.right + 2 || b.left < rr.left - 2,
        saleY: b.bottom > rr.bottom + 2 || b.top < rr.top - 2,
      };
    }).filter((o) => o.w > 0 && o.h > 0 && (o.txt || o.stroked || o.fs !== '16px'));
    return { root: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) }, out };
  });

  if (r.error) { console.log(r.error); await browser.close(); return; }
  console.log('CARRUSEL', JSON.stringify(r.root));
  for (const o of r.out) {
    const flags = [
      o.saleX ? 'SALE-X' : '', o.saleY ? 'SALE-Y' : '',
      o.stroked ? 'TRAZO' : '', o.op !== '1' ? 'op=' + o.op : '',
    ].filter(Boolean).join(' ');
    console.log(`[${flags.padEnd(14)}] <${o.tag}> ${o.fs}/${o.fw} ${o.w}x${o.h} @${o.x},${o.y} ${o.txt ? '"' + o.txt + '"' : ''} ${o.stroked ? 'stroke=' + o.stroke : ''} :: ${o.cls}`);
  }

  await page.locator('[class*="carousel"], [class*="Carousel"]').first().screenshot({ path: process.argv[2] || 'C:/temp/hero_mob2.png' });
  console.log('\ncaptura hero guardada');
  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });