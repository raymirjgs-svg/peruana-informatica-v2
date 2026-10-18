# Tasks: Secure order tracking + admin route auth

## Phase 0 — Data
- [x] 0.1 Add `tracking_code` to `backend/src/models/Order.ts` (STRING(20), unique, nullable).
- [x] 0.2 Create `backend/src/scripts/backfillTrackingCodes.ts`.
- [x] 0.3 Run schema sync + backfill against local DB; verify column and values. (214/214 rows, unique)

## Phase 1 — Backend tracking
- [x] 1.1 Create `generateTrackingCode()` util + unit test.
- [x] 1.2 `OrderController.createOrder`: set `tracking_code`, return it in 201.
- [x] 1.3 Add `GET /api/client/orders/track/:code` (safe payload).

## Phase 2 — Backend auth
- [x] 2.1 Verify admin panel sends the token to orders/payments/coupons. (orders page did NOT; fixed with `localStorage.adminToken`; coupons page already sends it)
- [x] 2.2 Add auth middleware to `admin/orderRoutes.ts`, `admin/paymentRoutes.ts`, `admin/couponRoutes.ts`. (`authenticateToken` + `requireAdmin`)
- [x] 2.3 Owner guard on `clientRoutes.ts` (`/orders/:id`, `/invoice`). → Migrated to tracking code; numeric-id routes removed (404). Decision: guest checkout has no account link.

## Phase 3 — Frontend
- [x] 3.1 `/track-order` accepts the tracking code.
- [x] 3.2 New page `/orders/track/[code]` (old `/orders/[id]` removed).
- [x] 3.3 Cart success screen shows the code and links to `/orders/track/[code]`.
- [x] 3.4 Email template shows the code + link to `/track-order`.

## Phase 4 — Verify
- [x] 4.1 `tsc` frontend vs baseline (39 errors — unchanged; new file inherits the same pre-existing badge errors).
- [x] 4.2 Backend build + `npm test` (18/18).
- [x] 4.3 Manual: create order → code works → invalid code 404 → numeric id 404 → admin route 401 without token.
