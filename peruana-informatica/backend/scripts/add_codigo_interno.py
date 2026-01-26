#!/usr/bin/env python3
"""
Agrega NULL en la posicion correcta para el campo codigo_interno
"""
import re
from pathlib import Path

def main():
    sql_file = Path(__file__).parent.parent.parent / 'peruana_informatica.sql'
    
    print("[INFO] Leyendo archivo SQL...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("[INFO] Procesando lineas...")
    updated_lines = []
    count = 0
    
    for i, line in enumerate(lines):
        # Buscar líneas que:
        # 1. Son parte de un INSERT de products
        # 2. Tienen el formato: ..., 'keywords', fecha, fecha, ...
        # 3. No ya tienen codigo_interno
        
        if "'keywords'" in line or line.strip().startswith('('):
            # Es una línea de datos dentro del INSERT
            # Buscar el patrón: ...', 'keywords', ... ('2025-10...', ...)
            # y cambiarlo a: ...', 'keywords', NULL, ('2025-10...', ...)
            
            # Pattern: ', '2025- o ', '1899- seguido de fecha
            pattern = r"('keywords',\s*)('([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})',\s*)"
            
            def replace_date(match):
                return f"{match.group(1)}NULL, {match.group(2)}"
            
            new_line = re.sub(pattern, replace_date, line)
            
            if new_line != line:
                count += 1
                updated_lines.append(new_line)
                continue
        
        updated_lines.append(line)
    
    print(f"[OK] {count} lineas actualizadas")
    
    print("[GUARDAR] Escribiendo archivo...")
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print("[COMPLETADO] Archivo actualizado correctamente")

if __name__ == '__main__':
    main()

