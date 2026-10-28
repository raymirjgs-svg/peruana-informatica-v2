#!/usr/bin/env python3
"""
Script de Automatización para Clasificación de Productos - Peruana Informática
================================================================================
Este script:
1. Obtiene productos de la API
2. Analiza el nombre para extraer especificaciones técnicas
3. Busca keywords SEO en internet
4. Crea categorías/subcategorías automáticamente
5. Actualiza los productos con la información correcta
"""

import requests
import re
import json
import time
import os
from urllib.parse import quote
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# ============================================
# CONFIGURACIÓN
# ============================================

API_BASE_URL = "http://200.58.98.122/api"
ADMIN_API_URL = f"{API_BASE_URL}/admin"
PUBLIC_API_URL = f"{API_BASE_URL}"

# Credenciales de admin (cambiar según sea necesario)
ADMIN_EMAIL = "admin@peruana.com"  # TODO: Cambiar por las credenciales correctas
ADMIN_PASSWORD = "admin123"

# Modo de prueba (solo extrae specs, no modifica la base de datos)
DRY_RUN = True

# Headers para las peticiones
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# ============================================
# PATRONES DE EXTRACCIÓN DE ESPECIFICACIONES
# ============================================

# Patrones para extraer especificaciones del nombre del producto
PATTERNS = {
    "ram": [
        r'(\d{1,2})\s*GB\s*(?:DDR\d|DDR5|DDR4|LPDDR[45]|RAM)',
        r'RAM\s*(\d{1,2})\s*GB',
        r'(\d{1,2})GB\s*(?:DDR\d|DDR4|DDR5)',
        r'(16|32|64|8|4)\s*GB\s*RAM',
    ],
    "storage": [
        r'(\d{3,4})\s*GB\s*(?:SSD|NVMe|PCIe)',
        r'(\d{1,2})\s*TB\s*(?:SSD|NVMe|PCIe|HDD)',
        r'(512|256|1TB|2TB|480|240|500)\s*(?:GB|TB)?\s*(?:SSD|NVMe|HDD)',
        r'SSD\s*(\d{1,2})\s*GB',
    ],
    "screen": [
        r'(\d{1,2})["\']?\s*(?:pulgadas|"|\'|inch)?\s*(?:FHD|IPS|LED|LCD|WUXGA|WQHD|4K|144Hz|165Hz|240Hz)?',
        r'(14|15\.6|16|17\.3|17|13\.3|11\.6|12\.4)\s*["\']?',
    ],
    "processor": [
        r'(INTEL\s+)?(CORE\s+)?(I[3-9]-\d{4,5}[A-Z]?)',
        r'(AMD\s+)?(RYZEN\s+)?([3579]\s*\d{4}[A-Z]?)',
        r'(CELERON|PENTIUM|ATOM)\s*[SN]?\d+',
    ],
    "gpu": [
        r'(RTX\s*\d{4,50}[0-9A-Z]*)',
        r'(GTX\s*\d{3,4}[0-9A-Z]*)',
        r'(GT\s*\d{3,4})',
        r'(RX\s*\d{4})',
        r'(INTEL\s+)?(XE|HD\s*\d{3,4})',
        r'(RADEON\s*(GRAPHICS|VEGA)?)',
    ],
    "brand": [
        r'^(ASUS|ACER|HP|DELL|LENOVO|MICROSOFT|APPLE|HUAWEI|SAMSUNG|MSI|GIGABYTE|TOSHIBA)',
    ],
    "category": [
        r'LAPTOP|NOTEBOOK|PORTATIL',
        r'DESKTOP|PC|COMPUTADORA',
        r'TARJETA\s*DE\s*VIDEO|GPU',
        r'MONITOR|PANTALLA',
        r'PROCESADOR|CPU',
        r'MEMORIA\s*RAM|RAM',
        r'DISCO|SSD|HDD|ALMACENAMIENTO',
        r'TECLADO|MOUSE|AURICULAR|WEBCAM',
        r'IMPRESORA|ESCANER',
        r'ROUTER|ACCESS\s*POINT|SWITCH',
    ],
    "laptop_type": [
        r'GAMER',
        r'BUSINESS|OFFICE|PROFESIONAL',
        r'2\s*EN\s*1|CONVERTIBLE|TOUCH|X360|SURFACE',
        r'ULTRABOOK|LIGHTWEIGHT',
        r'GAMING',
    ]
}

