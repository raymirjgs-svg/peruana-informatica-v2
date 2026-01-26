#!/usr/bin/env python3
"""
Actualiza los INSERT de products para agregar el campo codigo_interno
"""
import re
from pathlib import Path

def update_sql_file():
    sql_file = Path(__file__).parent.parent.parent / 'peruana_informatica.sql'
    
    print("Leyendo archivo SQL...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Buscando lineas de INSERT para products...")
    
    # Buscar todas las lineas que terminan con ), pero deben tener la estructura correcta
    # Patrón: ),\s*$
    # Pero necesitamos asegurarnos de que tienen el formato correcto
    
    lines = content.split('\n')
    updated_lines = []
    in_insert = False
    
    for line in lines:
        if 'INSERT INTO `products`' in line:
            in_insert = True
            updated_lines.append(line)
            continue
        
        if in_insert and line.strip().startswith('('):
            # Esta es una línea de valores
            # Necesito insertar NULL después de keywords y antes de created_at
            if line.strip().endswith('),'):
                # Extraer los componentes
                match = re.search(r'\'[^\']*\',\s*\'[0-9]{4}-[0-9]{2}', line)
                if match:
                    # Insertar NULL antes de la fecha
                    line = line.replace("', '202", "', NULL, '202")
                    line = line.replace("', '1899", "', NULL, '1899")
            
            updated_lines.append(line)
            
            if ';' in line:
                in_insert = False
        else:
            updated_lines.append(line)
    
    print("Guardando archivo actualizado...")
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(updated_lines))
    
    print("Archivo actualizado correctamente!")

if __name__ == '__main__':
    update_sql_file()

