-- ============================================
-- VERIFICACION DE IMAGENES
-- ============================================
-- Ejecuta este script en phpMyAdmin
-- ============================================

-- 1. Ver qué rutas de imágenes se guardaron
SELECT 
    id, 
    name, 
    codigo_interno,
    image,
    LENGTH(image) as longitud_ruta
FROM products 
WHERE image IS NOT NULL 
    AND image != ''
    AND image NOT LIKE '%placeholder%'
ORDER BY id DESC
LIMIT 20;

-- 2. Ver diferentes tipos de rutas
SELECT 
    CASE 
        WHEN image LIKE '%placeholder%' THEN 'Placeholder'
        WHEN image LIKE '/images/%' THEN 'Ruta local'
        WHEN image LIKE 'http%' THEN 'URL externa'
        ELSE 'Otro formato'
    END as tipo_imagen,
    COUNT(*) as cantidad
FROM products 
WHERE image IS NOT NULL AND image != ''
GROUP BY tipo_imagen;

-- 3. Ver ejemplos de cada tipo
SELECT 
    image,
    COUNT(*) as cantidad_productos
FROM products 
WHERE image IS NOT NULL AND image != ''
GROUP BY image
ORDER BY cantidad_productos DESC
LIMIT 10;

-- 4. Ver productos sin imagen
SELECT 
    COUNT(*) as sin_imagen
FROM products 
WHERE image IS NULL OR image = '' OR image LIKE '%placeholder%';

-- 5. Verificar rutas que parecen incorrectas
SELECT 
    id, 
    name, 
    image
FROM products 
WHERE image NOT LIKE '%placeholder%'
    AND image NOT LIKE '/images/%'
    AND image NOT LIKE 'http%'
    AND image IS NOT NULL
    AND image != ''
LIMIT 20;

