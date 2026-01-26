#!/usr/bin/env python3
"""
Agrega NULL después de keywords en todas las líneas de INSERT
"""
import re
from pathlib import Path

def main():
    sql_file = Path(__file__).parent.parent.parent / 'peruana_informatica.sql'
    
    print("[INFO] Leyendo archivo...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("[INFO] Procesando lineas...")
    updated_lines = []
    count = 0
    skip_next = False
    
    for line in lines:
        # Ya actualizadas tienen: 'keywords', NULL, 'date'
        if ', NULL, \'2025-' in line or ', NULL, \'1899-' in line:
            updated_lines.append(line)
            continue
        
        # Patrón: 'keywords', 'date'
        # Cambiar a: 'keywords', NULL, 'date'
        if "'keywords'" in line:
            # Buscar el patrón
            # Ejemplo: 'laptop, hp, ryzen, 8gb, ssd', '2025-10-15 21:53:17'
            pattern = r"('\w+(?:,?\s*\w+)*(?:\s*,?\w+)*'),\s*'([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})'"
            
            def replace(m):
                keywords = m.group(1)
                date = m.group(2)
                return f"{keywords}, NULL, '{date}'"
            
            new_line = re.sub(pattern, replace, line)
            
            if new_line != line:
                count += 1
                updated_lines.append(new_line)
                print(f"[OK] Linea {count} actualizada")
                continue
        
        updated_lines.append(line)
    
    print(f"[RESULTADO] {count} lineas actualizadas")
    
    print("[GUARDAR] Escribiendo archivo...")
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print("[COMPLETADO] Archivo actualizado!")

if __name__ == '__main__':
    main()

