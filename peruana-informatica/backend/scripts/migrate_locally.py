#!/usr/bin/env python3
"""
Script para migrar productos localmente sin necesidad de MySQL
Procesa los archivos SQL y genera comandos UPDATE directos
"""
import re
import json
from pathlib import Path
from collections import defaultdict

def extract_old_products(file_path):
    """Extraer todos los productos de la base antigua"""
    print("[INFO] Extrayendo productos de base antigua...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar tabla de productos
    products = {}
    
    # Extraer productos con el INSERT
    pattern = r"INSERT INTO `productos`[^;]*VALUES[^;]+;"
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        # Procesar cada línea de INSERT
        lines = re.findall(r'\(\d+,[^)]+\)', match)
        
        for line in lines:
            try:
                # Parsear línea manualmente (es complicado por las comas dentro de las strings)
                # Buscar el código interno que está cerca del inicio
                codigo_match = re.search(r"^\d+,.*?'([^']+)',\s*'([^']+)',\s*'([^']+)'", line)
                if codigo_match:
                    fecha_creacion = codigo_match.group(1)
                    fecha_act = codigo_match.group(2)
                    personal = codigo_match.group(3)
                    
                    # Buscar código interno (campo 9 aproximadamente)
                    parts = line.split(',')
                    if len(parts) > 11:
                        codigo_interno = parts[10].strip().strip("'\"")
                        nombre_producto = parts[11].strip().strip("'\"")
                        
                        # Extraer descripción (buscando el patrón)
                        desc_match = re.search(r"'([^']+)',\s*'([^']+)',\s*'([^']+)'", line)
                        
                        if codigo_interno and codigo_interno not in ['', 'NULL']:
                            products[codigo_interno] = {
                                'codigo': codigo_interno,
                                'nombre': nombre_producto,
                                'descripcion': extract_description_from_line(line)
                            }
            except Exception as e:
                pass
    
    print(f"[OK] Extraidos {len(products)} productos")
    return products

def extract_description_from_line(line):
    """Extraer descripción de una línea de producto"""
    # Buscar entre 'palabras_clave' y la fecha
    match = re.search(r"'([^']+)',\s*'([0-9]{4})", line)
    if match:
        return match.group(1)
    return ''

def extract_images(file_path):
    """Extraer imágenes de productos"""
    print("[INFO] Extrayendo imagenes...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    images = {}
    
    # Buscar tabla galeria_productos
    pattern = r"INSERT INTO `galeria_productos`[^;]*VALUES[^;]+;"
    matches = re.findall(pattern, content, re.DOTALL)
    
    for match in matches:
        # Buscar líneas: (id, cod_producto, 'imagen')
        img_lines = re.findall(r'\((\d+),\s*(\d+),\s*\'([^\']+)\'\)', match)
        
        for _, cod_producto, imagen in img_lines:
            cod = int(cod_producto)
            if cod not in images:
                images[cod] = []
            images[cod].append(imagen)
    
    print(f"[OK] Encontradas imagenes para {len(images)} productos")
    return images

def extract_new_products(file_path):
    """Extraer productos de la base nueva"""
    print("[INFO] Extrayendo productos de base nueva...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    products = []
    in_insert = False
    
    for line in lines:
        if 'INSERT INTO `products`' in line:
            in_insert = True
            continue
        
        if in_insert:
            # Buscar líneas con (id, 'name', ...
            match = re.match(r'\((\d+),\s*\'([^\']+)\',\s*\'([^\']+)\'', line)
            if match:
                product_id = int(match.group(1))
                name = match.group(2)
                slug = match.group(3)
                
                products.append({
                    'id': product_id,
                    'name': name,
                    'slug': slug,
                    'line': line.strip()
                })
            
            if ';' in line:
                in_insert = False
    
    print(f"[OK] Extraidos {len(products)} productos")
    return products

def normalize_name(name):
    """Normalizar nombre para matching"""
    if not name:
        return ''
    return re.sub(r'[^\w\s]', ' ', str(name).lower()).strip()

def find_best_match(product_name, old_products):
    """Encontrar mejor coincidencia"""
    normalized_new = normalize_name(product_name)
    
    best_match = None
    best_score = 0
    
    for codigo, old_product in old_products.items():
        normalized_old = normalize_name(old_product['nombre'])
        
        # Comparar palabras
        words_new = set(normalized_new.split())
        words_old = set(normalized_old.split())
        
        if words_new and words_old:
            common_words = words_new.intersection(words_old)
            if common_words:
                # Al menos 3 palabras en común
                if len(common_words) >= 3:
                    score = len(common_words) / max(len(words_new), len(words_old))
                    if score > best_score:
                        best_score = score
                        best_match = codigo
    
    return best_match if best_score > 0.5 else None

def generate_update_sql(matches):
    """Generar comandos SQL UPDATE"""
    print("[INFO] Generando comandos SQL...")
    
    updates = []
    
    for match_data in matches:
        product_id = match_data['product_id']
        descripcion = match_data['descripcion']
        imagen = match_data['imagen']
        codigo = match_data['codigo']
        
        # Crear comando UPDATE
        update_sql = f"-- Producto ID: {product_id}"
        update_sql += f"\nUPDATE products SET "
        update_sql += f"description = {repr(descripcion[:500])}, "
        update_sql += f"image = {repr(imagen)}, "
        update_sql += f"codigo_interno = {repr(codigo)} "
        update_sql += f"WHERE id = {product_id};"
        
        updates.append(update_sql)
    
    return '\n\n'.join(updates)

def main():
    print("=" * 60)
    print("MIGRACION LOCAL DE PRODUCTOS")
    print("=" * 60)
    
    root_dir = Path(__file__).parent.parent.parent
    
    old_db = root_dir / 'c2731212_web2.sql'
    new_db = root_dir / 'peruana_informatica.sql'
    output_file = root_dir / 'backend' / 'scripts' / 'migration_updates.sql'
    
    # Extraer datos
    print("\n[PASO 1] Procesando base de datos antigua...")
    old_products = extract_old_products(old_db)
    old_images = extract_images(old_db)
    
    print("\n[PASO 2] Procesando base de datos nueva...")
    new_products = extract_new_products(new_db)
    
    # Hacer matching
    print("\n[PASO 3] Buscando coincidencias...")
    matches = []
    matched_codes = set()
    
    for new_product in new_products:
        codigo = find_best_match(new_product['name'], old_products)
        
        if codigo:
            old_product = old_products[codigo]
            
            # Buscar imagen
            imagen = '/images/products/default.png'
            
            matches.append({
                'product_id': new_product['id'],
                'nombre': new_product['name'],
                'codigo': codigo,
                'descripcion': old_product.get('descripcion', ''),
                'imagen': imagen
            })
            
            matched_codes.add(codigo)
    
    print(f"[RESULTADO] Encontradas {len(matches)} coincidencias")
    
    # Generar SQL
    print("\n[PASO 4] Generando comandos SQL...")
    sql_updates = generate_update_sql(matches)
    
    # Guardar
    print("\n[GUARDAR] Escribiendo archivo SQL...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- ============================================\n")
        f.write("-- COMANDOS SQL PARA MIGRACION DE PRODUCTOS\n")
        f.write("-- Generado automaticamente\n")
        f.write("-- Total de productos a actualizar: " + str(len(matches)) + "\n")
        f.write("-- ============================================\n\n")
        f.write(sql_updates)
    
    print(f"[COMPLETADO] Archivo generado: {output_file}")
    
    # Guardar JSON con resultados
    results = {
        'total_matches': len(matches),
        'total_old': len(old_products),
        'total_new': len(new_products),
        'coverage': f"{(len(matches)/len(new_products)*100):.1f}%",
        'sample_matches': matches[:10]
    }
    
    with open(root_dir / 'backend' / 'scripts' / 'migration_results.json', 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\n[RESUMEN]")
    print(f"  Total productos antiguos: {len(old_products)}")
    print(f"  Total productos nuevos: {len(new_products)}")
    print(f"  Coincidencias encontradas: {len(matches)}")
    print(f"  Porcentaje de cobertura: {(len(matches)/len(new_products)*100):.1f}%")

if __name__ == '__main__':
    main()

