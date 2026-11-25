// Objetivos de toque pequenos, nav movil y que fuente se renderiza de verdad.
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });

  for (const v of [{ w: 390, h: 844, n: 'movil' }, { w: 1440, h: 900, n: 'escritorio' }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);

    const r = await page.evaluate(() => {
      const vw = window.innerWidth;
      const de = document.documentElement;

      const interactive = [...document.querySelectorAll('a, button, input, [role=button]')]
        .map((e) => {
          const b = e.getBoundingClientRect();
          return { tag: e.tagName.toLowerCase(), w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y), t: (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30) };
        })
        .filter((o) => o.w > 0 && o.h > 0 && o.w < 24 && o.h < 24);

      const h2 = document.querySelector('h2');
      const p = document.querySelector('p');
      const loaded = [...document.fonts].map((f) => f.family + '/' + f.status);

      // nav: cuantos enlaces de primer nivel
      const navLinks = [...document.querySelectorAll('header a, nav a')]
        .map((a) => (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 22))
        .filter(Boolean);

      return { small: interactive.slice(0, 8), smallCount: interactive.length, h2Font: h2 ? getComputedStyle(h2).fontFamily.split(',')[0] : '-', pFont: p ? getComputedStyle(p).fontFamily.split(',')[0] : '-', fonts: [...new Set(loaded)].slice(0, 8), navLinks: [...new Set(navLinks)].slice(0, 14), overflowX: de.scrollWidth > de.clientWidth + 1, docH: de.scrollHeight };
    });

    console.log(`\n### ${v.n} (${v.w}x${v.h})  doc ${r.docH}px | overflowX=${r.overflowX}`);
    console.log('fuente h2:', r.h2Font, '| fuente p:', r.pFont);
    console.log('fuentes cargadas:', r.fonts.join(' | ') || '(ninguna)');
    console.log('nav visible:', r.navLinks.join(' · ') || '(ninguno)');
    console.log('objetivos <24px:', r.smallCount, r.small.map((s) => `<${s.tag}> ${s.w}x${s.h} "@${s.x},${s.y} ${s.t}"`).join('  '));
    await ctx.close();
  }

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });