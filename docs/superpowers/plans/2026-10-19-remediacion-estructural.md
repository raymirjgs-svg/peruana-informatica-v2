# Plan Maestro de Remediación Estructural — Peruana Informática

**Objetivo:** llevar el proyecto de "funciona" a **100% funcional y profesional**, no solo en lo visual, sino en seguridad, correctitud de datos, arquitectura, testing y operación (deploy/observabilidad).

**Contexto:** ya se ejecutaron 9 commits de remediación (auth admin, SQLi, stock/cupones/webhook, transacciones, sanitización, build de frontend, unificación de auth admin, hardening de upload, paginación). Este plan cubre **lo que queda**, ordenado por prioridad y con evidencia (archivos/líneas) para que sea accionable.

**Principio rector:** P0 = rompe producción o es seguridad → antes de cualquier deploy. P1 = funcionalidad/datos incorrectos. P2 = estructura/mantenibilidad. P3 = nivel profesional (CI, tests, DX).

**Nota de alcance:** cada workstream es independiente y debería convertirse en su propio plan task-by-task antes de ejecutarse. Este documento es el roadmap maestro y las prioridades.

---

## P0 — Bloqueantes de producción y seguridad

### P0.1 — Rotar credenciales filtradas y purgar historial
- **Evidencia:** `.env.docker.example` en los commits `13f9e57` y `5983cd4` contiene `GEMINI_API_KEY`, `GOOGLE_CLIENT_SECRET` (x2) y `API_PERUANA_TOKEN` reales. Además `peruana-informatica/.env:15` tiene `JWT_SECRET=super_secure_jwt_key_2024`.
- **Tareas:** rotar TODAS esas claves en sus proveedores (Gemini, Google OAuth, ERP Peruana, JWT); decidir purga de historial (`git filter-repo`/BFG) o, como mínimo, rotación + nota; agregar *secret scanning* (gitleaks) al CI.
- **Aceptación:** claves viejas revocadas; `gitleaks` no detecta secretos en HEAD.

### P0.2 — Contrato del token de social login + secreto fallback
- **Evidencia:** `backend/src/controllers/authController.ts:6` usa `process.env.JWT_SECRET || 'tu_secreto_super_seguro'`; `:71-79` firma `{ userId, email, role }` **sin `id`**, mientras todo el resto lee `req.user.id` (`authMiddleware.ts:7`, `permissions.ts:13`, `cartController.ts:12`, `wishlistController.ts:16`).
- **Tareas:** firmar `{ id, email, role }`; usar `requireJwtSecret()` (sin fallback).
- **Aceptación:** login social emite un token que funciona en cart/wishlist/pagos; ningún secreto por defecto en el código.

### P0.3 — Endpoints de autenticación faltantes
- **Evidencia:** `frontend/src/app/account/register/page.tsx:28` llama `POST /api/auth/register`; el backend solo tiene `POST /social-login` (`backend/src/routes/authRoutes.ts`). Registro = 404. `docs/` describe register/refresh que no existen.
- **Tareas:** implementar `POST /api/auth/register` (validación + hash + token) o, si no está en alcance, retirar la UI de registro; alinear forgot/reset y docs.
- **Aceptación:** el flujo de registro (o su ausencia) coincide entre FE, BE y docs.

### P0.4 — `MP_WEBHOOK_SECRET` ausente en producción
- **Evidencia:** `PaymentController.ts:275-315` falla cerrado (500) si falta el secreto; no está en `envs/.env.production` ni en `.env.example`.
- **Tareas:** provisionar el secreto real en prod; agregarlo a templates/env.
- **Aceptación:** webhook de Mercado Pago responde 200 en prod con firma válida.

### P0.5 — Backend `:3001` publicado en producción
- **Evidencia:** `docker-compose.yml:35-36` publica el puerto; el override prod usa `expose` pero el merge conserva `ports`.
- **Tareas:** quitar `ports` del base o pisarlo explícitamente en prod; forzar todo por nginx (TLS + `limit_req`).
- **Aceptación:** en prod el backend no es alcanzable desde el host.

### P0.6 — Ruta de migraciones real
- **Evidencia:** no hay `sequelize-cli`/`migrate`; schema viene de `scripts/init-db/database_backup.sql` que está **untracked** (`*.sql` ignorado) → clon nuevo arranca con DB vacía; `backend/migrations/*.sql` nunca se ejecuta; `sync({alter:true})` en scripts.
- **Tareas:** adoptar runner (sequelize-cli o umzug); versionar migraciones; paso de migración en `Dockerfile.prod`/compose/CI; eliminar dependencia del dump; seed idempotente de roles/permisos.
- **Aceptación:** `docker compose up` en limpio crea el schema y los seeds sin pasos manuales.

### P0.7 — Lockout de super-admin + `/api/admin/me` sin autorización
- **Evidencia:** `routes/admin/authRoutes.ts:48` exige `role === 'admin'` (super-admin no entra) mientras `authMiddleware.ts:36` permite `['admin','super-admin']`; `:91` `/me` verifica el JWT a mano sin `requireAdmin`.
- **Tareas:** unificar el criterio de rol; proteger `/me` con `authenticateToken`+`requireAdmin`.
- **Aceptación:** super-admin entra; `/me` rechaza tokens de cliente.

### P0.8 — `customerToken` nunca se escribe (cart/pagos autenticados rotos)
- **Evidencia:** `CartService.ts:20` y `PaymentService.ts:20` leen `localStorage['customerToken']`, que **no se escribe en ningún lado**.
- **Tareas:** definir la fuente del token de cliente (sesión NextAuth de cliente) y usarla; sincronizar como se hizo con admin.
- **Aceptación:** carrito/pagos autenticados persisten en servidor para usuario logueado.

### P0.9 — Fallback de datos mockeado que se envía al usuario
- **Evidencia:** `frontend/src/utils/api.ts` devuelve productos/productos por componente/subcategorías **fake** ante error de red (~150 líneas).
- **Tareas:** eliminar los mocks; lanzar error real y mostrar estado de error.
- **Aceptación:** caída de la API se ve como error, nunca como catálogo ficticio.

### P0.10 — Efecto lateral en un GET público
- **Evidencia:** `backend/src/routes/productRoutes.ts:89` dispara `SyncService.syncProducts()` en cada `GET /products`.
- **Tareas:** mover la sincronización a job programado/manual; el GET solo lee.
- **Aceptación:** listar productos no dispara sincronización.

---

## P1 — Correctitud funcional y datos

### P1.1 — Cron nunca inicializado (emails de carrito abandonado muertos)
- **Evidencia:** `config/cron.ts:9` `CronJobScheduler.initialize()` sin llamadores.
- **Aceptación:** job corre (o se elimina el código si no se usa).

### P1.2 — Índices FK faltantes
- **Evidencia:** 23 modelos sin `indexes:` (`Product`, `Order`, `OrderItem`, `User`, `Cart`, `CartItem`, `Inventory`, `Category`, `SubCategory`, `Image`, `Quotation`, `Discount`); filtros calientes sin índice (`Product.slug/brand_id/category_id`, `Order.user_id`, `OrderItem.order_id`).
- **Tareas:** agregar índices vía migraciones (P0.6).
- **Aceptación:** `EXPLAIN` usa índice en listados/detalles.

### P1.3 — N+1 en `OrderController`
- **Evidencia:** `controllers/OrderController.ts:42-72` (findByPk por ítem) y `:116-124` (`OrderItem.create` en loop → `bulkCreate`).
- **Aceptación:** crear/leer pedido usa consultas batcheadas.

### P1.4 — Upload de comprobante de pago: sin magic bytes + ruta pública de escritura
- **Evidencia:** `routes/paymentRoutes.ts:18-31` solo valida mimetype/extension; `server.ts:128-129` sirve `/uploads` sin auth; el upload admin sí valida firma.
- **Tareas:** reusar la validación de firma; revisar el modelo de acceso a comprobantes.
- **Aceptación:** archivo no-imagen rechazado; acceso a comprobantes acotado.

