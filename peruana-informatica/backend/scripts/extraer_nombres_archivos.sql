-- ============================================
-- EXTRAER NOMBRES DE ARCHIVOS DE IMAGEN
-- ============================================
-- Este script te ayuda a ver qué archivos necesitas
-- ============================================

-- Ver todos los archivos únicos que se están usando
SELECT DISTINCT 
    gp.imagen as nombre_archivo,
    COUNT(*) as veces_usado
FROM c2731212_web2.galeria_productos gp
INNER JOIN c2731212_web2.productos p ON p.cod_producto = gp.cod_producto
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != ''
GROUP BY gp.imagen
ORDER BY gp.imagen;

-- Contar total
SELECT COUNT(DISTINCT gp.imagen) as total_archivos_diferentes
FROM c2731212_web2.galeria_productos gp
INNER JOIN c2731212_web2.productos p ON p.cod_producto = gp.cod_producto
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != '';

