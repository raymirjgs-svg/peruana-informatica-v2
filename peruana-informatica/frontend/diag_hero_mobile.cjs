// Mide el hero en movil: recorte, tamano de fuente, contraste y solapamiento.
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

function lum(c) {
  const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
    const s = Number(v) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });

  for (const v of [{ w: 390, h: 844, n: 'movil' }, { w: 1440, h: 900, n: 'escritorio' }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    const r = await page.evaluate(() => {
      // localizar el carrusel y su slide activo
      const slide = document.querySelector('[class*="carousel"] [class*="slide"], [class*="Carousel"] > div > div');
      const all = [...document.querySelectorAll('div')].filter((d) => {
        const s = getComputedStyle(d);
        return s.backgroundImage && s.backgroundImage !== 'none' && d.getBoundingClientRect().height > 120;
      });
      const hero = all[0];
      if (!hero) return null;
      const hr = hero.getBoundingClientRect();
      const texts = [...hero.querySelectorAll('h1,h2,h3,p,span,div')].filter((e) => {
        const t = e.innerText && e.innerText.trim();
        if (!t || t.length < 3) return false;
        const rr = e.getBoundingClientRect();
        return rr.width > 20 && rr.height > 8;
      }).slice(0, 8);
      return {
        heroRect: { x: Math.round(hr.x), y: Math.round(hr.y), w: Math.round(hr.width), h: Math.round(hr.height) },
        bg: getComputedStyle(hero).backgroundImage.slice(0, 60),
        color: getComputedStyle(hero).color,
        texts: texts.map((e) => {
          const rr = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return {
            t: e.innerText.trim().replace(/\s+/g, ' ').slice(0, 40),
            x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height),
            fs: s.fontSize, fw: s.fontWeight, color: s.color,
            // recortado respecto al hero?
            clipped: rr.bottom > hr.bottom + 1 || rr.right > hr.right + 1 || rr.top < hr.top - 1 || rr.left < hr.left - 1,
            lines: Math.round(rr.height / parseFloat(s.lineHeight || s.fontSize)),
          };
        }),
      };
    });

    if (!r) { console.log(`\n### ${v.n}: hero no encontrado`); await ctx.close(); continue; }

    console.log(`\n### ${v.n} (${v.w}x${v.h})`);
    console.log('hero:', JSON.stringify(r.heroRect), '| fondo:', r.bg);
    const clipped = r.texts.filter((t) => t.clipped);
    console.log('bloques de texto medidos:', r.texts.length, '| RECORTADOS:', clipped.length);
    for (const t of r.texts) {
      console.log(`  [${t.clipped ? 'RECORTADO' : 'ok      '}] ${t.fs}/${t.fw} ${t.w}x${t.h} (${t.lines} lineas) color=${t.color} :: "${t.t}"`);
    }
    // contraste del texto principal contra el fondo del hero (aprox: fondo = color del hero)
    await ctx.close();
  }

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });