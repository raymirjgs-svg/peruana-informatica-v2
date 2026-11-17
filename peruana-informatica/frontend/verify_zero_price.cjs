const { chromium } = require('playwright');

const BASE = 'https://peruanadeinformatica.com.pe';
const SLUG = 'watch-onn-google-tv-4k-uhd-streaming-box-core-cortex-a35-2gb-ram-8gb-storage-wifi-os-';

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));

  const r = await page.goto(`${BASE}/products/${SLUG}`, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('http_producto=', r.status());
  const body = await page.locator('body').innerText();
  console.log('muestra_consultar_precio=', /Consultar precio/i.test(body));
  console.log('precio_s_0_visible=', /S\/\.\s*0\.00/.test(body));

  // Botones disponibles
  const labels = await page.locator('button').allInnerTexts();
  console.log('botones=', JSON.stringify(labels.map(s => s.trim()).filter(Boolean).slice(0, 12)));

  const addCart = page.getByRole('button', { name: /añadir|agregar|carrito/i }).first();
  console.log('boton_carrito_visible=', await addCart.isVisible().catch(() => false));
  console.log('enlace_whatsapp=', await page.locator('a[href*="wa.me"]').count());

  // Intentar anadir al carrito
  if (await addCart.isVisible().catch(() => false)) {
    await addCart.click();
    await page.waitForTimeout(2500);
  }

  // Ir al carrito
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  const cart = await page.locator('body').innerText();
  console.log('carrito_tiene_producto=', /WATCH ONN GOOGLE TV/i.test(cart));
  const totalMatch = cart.match(/S\/\.\s*([0-9,]+(?:\.[0-9]{2})?)/g) || [];
  console.log('montos_en_carrito=', JSON.stringify(totalMatch.slice(0, 8)));
  console.log('total_cero=', /S\/\.\s*0\.00/.test(cart));
  const checkoutBtns = await page.locator('button, a').allInnerTexts();
  console.log('botones_carrito=', JSON.stringify(checkoutBtns.map(s => s.trim()).filter(s => /pagar|checkout|finalizar|pedido|whatsapp|comprar|continuar|confirmar/i.test(s)).slice(0, 10)));
  console.log('--- TEXTO CARRITO (recortado) ---');
  console.log('--- TEXTO CARRITO (recortado) ---');
  console.log(cart.split(String.fromCharCode(10)).filter(function(l){return l.trim();}).slice(0, 45).join(' | '));

  console.log('page_errors=', errs.length, errs.slice(0, 2).join(' | '));
  await browser.close();
})().catch((e) => { console.error('FALLO', String(e).slice(0, 300)); process.exit(1); });
