-- ============================================
-- SOLUCION: Sin copiar archivos físicamente
-- ============================================
-- Opción A: Usar URLs que apunten a las imágenes originales
-- ============================================

-- Actualizar con URLs completas (si las imágenes están en internet)
UPDATE products p
LEFT JOIN c2731212_web2.productos old_producto ON old_producto.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, MIN(imagen) as imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old_producto.cod_producto
SET p.image = CONCAT('https://tu-servidor.com/images/products/', gp.imagen)
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL;

-- ============================================
-- Opción B: Usar placeholders con códigos
-- ============================================
-- Las imágenes no existen físicamente, usa placeholders únicos

UPDATE products
SET image = CONCAT('https://via.placeholder.com/600/400/0066CC/FFFFFF?text=', 
                   REPLACE(REPLACE(name, ' ', '+'), ',', ''))
WHERE codigo_interno IS NOT NULL
    AND (image LIKE '%via.placeholder%' OR image IS NULL);

-- ============================================
-- Opción C: Usar Imgix/Cloudinary/CDN
-- ============================================
-- Si tienes CDN configurado

-- UPDATE products
-- SET image = CONCAT('https://cdn.tudominio.com/images/products/', gp.imagen)
-- WHERE codigo_interno IS NOT NULL;

-- ============================================
-- Opción D: HABILITAR ARCHIVOS FÍSICOS (SI TIENES LOS ARCHIVOS)
-- ============================================

-- 1. Copia los archivos a: frontend/public/images/products/
-- 2. Usa rutas relativas: /images/products/nombre.png
-- 3. Ejecuta:
/*
UPDATE products p
LEFT JOIN c2731212_web2.productos old_producto ON old_producto.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, MIN(imagen) as imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old_producto.cod_producto
SET p.image = CONCAT('/images/products/', gp.imagen)
WHERE p.codigo_interno IS NOT NULL AND gp.imagen IS NOT NULL;
*/


