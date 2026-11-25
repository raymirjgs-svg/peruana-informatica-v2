// Capturas de la portada publica (sin login) para critica de diseño.
const { chromium } = require('playwright');
const fs = require('fs');

const EXEC = 'C:\\Users\\LENOVO\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:3005';

(async () => {
  const dir = process.argv[2] || 'C:/temp/home-shots';
  fs.mkdirSync(dir, { recursive: true });

  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--disable-web-security', '--disable-site-isolation-trials'] });

  const views = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const report = [];

  for (const v of views) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('JS: ' + e.message.slice(0, 90)));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url().replace(BASE, '').slice(0, 70)); });

    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3500);

    // hero / primer pantallazo
    await page.screenshot({ path: `${dir}hero_${v.name}.png` });

    // portada completa
    await page.screenshot({ path: `${dir}full_${v.name}.png`, fullPage: true });

    // metricas utiles para la critica
    const m = await page.evaluate(() => {
      const gs = (s) => getComputedStyle(document.querySelector(s));
      const h1 = document.querySelector('h1');
      const imgs = [...document.querySelectorAll('img')];
      const noAlt = imgs.filter((i) => !i.alt || !i.alt.trim()).length;
      const btns = [...document.querySelectorAll('button, a')].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 24 && r.width < 24;
      }).length;
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      const fonts = [...new Set([...document.querySelectorAll('h1,h2,h3,p,button')].slice(0, 40).map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))];
      return {
        title: document.title,
        h1: h1 ? h1.innerText.slice(0, 120) : '(sin h1)',
        h1Size: h1 ? gs('h1').fontSize : null,
        h1Weight: h1 ? gs('h1').fontWeight : null,
        imgs: imgs.length,
        imgsNoAlt: noAlt,
        smallTargets: btns,
        overflowX,
        docHeight: document.documentElement.scrollHeight,
        fonts,
        bodyColor: gs('body').color,
        bodyBg: gs('body').backgroundColor,
      };
    });

    report.push({ viewport: v.name, ...m, errores: [...new Set(errors)].slice(0, 5) });
    await ctx.close();
  }

  fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });