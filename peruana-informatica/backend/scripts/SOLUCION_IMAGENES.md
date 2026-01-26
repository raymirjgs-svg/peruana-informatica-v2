# 🔧 SOLUCIÓN: Imágenes No Se Muestran

## Problema
Las rutas de imágenes están en la base de datos, pero los archivos no existen físicamente en el servidor.

## Solución

### Opción A: Copiar Imágenes Manualmente

1. **Buscar dónde están las imágenes originales:**
   - En la base de datos `c2731212_web2`, tabla `galeria_productos`
   - Los nombres de archivo son como: "Sin título-1.png", "LAPTOP.png", etc.

2. **Copiar las imágenes a XAMPP:**
   ```bash
   # Las imágenes deben estar en:
   C:/xampp/htdocs/tu-proyecto/frontend/public/images/products/
   ```

3. **Verificar las rutas en la base de datos:**
   - Ejecuta: `verificar_imagenes.sql` en phpMyAdmin

### Opción B: Usar URLs Externas Temporalmente

Actualiza las rutas para que apunten a un servicio de imágenes:

```sql
-- Usar imágenes de ejemplo temporales
UPDATE products
SET image = CONCAT('https://picsum.photos/seed/', id, '/400/400')
WHERE image LIKE '%placeholder%' 
   OR image IS NULL 
   OR image = '';
```

### Opción C: Generar Imágenes Desde los Datos

```sql
-- Usar el nombre del producto para generar una imagen placeholder inteligente
UPDATE products
SET image = CONCAT('https://via.placeholder.com/400?text=', 
                   REPLACE(REPLACE(REPLACE(name, ' ', '+'), ',', ''), '/', '-'))
WHERE image LIKE '%placeholder%';
```

## Verificar Estado Actual

Ejecuta en phpMyAdmin:

```sql
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN image LIKE '%placeholder%' THEN 1 ELSE 0 END) as placeholders,
    SUM(CASE WHEN image LIKE '/images/products/%' THEN 1 ELSE 0 END) as rutas_locales,
    SUM(CASE WHEN image LIKE 'http%' THEN 1 ELSE 0 END) as urls_externas
FROM products;
```

## Pasos Recomendados

1. **Revisar qué tipo de rutas tienes:**
   ```sql
   SELECT DISTINCT 
       CASE 
           WHEN image LIKE '%placeholder%' THEN 'Placeholder'
           WHEN image LIKE '/images/%' THEN 'Local'
           WHEN image LIKE 'http%' THEN 'Externa'
           ELSE 'Desconocida'
       END as tipo
   FROM products 
   WHERE image IS NOT NULL;
   ```

2. **Si son rutas locales (/images/products/file.png):**
   - Copia las imágenes físicamente a esa carpeta
   - O cambia las rutas a URLs externas

3. **Si quieres usar placeholders temporales:**
   - Ejecuta la Opción C arriba
   - Las imágenes se generarán automáticamente por nombre de producto