### P1.5 — `errorHandler` centralizado, pero evadido
- **Evidencia:** `middleware/errorHandler.ts` existe y está montado al final, pero hay **~195 `res.status(500)` inline** vs 2 `next(error)`; fuga de `error.message` en `productRoutes.ts:253,307`, `ExternalApiController.ts:20`, `SystemController.ts:34,59`, `TaxonomyController`, `SyncController`, `carouselRoutes.ts:299,307`, `uploadRoutes.ts:103`, etc.
- **Tareas:** normalizar a `CustomError`+`next(err)`, sanear mensajes; montar/usar `middleware/logger.ts` (hoy importado y nunca usado).
- **Aceptación:** respuestas de error uniformes y sin internals.

### P1.6 — Rate limiters no cableados
- **Evidencia:** `paymentLimiter` definido y sin usar; sin límite en `POST /api/payments/*`, `/api/coupons/validate|apply`, `/api/auth/social-login`, `POST /api/admin/upload`.
- **Tareas:** aplicar limiters a esos endpoints; unificar los dos sistemas de limiter.
- **Aceptación:** endpoints sensibles con límite efectivo.

### P1.7 — Paginación en listados sin tope
- **Evidencia:** 67 `findAll`; sin paginar `admin/brandRoutes`, subcategorías, carousel, contactos, blog (admin). Productos públicos sí paginan.
- **Tareas:** helper `backend/src/utils/pagination.ts`; `?page=&limit=` (tope 100, default 20) devuelve `{ success, data, pagination }` (+ `summary` en cupones/descuentos); sin esos params se conserva la respuesta legacy con tope de seguridad de 1000 filas.
- **Estado:** hecho. Paginan brands, taxonomía (categorías/subcategorías), carousel, cupones, descuentos y promo-banners; contactos, blog, páginas, reviews, clientes, productos y pedidos ya lo hacían. UI: `frontend/src/components/admin/Pagination.tsx` en cupones, descuentos, carousel y promo-banners.
- **Aceptación:** todos los listados admin paginan (contrato documentado).

### P1.8 — Guard de `/admin` en el servidor
- **Evidencia:** no existe `frontend/src/middleware.ts`; 14 páginas admin sin redirect (blog, carousel, categories, company-settings, contacts, customers, orders, products, quotations, seo, settings, system, taxonomy, users). Hoy el token de admin vive en `localStorage` (legible por XSS).
- **Tareas:** `middleware.ts` con `withAuth` para `/admin/*` (excepto login) y `/account/*`.
- **Aceptación:** visitar `/admin/*` sin sesión redirige a login (server-side).

### P1.9 — Fronteras de error/loading/not-found
- **Evidencia:** no existen `app/error.tsx`, `app/loading.tsx`, `app/global-error.tsx`, `app/not-found.tsx`; ~11 lugares tragan errores con `console.error` (`app/page.tsx:32`, `products/[slug]:48,72`, `cart:54`, `Header:44`, `Footer:20`, etc.).
- **Aceptación:** errores por ruta con UI consistente; sin `catch` silencioso en flujos de datos.

---

## P2 — Estructura y arquitectura

### P2.1 — Lógica inline en rutas → controllers
- **Evidencia:** `admin/taxonomyRoutes.ts` (381 ln, CRUD completo inline), `admin/categoryRoutes.ts` (243), `admin/carouselRoutes.ts` (312), `productRoutes.ts` (365), `dashboardRoutes.ts` (76), `admin/authRoutes.ts` (duplica login de `authController.ts`). CRUD de categorías en **3 lugares**.
- **Aceptación:** routers solo enrutan; lógica en controllers; sin duplicación de CRUD.
- **Estado:** hecho. Nuevos `admin/CategoryController.ts`, `admin/CarouselController.ts`, `admin/DashboardController.ts`; `TaxonomyController` y `admin/ProductController` extendidos; `authController.adminLogin` reutilizado. Routers reducidos a routing + validación. Verificado con MySQL real: product por id/slug, menú de categorías, CRUD completo de taxonomía/categorías/carousel, `reorder` idempotente y `upload` con tipo explícito; `tsc` 0, 18/18 tests, `next build` OK.

