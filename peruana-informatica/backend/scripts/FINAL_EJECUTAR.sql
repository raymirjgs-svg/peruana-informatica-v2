-- ============================================
-- SOLUCION FINAL RAPIDA SIN ARCHIVOS FISICOS
-- ============================================
-- Ejecuta este script completo en phpMyAdmin
-- ============================================

-- Opción 1: Placeholders automáticos basados en código
UPDATE products
SET image = CONCAT('https://via.placeholder.com/600/400/0066CC/FFFFFF?text=COD:', codigo_interno)
WHERE codigo_interno IS NOT NULL;

-- Verificar
SELECT id, name, codigo_interno, LEFT(image, 80) as imagen 
FROM products 
WHERE codigo_interno IS NOT NULL
LIMIT 10;

-- Estadísticas
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN image LIKE 'https://via.placeholder.com%' THEN 1 ELSE 0 END) as con_placeholder,
    SUM(CASE WHEN image LIKE '%picsum%' THEN 1 ELSE 0 END) as con_picsum
FROM products
WHERE codigo_interno IS NOT NULL;


