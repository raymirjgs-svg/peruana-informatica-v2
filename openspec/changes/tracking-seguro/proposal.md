# Proposal: Secure order tracking + admin route auth

## Problem

The "order tracking number" shown to customers (and used at `/track-order`) is the raw
`orders.id` — an auto-increment integer. The public endpoint
`GET /api/client/orders/:id` (`backend/src/controllers/ClientController.ts:8`) returns
customer name, email, total and line items for **any** id, and
`GET /api/client/orders/:id/invoice` (`:46`) downloads the invoice (RUC, address). Any
visitor can enumerate orders (`1024`, `1025`, ...) and read/download other customers' PII.

Separately, the admin routers `/api/admin/orders`, `/api/admin/payments` and
`/api/admin/coupons` are mounted with **no auth middleware** (`server.ts:184-189`), so
anyone can read all orders, mark payments as verified, or create/delete coupons.

## Outcome

1. Every order gets an opaque, non-guessable `tracking_code` delivered by email.
2. Guests can still track their order status by entering that code — no login required.
3. `GET /api/client/orders/:id` and `/invoice` require the authenticated owner.
4. Admin order/payment/coupon routes require an authenticated admin.

## Non-goals

- MP webhook signature/idempotency, stock enforcement, coupon server-side application
  (tracked separately; see the purchase-flow review).
- Refactoring the 711-line `cart/page.tsx`.