### P2.2 — Logging unificado
- **Evidencia:** **456 `console.*`** vs 30 `logger.*`; 3 loggers compitiendo (`config/logger.ts` real, `utils/logger.ts` muerto, `middleware/logger.ts`); sin `morgan`.
- **Aceptación:** un solo logger (winston) en controllers/handlers; sin `utils/logger.ts`.
- **Estado:** hecho. `utils/logger.ts` eliminado; `config/logger.ts` es el único logger (winston). 457 `console.*` reemplazados por `logger.info/warn/error` en 60 archivos (imports relativos agregados, sin duplicar los existentes). `Sequelize logging` en desarrollo ahora usa `logger.debug`. Verificado: `tsc` 0, 18/18 tests, smoke runtime con logs winston.

### P2.3 — Config/env con validación de esquema
- **Evidencia:** solo `JWT_SECRET` validado; fallbacks inseguros (`DB_PASSWORD||''`, `MP_ACCESS_TOKEN||'TEST-TOKEN'`); `backend/.env.example` incompleto (falta MP_WEBHOOK_SECRET, Redis, Google, CORS, etc.); **no existe `frontend/.env.example`**; `envs/.env.staging` sin `JWT_SECRET`/`NEXTAUTH_SECRET` (crashea al boot).
- **Tareas:** validación con zod/envalid al arranque; completar examples; corregir staging.
- **Aceptación:** variables faltantes/inválidas fallan al iniciar con mensaje claro.
- **Estado:** hecho (salvo staging, que es ops). `config/env.ts` ahora valida con zod (zod añadido al backend) al arrancar: errores agregados por variable (`JWT_SECRET`, `PORT`, `NODE_ENV`, etc.) y warnings de producción (DB_PASSWORD vacío, sin MP_WEBHOOK_SECRET, JWT corto, sin CORS). `server.ts` llama `validateEnv()` antes de conectar. Eliminado el fallback `MP_ACCESS_TOKEN || 'TEST-TOKEN'`. Los `.env.example` de backend y frontend ya estaban completos. `envs/.env.staging` no existe en el repo (gitignored) → la provisión de secretos de staging sigue pendiente como tarea de ops.

### P2.4 — Capa de datos del frontend unificada
- **Evidencia:** 3 estrategias de token; `lib/api-client.ts` muerto; `utils/api.ts` con mocks (P0.9); ~27 archivos con `NEXT_PUBLIC_API_URL || 'http://localhost:3001'` hardcodeado; `contacto/page.tsx:27` sin fallback (`undefined/api/...`); `next.config.ts` `images.unoptimized: true` + `hostname:'**'`; conflicto `NEXT_PUBLIC_API_URL` con/sin `/api` (root `.env.example` incluye `/api`).
- **Aceptación:** un único cliente API; una sola fuente de token; cero URLs hardcodeadas; env coherente.

