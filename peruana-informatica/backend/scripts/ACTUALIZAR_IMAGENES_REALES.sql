-- ============================================
-- ACTUALIZAR CON IMAGENES REALES
-- ============================================
-- Ejecuta: get_real_images.sql primero para ver resultados
-- Luego ejecuta este para actualizar
-- ============================================

-- PASO 1: Ver productos que necesitan actualización
SELECT 
    p.id,
    p.name,
    p.codigo_interno,
    p.image as imagen_actual,
    old_producto.nombre_producto as nombre_antiguo,
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
LIMIT 20;

-- PASO 2: ACTUALIZAR PRODUCTOS CON IMAGENES REALES
-- ⚠️ IMPORTANTE: Verifica el PASO 1 antes de ejecutar esto
-- ⚠️ Este query actualiza las rutas

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

-- PASO 3: Verificar actualización
SELECT 
    id,
    name,
    codigo_interno,
    image
FROM products
WHERE codigo_interno IN ('18385', '19267', '18033', '18358', '16043')
ORDER BY id;

-- PASO 4: Estadísticas finales
SELECT 
    COUNT(*) as total_productos,
    SUM(CASE WHEN image NOT LIKE '%picsum%' AND image NOT LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_imagen_real,
    SUM(CASE WHEN image LIKE '%picsum%' OR image LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_placeholder
FROM products
WHERE codigo_interno IS NOT NULL;

-- ============================================
-- NOTA IMPORTANTE:
-- Las imágenes ahora apuntan a: /images/products/nombre_archivo.png
-- Necesitas copiar esos archivos a:
-- C:/xampp/htdocs/peruana-informatica/frontend/public/images/products/
-- ============================================

-- PARA EXTRAER LOS NOMBRES DE ARCHIVO:
SELECT DISTINCT 
    SUBSTRING_INDEX(image, '/', -1) as nombre_archivo
FROM products 
WHERE image LIKE '/images/products/%'
ORDER BY nombre_archivo;

