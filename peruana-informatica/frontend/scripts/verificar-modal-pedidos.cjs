// Reproduccion local del bug de apilado del modal de detalle de pedido.
// - Token JWT de prueba en localStorage (el guard solo valida el exp).
// - API de pedidos interceptada: datos falsos, sin tocar produccion.
const { chromium } = require('playwright');

const EXEC = 'C:/Users/LENOVO/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:3006';
const PREFIX = process.env.PREFIX || '_modal';
const WIDTHS = (process.env.WIDTHS || '390,1024,1100,1200,1280,1366').split(',').map(Number);

// JWT de prueba: header.payload.firma (el guard solo lee exp)
function fakeJwt() {
  // el guard usa atob(): base64 estandar, no base64url
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ exp: Math.floor(Date.now() / 1000) + 3600, role: 'admin' })}.firma-de-prueba`;
}

const ORDER = {
  id: 340,
  customer_name: 'Yerson Pítur Muñoz Pérez',
  customer_email: 'pterso15xperu@gmail.com',
  customer_phone: '999888777',
  customer_dni: '70123456',
  shipping_address: 'Av. Grau 345, Piura',
  shipping_city: 'Piura',
  shipping_reference: 'Frente al parque',
  tracking_code: 'PT-6YWEAY-P9K8H8',
  invoice_number: 'F001-00004339',
  status: 'pending_approval',
  payment_status: 'pending',
  payment_method: 'mercadopago',
  total_amount: 398.0,
  subtotal: 398.0,
  shipping_cost: 0,
  discount: 0,
  createdAt: '2026-11-26T15:30:00.000Z',
  items: [
    { id: 1, product_id: 1649, product_name: 'DISCO SOLIDO M.2 VP14000 1TB, PCIE NVME 2280, 14000 MB/S', product_price: 398, quantity: 1, subtotal: 398, cod_interno: '20934' },
    { id: 2, product_id: 1702, product_name: 'MEMORIA SODIMM DDR4 16GB 3200MHz LAPTOP', product_price: 189, quantity: 2, subtotal: 378, cod_interno: '20935' },
  ],
  notes: 'Entregar en la mañana, timbre 3B.',
};

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const results = [];

  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    await page.addInitScript((token) => {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify({ email: 'prueba@local', role: 'admin' }));
    }, fakeJwt());

    // sesion de NextAuth (AdminSessionSync la exige antes de montar el guard)
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { email: 'prueba@local', role: 'admin', name: 'Prueba Local' },
          accessToken: fakeJwt(),
          expires: new Date(Date.now() + 3600_000).toISOString(),
        }),
      })
    );

    // el handler general primero: Playwright da prioridad al ultimo registrado
    await page.route(/\/api\/admin\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
    );
    await page.route(/\/api\/admin\/orders/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, orders: [ORDER], data: [ORDER] }) })
    );

    await page.goto(`${BASE}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2500);

    // abrir el modal con el icono del ojo
    const eye = page.locator('button[title="Ver detalle"]').first();
    await eye.waitFor({ state: 'visible', timeout: 20000 });
    await eye.click();
    await page.waitForTimeout(900);

    // medidor: el sidebar tapa el modal?
    const probe = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0.z-50, div.fixed.inset-0[class*="z-[60]"]');
      const dialog = modal?.querySelector('[class*="max-w-"]');
      const sidebar = document.querySelector('aside');
      if (!modal || !dialog || !sidebar) return { error: 'no encontrado', modal: !!modal, dialog: !!dialog, sidebar: !!sidebar };

      const d = dialog.getBoundingClientRect();
      const s = sidebar.getBoundingClientRect();
      const solapa = Math.max(0, Math.min(d.right, s.right) - Math.max(d.left, s.left));
      const solapaY = Math.max(0, Math.min(d.bottom, s.bottom) - Math.max(d.top, s.top));

      // que elemento esta realmente en pantalla sobre la esquina izquierda del modal
      const x = Math.max(4, Math.min(d.left + 24, window.innerWidth - 4));
      const y = Math.max(4, Math.min(d.top + 40, window.innerHeight - 4));
      const hit = document.elementFromPoint(x, y);
      const hitTag = hit ? `${hit.tagName}.${String(hit.className || '').split(' ').slice(0, 2).join('.')}` : null;

      // el centro del modal debe ser interactable (no debe haber nada encima)
      const cx = d.left + d.width / 2;
      const cy = d.top + d.height / 2;
      const hitCenter = document.elementFromPoint(cx, cy);
      const centerTag = hitCenter ? `${hitCenter.tagName}.${String(hitCenter.className || '').split(' ').slice(0, 2).join('.')}` : null;

      // apilado real: en la zona donde se solapan modal y sidebar, que esta ENCIMA?
      const ix = Math.max(d.left, s.left) + 20;
      const iy = Math.max(d.top, s.top) + 40;
      const hitOverlap = document.elementFromPoint(ix, iy);
      const modalSobreSidebar = !!(hitOverlap && hitOverlap.closest('[class*="max-w-"]'));

      // el centro del dialogo pertenece al dialogo (nada encima)
      const centroDelDialogo = !!(hitCenter && hitCenter.closest('[class*="max-w-"]'));

      return {
        modalZ: getComputedStyle(modal).zIndex,
        dialog: { left: Math.round(d.left), right: Math.round(d.right), width: Math.round(d.width) },
        sidebar: { left: Math.round(s.left), right: Math.round(s.right), width: Math.round(s.width), z: getComputedStyle(sidebar).zIndex },
        solapaGeometricaPx: Math.round(solapa),
        modalSobreSidebar,
        centroDelDialogo,
        hitEnSolape: hitOverlap ? `${hitOverlap.tagName}.${String(hitOverlap.className || '').split(' ').slice(0, 2).join('.')}` : null,
        hitIzq: hitTag,
        hitCentro: centerTag,
      };
    });

    await page.screenshot({ path: `${PREFIX}_${width}.png` });
    results.push({ width, ...probe });
    console.log(`${width}px ->`, JSON.stringify(probe));
    await ctx.close();
  }

  await browser.close();
  require('fs').writeFileSync(`${PREFIX}_resultado.json`, JSON.stringify(results, null, 2));
  console.log('\nRESUMEN:', JSON.stringify(results.map(r => ({ w: r.width, modalSobreSidebar: r.modalSobreSidebar, centroDelDialogo: r.centroDelDialogo, z: r.modalZ }))));
})();
