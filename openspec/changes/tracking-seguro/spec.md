# Spec: Secure order tracking + admin route auth

## Requirements

- **R1** Every order has a unique, non-guessable `tracking_code`.
- **R2** A guest can view an order's tracking state by entering the code, without login.
- **R3** `GET /api/client/orders/:id` and `GET /api/client/orders/:id/invoice` require an
  authenticated owner (`order.user_id === req.user.userId`).
- **R4** `/api/admin/orders`, `/api/admin/payments` and `/api/admin/coupons` require an
  authenticated admin.
- **R5** The tracking-by-code payload exposes only: `status`, `payment_status`, `items`,
  `total_amount`, `createdAt`, customer name, and a **masked** email.
- **R6** An invalid or unknown tracking code returns `404`.
- **R7** `POST /api/orders` returns the generated `tracking_code` so the confirmation
  screen can display it.

## Scenarios

### S1 — Guest tracks by code
Given an order with tracking code `PX-7F3K-92QD`
When a guest calls `GET /api/client/orders/track/PX-7F3K-92QD`
Then 200 with status/payment_status/items/total/createdAt/masked email.

### S2 — Invalid code
When anyone calls `GET /api/client/orders/track/NOPE`
Then 404, and no order data is leaked.

### S3 — Numeric id is no longer public
When an anonymous request hits `GET /api/client/orders/1024`
Then 401 (no token).

### S4 — Owner access by id
Given a logged-in customer who owns order 1024
When they call `GET /api/client/orders/1024` with a valid token
Then 200 with their order.

### S5 — Non-owner access
Given a logged-in customer who does NOT own order 1024
When they call `GET /api/client/orders/1024`
Then 404.

### S6 — Admin routes protected
When an anonymous request hits `GET /api/admin/orders`, `PATCH /api/admin/payments/:id/verify`
or `POST /api/admin/coupons`
Then 401.

### S7 — Tracking code returned on create
When `POST /api/orders` succeeds
Then the 201 body includes `tracking_code`.

## Data contract

`GET /api/client/orders/track/:code` → 200:
```json
{
  "id": 1024,
  "tracking_code": "PX-7F3K-92QD",
  "customer_name": "Jane Doe",
  "customer_email": "j***e@example.com",
  "total_amount": "149.90",
  "status": "pending",
  "payment_status": "pending",
  "items": [{ "product_name": "...", "quantity": 1, "price": "149.90" }],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```
No `invoice_file`, no full `customer_email`, no `customer_document`.
