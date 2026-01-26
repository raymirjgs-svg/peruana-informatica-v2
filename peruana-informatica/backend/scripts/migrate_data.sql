-- ============================================
-- Script de Migración de Datos de Productos
-- Desde c2731212_web2 a peruana_informatica
-- ============================================

-- PASO 1: Agregar columna codigo_interno si no existe
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `codigo_interno` VARCHAR(50) NULL AFTER `keywords`;

-- PASO 2: Crear tabla temporal con productos antiguos
DROP TEMPORARY TABLE IF EXISTS temp_old_products;
CREATE TEMPORARY TABLE temp_old_products AS
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    p.descripcion,
    GROUP_CONCAT(gp.imagen SEPARATOR ';') AS imagenes
FROM productos p
LEFT JOIN galeria_productos gp ON p.cod_producto = gp.cod_producto
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != '' 
    AND p.codigo_interno != 'NULL'
GROUP BY p.codigo_interno, p.nombre_producto, p.descripcion;

-- PASO 3: Ver coincidencias
SELECT 
    p.id,
    p.name,
    p.image AS imagen_actual,
    o.nombre_producto AS nombre_antiguo,
    o.imagenes AS imagenes_nuevas,
    SUBSTRING(o.descripcion, 1, 100) AS descripcion_preview
FROM products p
INNER JOIN temp_old_products o ON 
    -- Matching por nombre aproximado
    (
        SUBSTRING(p.name, 1, 30) = SUBSTRING(o.nombre_producto, 1, 30)
        OR p.name LIKE CONCAT('%', SUBSTRING(o.nombre_producto, 1, 10), '%')
    )
LIMIT 20;

-- PASO 4: Actualizar productos (DESCOMENTAR PARA EJECUTAR)
-- IMPORTANTE: Hacer backup antes!
-- 
-- UPDATE products p
-- INNER JOIN temp_old_products o ON 
--     (
--         SUBSTRING(p.name, 1, 30) = SUBSTRING(o.nombre_producto, 1, 30)
--         OR p.name LIKE CONCAT('%', SUBSTRING(o.nombre_producto, 1, 10), '%')
--     )
-- SET 
--     p.description = o.descripcion,
--     p.image = CONCAT('/images/products/', SUBSTRING_INDEX(o.imagenes, ';', 1)),
--     p.codigo_interno = o.codigo_interno
-- WHERE p.description = '' OR p.description IS NULL OR p.image LIKE '%placeholder%';

-- PASO 5: Verificar resultados
SELECT 
    COUNT(*) as total_actualizados,
    SUM(CASE WHEN codigo_interno IS NOT NULL THEN 1 ELSE 0 END) as con_codigo,
    SUM(CASE WHEN image LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_imagenes_placeholder
FROM products;

-- PASO 6: Limpiar tabla temporal
DROP TEMPORARY TABLE temp_old_products;