### P2.5 — Purga de código muerto
- **Evidencia:** `common/Navbar.tsx` (739 ln, 0 imports), `QuotationForm` duplicado, stubs vacíos (`cart/Cart.tsx`, `cart/Checkout.tsx`, `product/ProductDetail.tsx`, `seo/SEOHead.tsx`, `hooks/useProducts.ts`, `hooks/useSEO.ts`, `services/OrderService.ts`, `services/piClient.ts`, `models/Order.ts`, `models/User.ts`), `AuthProvider`/`NextAuthProvider` idénticos, `robots.ts` + `api/robots/route.ts` duplicados, backend `OpenAIService.ts`, `UnsplashService.ts`, `models/Banner.js`, `routes/banners.js`, `controllers/index.ts`, scripts de debug sueltos, doble mount `/api/payments`+`/api/payment`.
- **Aceptación:** sin archivos muertos/vacíos; un solo provider/robots.
- **Estado:** hecho. Eliminados 26 módulos sin imports reales (verificados con búsqueda de especificadores, alias y rutas dinámicas):
  - Frontend: `common/Navbar.tsx`, `cart/Cart.tsx`, `cart/Checkout.tsx`, `product/ProductDetail.tsx`, `seo/SEOHead.tsx`, `hooks/useProducts.ts`, `hooks/useSEO.ts`, `services/OrderService.ts`, `services/piClient.ts`, `lib/api-client.ts`, `utils/canonical.ts`, `utils/slugs.ts`, `models/Order.ts`, `models/User.ts`, `app/api/robots/route.ts`, `components/quotation/QuotationForm.tsx`.
  - Backend: `controllers/index.ts`, `services/OpenAIService.ts`, `services/UnsplashService.ts`, `models/Banner.js`, `routes/banners.js`, `routes/settingsRoutes.ts`, `routes/taxonomyRoutes.ts` (público sin auth y sin montar), `models/ComponentCompatibility.ts`, `models/Inventory.ts`, `scripts/fix-db.ts`.
  - Conservados a propósito: `AuthProvider` y `NextAuthProvider` (los usan layouts distintos), `app/cotizador/laptop/components/QuotationForm.tsx` y `components/quotation/QuotationSummary.tsx` (en uso), `bulkAssignProducts`/`backfillTrackingCodes`/`syncDatabase` (utilidades ops documentadas) y el doble mount `/api/payments` + `/api/payment` (el frontend usa ambos).
  - `settingsRoutes.ts` se eliminó porque su GET duplicaba `globalSettingsRoutes` (montado en `/api/settings`) y su PUT admin no estaba montado ni se usaba desde el frontend.
  - Verificado: backend `tsc` 0 + 18/18 tests; frontend `tsc --noEmit` 0 + `next build` OK (limpiando `.next` cacheado).

### P2.6 — Partir archivos "god"
- **Evidencia:** `admin/products/page.tsx` 1498, `admin/blog/page.tsx` 1242, `admin/seo/page.tsx` 855, `cotizador/laptop/page.tsx` 745, `cart/page.tsx` 717, `account/profile/page.tsx` 638, `admin/orders/page.tsx` 565, `blogController.ts` 1445, `admin/ProductController.ts` 787, `seoController.ts` 625.
- **Aceptación:** componentes/páginas < ~400 ln, separados por responsabilidad.
- **Estado:** en progreso.
  - Hecho: `blogController.ts` (1446 ln) partido en `controllers/blog/BlogPublicController.ts` (152), `BlogAdminController.ts` (376), `BlogAiController.ts` (361) y `BlogDemoController.ts` (47), con los datos demo extraídos a `data/blogDemoPosts.ts` (531, dato estático). `blogRoutes.ts` reapunta a los cuatro controllers; sin cambios de contrato. Verificado con MySQL real: listado público/admin, stats, sugerencias IA, create/get/update/delete y 401 sin token; `tsc` 0, 18/18 tests.
  - Hecho: `admin/ProductController.ts` (1026 ln) partido en `admin/ProductController.ts` (376, CRUD), `admin/ProductBulkController.ts` (227, import/bulk/sync), `admin/ProductErpController.ts` (102, ERP lookup) y `ProductPublicController.ts` (233, público), con `createProductRecord` extraído a `services/productRecordService.ts` (94). Se eliminó el `SyncService.syncProducts()` que corría en el GET admin (resto de P0.10): el listado admin pasó de disparar sync a responder en ~50 ms. Verificado con MySQL real: públicas por id/slug, sugerencias, admin list/detail, create/update/toggle/delete, ERP lookup, import JSON y bulk update; `tsc` 0, 18/18 tests.
  - Hecho: `seoController.ts` (626 ln) partido en `seoController.ts` (292, CRUD), `SeoPageController.ts` (106), `SeoAnalysisController.ts` (150) y `SeoSuggestController.ts` (63), con los campos editables en `utils/seoFields.ts`. Verificado con MySQL real: getAll, analysis, get/update por page_type, create/get/update/delete y suggest (Gemini responde 500 por la key filtrada, wiring OK); `tsc` 0, 18/18 tests.
  - Hecho: `admin/orders/page.tsx` (583 ln) partido en `orders/types.ts`, `components/admin/orders/statusBadges.tsx`, `OrderCard.tsx` y `InvoiceModal.tsx` (page 232 ln); `tsc` 0 y `next build` OK.
  - Hecho: `account/profile/page.tsx` (638 ln) partido en `profile/types.ts` y 7 componentes en `components/account/profile/` (page 281 ln); `tsc` 0 y `next build` OK.
  - Hecho: `cart/page.tsx` (717 ln) partido en `cart/{types,helpers}.ts` y `ProgressBar`, `SuccessStep`, `PaymentStep`, `CustomerStep`, `CartStep` (page 295 ln); `tsc` 0 y `next build` OK.
  - Hecho: `admin/seo/page.tsx` (855 ln) partido en 6 componentes locales (score, stats, recomendaciones, listado, herramientas y modal de edición); page 294 ln; `tsc` 0 y `next build` OK.
  - Hecho: `cotizador/laptop/page.tsx` (749 ln) partido en `types.ts` y 5 componentes (filtros, lista, card, éxito y panel de cotización); page 317 ln; se eliminaron helpers de estandarización sin uso. `tsc` 0 y `next build` OK.
  - Hecho: `admin/blog/page.tsx` (1242 ln) partido en `blog/types.ts`, `blog/utils.ts`, `blog/useBlogAdmin.ts` (hook con estado/handlers, 408 ln) y 7 componentes locales (stats, panel IA, aviso IA, listado, modales de API key, sugerencias y post); page 157 ln; `tsc` 0 y `next build` OK.
  - Hecho: `admin/products/page.tsx` (1498 ln) partido en `products/types.ts`, `products/utils.ts`, `hooks/useProductsData.ts` (datos, filtros y selección) y `hooks/useProductsForms.ts` (alta/edición/bulk); 11 componentes locales (toast, header, filtros, barra y modal bulk, vistas lista y grilla, preview, crear, editar y paginación); page 80 ln; `tsc` 0 y `next build` OK.