# Mapeo de categorías principales
CATEGORY_MAPPING = {
    "LAPTOP": {"category": "Laptops", "keywords": ["laptop", "portátil", "notebook"]},
    "DESKTOP": {"category": "Computadoras", "keywords": ["pc de escritorio", "desktop"]},
    "ALL IN ONE": {"category": "All in One", "keywords": ["all in one", "aio"]},
    "MINI PC": {"category": "Computadoras", "keywords": ["mini pc", "nuc", "minipc"]},
    "TARJETA DE VIDEO": {"category": "Tarjetas de Video", "keywords": ["tarjeta gráfica", "gpu", "rtx", "gtx"]},
    "MONITOR": {"category": "Monitores", "keywords": ["monitor", "pantalla"]},
    "PROCESADOR": {"category": "Procesadores", "keywords": ["cpu", "procesador", "intel", "amd"]},
    "MEMORIA RAM": {"category": "Memorias RAM", "keywords": ["ram", "memoria", "ddr4", "ddr5"]},
    "DISCO": {"category": "Discos y Almacenamiento", "keywords": ["ssd", "disco", "hdd", "nvme"]},
    "TECLADO": {"category": "Teclados", "keywords": ["teclado", "keyboard"]},
    "MOUSE": {"category": "Mouse", "keywords": ["mouse", "ratón"]},
    "IMPRESORA": {"category": "Impresoras", "keywords": ["impresora", "multifuncional"]},
    "ROUTER": {"category": "Routers", "keywords": ["router", "wifi", "inalámbrico"]},
    "CASE": {"category": "Cases y Gabinetes", "keywords": ["case", "gabinete", "chasis"]},
    "FUENTE": {"category": "Fuentes de Poder", "keywords": ["fuente", "psu", "power supply"]},
    "PLACA": {"category": "Placas Madre", "keywords": ["placa", "motherboard", "mainboard"]},
    "REFRIGERACION": {"category": "Refrigeración", "keywords": ["cooler", "ventilador", "aio", "liquid"]},
    "AURICULAR": {"category": "Audifonos", "keywords": ["auricular", "headset", "headphone"]},
    "PARLANTE": {"category": "Parlantes", "keywords": ["parlante", "speaker"]},
    "WEBCAM": {"category": "Webcams", "keywords": ["webcam", "cámara"]},
    "MOCHILA": {"category": "Mochilas y Maletines", "keywords": ["mochila", "maletín", "funda"]},
    "CABLE": {"category": "Cables y Conectores", "keywords": ["cable", "conector", "hdmi", "usb"]},
    "ACCESS POINT": {"category": "Access Points", "keywords": ["access point", "ap"]},
    "SWITCH": {"category": "Switches de Red", "keywords": ["switch", "conmutador"]},
    "CAMARA": {"category": "Cámaras de Seguridad", "keywords": ["cámara", "seguridad", "ip camera"]},
    "DVR": {"category": "DVR y NVR", "keywords": ["dvr", "nvr"]},
    "TABLET": {"category": "Tablets", "keywords": ["tablet", "ipad"]},
    "SCANNER": {"category": "Scanners", "keywords": ["scanner", "escáner"]},
    "PROYECTOR": {"category": "Proyectores", "keywords": ["proyector", "proector"]},
    "UPS": {"category": "UPS y Estabilizadores", "keywords": ["ups", "estabilizador"]},
    "ANTIVIRUS": {"category": "Antivirus", "keywords": ["antivirus", "seguridad"]},
    "SOFTWARE": {"category": "Software y Licencias", "keywords": ["software", "licencia"]},
    "SERVIDOR": {"category": "Servidores", "keywords": ["servidor", "server"]},
    "PERIFERICO": {"category": "Periféricos", "keywords": ["periférico"]},
    "MOUSE PAD": {"category": "Mouse Pads", "keywords": ["mouse pad", "alfombrilla"]},
}


class PeruanaInformaticaScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.token = None
        self.categories = []
        self.subcategories = []
        self.brands = []
        
    def login(self, email: str, password: str) -> bool:
        """Inicia sesión en el panel de admin"""
        try:
            response = self.session.post(
                f"{ADMIN_API_URL}/login",
                json={"email": email, "password": password},
                headers=HEADERS
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token") or data.get("accessToken")
                if self.token:
                    self.session.headers["Authorization"] = f"Bearer {self.token}"
                    print(f"✅ Login exitoso")
                    return True
            print(f"❌ Login fallido: {response.status_code} - {response.text}")
            return False
        except Exception as e:
            print(f"❌ Error en login: {e}")
            return False
    
    def get_products(self, limit: int = 100, page: int = 1) -> List[Dict]:
        """Obtiene productos de la API"""
        try:
            response = self.session.get(
                f"{PUBLIC_API_URL}/products",
                params={"limit": limit, "page": page},
                headers=HEADERS
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("products", [])
            return []
        except Exception as e:
            print(f"❌ Error obteniendo productos: {e}")
            return []
    
    def get_all_products(self) -> List[Dict]:
        """Obtiene todos los productos"""
        all_products = []
        page = 1
        while True:
            products = self.get_products(limit=100, page=page)
            if not products:
                break
            all_products.extend(products)
            print(f"   Obtenidos {len(all_products)} productos...")
            page += 1
            if page > 50:  # Límite de seguridad
                break
        return all_products
    
    def get_categories(self) -> List[Dict]:
        """Obtiene todas las categorías"""
        try:
            response = self.session.get(
                f"{PUBLIC_API_URL}/categories",
                headers=HEADERS
            )
            if response.status_code == 200:
                self.categories = response.json()
                return self.categories
            return []
        except Exception as e:
            print(f"❌ Error obteniendo categorías: {e}")
            return []
    
    def create_category(self, name: str, appears_in_menu: bool = False) -> Optional[Dict]:
        """Crea una nueva categoría"""
        try:
            response = self.session.post(
                f"{ADMIN_API_URL}/categories",
                json={"name": name, "appears_in_menu": appears_in_menu},
                headers=HEADERS
            )
            if response.status_code == 201:
                print(f"   ✅ Categoría creada: {name}")
                return response.json()
            elif response.status_code == 400:
                error = response.json()
                if "unique" in str(error).lower() or "ya existe" in str(error).lower():
                    return None  # Ya existe
            return None
        except Exception as e:
            print(f"❌ Error creando categoría: {e}")
            return None
    
    def create_subcategory(self, name: str, category_id: int) -> Optional[Dict]:
        """Crea una nueva subcategoría"""
        try:
            response = self.session.post(
                f"{ADMIN_API_URL}/taxonomy/subcategories",
                json={"name": name, "category_id": category_id},
                headers=HEADERS
            )
            if response.status_code == 201:
                print(f"   ✅ Subcategoría creada: {name}")
                return response.json()
            return None
        except Exception as e:
            print(f"❌ Error creando subcategoría: {e}")
            return None
    
    def update_product(self, product_id: int, data: Dict) -> bool:
        """Actualiza un producto"""
        try:
            response = self.session.put(
                f"{ADMIN_API_URL}/products/{product_id}",
                json=data,
                headers=HEADERS
            )
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Error actualizando producto: {e}")
            return False
    
    def search_seo_keywords(self, product_name: str) -> List[str]:
        """Busca keywords SEO para el producto en Google"""
        keywords = []
        
        # Usar el nombre del producto para buscar sugerencias
        search_query = quote(product_name[:50])
        
        try:
            # Intentar con una búsqueda web
            url = f"https://www.google.com/search?q={search_query}+precio+peru"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                # Extraer palabras clave del contenido
                text = response.text.lower()
                
                # Buscar patrones comunes en los resultados
                patterns = [
                    r'precio\s+(?:de\s+)?([^|<]+)',
                    r'([^\s]+)\s+(?:en\s+)?(?:perú|peru|lima)',
                    r'(?:buy|comprar)\s+([^\s]+)',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, text)
                    keywords.extend(matches[:3])
        
        except Exception as e:
            print(f"   ⚠️ Error en búsqueda SEO: {e}")
        
        # Keywords base del producto
        base_keywords = self.extract_keywords_from_name(product_name)
        keywords.extend(base_keywords)
        
        return list(set(keywords))[:10]
    
    def extract_keywords_from_name(self, name: str) -> List[str]:
        """Extrae keywords del nombre del producto"""
        keywords = []
        name_lower = name.lower()
        
        # Agregar marca
        brand_match = re.search(r'^(asus|acer|hp|dell|lenovo|microsoft|apple|huawei|samsung|msi|gigabyte|toshiba)',
                                name_lower, re.IGNORECASE)
        if brand_match:
            keywords.append(brand_match.group(1))
        
        # Agregar tipo de producto
        for category_key, category_data in CATEGORY_MAPPING.items():
            if any(kw in name_lower for kw in category_data["keywords"]):
                keywords.append(category_data["category"].lower())
                break
        
        # Agregar procesador
        if "i7" in name_lower or "i9" in name_lower:
            keywords.append("intel core i7")
        if "i5" in name_lower:
            keywords.append("intel core i5")
        if "ryzen 7" in name_lower or "ryzen 9" in name_lower:
            keywords.append("ryzen 7")
        if "ryzen 5" in name_lower:
            keywords.append("ryzen 5")
        
        # Agregar RAM
        ram_match = re.search(r'(\d+)\s*gb\s*(?:ram|ddr)', name_lower)
        if ram_match:
            keywords.append(f"ram {ram_match.group(1)}gb")
        
        # Agregar almacenamiento
        storage_match = re.search(r'(\d+)\s*(?:gb|tb)\s*(?:ssd|nvme)', name_lower)
        if storage_match:
            keywords.append(f"{storage_match.group(1)}gb ssd")
        
        # Agregar pantalla
        screen_match = re.search(r'(\d+["\']?)', name_lower)
        if screen_match:
            keywords.append(f"pantalla {screen_match.group(1)}")
        
        # Agregar GPU
        if "rtx" in name_lower:
            gpu_match = re.search(r'rtx\s*(\d+)', name_lower)
            if gpu_match:
                keywords.append(f"rtx {gpu_match.group(1)}")
        
        return keywords
    
    def extract_specs(self, product_name: str) -> Dict:
        """Extrae todas las especificaciones del nombre del producto"""
        specs = {
            "brand": None,
            "category": None,
            "product_type": None,
            "processor": None,
            "ram": None,
            "storage": None,
            "screen": None,
            "gpu": None,
            "wattage": None,
            "form_factor": None,
            "connectivity": None,
        }
        
        name = product_name.upper()
        name_lower = product_name.lower()
        
        # ========== 1. DETECTAR MARCA ==========
        brands = ['ASUS', 'ACER', 'HP', 'DELL', 'LENOVO', 'MICROSOFT', 'APPLE', 
                  'HUAWEI', 'SAMSUNG', 'MSI', 'GIGABYTE', 'TOSHIBA', 'LG', 'VIEWSONIC',
                  'BENQ', 'SENTEY', 'EVGA', 'ZOTAC', 'PALIT', 'SAPPHIRE', 'POWERCOLOR',
                  'CORSAIR', 'KINGSTON', 'CRUCIAL', 'WESTERN', 'SEAGATE', 'WD',
                  'LOGITECH', 'RAZER', 'HYPERX', 'COOLER MASTER', 'THERMALTAKE',
                  'ANTEC', 'AEROCOOL', 'DEEPCOOL', 'NOX', 'XPG', 'ADATA', 'G.SKILL',
                  'EPSON', 'CANON', 'BROTHER', 'HP', 'SAMSUNG', 'RICOH',
                  'TP-LINK', 'MIKROTIK', 'UBIQUITI', 'CISCO', 'NETGEAR',
                  'HIKVISION', 'DAHUA', 'UNIARCH', 'AXIS']
        for brand in brands:
            if brand in name:
                specs["brand"] = brand.title()
                break
        
        # ========== 2. DETECTAR CATEGORÍA ==========
        # Usar mapeo directo
        for cat_key, cat_data in CATEGORY_MAPPING.items():
            if cat_key in name:
                specs["category"] = cat_data["category"]
                break
        
        # Si no se detectó, intentar con palabras clave
        if not specs["category"]:
            if "LAPTOP" in name or "NOTEBOOK" in name:
                specs["category"] = "Laptops"
            elif "DESKTOP" in name or "PC ESCRITORIO" in name:
                specs["category"] = "Computadoras"
            elif "ALL IN ONE" in name or " AIO " in name:
                specs["category"] = "All in One"
            elif "MINI PC" in name or "NUC" in name:
                specs["category"] = "Computadoras"
            elif "TARJETA" in name and "VIDEO" in name:
                specs["category"] = "Tarjetas de Video"
            elif "MONITOR" in name:
                specs["category"] = "Monitores"
            elif "PROCESADOR" in name or "CPU" in name:
                specs["category"] = "Procesadores"
            elif ("MEMORIA" in name or " RAM " in name) and "DDR" in name:
                specs["category"] = "Memorias RAM"
            elif "DISCO" in name or "SSD" in name or "HDD" in name or "NVME" in name:
                specs["category"] = "Discos y Almacenamiento"
            elif "TECLADO" in name:
                specs["category"] = "Teclados"
            elif "MOUSE" in name:
                specs["category"] = "Mouse"
            elif "IMPRESORA" in name or "MULTIFUNCIONAL" in name:
                specs["category"] = "Impresoras"
            elif "ROUTER" in name:
                specs["category"] = "Routers"
            elif "CASE" in name or "GABINETE" in name:
                specs["category"] = "Cases y Gabinetes"
            elif "FUENTE" in name or "POWER" in name:
                specs["category"] = "Fuentes de Poder"
            elif "PLACA" in name or "MOTHERBOARD" in name:
                specs["category"] = "Placas Madre"
            elif "REFRIGERACION" in name or "COOLER" in name or "VENTILADOR" in name:
                specs["category"] = "Refrigeración"
            elif "AURICULAR" in name or "HEADSET" in name or "HEADPHONE" in name:
                specs["category"] = "Audifonos"
            elif "PARLANTE" in name or "SPEAKER" in name:
                specs["category"] = "Parlantes"
            elif "WEBCAM" in name:
                specs["category"] = "Webcams"
            elif "MOCHILA" in name or "MALETIN" in name:
                specs["category"] = "Mochilas y Maletines"
            elif "CABLE" in name or "CONECTOR" in name or "HDMI" in name or "USB" in name:
                specs["category"] = "Cables y Conectores"
            elif "ACCESS POINT" in name or "AP " in name:
                specs["category"] = "Access Points"
            elif "SWITCH" in name:
                specs["category"] = "Switches de Red"
            elif "CAMARA" in name or "SEGURIDAD" in name:
                specs["category"] = "Cámaras de Seguridad"
            elif "DVR" in name or "NVR" in name:
                specs["category"] = "DVR y NVR"
            elif "TABLET" in name or "IPAD" in name:
                specs["category"] = "Tablets"
            elif "PROYECTOR" in name:
                specs["category"] = "Proyectores"
            elif "UPS" in name or "ESTABILIZADOR" in name:
                specs["category"] = "UPS y Estabilizadores"
        
        # ========== 3. DETECTAR TIPO DE PRODUCTO (Gamer, Office, etc) ==========
        if "GAMER" in name or "GAMING" in name:
            specs["product_type"] = "Gamer"
        elif "BUSINESS" in name or "OFFICE" in name or "PROFESIONAL" in name:
            specs["product_type"] = "Business"
        elif "2 EN 1" in name or "CONVERTIBLE" in name or "X360" in name or "TOUCH" in name:
            specs["product_type"] = "2 en 1"
        elif "ULTRABOOK" in name:
            specs["product_type"] = "Ultrabook"
        
        # ========== 4. PROCESADOR ==========
        # Intel
        intel_match = re.search(r'(CORE\s*I[3-9](?:\s*[A-Z]+\d*[A-Z]*)?-?\d{4,5}[A-Z]?)', name)
        if not intel_match:
            intel_match = re.search(r'(CELERON\s*[SN]?\d+)', name)
        if not intel_match:
            intel_match = re.search(r'(PENTIUM\s*[SN]?\d+)', name)
        if not intel_match:
            intel_match = re.search(r'(ATOM\s*\d+)', name)
        if intel_match:
            specs["processor"] = intel_match.group(1).strip()
        
        # AMD
        if not specs.get("processor"):
            amd_match = re.search(r'(RYZEN\s*[3579]\s*\d{4}[A-Z]?)', name)
            if not amd_match:
                amd_match = re.search(r'(RYZEN\s*[3579])', name)
            if not amd_match:
                amd_match = re.search(r'(ATHLON\s*\d+)', name)
            if amd_match:
                specs["processor"] = amd_match.group(1).strip()
        
        # Apple
        if not specs.get("processor"):
            apple_match = re.search(r'(APPLE\s*M\d)', name)
            if not apple_match:
                apple_match = re.search(r'(M\d\s*CHIP)', name)
            if apple_match:
                specs["processor"] = apple_match.group(1).strip()
        
        # ========== 5. MEMORIA RAM ==========
        # Patrones para RAM
        ram_match = re.search(r'(\d{1,2})\s*GB\s*(?:DDR\d|DDR[45]|LPDDR[45]|RAM)', name)
        if not ram_match:
            ram_match = re.search(r'(RAM\s*:?\s*)(\d{1,2})\s*GB', name, re.IGNORECASE)
        if not ram_match:
            ram_match = re.search(r'(\d{1,2})GB\s*(?:DDR\d|DDR[45])', name)
        if not ram_match:
            ram_match = re.search(r'(16|32|64|8|4)\s*GB\s*(?:RAM|MEMORIA)', name)
        if ram_match:
            specs["ram"] = f"{ram_match.group(1)}GB"
        
        # ========== 6. ALMACENAMIENTO ==========
        # TB primero (mayor capacidad)
        storage_match = re.search(r'(\d)\s*TB\s*(?:SSD|NVMe|PCIe|HDD)?', name)
        if not storage_match:
            storage_match = re.search(r'(1TB|2TB|4TB)\s*(?:SSD|NVMe|PCIe|HDD)?', name)
        if not storage_match:
            storage_match = re.search(r'(\d{3,4})\s*GB\s*(?:SSD|NVMe|PCIe)', name)
        if not storage_match:
            storage_match = re.search(r'(512|256|480|240|1TB|2TB)\s*GB?\s*(?:SSD|NVMe|HDD)', name)
        if not storage_match:
            storage_match = re.search(r'(SSD\s*)(\d{1,2})\s*GB', name, re.IGNORECASE)
        if storage_match:
            storage_val = storage_match.group(1)
            if 'TB' in storage_val.upper():
                specs["storage"] = storage_val.upper()
            else:
                specs["storage"] = f"{storage_val}GB"
        
        # ========== 7. PANTALLA ==========
        # Solo si es laptop, monitor o AIO
        if specs.get("category") in ["Laptops", "Monitores", "All in One"]:
            screen_match = re.search(r'(\d{2}[.,]?\d?)\s*["\']?\s*(?:PULGADAS|PULG|"|\'|INCH)?', name)
            if not screen_match:
                screen_match = re.search(r'(14|15\.6|16|17\.3|17|13\.3|11\.6|12\.4|23\.8|27|24|32)\s*["\']?', name)
            if screen_match:
                screen_val = screen_match.group(1).replace(',', '.')
                if not screen_val.endswith('"'):
                    screen_val = f'{screen_val}"'
                specs["screen"] = screen_val
        
        # ========== 8. GPU / TARJETA DE VIDEO ==========
        if specs.get("category") == "Tarjetas de Video" or "TARJETA" in name:
            gpu_match = re.search(r'(RTX\s*\d{4,50}[A-Z]?)', name)
            if not gpu_match:
                gpu_match = re.search(r'(GTX\s*\d{3,4}[A-Z]?)', name)
            if not gpu_match:
                gpu_match = re.search(r'(GT\s*\d{3,4})', name)
            if not gpu_match:
                gpu_match = re.search(r'(RX\s*\d{4})', name)
            if gpu_match:
                specs["gpu"] = gpu_match.group(1).strip()
        
        # GPU integrada en laptop
        if not specs.get("gpu"):
            if "RTX" in name:
                gpu_match = re.search(r'(RTX\s*\d+)', name)
                if gpu_match:
                    specs["gpu"] = gpu_match.group(1)
            elif "GTX" in name:
                gpu_match = re.search(r'(GTX\s*\d+)', name)
                if gpu_match:
                    specs["gpu"] = gpu_match.group(1)
            elif "RADEON" in name and "GRAPHICS" in name:
                specs["gpu"] = "Radeon Graphics"
            elif "INTEL" in name and "XE" in name:
                specs["gpu"] = "Intel Xe"
        
        # ========== 9. WATTAGE (Fuentes) ==========
        if specs.get("category") == "Fuentes de Poder" or "FUENTE" in name:
            watt_match = re.search(r'(\d{3,4})\s*W(?:ATT)?', name)
            if watt_match:
                specs["wattage"] = f"{watt_match.group(1)}W"
        
        # ========== 10. FORM FACTOR ==========
        # Para cases
        if specs.get("category") == "Cases y Gabinetes":
            if "ATX" in name or "FULL TOWER" in name:
                specs["form_factor"] = "ATX"
            elif "MICRO ATX" in name or "MATX" in name:
                specs["form_factor"] = "Micro-ATX"
            elif "MINI ITX" in name:
                specs["form_factor"] = "Mini-ITX"
        
        # Para placas madre
        if specs.get("category") == "Placas Madre":
            if "ATX" in name:
                specs["form_factor"] = "ATX"
            elif "MICRO ATX" in name or "MATX" in name:
                specs["form_factor"] = "Micro-ATX"
            elif "MINI ITX" in name:
                specs["form_factor"] = "Mini-ITX"
            if "LGA1700" in name:
                specs["socket"] = "LGA1700"
            elif "LGA1200" in name:
                specs["socket"] = "LGA1200"
            elif "AM5" in name:
                specs["socket"] = "AM5"
            elif "AM4" in name:
                specs["socket"] = "AM4"
        
        # ========== 11. CONECTIVIDAD ==========
        if "WIFI" in name or "WIRELESS" in name or "INALAMBRICO" in name:
            specs["connectivity"] = "WiFi"
        if "BLUETOOTH" in name:
            if specs.get("connectivity"):
                specs["connectivity"] += " + Bluetooth"
            else:
                specs["connectivity"] = "Bluetooth"
        
        return specs
    
    def get_or_create_category(self, category_name: str) -> Optional[int]:
        """Obtiene o crea una categoría"""
        # Buscar categoría existente
        for cat in self.categories:
            if cat.get("name", "").lower() == category_name.lower():
                return cat.get("id")
        
        # Crear nueva categoría
        new_category = self.create_category(category_name)
        if new_category:
            self.categories.append(new_category)
            return new_category.get("id")
        
        return None
    
    def get_or_create_subcategory(self, subcategory_name: str, category_id: int) -> Optional[int]:
        """Obtiene o crea una subcategoría"""
        # Buscar subcategoría existente
        try:
            response = self.session.get(
                f"{ADMIN_API_URL}/taxonomy/subcategories",
                params={"category_id": category_id},
                headers=HEADERS
            )
            if response.status_code == 200:
                subcategories = response.json()
                for subcat in subcategories:
                    if subcat.get("name", "").lower() == subcategory_name.lower():
                        return subcat.get("id")
        except:
            pass
        
        # Crear nueva subcategoría
        new_subcategory = self.create_subcategory(subcategory_name, category_id)
        if new_subcategory:
            return new_subcategory.get("id")
        
        return None
    
    def process_products(self, products: List[Dict]) -> Dict:
        """Procesa todos los productos"""
        results = {
            "total": len(products),
            "processed": 0,
            "updated": 0,
            "errors": 0,
            "new_categories": [],
            "new_subcategories": [],
        }
        
        # Obtener categorías existentes
        self.get_categories()
        
        for i, product in enumerate(products):
            print(f"\n[{i+1}/{len(products)}] Procesando: {product.get('name', '')[:50]}...")
            
            try:
                # Extraer especificaciones
                specs = self.extract_specs(product.get("name", ""))
                print(f"   📋 Especificaciones: {specs}")
                
                # Buscar keywords SEO
                keywords = self.search_seo_keywords(product.get("name", ""))
                print(f"   🔑 Keywords: {keywords[:5]}")
                
                # Determinar categoría
                category_id = None
                if specs.get("category"):
                    category_id = self.get_or_create_category(specs["category"])
                    if category_id:
                        results["new_categories"].append(specs["category"])
                
                # Determinar subcategorías
                subcategory_ids = []
                
                # Subcategoría: Tipo de laptop
                if specs.get("laptop_type") and specs.get("category") == "Laptops":
                    subcat_id = self.get_or_create_subcategory(
                        specs["laptop_type"], 
                        category_id
                    )
                    if subcat_id:
                        subcategory_ids.append(subcat_id)
                        results["new_subcategories"].append(specs["laptop_type"])
                
                # Subcategoría: Procesador
                if specs.get("processor"):
                    # Extraer nombre corto del procesador
                    proc_match = re.search(r'(I[3-9]|RYZEN\s*[3579])', specs["processor"], re.IGNORECASE)
                    if proc_match:
                        proc_name = proc_match.group(1).upper()
                        if category_id:
                            subcat_id = self.get_or_create_subcategory(proc_name, category_id)
                            if subcat_id:
                                subcategory_ids.append(subcat_id)
                
                # Subcategoría: RAM
                if specs.get("ram"):
                    if category_id:
                        subcat_id = self.get_or_create_subcategory(specs["ram"], category_id)
                        if subcat_id:
                            subcategory_ids.append(subcat_id)
                
                # Subcategoría: GPU
                if specs.get("gpu"):
                    if category_id:
                        subcat_id = self.get_or_create_subcategory(specs["gpu"], category_id)
                        if subcat_id:
                            subcategory_ids.append(subcat_id)
                
                # Preparar datos para actualizar
                update_data = {
                    "category_id": category_id,
                    "subcategory_ids": subcategory_ids,
                    "keywords": ",".join(keywords[:10]),
                    "component_type": specs.get("laptop_type", "").lower() if specs.get("laptop_type") else None,
                }
                
                # Agregar especificaciones como parte de las keywords
                if specs.get("processor"):
                    update_data["keywords"] += f",{specs['processor']}"
                if specs.get("ram"):
                    update_data["keywords"] += f",{specs['ram']}"
                if specs.get("storage"):
                    update_data["keywords"] += f",{specs['storage']}"
                if specs.get("screen"):
                    update_data["keywords"] += f",{specs['screen']}"
                if specs.get("gpu"):
                    update_data["keywords"] += f",{specs['gpu']}"
                
                # Actualizar producto
                product_id = product.get("cod_producto")
                if product_id:
                    if self.update_product(product_id, update_data):
                        print(f"   ✅ Producto actualizado")
                        results["updated"] += 1
                    else:
                        print(f"   ⚠️ Error al actualizar producto")
                        results["errors"] += 1
                
                results["processed"] += 1
                
                # Esperar un poco para no saturar la API
                time.sleep(0.5)
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                results["errors"] += 1
        
        # Eliminar duplicados
        results["new_categories"] = list(set(results["new_categories"]))
        results["new_subcategories"] = list(set(results["new_subcategories"]))
        
        return results


def main():
    """Función principal"""
    print("=" * 60)
    print("🤖 Automatización de Clasificación de Productos")
    print("   Peruana Informática")
    print("=" * 60)
    
    scraper = PeruanaInformaticaScraper()
    
    if DRY_RUN:
        print("\n📝 MODO PRUEBA - Solo extraerá especificaciones")
        print("   No se modificará la base de datos")
    else:
        # Login
        print("\n🔐 Iniciando sesión...")
        if not scraper.login(ADMIN_EMAIL, ADMIN_PASSWORD):
            print("❌ No se pudo iniciar sesión")
            return
    
    # Obtener productos
    print("\n📦 Obteniendo productos...")
    products = scraper.get_all_products()
    print(f"   Total de productos: {len(products)}")
    
    if not products:
        print("❌ No se pudieron obtener productos")
        return
    
    if DRY_RUN:
        # Modo prueba: solo extraer especificaciones
        print("\n⚙️ Extrayendo especificaciones (modo prueba)...")
        for i, product in enumerate(products[:10]):  # Solo los primeros 10
            print(f"\n[{i+1}] {product.get('name', '')[:60]}...")
            specs = scraper.extract_specs(product.get("name", ""))
            keywords = scraper.extract_keywords_from_name(product.get("name", ""))
            print(f"   📋Specs: {specs}")
            print(f"   🔑Keywords: {keywords[:5]}")
        print(f"\n✅ Completado! Procesados {min(10, len(products))} productos en modo prueba")
    else:
        # Procesar productos normalmente
        print("\n⚙️ Procesando productos...")
        results = scraper.process_products(products)
        
        # Mostrar resultados
        print("\n" + "=" * 60)
        print("📊 RESULTADOS")
        print("=" * 60)
        print(f"   Total productos: {results['total']}")
        print(f"   Procesados: {results['processed']}")
        print(f"   Actualizados: {results['updated']}")
        print(f"   Errores: {results['errors']}")
        print(f"\n   Nuevas categorías: {results['new_categories']}")
        print(f"   Nuevas subcategorías: {results['new_subcategories']}")


if __name__ == "__main__":
    main()
