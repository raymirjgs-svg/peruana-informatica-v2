-- Migration: Add customer management fields to users table
-- Date: 2026-01-21
-- Description: Adds is_blocked and last_login columns for customer management

USE prueba;

-- Add is_blocked column (to block problematic users)
ALTER TABLE `users` 
ADD COLUMN `is_blocked` BOOLEAN NOT NULL DEFAULT FALSE AFTER `auth_provider`;

-- Add last_login column (to track user activity)
ALTER TABLE `users` 
ADD COLUMN `last_login` DATETIME NULL AFTER `is_blocked`;

-- Add index for performance
CREATE INDEX idx_is_blocked ON `users`(`is_blocked`);
CREATE INDEX idx_last_login ON `users`(`last_login`);

-- Display updated table structure
DESCRIBE `users`;