### P2.7 — Tipos unificados
- **Evidencia:** triple `Product` (`models/Product.ts`, `types/index.ts` con `id:string` en conflicto, `models/ApiTypes.ts`); `CartItem` duplicado; ~148 `any` + 31 `as any` + 170 backend `any` + 17 `@ts-ignore`.
- **Aceptación:** una sola definición de dominio; eliminar `any` en rutas calientes; lint de `no-explicit-any` activo.
- **Estado:** parcial.
  - Hecho: `frontend/src/types/index.ts` reducido a `PaginationMeta`; eliminadas las definiciones muertas y conflictivas de `Product` (`id: string`), `CartItem`, `User`, `Order` y `ProductImage`.
  - Hecho: `CartItem` unificado en `services/CartService.ts` (producto tipado con `@/models/Product`, `id` opcional para líneas locales) y `useCart` lo reexporta; ya no hay dos `CartItem`.
  - Hecho: `@typescript-eslint/no-explicit-any` pasó de `off` a `warn` en el frontend (0 errores, 311 warnings) para habilitar la limpieza incremental.
  - Pendiente: unificar los `Product` locales de páginas (`inventory`, `cotizador/*`, `resumen`, `lista-distribucion`) y bajar los warnings de `any`.

### P2.8 — Server-state + RSC para primer render
- **Evidencia:** sin SWR/react-query; `useEffect+useState` en todas partes; `Header/Footer/MegaMenu/Navigation` refetchean settings/categorías por página (waterfall); 54/61 páginas client; SEO por página imposible en client components.
- **Tareas:** adoptar SWR/TanStack Query; mover data de primer paint a Server Components; `generateMetadata` en páginas públicas; `metadataBase`.
- **Aceptación:** sin refetch duplicado; metadata por página; menos JS cliente.

