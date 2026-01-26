#!/usr/bin/env python3
"""
Script simple para generar SQL de migración
Lee los archivos SQL y crea comandos UPDATE
"""
import re
from pathlib import Path

def find_all_lines_in_sql(file_path, search_pattern):
    """Buscar todas las líneas que coincidan con el patrón"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    matching_lines = []
    for i, line in enumerate(lines):
        if re.search(search_pattern, line, re.IGNORECASE):
            matching_lines.append((i+1, line.strip()))
    
    return matching_lines

def extract_products_simple(old_db):
    """Extraer productos de forma simple buscando codigo_interno"""
    print("[INFO] Buscando productos por codigo_interno...")
    
    with open(old_db, 'r', encoding='utf-8') as f:
        content = f.read()
    
    products = {}
    
    # Buscar líneas que tienen codigo_interno
    # Patrón: ('codigo_interno', 'nombre', 'descripcion', ...)
    pattern = r"(\d+),\s*'[^']*',\s*'[^']*',[^,]*,\s*'Nuevo',\s*'([^']+)',\s*'([^']*)',\s*'([^']+)'"
    
    matches = re.findall(pattern, content)
    
    for match in matches:
        cod_producto = match[0]
        codigo_interno = match[1]
        codigo_fabrica = match[2]
        nombre_producto = match[3]
        
        if codigo_interno and codigo_interno not in ['', 'NULL']:
            products[codigo_interno] = {
                'codigo': codigo_interno,
                'nombre': nombre_producto,
                'cod_fabrica': codigo_fabrica
            }
    
    print(f"[OK] Encontrados {len(products)} productos")
    return products

def extract_images_from_sql(file_path):
    """Extraer imágenes de galeria_productos"""
    print("[INFO] Extrayendo imágenes...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    images = {}
    
    # Buscar líneas de galeria_productos
    pattern = r'\((\d+),\s*(\d+),\s*\'([^\']+)\'\)'
    matches = re.findall(pattern, content)
    
    for match in matches:
        _, cod_producto, imagen = match
        cod = int(cod_producto)
        if cod not in images:
            images[cod] = []
        images[cod].append(imagen)
    
    print(f"[OK] Encontradas {len(images)} productos con imágenes")
    return images

def create_simple_migration():
    """Crear un archivo SQL simple que puedas ejecutar en XAMPP"""
    
    root_dir = Path(__file__).parent.parent.parent
    
    old_db = root_dir / 'c2731212_web2.sql'
    output_file = root_dir / 'backend' / 'scripts' / 'XAMPP_migration.sql'
    
    print("=" * 60)
    print("GENERADOR DE SQL PARA MIGRACION")
    print("=" * 60)
    print()
    
    # Crear SQL directo
    sql_content = """-- ============================================
-- SCRIPT DE MIGRACION PARA XAMPP
-- ============================================
-- IMPORTANTE: Debes tener ambas bases en XAMPP
-- ============================================

-- PASO 1: Asegurar que existe la columna codigo_interno
ALTER TABLE products ADD COLUMN codigo_interno VARCHAR(50) DEFAULT NULL AFTER keywords;

-- PASO 2: Importar la base antigua (c2731212_web2) si no está
-- Usa phpMyAdmin para importar c2731212_web2.sql

-- PASO 3: Crear vista temporal con los datos
CREATE OR REPLACE VIEW temp_productos_vieja AS
SELECT 
    p.codigo_interno,
    p.nombre_producto,
    SUBSTRING(p.descripcion, 1, 500) as descripcion_corta,
    (SELECT gp.imagen FROM galeria_productos gp 
     WHERE gp.cod_producto = p.cod_producto LIMIT 1) as imagen
FROM c2731212_web2.productos p
WHERE p.codigo_interno IS NOT NULL 
    AND p.codigo_interno != ''
    AND p.codigo_interno != 'NULL';

-- PASO 4: Actualizar productos existentes por coincidencia de nombre
UPDATE peruana_informatica.products p
INNER JOIN temp_productos_vieja t ON 
    (
        SUBSTRING(p.name, 1, 30) = SUBSTRING(t.nombre_producto, 1, 30)
        OR p.name LIKE CONCAT('%', SUBSTRING(t.nombre_producto, 1, 15), '%')
    )
SET 
    p.description = IF(p.description = '', t.descripcion_corta, p.description),
    p.image = IF(p.image LIKE '%placeholder%' OR p.image IS NULL, 
                 CONCAT('/images/products/', t.imagen), 
                 p.image),
    p.codigo_interno = IF(p.codigo_interno IS NULL, t.codigo_interno, p.codigo_interno)
WHERE p.name IS NOT NULL;

-- PASO 5: Ver resultados
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN codigo_interno IS NOT NULL THEN 1 ELSE 0 END) as con_codigo,
    SUM(CASE WHEN description != '' THEN 1 ELSE 0 END) as con_desc,
    SUM(CASE WHEN image NOT LIKE '%placeholder%' THEN 1 ELSE 0 END) as con_imagen
FROM peruana_informatica.products;

-- PASO 6: Ver muestra de productos actualizados
SELECT id, name, codigo_interno, LEFT(description, 50) as descripcion 
FROM peruana_informatica.products 
WHERE codigo_interno IS NOT NULL 
LIMIT 20;

-- PASO 7: Limpiar vista temporal
DROP VIEW IF EXISTS temp_productos_vieja;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"[COMPLETADO] Archivo generado: {output_file}")
    print()
    print("PARA USAR:")
    print("1. Abre phpMyAdmin")
    print("2. Importa c2731212_web2.sql")
    print("3. Importa peruana_informatica.sql")
    print("4. Copia y pega el contenido de XAMPP_migration.sql")
    print("5. Ejecuta el script")

if __name__ == '__main__':
    create_simple_migration()

