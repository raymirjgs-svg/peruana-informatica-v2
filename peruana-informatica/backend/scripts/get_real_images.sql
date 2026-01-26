-- ============================================
-- OBTENER IMAGENES REALES POR CODIGO INTERNO
-- ============================================

-- PASO 1: Ver qué productos necesitan imágenes reales
SELECT 
    p.id,
    p.name,
    p.codigo_interno,
    p.image as imagen_actual
FROM products p
WHERE p.codigo_interno IS NOT NULL
ORDER BY p.id
LIMIT 20;

-- PASO 2: Buscar las imágenes reales en la base antigua
-- Este query muestra las coincidencias
SELECT 
    p.id as id_nuevo,
    p.name as nombre_nuevo,
    p.codigo_interno as codigo,
    old.nombre_producto as nombre_antiguo,
    gp.imagen as imagen_real
FROM products p
LEFT JOIN c2731212_web2.productos old ON old.codigo_interno = p.codigo_interno
LEFT JOIN c2731212_web2.galeria_productos gp ON gp.cod_producto = old.cod_producto
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL
    AND p.image LIKE '%picsum%'
LIMIT 50;

-- PASO 3: ACTUALIZAR con imágenes reales (¡CUIDADO! Revísalo antes)
-- Este comando actualiza las rutas a localhost
UPDATE products p
LEFT JOIN c2731212_web2.productos old ON old.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old.cod_producto
SET p.image = CONCAT('http://localhost/tu-proyecto/frontend/public/images/products/', gp.imagen)
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL
    AND p.image LIKE '%picsum%';

-- ============================================
-- ALTERNATIVA: Usar rutas relativas desde /images/
-- ============================================

-- Actualizar con rutas relativas (para Next.js)
UPDATE products p
LEFT JOIN c2731212_web2.productos old ON old.codigo_interno = p.codigo_interno
LEFT JOIN (
    SELECT cod_producto, imagen 
    FROM c2731212_web2.galeria_productos 
    GROUP BY cod_producto
) gp ON gp.cod_producto = old.cod_producto
SET p.image = CONCAT('/images/products/', gp.imagen)
WHERE p.codigo_interno IS NOT NULL
    AND gp.imagen IS NOT NULL
    AND p.image LIKE '%picsum%';

-- Verificar actualización
SELECT 
    id,
    name,
    codigo_interno,
    LEFT(image, 80) as imagen_nueva
FROM products
WHERE codigo_interno IN ('18385', '19267', '18033', '18358')
LIMIT 10;