### P2.9 — Swagger real
- **Evidencia:** `/api-docs` montado (`server.ts:170`) pero **cero** anotaciones `@openapi` → docs vacías; `docs/technical/*` describe endpoints inexistentes.
- **Aceptación:** spec cubre rutas y componentes; docs alineadas.
- **Estado:** hecho.
  - `scripts/generate-openapi.ts` introspecciona los routers Express montados y emite `src/config/openapi.paths.json` (168 paths / 207 operaciones). `npm run docs:generate` lo regenera.
  - `config/swagger.ts` carga ese JSON, define 16 schemas (Product, Category, Brand, Order, AuthResponse, etc.) y enriquece las operaciones clave con request bodies, parámetros y `$ref`s; `/api-docs` sirve la spec real. `tsc` 0, 18/18 tests.

### P2.10 — Deploy/nginx correctos
- **Evidencia:** `nginx/nginx.conf` con `midominio.com` y sin `location /images/` (imágenes 404 en prod); healthcheck nginx pega `http://localhost/health` que no existe (solo `/api/health`); `nginx/conf.d` vacío; composes duplicados stale.
- **Aceptación:** nginx sirve `/health` y `/images/`; dominio real; un solo set de compose.

---

## P3 — Nivel profesional (ingeniería y operación)

### P3.1 — CI en Pull Requests
- **Evidencia:** `.github/workflows/*` solo deployan (push a main/develop); **ningún** job corre `npm ci`, `test`, `tsc`, `eslint` ni Playwright en PR; `develop` no existe (staging.yml muerto).
- **Tareas:** `ci.yml` en `pull_request` para backend (`ci`+`tsc`+`jest --coverage`) y frontend (`ci`+`tsc`+`eslint`+`build`+playwright); proteger rama.
- **Aceptación:** PR no mergea sin CI verde.

### P3.2 — Tests reales
- **Evidencia:** cobertura backend **0.87%**; `analytics.test.ts`/`roles.test.ts` construyen una app Express fake y **no importan código real**; `permissions.test.ts` solo valida `typeof === 'function'`; frontend sin tests unitarios.
- **Tareas:** tests de integración con `supertest(app)` y DB de test para auth/orders/payments/coupons; thresholds de cobertura; frontend Vitest+RTL para services/hooks críticos; arreglar Playwright (sin `return` silenciosos, credenciales por env, `storageState`, no commitear `playwright-report/`).
- **Aceptación:** cobertura con umbral que rompe build; flujos de negocio cubiertos.
- **Estado:** parcial.
  - Hecho: eliminados `analytics.test.ts` y `roles.test.ts` (apps Express fake que no importaban código real); `permissions.test.ts` reescrito contra el middleware real (`checkPermission`/`checkAnyPermission`/`checkRole`) con modelos mockeados.
  - Hecho: tests nuevos para `utils/pagination.ts`, `utils/seoFields.ts`, `utils/imageSignature.ts` y `middleware/errorHandler.ts` (37 tests, 6 suites). `coverageThreshold` en `jest.config.js` rompe el build si `src/utils` baja de 85% líneas o `src/middleware` de 30%.
  - Pendiente: integración real con DB de test (auth/orders/payments/coupons), Vitest+RTL en frontend y arreglo de Playwright.

### P3.3 — Lint/format/hooks
- **Evidencia:** backend sin ESLint/Prettier; frontend con `ignoreDuringBuilds: true` y `no-explicit-any: off`; sin husky/lint-staged/editorconfig.
- **Aceptación:** lint obligatorio (no ignorado en build); pre-commit con lint/types.
- **Estado:** parcial.
  - Hecho: frontend ya no ignora ESLint en `next build` (`ignoreDuringBuilds: false`); se corrigieron los 10 errores existentes y `npm run lint` queda limitado a `src` (0 errores, 154 warnings).
  - Hecho: backend con ESLint 9 + `typescript-eslint` (`eslint.config.mjs`), script `lint` y job de CI; 0 errores, 66 warnings.
  - Hecho: `.editorconfig` en la raíz.
  - Pendiente: husky/lint-staged (requiere decidir tooling de monorepo) y Prettier.

### P3.4 — Builds reproducibles y pipeline
- **Evidencia:** `Dockerfile.prod` usa `npm install`; `tsc` emite tests a `dist`; rollback reconstruye desde ref git (no atómico); sin Dependabot/CODEOWNERS.
- **Aceptación:** `npm ci`; tests fuera de `dist`; artefactos/etiquetas para rollback; Dependabot activo.

