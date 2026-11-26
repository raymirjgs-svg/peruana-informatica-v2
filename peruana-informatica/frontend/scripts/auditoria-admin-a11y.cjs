const { chromium } = require('playwright');
const fs = require('fs');

const EXE = 'C:/Users/LENOVO/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:3006/admin';
const EMAIL = 'auditor.temporal@peruanainformatica.com.pe';
const PASS = 'Auditoria#2026Tmp';
const STATE = process.env.STATE || '_admin_state_local.json';
const PREFIX = process.env.PREFIX || '_adm2';
const DARK = process.env.DARK === '1';

const PAGES = [
  ['/', 'dashboard'], ['/products', 'products'], ['/orders', 'orders'],
  ['/quotations', 'quotations'], ['/customers', 'customers'], ['/users', 'users'],
  ['/categories', 'categories'], ['/brands', 'brands'], ['/inventory', 'inventory'],
  ['/reports', 'reports'], ['/settings', 'settings'], ['/company-settings', 'company-settings'],
  ['/blog', 'blog'], ['/carousel', 'carousel'], ['/roles', 'roles'], ['/reviews', 'reviews'],
  ['/discounts', 'discounts'], ['/coupons', 'coupons'], ['/contacts', 'contacts'],
  ['/media', 'media'], ['/announcements', 'announcements'], ['/promo-banners', 'promo-banners'],
  ['/payment-settings', 'payment-settings'], ['/marketing', 'marketing'], ['/seo', 'seo'],
  ['/wishlists', 'wishlists'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: fs.existsSync(STATE) ? STATE : undefined });
  const page = await ctx.newPage();

  await page.goto(BASE + '/products', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  if (page.url().includes('/login')) {
    const inputs = await page.$$('input');
    await inputs[0].fill(EMAIL); await inputs[1].fill(PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(7000);
    if (page.url().includes('/login')) {
      console.log('LOGIN FALLIDO:', await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200)));
      await browser.close(); process.exit(1);
    }
    await ctx.storageState({ path: STATE });
  }
  if (DARK) {
    await page.evaluate(() => { localStorage.setItem('adminTheme', 'dark'); document.documentElement.classList.add('dark'); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  }
  console.log('sesion ok ->', page.url());

  const results = [];
  for (const [route, name] of PAGES) {
    const errors = [];
    const onErr = e => errors.push('JS: ' + e.message.slice(0, 80));
    const onResp = r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url().replace(BASE, '').slice(0, 50)); };
    page.on('pageerror', onErr);
    page.on('response', onResp);
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
      const m = await page.evaluate(() => {
        const parse = c => { const x = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); return x ? { r: +x[1], g: +x[2], b: +x[3], a: x[4] === undefined ? 1 : +x[4] } : null; };
        const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const ratio = (a, b) => { const l1 = lum(a.r, a.g, a.b), l2 = lum(b.r, b.g, b.b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
        const bgOf = el => { let n = el; while (n && n !== document.documentElement) { const s = getComputedStyle(n); const c = parse(s.backgroundColor); if (s.backgroundImage && s.backgroundImage !== 'none') { const g = s.backgroundImage.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (g) return { r: +g[1], g: +g[2], b: +g[3] }; } if (c && c.a > 0.85) return c; n = n.parentElement; } return { r: 255, g: 255, b: 255 }; };
        const seen = new Set(); const lows = [];
        document.querySelectorAll('p,span,a,li,dd,dt,h1,h2,h3,h4,button,label,td,th,small,legend').forEach(el => {
          if (el.children.length) return;
          const txt = (el.textContent || '').trim(); if (!txt || txt.length < 2) return;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
          const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.opacity === '0') return;
          const fg = parse(s.color); if (!fg) return;
          const bg = bgOf(el);
          const size = parseFloat(s.fontSize), weight = parseInt(s.fontWeight, 10) || 400;
          const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
          const cr = ratio({ r: fg.r, g: fg.g, b: fg.b }, bg);
          if (cr < need) { const k = s.color + Math.round(size) + txt.slice(0, 8); if (seen.has(k)) return; seen.add(k); lows.push(txt.slice(0, 20) + ' ' + s.color + ' ' + size + 'px ' + cr.toFixed(2) + ':1'); }
        });
        const small = [...document.querySelectorAll('p,span,a,li,td,th,small,label,button,h1,h2,h3,h4')].filter(el => { if (el.children.length) return false; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width && r.height && parseFloat(s.fontSize) < 12 && (el.textContent || '').trim().length > 1; }).length;
        const tiny = [...document.querySelectorAll('a,button,input,select,[role="tab"]')].map(el => { const r = el.getBoundingClientRect(); return { n: (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 18), w: +r.width.toFixed(0), h: +r.height.toFixed(0) }; }).filter(t => t.w > 4 && t.h > 4 && (t.w < 24 || t.h < 24));
        const noName = [...document.querySelectorAll('button')].filter(el => !(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText.trim() || el.querySelector('img')?.alt)).length;
        const unlabeled = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(el => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !(el.id && document.querySelector(`label[for="${el.id}"]`)) && !el.closest('label') && !el.getAttribute('placeholder')).length;
        const emoji = (document.body.innerText.match(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/gu) || []).length;
        return { lows: lows.length, lowSample: lows.slice(0, 3), small, tiny: tiny.length, noName, unlabeled, emoji, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      });
      results.push({ route, ...m, errors });
      await page.screenshot({ path: `${PREFIX}_${name}.png` });
    } catch (e) { results.push({ route, error: e.message.slice(0, 70) }); }
    page.off('pageerror', onErr); page.off('response', onResp);
  }

  fs.writeFileSync(`${PREFIX}_data.json`, JSON.stringify(results, null, 1));
  const tot = results.reduce((a, r) => ({
    lows: a.lows + (r.lows || 0), small: a.small + (r.small || 0), tiny: a.tiny + (r.tiny || 0),
    noName: a.noName + (r.noName || 0), unlbl: a.unlbl + (r.unlabeled || 0), emoji: a.emoji + (r.emoji || 0),
    err: a.err + (r.errors ? r.errors.length : 0),
  }), { lows: 0, small: 0, tiny: 0, noName: 0, unlbl: 0, emoji: 0, err: 0 });
  console.log('TOTALES', JSON.stringify(tot));
  console.log('paginas con error:', results.filter(r => r.error).map(r => r.route));
  await browser.close();
})();
