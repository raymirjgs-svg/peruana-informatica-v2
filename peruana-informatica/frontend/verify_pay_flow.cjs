const { chromium } = require('playwright');

const BASE = 'https://peruanadeinformatica.com.pe';
const CODE = 'PI-WXQNFA-7HTGFT';

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

  // ---------- 1. Seguimiento del cliente ----------
  const r = await page.goto(`${BASE}/seguimiento/${CODE}`, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('seguimiento_http=', r.status());

  const h1 = await page.locator('h1, h2').first().innerText().catch(() => '');
  console.log('titulo=', h1.trim().slice(0, 80));

  const payBtn = page.getByRole('button', { name: /Pagar con Mercado Pago/i });
  console.log('boton_mp_visible=', await payBtn.isVisible().catch(() => false));
  console.log('texto_pagar_pedido=', (await page.getByText('Pagar pedido').count()) > 0);

  // Codigo visible y boton copiar
  console.log('codigo_visible=', (await page.getByText(CODE).count()) > 0);
  console.log('boton_copiar=', (await page.getByRole('button', { name: /Copiar/i }).count()) > 0);

  // Ningun dato personal visible
  const bodyText = await page.locator('body').innerText();
  const patrones = [/\b\d{8}\b/, /@gmail\.com/i, /@peruanainformatica\.com\.pe/i, /\bDNI\b/i, /\bRUC\b/i];
  console.log('pII_en_pagina=', patrones.filter((p) => p.test(bodyText)).map(String).join(',') || 'ninguno');

  // ---------- 2. Intento de pago (token de MP aun invalido) ----------
  let msgPago = '';
  try {
    await payBtn.click({ timeout: 15000 });
    await page.waitForTimeout(4000);
    msgPago = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const i = msgPago.search(/pasarela de pago|No pudimos conectar|No est[aá] disponible/i);
    msgPago = i >= 0 ? msgPago.slice(i, i + 160) : '(sin mensaje de error visible)';
  } catch (e) {
    msgPago = 'error al pulsar: ' + String(e).slice(0, 100);
  }
  console.log('mensaje_pago=', msgPago);

  // ---------- 3. Panel admin ----------
  const adm = await ctx.newPage();
  const rl = await adm.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('admin_login_http=', rl.status());
  const user = adm.locator('input[name="username"], input#username, input[type="text"]').first();
  const pass = adm.locator('input[type="password"]').first();
  if (await user.isVisible().catch(() => false) && await pass.isVisible().catch(() => false)) {
    await user.fill('admin');
    await pass.fill('admin123');
    await adm.getByRole('button', { name: /iniciar|entrar|login/i }).first().click();
    await adm.waitForTimeout(4000);
    console.log('url_tras_login=', adm.url());
    await adm.goto(`${BASE}/admin/settings`, { waitUntil: 'networkidle', timeout: 60000 });
    const txt = await adm.locator('body').innerText();
    console.log('admin_settings_mp_token=', /Access Token/i.test(txt));
    console.log('admin_settings_probar=', /Probar conex/i.test(txt));
    console.log('admin_settings_metodos=', ['Mercado Pago', 'Transferencia', 'Yape', 'Plin', 'Tarjeta'].filter((m) => txt.includes(m)).join(','));
    const bodyAdmin = txt;
    console.log('admin_muestra_token_plano=', /APP_USR-[A-Za-z0-9]{10,}/.test(bodyAdmin));
  } else {
    console.log('admin_login_form_no_encontrado');
  }

  console.log('page_errors=', errors.length, errors.slice(0, 3).join(' | '));
  await browser.close();
})().catch((e) => { console.error('FALLO', e); process.exit(1); });
