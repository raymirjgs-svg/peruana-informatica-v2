# Guía de Migración de Productos

## Problema
Necesitas migrar imágenes y descripciones de productos desde la base de datos antigua (`c2731212_web2.sql`) a la nueva (`peruana_informatica.sql`).

## Solución Recomendada

### Opción 1: Usar MySQL directamente (Más Seguro)

1. **Conectar a la base de datos antigua:**
```sql
mysql -u root -p c2731212_web2
```

2. **Exportar productos con código e imágenes:**
```sql
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    p.descripcion,
    gp.imagen
FROM productos p
LEFT JOIN galeria_productos gp ON p.cod_producto = gp.cod_producto
WHERE p.codigo_interno IS NOT NULL AND p.codigo_interno != ''
LIMIT 100;
```

3. **Crear archivo CSV para matching:**
```sql
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    p.descripcion,
    gp.imagen
FROM productos p
LEFT JOIN galeria_productos gp ON p.cod_producto = gp.cod_producto
WHERE p.codigo_interno IS NOT NULL AND p.codigo_interno != ''
INTO OUTFILE '/tmp/productos_old.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Opción 2: Script SQL de Actualización Directo

Crea un script SQL que actualice los productos basándose en el código interno:

```sql
-- 1. Primero agregar columna codigo_interno si no existe
ALTER TABLE products ADD COLUMN codigo_interno VARCHAR(50) NULL AFTER keywords;

-- 2. Crear una tabla temporal con los datos de la base antigua
CREATE TEMPORARY TABLE temp_old_products AS
SELECT 
    codigo_interno,
    nombre_producto,
    descripcion,
    imagen
FROM (
    SELECT 
        p.codigo_interno,
        p.nombre_producto,
        p.descripcion,
        gp.imagen
    FROM productos p
    LEFT JOIN galeria_productos gp ON p.cod_producto = gp.cod_producto
    WHERE p.codigo_interno IS NOT NULL AND p.codigo_interno != ''
) AS old_data;

-- 3. Actualizar productos en la base nueva basándose en el nombre
UPDATE products p
INNER JOIN temp_old_products o ON 
    SUBSTRING(p.name, 1, 20) LIKE CONCAT('%', SUBSTRING(o.nombre_producto, 1, 20), '%')
SET 
    p.description = o.descripcion,
    p.image = CONCAT('/images/products/', o.imagen),
    p.codigo_interno = o.codigo_interno
WHERE p.description = '' OR p.description IS NULL;
```

### Opción 3: Script Python Simplificado

Ejecuta el script `migrate_products_simple.py` que ya tienes pero con un enfoque más directo.

## Pasos para Ejecutar la Migración

1. **Backup de la base de datos:**
```bash
mysqldump -u root -p peruana_informatica > backup.sql
```

2. **Ejecutar script de migración:**
```bash
cd backend/scripts
python migrate_products_simple.py
```

3. **Revisar resultados:**
```bash
cat migration_results.json
```

4. **Si todo está bien, aplicar los cambios:**
```sql
-- Los cambios se harán directamente en la base de datos
```

## Estructura de Datos

### Base Antigua (c2731212_web2)
- Tabla: `productos`
- Campos relevantes:
  - `codigo_interno` (VARCHAR): Código único
  - `nombre_producto` (TEXT): Nombre
  - `descripcion` (TEXT): Descripción
- Tabla: `galeria_productos`
  - `cod_producto` (INT): ID del producto
  - `imagen` (VARCHAR): Nombre del archivo

### Base Nueva (peruana_informatica)
- Tabla: `products`
- Campos:
  - `name`: Nombre
  - `description`: Descripción
  - `image`: URL de la imagen

## Recomendaciones

1. **Matching por Código Interno** es la forma más segura
2. Si no hay código, usar **matching por nombre** con similitud
3. **Siempre hacer backup** antes de migrar
4. Probar con un **subset de datos** primero
5. **Validar resultados** antes de aplicar todos los cambios

