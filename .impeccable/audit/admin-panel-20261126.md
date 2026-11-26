# Auditoría Impeccable — Panel de administración `/admin`

**Target:** `https://peruanadeinformatica.com.pe/admin`
**Fecha:** 26/11/2026
**Alcance:** 28 rutas del panel (frontend `src/app/admin/**` y `src/components/admin/**`)
**Método:** medición con Chromium sobre producción + `impeccable detect` sobre el código

## Score table

| Categoría | Puntuación | Antes | Después (producción) |
|---|---|---|---|
| Accesibilidad | 5/5 | 63 controles sin nombre, 428 inputs sin etiqueta, 28 targets < 24 px | 0 · 0 · 1 (enlace en línea, exento) |
| Contraste y legibilidad | 4/5 | 2820 textos bajo AA, 7511 textos < 12 px | 0 · 0 |
| Jerarquía y sistema visual | 4/5 | 44 usos de `from-indigo-*`, halos decorativos, emojis como iconos | 0 indigo · 0 halos · 0 emojis de UI |
| Responsivo y temas | 4/5 | Sin equivalentes `dark:` en 128 archivos, sin `color-scheme` | Cobertura `dark:` completa, foco visible en claro y oscuro |
| Integridad de implementación | 4/5 | `alert()` nativo en el módulo Blog, `use client` mal colocado | Toast Sonner, build limpio |

**Health Score: 21/25** — el panel queda accesible, legible y consistente en los dos temas.

## Qué se corrigió

### Accesibilidad
- Cada control interactivo tiene nombre accesible: `aria-label` en botones de icono, `aria-expanded` en el menú móvil del `Sidebar`, `aria-controls`/`id` en el panel de navegación.
- Cada campo de formulario tiene etiqueta: `htmlFor`/`id` en filtros de productos, contactos, cotizaciones, acciones masivas y selectores de paginación; `<label>` envolviendo checkboxes; `aria-label` en los inputs de archivo de marcas.
- Áreas táctiles: checkboxes de selección de productos y de configuración a 24 px (WCAG 2.5.8), iconos de acción con `p-2.5`.
- Enlace «Saltar al contenido» y `main` identificado en el layout público heredado por el admin.

### Contraste y legibilidad
- Barrido mecánico de tokens: `text-gray-400/500` → `text-gray-600`, `text-[10px]/[11px]` → `text-xs`.
- Estados: `text-red-600` → `text-red-700` (4.41:1 → 4.83:1), `text-emerald-600` → `text-emerald-700` (3.77:1 → 4.83:1), `Button variant="success"` a `emerald-700`.
- Gradientes del score SEO a tonos 700/800 para que el texto blanco supere 4.8:1.

### Jerarquía y sistema visual
- Paleta del admin unificada en azul: 0 usos de `indigo` (antes 44). Verde, ámbar y rojo quedan solo como estados semánticos.
- `StatsCard` sin halo decorativo y con una sola elevación.
- Emojis sustituidos por iconos Lucide en toda la interfaz; los emojis que quedan son **contenido** editable por el administrador (icono de anuncio, icono de categoría).

### Integridad
- `alert()` nativo sustituido por `toast` de Sonner en el módulo Blog.
- Imports de `lucide-react` colocados después de `"use client"` (Turbopack lo exige).
- `impeccable detect --json --changed` → `[]`.

## Hallazgo de causa raíz (P1)

**El `content` de Tailwind no cubría `src/services`.** Las clases que se componen desde código fuera de `src/app`, `src/components` y `src/pages` se purgaban del CSS: el gradiente del score SEO (`SeoService.getScoreBackgroundColor`) nunca se aplicó y el texto blanco quedaba sobre el fondo claro de la página (1.05:1, ilegible).

```js
// tailwind.config.js
content: ['./src/**/*.{js,ts,jsx,tsx,mdx}']
```

El sitio público se verificó después del cambio: home, ficha y lista de distribución sin errores JS ni HTTP, sin overflow horizontal, sin imágenes rotas y con la tipografía Outfit intacta.

## Hallazgo de seguridad (fuera de alcance, pendiente de decisión)

Al eliminar el usuario temporal de auditoría (id 125) se comprobó que **su JWT sigue siendo válido**: `requireAdmin` valida la firma y el rol del payload sin volver a consultar la base de datos, por lo que un usuario borrado o bloqueado conserva el acceso hasta que expira el token (7 días de acceso, 30 de refresco).

**Fix propuesto (backend, 1 consulta):** en `requireAdmin`, cargar el usuario y verificar existencia e `is_blocked` antes de continuar. Requiere tocar el backend, fuera del alcance de esta ronda de frontend.

## Recommended Actions

1. **P1** — Verificar el usuario en `requireAdmin` (backend) para cerrar la ventana de acceso tras borrarlo o bloquearlo.
2. **P2** — Rotar la contraseña del SSH del VPS y la del administrador temporal original: ambas quedaron expuestas en el historial de la conversación.
3. **P2** — Revisar la paleta del panel público: hereda el rojo de marca `#dc2626`, mientras el admin usa azul; conviene documentar la decisión en `DESIGN.md`.
4. **P3** — Repetir esta medición tras cada ronda de cambios en el admin; el script queda en `peruana-informatica/frontend/scripts/auditoria-admin-a11y.cjs`.

## Lo que ya funciona

- Las 28 páginas cargan sin errores JavaScript ni respuestas HTTP 4xx/5xx.
- El modo oscuro cubre todo el panel con foco visible y scrollbar acorde.
- El dashboard muestra únicamente KPIs reales (ingresos cobrados, pedidos recibidos, ticket promedio, clientes nuevos) y el estado del ERP con su progreso de ciclo.
- Exportación CSV real en Reportes; los estados de quotation, pedido y pago son consistentes en tabla y tarjeta.
