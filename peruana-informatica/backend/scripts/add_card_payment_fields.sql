-- ============================================
-- SCRIPT: Agregar campos para pagos con tarjeta
-- Fecha: 2024-12-24
-- ============================================

-- Paso 1: Modificar el ENUM de payment_method para incluir 'efectivo'
-- NOTA: En MySQL, modificar un ENUM requiere redefinir la columna
ALTER TABLE `orders` 
MODIFY COLUMN `payment_method` ENUM('efectivo', 'transferencia', 'tarjeta', 'yape', 'plin') DEFAULT NULL;

-- Paso 2: Agregar campos para datos de tarjeta
-- Solo almacenamos los últimos 4 dígitos por seguridad PCI DSS
ALTER TABLE `orders` 
ADD COLUMN `card_last_four` VARCHAR(4) DEFAULT NULL AFTER `payment_verified_by`,
ADD COLUMN `card_type` VARCHAR(20) DEFAULT NULL AFTER `card_last_four`,
ADD COLUMN `card_holder` VARCHAR(255) DEFAULT NULL AFTER `card_type`;

-- Paso 3: Verificar la estructura actualizada
DESCRIBE `orders`;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
