/**
 * Verificacion de la resolucion de URLs de imagen de producto.
 *
 * Ejecutar:  node --experimental-strip-types scripts/verify-image-urls.ts
 * (o via npm run verify:image-urls)
 *
 * Comprueba que:
 *  - las URLs absolutas del ERP NO se duplican con el prefijo /images/products/
 *  - las rutas que ya traen /images/... no se duplican
 *  - los nombres de archivo sueltos se resuelven contra el host de la API
 *  - los valores vacios devuelven el placeholder
 */

process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { getProductImageUrl, getBackendImageUrl, getProductImageFilename } from '../src/utils/images.ts';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

let failed = 0;

function check(label: string, actual: string, expected: string) {
    const ok = actual === expected;
    if (!ok) failed++;
    console.log(`${ok ? 'OK  ' : 'FALLA'} ${label}`);
    if (!ok) console.log(`       esperado: ${expected}\n       obtenido: ${actual}`);
}

// 1. URL absoluta del ERP: se devuelve tal cual (el bug que rompia las imagenes).
check(
    'URL absoluta del ERP',
    getProductImageUrl('https://peruanadeinformatica.com.pe/images/products/1775765737206-491576450.jpg'),
    'https://peruanadeinformatica.com.pe/images/products/1775765737206-491576450.jpg'
);

// 2. Ruta con subcarpeta ya incluida: solo se antepone el host.
check(
    'ruta con /images/products/ (sin host)',
    getProductImageUrl('/images/products/1775765737206-491576450.jpg'),
    `${BASE}/images/products/1775765737206-491576450.jpg`
);

// 3. Nombre de archivo simple: se resuelve contra el host de la API.
check(
    'nombre de archivo simple',
    getProductImageUrl('Monitor Gamer 32.png'),
    `${BASE}/images/products/Monitor%20Gamer%2032.png`
);

// 4. Vacio -> placeholder.
check('imagen vacia', getProductImageUrl(''), '/no-image.svg');
check('imagen null', getProductImageUrl(null), '/no-image.svg');
check('imagen undefined', getProductImageUrl(undefined), '/no-image.svg');

// 5. Imagen generica del backend (carousel, uploads).
check('backend url absoluta', getBackendImageUrl('https://peruanadeinformatica.com.pe/uploads/x.jpg'), 'https://peruanadeinformatica.com.pe/uploads/x.jpg');
check('backend ruta relativa', getBackendImageUrl('/uploads/x.jpg'), `${BASE}/uploads/x.jpg`);

// 6. Nombre de archivo decodificado (para comparar contra el disco).
check('nombre decodificado', getProductImageFilename('https://x.com/images/products/Monitor%20Gamer.png'), 'Monitor Gamer.png');

console.log(failed === 0 ? '\nTodas las verificaciones pasaron.' : `\n${failed} verificacion(es) fallaron.`);
process.exit(failed === 0 ? 0 : 1);
