-- Migration: Add coupon fields to orders table
-- Date: 2026-10-18
-- Description: Adds coupon_code and discount_amount so the coupon applied at
--   checkout is persisted on the order. Required by the server-side coupon
--   validation/discount logic in OrderController.createOrder.
--
-- NOTE: Run ONCE against the target database (peruana_informatica) before
-- deploying the matching backend build. These columns were applied to the
-- local/dev database only; production must be migrated explicitly (the app
-- does not run sync({ alter: true }) on startup).

ALTER TABLE `orders`
ADD COLUMN `coupon_code` VARCHAR(50) NULL;

ALTER TABLE `orders`
ADD COLUMN `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0;

DESCRIBE `orders`;
