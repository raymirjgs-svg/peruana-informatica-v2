-- ============================================
-- EJECUTA ESTE SCRIPT COMPLETO
-- ============================================

-- PASO 1: ACTUALIZAR todas las rutas de imágenes
UPDATE products p
LEFT JOIN c2731212_web2.productos old_producto ON old_producto.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, MIN(imagen) as imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old_producto.cod_producto
SET p.image = CONCAT('/images/products/', gp.imagen)
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL
    AND p.image LIKE '%via.placeholder%';

-- PASO 2: Ver resultados actualizados
SELECT 
    id,
    name,
    codigo_interno,
    LEFT(image, 60) as ruta_imagen
FROM products
WHERE codigo_interno IS NOT NULL
ORDER BY id
LIMIT 20;

-- PASO 3: Ver estadísticas
SELECT 
    COUNT(*) as total_con_codigo,
    SUM(CASE WHEN image LIKE '/images/products/%' THEN 1 ELSE 0 END) as con_imagen_real,
    SUM(CASE WHEN image LIKE '%via.placeholder%' THEN 1 ELSE 0 END) as con_placeholder
FROM products
WHERE codigo_interno IS NOT NULL;

-- PASO 4: Extraer lista de archivos únicos necesarios
SELECT DISTINCT 
    SUBSTRING_INDEX(image, '/', -1) as archivo_necesario
FROM products 
WHERE image LIKE '/images/products/%'
ORDER BY archivo_necesario;

