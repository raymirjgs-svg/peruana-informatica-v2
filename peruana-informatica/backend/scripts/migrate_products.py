#!/usr/bin/env python3
"""
Script para migrar imágenes y descripciones de productos
desde c2731212_web2.sql a peruana_informatica.sql
"""

import re
import json
from pathlib import Path

# Rutas de archivos
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent.parent
OLD_DB = ROOT_DIR / 'c2731212_web2.sql'
NEW_DB = ROOT_DIR / 'peruana_informatica.sql'
OUTPUT_DB = ROOT_DIR / 'peruana_informatica_updated.sql'

def normalize_text(text):
    """Normalizar texto para comparación"""
    if not text:
        return ''
    return re.sub(r'[^\w\s]', ' ', str(text).lower()).strip()

def extract_old_products(sql_content):
    """Extraer productos de la base de datos antigua"""
    products = {}
    
    # Buscar tabla de productos
    pattern = r"INSERT INTO `productos`[^;]+VALUES[^;]+;"
    matches = re.findall(pattern, sql_content, re.DOTALL)
    
    for match in matches:
        # Extraer líneas de INSERT
        lines = re.findall(r'\((\d+),[^)]+\)', match)
        for line in lines:
            parts = line.split(',')
            if len(parts) > 4:
                try:
                    cod_producto = int(parts[0].strip())
                    # Buscar codigo_interno (campo 9)
                    if len(parts) > 9:
                        codigo_interno = parts[9].strip().strip("'\"")
                        
                        # Extraer nombre y descripción
                        nombre_idx = 11  # nombre_producto
                        desc_idx = 16    # descripcion
                        
                        if len(parts) > nombre_idx:
                            nombre_producto = parts[nombre_idx].strip().strip("'\"")
                        else:
                            nombre_producto = ''
                            
                        if len(parts) > desc_idx:
                            descripcion = parts[desc_idx].strip().strip("'\"")
                        else:
                            descripcion = ''
                        
                        if codigo_interno and codigo_interno != 'NULL':
                            products[codigo_interno] = {
                                'codigo_interno': codigo_interno,
                                'nombre': nombre_producto,
                                'descripcion': descripcion,
                                'cod_producto': cod_producto
                            }
                except (ValueError, IndexError):
                    pass
    
    return products

def extract_product_images(sql_content):
    """Extraer imágenes de productos"""
    images = {}
    
    # Buscar tabla galeria_productos
    pattern = r"INSERT INTO `galeria_productos`[^;]+VALUES[^;]+;"
    matches = re.findall(pattern, sql_content, re.DOTALL)
    
    for match in matches:
        # Buscar líneas: (id, cod_producto, 'imagen')
        pattern_img = r'\((\d+),\s*(\d+),\s*\'([^\']+)\'\)'
        matches_img = re.findall(pattern_img, match)
        
        for _, cod_producto, imagen in matches_img:
            cod = int(cod_producto)
            if cod not in images:
                images[cod] = []
            images[cod].append(imagen)
    
    return images

def extract_new_products(sql_content):
    """Extraer productos de la base de datos nueva"""
    products = []
    
    # Buscar tabla products
    pattern = r"INSERT INTO `products`[^;]+VALUES[^;]+;"
    matches = re.findall(pattern, sql_content, re.DOTALL)
    
    for match in matches:
        # Extraer líneas: (id, 'name', 'slug', 'description', ...)
        pattern_product = r'\((\d+),\s*\'([^\']+)\',\s*\'([^\']+)\',[^;]+\)'
        lines = re.findall(pattern_product, match)
        
        for product_data in lines:
            if len(product_data) >= 3:
                product_id = int(product_data[0])
                name = product_data[1]
                slug = product_data[2]
                
                products.append({
                    'id': product_id,
                    'name': name,
                    'slug': slug
                })
    
    return products

def find_best_match(product_name, old_products):
    """Encontrar el mejor match entre productos"""
    normalized_new = normalize_text(product_name)
    best_match = None
    best_score = 0
    
    for codigo, old_product in old_products.items():
        normalized_old = normalize_text(old_product['nombre'])
        
        # Calcular similitud
        words_new = set(normalized_new.split())
        words_old = set(normalized_old.split())
        
        if words_new and words_old:
            common_words = words_new.intersection(words_old)
            # Al menos 3 palabras en común
            if len(common_words) >= 3:
                score = len(common_words) / max(len(words_new), len(words_old))
                if score > best_score:
                    best_score = score
                    best_match = codigo
    
    return best_match, best_score

def main():
    print("[INICIO] Migracion de productos...")
    
    # Leer archivos
    print("[LECTURA] Leyendo archivos SQL...")
    old_db = open(OLD_DB, 'r', encoding='utf-8').read()
    new_db = open(NEW_DB, 'r', encoding='utf-8').read()
    
    # Extraer datos
    print("[EXTRACCION] Productos antiguos...")
    old_products = extract_old_products(old_db)
    print(f"[OK] Encontrados {len(old_products)} productos")
    
    print("[EXTRACCION] Imagenes...")
    old_images = extract_product_images(old_db)
    print(f"[OK] Encontradas imagenes para {len(old_images)} productos")
    
    print("[EXTRACCION] Productos nuevos...")
    new_products = extract_new_products(new_db)
    print(f"[OK] Encontrados {len(new_products)} productos")
    
    # Hacer matching
    print("\n[BUSCANDO] Coincidencias...")
    matched = 0
    unmatched = []
    
    for new_product in new_products:
        codigo, score = find_best_match(new_product['name'], old_products)
        if codigo and score > 0.5:
            new_product['matched_codigo'] = codigo
            new_product['matched_score'] = score
            matched += 1
        else:
            unmatched.append(new_product)
    
    print(f"[OK] Coincidencias encontradas: {matched}")
    print(f"[WARN] Sin coincidencia: {len(unmatched)}")
    
    # Guardar resultados
    results = {
        'matched': matched,
        'unmatched': len(unmatched),
        'total_old': len(old_products),
        'total_new': len(new_products),
        'products_with_images': len(old_images),
        'sample_matches': [
            {
                'new': p['name'],
                'old': old_products[p.get('matched_codigo', '')]['nombre'],
                'score': p.get('matched_score', 0)
            }
            for p in new_products if p.get('matched_codigo')
        ][:10]
    }
    
    with open(SCRIPT_DIR / 'migration_results.json', 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\n[RESULTADOS]")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n[OK] Resultados guardados en: migration_results.json")
    
    # Generar recomendaciones
    if matched > 0:
        print("\n[INFO] Para continuar con la migracion:")
        print("1. Revisa migration_results.json")
        print("2. Los productos con score > 0.5 pueden ser actualizados")
        print("3. Usa las funciones de matching para actualizar la base de datos")

if __name__ == '__main__':
    main()

