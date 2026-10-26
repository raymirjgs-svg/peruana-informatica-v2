# Lista de mejoras - Checklist

## P0 - Bloqueantes de producción y seguridad
- [x] P0.1 Rotar credenciales filtradas (parcial - requiere rotación manual en proveedores)
- [x] P0.2 Contrato token social login sin fallback inseguro
- [x] P0.3 Endpoints auth / registro alineados
- [x] P0.4 MP_WEBHOOK_SECRET gestión (pendiente provision prod)
- [x] P0.5 Backend no expuesto públicamente
- [x] P0.6 Migraciones (parcial)
- [x] P0.7 Lockout super-admin /api/admin/me
- [x] P0.8 customerToken unificado
- [x] P0.9 Eliminar mocks falsos en frontend
- [x] P0.10 GET público sin efecto lateral de sync

## P1 - Correctitud
- [x] P1.1 Cron inicializado/gestionado
- [x] P1.2 Índices FK (vía migraciones)
- [x] P1.3 N+1 en OrderController optimizado
- [x] P1.4 Upload comprobante con magic bytes + acceso restringido
- [x] P1.5 errorHandler centralizado
- [x] P1.6 Rate limiters aplicados
- [x] P1.7 Paginación en listados admin
- [x] P1.8 Guard server-side /admin
- [x] P1.9 Fronteras error/loading/not-found

## P2 - Estructura y arquitectura
- [x] P2.1 Rutas → controllers
- [x] P2.2 Logging unificado (winston)
- [x] P2.3 Config/env con validación zod
- [x] P2.4 Capa datos frontend unificada
- [x] P2.5 Purga código muerto
- [x] P2.6 Partir archivos god (salvo quotations WIP)
- [x] P2.7 Tipos unificados / sin any (backend 0, frontend 0, reglas error)
- [x] P2.8 Server-state + RSC
- [x] P2.9 Limpieza general
- [x] P2.10 Infra/nginx/ci

## P3 - Profesional
- [x] P3.1 CI en PRs (typecheck+lint+tests+build)
- [ ] P3.2 Tests integración DB / Vitest+RTL / Playwright (parcial)
- [x] P3.3 Lint/format/hooks (ESLint obligatorio, editorconfig)
- [x] P3.4 Builds reproducibles (Dockerfile, scripts)
- [ ] P3.5 Observabilidad/backups (métricas/backup hechos, falta Sentry/offsite)
- [ ] P3.6 Accesibilidad/i18n (decisión pendiente)

## Estado actual
- Backend: 0 errors/warnings, 0 any, tests OK
- Frontend: 0 errors, warnings desactivados/reducidos, 0 any, build OK
