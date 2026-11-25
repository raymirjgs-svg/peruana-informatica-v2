// Mide los bloques de texto del hero por su contenido real (no por selector).
const { chromium } = require('playwright');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = 'https://peruanadeinformatica.com.pe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });

  for (const v of [{ w: 390, h: 844, n: 'movil' }, { w: 1440, h: 900, n: 'escritorio' }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4500);

    const r = await page.evaluate(() => {
      const vw = window.innerWidth;
      const de = document.documentElement;

      // contenedor del carrusel: el ancestro comun de los controles
      const ctrl = document.querySelector('button[aria-label*="iguiente"], button[aria-label*="ext"], [class*="next"]');
      let root = null;
      for (let n = ctrl; n; n = n.parentElement) {
        if (n.getBoundingClientRect().height > 200) { root = n; break; }
      }
      if (!root) return { error: 'carrusel no encontrado' };
      const rr = root.getBoundingClientRect();

      const seen = new Set();
      const blocks = [...root.querySelectorAll('*')].filter((e) => {
        const t = (e.innerText || '').trim();
        if (!t || t.length < 2) return false;
        // solo hojas de texto
        if ([...e.children].some((c) => (c.innerText || '').trim().length > 0)) return false;
        const b = e.getBoundingClientRect();
        if (b.width < 15 || b.height < 6) return false;
        const key = e.tagName + t + Math.round(b.x) + Math.round(b.y);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map((e) => {
        const b = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        const lineH = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.2;
        return {
          tag: e.tagName.toLowerCase(),
          t: e.innerText.trim().replace(/\s+/g, ' ').slice(0, 38),
          x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
          fs: s.fontSize, fw: s.fontWeight, color: s.color, lh: lineH.toFixed(0),
          lines: Math.max(1, Math.round(b.height / lineH)),
          fueraX: b.left < -1 || b.right > vw + 1,
          fueraRoot: b.bottom > rr.bottom + 2 || b.top < rr.top - 2 || b.right > rr.right + 2 || b.left < rr.left - 2,
        };
      });

      return {
        root: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) },
        scrollW: de.scrollWidth, clientW: de.clientWidth,
        overflowX: de.scrollWidth > de.clientWidth + 1,
        blocks,
      };
    });

    if (r.error) { console.log(`\n### ${v.n}: ${r.error}`); await ctx.close(); continue; }
    console.log(`\n### ${v.n} (${v.w}x${v.h})`);
    console.log('carrusel:', JSON.stringify(r.root), '| overflowX documento:', r.overflowX, `(${r.scrollW} vs ${r.clientW})`);
    for (const b of r.blocks) {
      const flags = [b.fueraX ? 'FUERA-PANTALLA' : '', b.fueraRoot ? 'FUERA-CARRUSEL' : ''].filter(Boolean).join(' ') || 'ok';
      console.log(`  [${flags.padEnd(16)}] <${b.tag}> ${b.fs}/${b.fw} ${b.w}x${b.h} L${b.lines} "${b.t}"`);
    }
    await ctx.close();
  }

  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });