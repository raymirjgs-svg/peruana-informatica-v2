-- ============================================
-- SCRIPT FINAL DE MIGRACIÓN
-- Importar productos con códigos internos, imágenes y descripciones
-- ============================================

-- PASO 1: Verificar que la tabla products tenga el campo codigo_interno
-- (Ya lo agregamos en el archivo SQL)

-- PASO 2: Si no existe, agregar el campo
-- NOTA: Ejecutar solo si la columna no existe
ALTER TABLE `products` ADD COLUMN `codigo_interno` VARCHAR(50) DEFAULT NULL AFTER `keywords`;

-- PASO 3: Importar datos de la base antigua
-- IMPORTANTE: Debes tener ambas bases de datos cargadas en MySQL

-- Opción A: Si tienes ambas bases en el mismo servidor MySQL
-- Usar la cláusula USE antes de ejecutar

-- Opción B: Crear tabla temporal con datos de productos antiguos
DROP TABLE IF EXISTS temp_productos_antiguos;

CREATE TABLE temp_productos_antiguos AS
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    p.descripcion,
    p.caracteristicas,
    (SELECT gp.imagen 
     FROM galeria_productos gp 
     WHERE gp.cod_producto = p.cod_producto 
     LIMIT 1) AS imagen_principal
FROM productos p
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != ''
    AND p.estado = 'A';

-- PASO 4: Actualizar productos en la nueva base usando matching por nombre
UPDATE products p
INNER JOIN temp_productos_antiguos t ON 
    (
        -- Matching exacto por código si existe
        p.codigo_interno IS NOT NULL AND p.codigo_interno = t.codigo_interno
        OR
        -- Matching por similitud de nombre (primeros caracteres)
        SUBSTRING(p.name, 1, 30) = SUBSTRING(t.nombre_producto, 1, 30)
        OR
        -- Matching por palabras clave
        (p.name LIKE CONCAT('%', SUBSTRING(t.nombre_producto, 1, 10), '%')
         AND LENGTH(p.name) BETWEEN LENGTH(t.nombre_producto) - 20 AND LENGTH(t.nombre_producto) + 20)
    )
SET 
    p.description = COALESCE(NULLIF(p.description, ''), t.descripcion, ''),
    p.image = CASE 
        WHEN p.image IS NULL OR p.image LIKE '%placeholder%' 
        THEN CONCAT('/images/products/', t.imagen_principal)
        ELSE p.image 
    END,
    p.codigo_interno = COALESCE(p.codigo_interno, t.codigo_interno)
WHERE p.codigo_interno IS NULL 
    OR p.description IS NULL 
    OR p.description = ''
    OR p.image LIKE '%placeholder%';

-- PASO 5: Ver estadísticas
SELECT 
    COUNT(*) as total_productos,
    SUM(CASE WHEN codigo_interno IS NOT NULL THEN 1 ELSE 0 END) as con_codigo,
    SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as con_descripcion,
    SUM(CASE WHEN image IS NOT NULL AND image NOT LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_imagen_real
FROM products;

-- PASO 6: Ver ejemplo de productos actualizados
SELECT 
    id,
    name,
    codigo_interno,
    LEFT(description, 100) as descripcion_preview,
    LEFT(image, 50) as imagen
FROM products
WHERE codigo_interno IS NOT NULL
LIMIT 10;

-- PASO 7: Limpiar tabla temporal
DROP TABLE IF EXISTS temp_productos_antiguos;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