### P3.5 — Observabilidad y backups
- **Evidencia:** sin APM/metrics/tracing/Sentry; heartbeat vacío cada 10s (`server.ts:279`); backup local sin cifrado/offsite y con password en CLI; `unhandledRejection` no sale.
- **Aceptación:** error tracking + métricas básicas; backup cifrado y verificado.
- **Estado:** parcial.
  - Hecho: `middleware/metrics.ts` cuenta requests por método/estado y duración; `/api/metrics` expone formato Prometheus protegido por `METRICS_TOKEN` (404 si el token falta).
  - Hecho: `unhandledRejection` ahora cierra el proceso con código 1; eliminado el `setInterval` heartbeat vacío.
  - Hecho: `scripts/backup-db.sh` usa `MYSQL_PWD` (sin password en argv), `--single-transaction`, valida el gzip y cifra con `openssl` si `BACKUP_PASSPHRASE` está definido; `scripts/backup_daemon.sh` aplica la misma política y la retención cubre archivos cifrados.
  - Pendiente: error tracking (Sentry/APM requiere cuenta y DSN) y copia offsite.

### P3.6 — Accesibilidad e i18n (decisión)
- **Evidencia:** 259 `<button>` vs 6 `aria-label`; `<img>` sin `alt` en admin/reviews y ProductImageManager; copy 100% hardcodeado en español; fechas `es-PE` vs `es-ES`.
- **Decisión pendiente:** ¿el sitio será multi-idioma? Si no, cerrar con lint a11y y consistencia de locale.

---

## Secuenciación propuesta (fases ejecutables, 1 commit por ítem)

- **Fase A — P0 (bloqueantes):** P0.1→P0.10. Obligatoria antes de cualquier deploy a prod.
- **Fase B — P1 (correctitud):** P1.1→P1.9.
- **Fase C — P2 (estructura):** P2.1→P2.10 (la más grande; subdividir por archivo/módulo).
- **Fase D — P3 (profesional):** P3.1→P3.6.

**Esfuerzo relativo:** A ~1-2 días · B ~2-3 días · C ~1-2 semanas · D ~1 semana (según equipo).

---

## Criterios de aceptación globales ("100% funcional y profesional")

1. Ningún secreto real en repo ni historial; todas las claves rotadas.
2. CI verde en PR (tsc + lint + tests + build + e2e) y rama protegida.
3. Migraciones repetibles: clon limpio → `up` → schema+seeds sin pasos manuales.
4. Todos los endpoints admin protegidos server-side; un único mecanismo de token por rol.
5. `errorHandler` central en uso; sin fuga de internals; logs unificados.
6. Cobertura de tests con umbral que rompe el build; flujos de negocio críticos cubiertos.
7. `.env.example` completos (backend y frontend); validación de env al arranque.
8. Sin código muerto/vacío; archivos < ~400 ln; un tipo de dominio por entidad.
9. Swagger refleja las rutas; docs alineadas con el código.
10. Observabilidad mínima (error tracking + healthchecks reales); backups cifrados.

---

## Riesgos y decisiones abiertas (requieren input)

1. **Purga de historial git:** reescribir historia (BFG) vs solo rotar claves. Riesgo de romper clones/PRs.
2. **Runner de migraciones:** `sequelize-cli` vs `umzug`. Impacta P0.6 y P1.2.
3. **Server-state:** SWR (simple) vs TanStack Query (potente). Impacta P2.8.
4. **Arquitectura frontend:** mover a RSC/SSR el primer render vs SPA-client actual. Cambio grande.
5. **Monorepo:** mantener dos `package.json` independientes vs workspaces + turbo. Impacta CI/DX (P3.1/P3.4).
6. **i18n:** ¿multi-idioma o solo español? Define P3.6.
7. **Registro de usuarios:** ¿se implementa `register`/`forgot`/`reset` o se retira la UI? (P0.3).
