# Informe de mejoras SEO local + pendientes

Fecha: 2026-10-27

## 1) Diagnóstico SEO
- [x] 1.1 view-source comprobado (ficha con SSR parcial). 
- [x] 1.2 Rich Results Test - schema Product/BreadcrumbList presente
- [x] 1.3 Endpoint público /api/products/slug/:slug
- [x] 1.4 INTERNAL_API_URL revisado (usa getApiBase/apiClient)

## 2) SEO técnico
- [x] 2.1 JSON-LD Product enriquecido (seller, areaServed, priceValidUntil, itemCondition)
- [x] 2.2 LocalBusiness/Organization añadido (pendiente revisar en layout global si aplica)
- [x] 2.3 generateMetadata mejorado con contexto local
- [ ] 2.4 Fallback SSR con logging detallado
- [ ] 2.5 Microcopy local visible
- [ ] 2.6 Sitemap con productos activos
- [ ] 2.7 Robots.txt revisión

## 3) Google Merchant Center
- [ ] 3.1 Endpoint /api/feed/google-merchant.xml
- [ ] 3.2 Filtro por stock/activo
- [ ] 3.3 Documentación GMC
- [ ] 3.4 Validación feed

## 4) Pendientes checklist
- [ ] P0.1 Rotación credenciales (ops)
- [ ] P0.4 MP_WEBHOOK_SECRET prod (ops)
- [ ] P0.6 Migraciones repetibles
- [ ] P3.2 Tests integración/Vitest/Playwright
- [ ] P3.5 Sentry + offsite backup
- [ ] P3.6 Decisión i18n/a11y

## Evidencia
- Archivos modificados: products/[slug]/layout.tsx
