#!/usr/bin/env python3
"""
Agrega el campo codigo_interno (NULL) a todos los INSERT de products
"""
import re
from pathlib import Path

def fix_sql():
    sql_file = Path(__file__).parent.parent.parent / 'peruana_informatica.sql'
    
    print("[LEER] Abriendo archivo SQL...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("[BUSCAR] Localizando lineas de INSERT...")
    
    # Patrón para encontrar líneas de INSERT que tienen el formato:
    # (id, 'name', 'slug', 'description', ..., 'keywords', 'date', 'date', ...)
    # Necesitamos insertar NULL después de keywords y antes de created_at
    
    # Buscar todas las líneas que terminen con ), o ),
    # y tengan el patrón de fecha al final
    
    def replace_line(match):
        line = match.group(0)
        
        # Buscar la última cadena que es 'keywords' seguida de una fecha
        # Patrón: 'keywords', 'YYYY-MM-DD'
        pattern = r"('keywords',\s*)'([0-9]{4}-[0-9]{2}-[0-9]{2})"
        
        def insert_null(m):
            return f"{m.group(1)}NULL, '{m.group(2)}"
        
        # Reemplazar múltiples veces si hay múltiples matches
        new_line = re.sub(pattern, insert_null, line)
        
        return new_line
    
    # Buscar líneas que contengan VALUES y tengan fechas
    lines = content.split('\n')
    updated_content = []
    
    for line in lines:
        if 'VALUES' not in line and '),' in line and "'202" in line and "keywords" not in line:
            # Esta es una línea de datos dentro de un INSERT
            # Buscar el patrón: ', 'YYYY-MM-DD HH:MM:SS', 'YYYY-MM-DD HH:MM:SS'
            # e insertar NULL antes de la primera fecha
            pattern = r"',\s*'([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})',\s*'([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})',\s*([01]),\s*(NULL|'[^']*'),\s*(NULL|'[^']*')\s*\),"
            
            replacement = r"', NULL, '\1', '\2', \3, \4, \5 ),"
            new_line = re.sub(pattern, replacement, line)
            
            # Si hubo un cambio, usar la nueva línea
            if new_line != line:
                updated_content.append(new_line)
                continue
        
        updated_content.append(line)
    
    print("[GUARDAR] Escribiendo archivo actualizado...")
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(updated_content))
    
    print("[OK] Archivo actualizado!")

if __name__ == '__main__':
    fix_sql()

