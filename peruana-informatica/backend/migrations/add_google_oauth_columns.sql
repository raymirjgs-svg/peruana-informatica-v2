-- Migration: Add Google OAuth columns to users table
-- Date: 2026-01-21
-- Description: Adds google_id and auth_provider columns to support Google OAuth login

USE prueba;

-- Add google_id column (stores Google's unique user ID)
ALTER TABLE `users` 
ADD COLUMN `google_id` VARCHAR(255) NULL UNIQUE AFTER `role`;

-- Add auth_provider column (tracks how the user registered: 'local', 'google', or 'local_and_google')
ALTER TABLE `users` 
ADD COLUMN `auth_provider` VARCHAR(20) NOT NULL DEFAULT 'local' AFTER `google_id`;

-- Modify password_hash to allow NULL (Google users don't have passwords)
ALTER TABLE `users` 
MODIFY COLUMN `password_hash` VARCHAR(255) NULL;

-- Add indexes for performance
CREATE INDEX idx_google_id ON `users`(`google_id`);
CREATE INDEX idx_auth_provider ON `users`(`auth_provider`);

-- Display updated table structure
DESCRIBE `users`;
