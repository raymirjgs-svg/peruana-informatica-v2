-- ============================================
-- SCRIPT DE MIGRACION PARA XAMPP
-- ============================================
-- IMPORTANTE: Debes tener ambas bases en XAMPP
-- ============================================

-- PASO 1: Asegurar que existe la columna codigo_interno
ALTER TABLE products ADD COLUMN codigo_interno VARCHAR(50) DEFAULT NULL AFTER keywords;

-- PASO 2: Importar la base antigua (c2731212_web2) si no está
-- Usa phpMyAdmin para importar c2731212_web2.sql

-- PASO 3: Crear vista temporal con los datos
CREATE OR REPLACE VIEW temp_productos_vieja AS
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    SUBSTRING(p.descripcion, 1, 500) as descripcion_corta,
    (SELECT gp.imagen FROM galeria_productos gp 
     WHERE gp.cod_producto = p.cod_producto LIMIT 1) as imagen
FROM c2731212_web2.productos p
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != ''
    AND p.codigo_interno != 'NULL';

-- PASO 4: Actualizar productos existentes por coincidencia de nombre
UPDATE peruana_informatica.products p
INNER JOIN temp_productos_vieja t ON 
    (
        SUBSTRING(p.name, 1, 30) = SUBSTRING(t.nombre_producto, 1, 30)
        OR p.name LIKE CONCAT('%', SUBSTRING(t.nombre_producto, 1, 15), '%')
    )
SET 
    p.description = IF(p.description = '', t.descripcion_corta, p.description),
    p.image = IF(p.image LIKE '%placeholder%' OR p.image IS NULL, 
                 CONCAT('/images/products/', t.imagen), 
                 p.image),
    p.codigo_interno = IF(p.codigo_interno IS NULL, t.codigo_interno, p.codigo_interno)
WHERE p.name IS NOT NULL;

-- PASO 5: Ver resultados
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN codigo_interno IS NOT NULL THEN 1 ELSE 0 END) as con_codigo,
    SUM(CASE WHEN description != '' THEN 1 ELSE 0 END) as con_desc,
    SUM(CASE WHEN image NOT LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_imagen
FROM peruana_informatica.products;

-- PASO 6: Ver muestra de productos actualizados
SELECT id, name, codigo_interno, LEFT(description, 50) as descripcion 
FROM peruana_informatica.products 
WHERE codigo_interno IS NOT NULL 
LIMIT 20;

-- PASO 7: Limpiar vista temporal
DROP VIEW IF EXISTS temp_productos_vieja;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
