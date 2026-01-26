-- ============================================
-- ACTUALIZAR CON IMAGENES REALES
-- ============================================
-- IMPORTANTE: Este script busca las imágenes reales en la base antigua
-- ============================================

-- PASO 1: Ver qué se va a actualizar (ejecuta primero esto)
SELECT 
    p.id,
    p.name,
    p.codigo_interno,
    p.image as imagen_actual,
    gp.imagen as imagen_nueva
FROM products p
LEFT JOIN c2731212_web2.productos old_producto ON old_producto.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, MIN(imagen) as imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old_producto.cod_producto
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL
    AND (p.image LIKE '%picsum%' OR p.image LIKE '%placeholder%')
ORDER BY p.id
LIMIT 20;

-- PASO 2: ACTUALIZAR con imágenes reales (ejecuta esto para actualizar)
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
    AND (p.image LIKE '%picsum%' OR p.image LIKE '%placeholder%');

-- PASO 3: Verificar resultados
SELECT id, name, codigo_interno, image 
FROM products 
WHERE codigo_interno IS NOT NULL
ORDER BY id
LIMIT 20;

-- PASO 4: Estadísticas
SELECT 
    COUNT(*) as total_con_codigo,
    SUM(CASE WHEN image LIKE '/images/products/%' THEN 1 ELSE 0 END) as con_imagen_real,
    SUM(CASE WHEN image LIKE '%picsum%' THEN 1 ELSE 0 END) as con_placeholder
FROM products
WHERE codigo_interno IS NOT NULL;

