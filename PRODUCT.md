# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (confirmed):** el comprador del sitio público. Llega a la tienda a
buscar un producto de tecnología concreto o a armar una PC, compara, cotiza y
paga. Es el usuario cuyo trabajo manda en el diseño de las superficies
públicas.

**Secondary (fact, current scope excludes it):** el operador interno
(`super-admin`, `admin`, `vendedor`, `soporte`, sembrados en la base) que
gestiona catálogo, pedidos, contenido y ajustes en `/admin`. Existe y funciona,
pero esta ronda de diseño lo deja fuera por decisión del cliente.

## Product Purpose

Tienda en línea de productos de tecnología para el mercado peruano: navegar
catálogo, armar una PC por componentes, cotizar, pedir, pagar y seguir el pedido
por código de seguimiento. El éxito es que el comprador encuentre el producto,
confíe en el precio y llegue al pedido. **WhatsApp es un canal válido de
consulta y de cierre**: que el cliente escriba no es un fallo del diseño, es
una ruta de venta que la web debe alimentar y no impedir.

## Positioning

**Integración ERP:** el stock y los precios se sincronizan desde un sistema ERP
externo, no se inventan en la web. Todo diseño debe respetar que la verdad del
producto viene del ERP.

## Operating Context

- Pago: **Mercado Pago** como única pasarela.
- Flujo de pedido con **aprobación humana** (`checkout_mode = approval`): el
  pedido nace en revisión, el admin lo aprueba y recién queda habilitado para
  pagar; el cliente paga desde el enlace de seguimiento.
- **WhatsApp** como canal de cierre comercial y consulta.
- Cotizador por componentes (`/cotizador/laptop`, `/cotizador/pc`).
- Blog con generación de contenido por IA (Google Gemini).
- Tienda en español de Perú, precios en soles (S/).

## Capabilities and Constraints

Confirmado por el cliente:

- **El alcance visual es solo el sitio público.** No tocar backend, pagos, ERP
  ni lógica de negocio en esta ronda.
- **No cambiar textos legales.**
- **Cambios mínimos reutilizando componentes existentes** antes de crear nada.

Confirmado por el repo (cifras de la **base de datos MySQL de producción**
`peruana_informatica`, leídas dentro del contenedor `peruana_backend` del VPS
con un script `mysql2` durante la ronda de auditoría del panel admin, informe
entregado el **21/11/2026**):

- 1.597 productos, 397 marcas, 38 categorías, 314 pedidos, 108 clientes,
  13 posts de blog.
- **Estas cifras se mueven**: el ERP sincroniza stock y precios a diario. En la
  captura de portada de hoy figuran ya **1.602 productos y 322 pedidos**. No se
  citan como verdad permanente, sino como tamaño de la operación en esa fecha.
- Rojo corporativo `#dc2626` en la tienda pública; azul reservado al panel
  `/admin`.
- Logo y nombre vigentes conservados.
- Paginación, búsqueda y filtros de catálogo ya operativos.

Abierto / por confirmar:

- `MP_ACCESS_TOKEN` en producción es un placeholder
  (`PROD-0000000…-000000000`, 71 caracteres). **Dónde lo vi:** en el entorno del
  contenedor `peruana_backend` del VPS (`docker exec peruana_backend env`),
  durante la ronda de auditoría del panel admin. Como comprobación adicional,
  la API de Mercado Pago rechazaba el token con
  `403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES`. No tengo anotada la fecha exacta
  de ese chequeo (posterior al 17/11/2026), así que **vale como "por
  verificar"**: puede haber cambiado si el cliente ya pegó el token real.
  **No es un problema de diseño** y no se toca en esta ronda.

## Brand Commitments

- **Rojo `#dc2626`** como color de marca del sitio público.
- **Azul** únicamente para el panel administrativo.
- Logo y nombre actuales: intactos.
- **Mercado Pago** como única pasarela y **WhatsApp** como canal de cierre.
- **Español de Perú**: precios en **S/**, y trato de **"tú" o "usted"** igual que
  la web ya usa. **Nunca "vos".**

## Evidence on Hand

Real, con rutas: imágenes de producto en
`peruana-informatica/backend/public/images/` (`products/`, `carousel/`) y
subidas en `public/uploads/`; catálogo y stock sincronizados desde el ERP;
pedidos y cotizaciones reales en base.

**Ausencias que no se deben fabricar:** no existen testimonios de clientes,
fotos de clientes ni casos de éxito reales. Cualquier espacio que parezca
pedirlos se resuelve con contenido real del producto, no con personajes
inventados.

## Product Principles

1. **La verdad del ERP manda.** Stock y precio vienen del ERP; la UI nunca los
   adorna ni los contradice.
2. **Claridad del comprador antes que la decoración.** Cada píxel de la portada
   compite con el producto; si no ayuda a decidir, no va.
3. **Cambio mínimo, componente reutilizado.** Se arregla lo compartido, no se
   reescriben 29 pantallas.
4. **Lengua y moneda nativas.** Español de Perú y S/ como idioma visual, no
   como traducción pegada.
5. **La confianza se gana con precisión**, no con efectos: precio, stock y
   siguiente paso siempre visibles.

## Accessibility & Inclusion

No se estableció un requisito de accesibilidad específico del producto en esta
ronda (*inferencia, no compromiso confirmado*): se toma **WCAG 2.1 AA** como
línea base de trabajo para las superficies públicas. Pendiente de confirmación
explícita.