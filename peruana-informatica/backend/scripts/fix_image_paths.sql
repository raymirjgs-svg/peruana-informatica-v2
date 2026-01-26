-- ============================================
-- CORREGIR RUTAS DE IMAGENES
-- ============================================
-- Este script corrige las rutas de imágenes
-- ============================================

-- PASO 1: Ver el estado actual
SELECT 
    CASE 
        WHEN image LIKE '%placeholder%' THEN 'Placeholder (sin actualizar)'
        WHEN image LIKE '/images/products/%' THEN 'Ruta correcta (actualizado)'
        WHEN image LIKE 'http%' THEN 'URL externa'
        WHEN image LIKE '%Sin título%' THEN 'Nombre de archivo sin procesar'
        ELSE 'Otro formato'
    END as estado_imagen,
    COUNT(*) as cantidad
FROM products
WHERE image IS NOT NULL AND image != ''
GROUP BY estado_imagen;

-- PASO 2: Si las rutas son solo nombres de archivo, agregar el prefijo
-- (DESCOMENTA SOLO SI LOS RESULTADOS DEL PASO 1 MUESTRAN "Nombre de archivo sin procesar")
/*
UPDATE products
SET image = CONCAT('/images/products/', image)
WHERE image NOT LIKE '%/%' 
    AND image NOT LIKE 'http%'
    AND image NOT LIKE '%placeholder%'
    AND image IS NOT NULL 
    AND image != '';
*/

-- PASO 3: Ver productos actualizados
SELECT 
    id,
    name,
    codigo_interno,
    image,
    CASE 
        WHEN image LIKE '%placeholder%' THEN 'SIN IMAGEN'
        WHEN image LIKE '/images/products/%' THEN 'CON IMAGEN (verificar archivo)'
        WHEN image LIKE 'http%' THEN 'URL EXTERNA'
        ELSE 'RUTA DESCONOCIDA'
    END as tipo_ruta
FROM products 
WHERE codigo_interno IS NOT NULL
ORDER BY id DESC
LIMIT 20;

-- ============================================
-- PROBLEMA: Las imágenes no existen físicamente
-- ============================================
-- Las rutas están guardadas así: "/images/products/Sin título-1.png"
-- PERO el archivo no existe en: "htdocs/images/products/Sin título-1.png"
-- 
-- SOLUCION:
-- 1. Copiar las imágenes de la base antigua a htdocs/images/products/
-- 2. O usar URLs externas/placeholders hasta tener las imágenes
-- ============================================

