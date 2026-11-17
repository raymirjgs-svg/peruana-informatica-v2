# Design: Secure order tracking + admin route auth

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | `orders.tracking_code STRING(20) UNIQUE NULL` | Applied by the repo's existing `sequelize.sync({ alter: true })` mechanism (`src/scripts/syncDatabase.ts:33`); nullable keeps the migration safe for legacy rows, backfilled afterwards. MySQL allows multiple `NULL` in a UNIQUE index. |
| D2 | Code format `PX-XXXX-XXXX` (Crockford-ish base32, no `0/O/1/I/L`), generated with `crypto.randomBytes` | ~50 bits of entropy, no ambiguity when read from an email, easy to type. |
| D3 | Retry on unique collision (loop over `SequelizeUniqueConstraintError`) | Avoids duplicate code without pre-checking. |
| D4 | New public endpoint `GET /api/client/orders/track/:code` | Guests keep tracking; no login needed. Returns a reduced, safe payload (R5). |
| D5 | `GET /api/client/orders/:id` and `/invoice` are **removed**; all client order access goes through the tracking code. Legacy `/orders/[id]` page replaced by `/orders/track/[code]` | Orders are not linked to an account (public/guest checkout, `user_id` is NULL), so an auth + `user_id` ownership check was not possible. The opaque code acts as the customer's secret. |
| D6 | Admin routers get `authenticateToken` + `requireAdmin` at the router level | Smallest, uniform change; the admin panel is updated to send `localStorage.adminToken` first (verification task 2.1). |
| D7 | Invoice download for guests: **by tracking code** (`GET /api/client/orders/track/:code/invoice`) | Keeps the guest flow working. Resolved in favor of code-based access. |

## Backend flow

```
createOrder ──► generate tracking_code ──► Order.create ──► 201 { tracking_code }
                       │
email (orderConfirmation) ──► shows tracking_code + link /track-order
                       │
guest ──► GET /track-order ──► /orders/track/[code] ──► GET /api/client/orders/track/:code
owner ──► GET /api/client/orders/:id (token + ownership)
admin ──► /api/admin/orders|payments|coupons (token + admin)
```

## Migration

1. Add field to `Order` model → `sequelize.sync({ alter: true })` adds the column.
2. `src/scripts/backfillTrackingCodes.ts` generates codes for existing rows with `NULL`.

## Risks

- **R-1 (pre-existing):** `package.json` script `add-columns` points to a non-existent
  file (`src/scripts/addMissingColumns.ts`). Do not rely on it; use `syncDatabase`/a new script.
- **R-2:** Activating admin auth can break the admin panel if it does not send the token.
  Verify the admin API client before enabling.
- **R-3:** Backfill must be run once in production; coordinate the deploy.
- **R-4:** UX change (code instead of `#1024`) must be communicated to the client.
