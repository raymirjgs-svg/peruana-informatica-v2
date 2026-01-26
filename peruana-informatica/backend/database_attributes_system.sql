-- =====================================================
-- DYNAMIC ATTRIBUTES SYSTEM - DATABASE SCHEMA
-- Execute este SQL en phpMyAdmin para crear las tablas
-- =====================================================

-- 1. Tabla de Atributos
CREATE TABLE IF NOT EXISTS attributes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT 'Nombre del atributo (ej: Socket, Tipo RAM)',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único (ej: socket_type, ram_type)',
  component_type VARCHAR(50) NOT NULL COMMENT 'Tipo de componente (motherboard, cpu, ram, etc)',
  input_type ENUM('text', 'number', 'select', 'boolean', 'multiselect') NOT NULL,
  is_filterable BOOLEAN DEFAULT TRUE COMMENT 'Si se puede usar como filtro',
  is_required BOOLEAN DEFAULT FALSE COMMENT 'Si es obligatorio',
  display_order INT DEFAULT 0 COMMENT 'Orden de visualización',
  unit VARCHAR(20) NULL COMMENT 'Unidad de medida (GB, MHz, W, etc)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_component (component_type),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Valores de Atributos
CREATE TABLE IF NOT EXISTS attribute_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attribute_id INT NOT NULL,
  value VARCHAR(100) NOT NULL COMMENT 'Valor del atributo (ej: AM4, DDR4, Intel)',
  code VARCHAR(50) NOT NULL COMMENT 'Código del valor (ej: am4, ddr4, intel)',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
  INDEX idx_attribute (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Atributos de Productos
CREATE TABLE IF NOT EXISTS product_attributes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL COMMENT 'ID del producto (cod_producto)',
  attribute_id INT NOT NULL COMMENT 'ID del atributo',
  value_id INT NULL COMMENT 'ID del valor (para select/multiselect)',
  value_text VARCHAR(255) NULL COMMENT 'Valor de texto',
  value_number DECIMAL(10,2) NULL COMMENT 'Valor numérico',
  value_boolean BOOLEAN NULL COMMENT 'Valor booleano',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
  FOREIGN KEY (value_id) REFERENCES attribute_values(id) ON DELETE SET NULL,
  UNIQUE KEY unique_product_attribute (product_id, attribute_id),
  INDEX idx_product (product_id),
  INDEX idx_attribute (attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Reglas de Compatibilidad
CREATE TABLE IF NOT EXISTS compatibility_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo de la regla',
  source_component_type VARCHAR(50) NOT NULL COMMENT 'Tipo de componente origen (motherboard)',
  source_attribute_id INT NOT NULL COMMENT 'Atributo origen (platform)',
  source_value_id INT NOT NULL COMMENT 'Valor origen (AMD)',
  target_component_type VARCHAR(50) NOT NULL COMMENT 'Tipo de componente destino (cpu)',
  target_attribute_id INT NOT NULL COMMENT 'Atributo destino (brand)',
  target_value_id INT NOT NULL COMMENT 'Valor destino (AMD)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_attribute_id) REFERENCES attributes(id),
  FOREIGN KEY (source_value_id) REFERENCES attribute_values(id),
  FOREIGN KEY (target_attribute_id) REFERENCES attributes(id),
  FOREIGN KEY (target_value_id) REFERENCES attribute_values(id),
  INDEX idx_source (source_component_type, source_attribute_id),
  INDEX idx_target (target_component_type, target_attribute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- SEED DATA - ATRIBUTOS BÁSICOS
-- =====================================================

-- Atributos para PLACAS MADRE (Motherboards)
INSERT INTO attributes (name, code, component_type, input_type, is_filterable, display_order) VALUES
('Plataforma', 'platform', 'motherboard', 'select', TRUE, 1),
('Socket', 'socket', 'motherboard', 'select', TRUE, 2),
('Chipset', 'chipset', 'motherboard', 'select', TRUE, 3),
('Tipo de RAM', 'ram_type', 'motherboard', 'select', TRUE, 4),
('Slots RAM', 'ram_slots', 'motherboard', 'number', TRUE, 5),
('RAM Máxima', 'max_ram', 'motherboard', 'number', FALSE, 6),
('Factor de Forma', 'form_factor', 'motherboard', 'select', TRUE, 7),
('PCIe', 'pcie_version', 'motherboard', 'select', TRUE, 8),
('Slots M.2', 'm2_slots', 'motherboard', 'number', TRUE, 9),
('Wi-Fi', 'has_wifi', 'motherboard', 'boolean', TRUE, 10),
('Bluetooth', 'has_bluetooth', 'motherboard', 'boolean', TRUE, 11);

-- Atributos para CPUs (Procesadores)
INSERT INTO attributes (name, code, component_type, input_type, is_filterable, display_order, unit) VALUES
('Marca', 'brand', 'cpu', 'select', TRUE, 1, NULL),
('Socket', 'socket', 'cpu', 'select', TRUE, 2, NULL),
('Núcleos', 'cores', 'cpu', 'number', TRUE, 3, NULL),
('Hilos', 'threads', 'cpu', 'number', TRUE, 4, NULL),
('Frecuencia Base', 'base_clock', 'cpu', 'number', FALSE, 5, 'GHz'),
('Frecuencia Turbo', 'boost_clock', 'cpu', 'number', FALSE, 6, 'GHz'),
('TDP', 'tdp', 'cpu', 'number', TRUE, 7, 'W'),
('Gráficos Integrados', 'has_igpu', 'cpu', 'boolean', TRUE, 8, NULL),
('Desbloqueado', 'unlocked', 'cpu', 'boolean', TRUE, 9, NULL);

-- Atributos para RAM (Memorias)
INSERT INTO attributes (name, code, component_type, input_type, is_filterable, display_order, unit) VALUES
('Tipo', 'type', 'ram', 'select', TRUE, 1, NULL),
('Capacidad', 'capacity', 'ram', 'number', TRUE, 2, 'GB'),
('Velocidad', 'speed', 'ram', 'number', TRUE, 3, 'MHz'),
('Latencia CAS', 'cas_latency', 'ram', 'number', FALSE, 4, NULL),
('RGB', 'has_rgb', 'ram', 'boolean', TRUE, 5, NULL);

-- =====================================================
-- VALORES DE ATRIBUTOS
-- =====================================================

-- Valores para "Plataforma" (Motherboards)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'Intel', 'intel', 1 FROM attributes WHERE code = 'platform' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'AMD', 'amd', 2 FROM attributes WHERE code = 'platform' AND component_type = 'motherboard';

-- Valores para "Socket" (Motherboards)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'AM4', 'am4', 1 FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'AM5', 'am5', 2 FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'LGA1700', 'lga1700', 3 FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'LGA1200', 'lga1200', 4 FROM attributes WHERE code = 'socket' AND component_type = 'motherboard';

-- Valores para "Tipo de RAM" (Motherboards)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'DDR4', 'ddr4', 1 FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'DDR5', 'ddr5', 2 FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard';

-- Valores para "Factor de Forma" (Motherboards)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'ATX', 'atx', 1 FROM attributes WHERE code = 'form_factor' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'Micro-ATX', 'micro_atx', 2 FROM attributes WHERE code = 'form_factor' AND component_type = 'motherboard'
UNION ALL
SELECT id, 'Mini-ITX', 'mini_itx', 3 FROM attributes WHERE code = 'form_factor' AND component_type = 'motherboard';

-- Valores para "PCIe" (Motherboards)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, '3.0', 'pcie_3', 1 FROM attributes WHERE code = 'pcie_version' AND component_type = 'motherboard'
UNION ALL
SELECT id, '4.0', 'pcie_4', 2 FROM attributes WHERE code = 'pcie_version' AND component_type = 'motherboard'
UNION ALL
SELECT id, '5.0', 'pcie_5', 3 FROM attributes WHERE code = 'pcie_version' AND component_type = 'motherboard';

-- Valores para "Marca" (CPUs)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'Intel', 'intel', 1 FROM attributes WHERE code = 'brand' AND component_type = 'cpu'
UNION ALL
SELECT id, 'AMD', 'amd', 2 FROM attributes WHERE code = 'brand' AND component_type = 'cpu';

-- Valores para "Socket" (CPUs)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'AM4', 'am4', 1 FROM attributes WHERE code = 'socket' AND component_type = 'cpu'
UNION ALL
SELECT id, 'AM5', 'am5', 2 FROM attributes WHERE code = 'socket' AND component_type = 'cpu'
UNION ALL
SELECT id, 'LGA1700', 'lga1700', 3 FROM attributes WHERE code = 'socket' AND component_type = 'cpu'
UNION ALL
SELECT id, 'LGA1200', 'lga1200', 4 FROM attributes WHERE code = 'socket' AND component_type = 'cpu';

-- Valores para "Tipo" (RAM)
INSERT INTO attribute_values (attribute_id, value, code, display_order)
SELECT id, 'DDR4', 'ddr4', 1 FROM attributes WHERE code = 'type' AND component_type = 'ram'
UNION ALL
SELECT id, 'DDR5', 'ddr5', 2 FROM attributes WHERE code = 'type' AND component_type = 'ram';


-- =====================================================
-- REGLAS DE COMPATIBILIDAD
-- =====================================================

-- Regla: Placa AMD → CPU AMD
INSERT INTO compatibility_rules (
  rule_name, 
  source_component_type, source_attribute_id, source_value_id,
  target_component_type, target_attribute_id, target_value_id,
  is_active
)
SELECT 
  'AMD Motherboard → AMD CPU',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'platform' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'amd' AND attribute_id = (SELECT id FROM attributes WHERE code = 'platform' AND component_type = 'motherboard')),
  'cpu',
  (SELECT id FROM attributes WHERE code = 'brand' AND component_type = 'cpu'),
  (SELECT id FROM attribute_values WHERE code = 'amd' AND attribute_id = (SELECT id FROM attributes WHERE code = 'brand' AND component_type = 'cpu')),
  TRUE;

-- Regla: Placa Intel → CPU Intel
INSERT INTO compatibility_rules (
  rule_name, 
  source_component_type, source_attribute_id, source_value_id,
  target_component_type, target_attribute_id, target_value_id,
  is_active
)
SELECT 
  'Intel Motherboard → Intel CPU',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'platform' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'intel' AND attribute_id = (SELECT id FROM attributes WHERE code = 'platform' AND component_type = 'motherboard')),
  'cpu',
  (SELECT id FROM attributes WHERE code = 'brand' AND component_type = 'cpu'),
  (SELECT id FROM attribute_values WHERE code = 'intel' AND attribute_id = (SELECT id FROM attributes WHERE code = 'brand' AND component_type = 'cpu')),
  TRUE;

-- Reglas de Socket
INSERT INTO compatibility_rules (
  rule_name, 
  source_component_type, source_attribute_id, source_value_id,
  target_component_type, target_attribute_id, target_value_id,
  is_active
)
SELECT 
  'AM4 Motherboard → AM4 CPU',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'am4' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard')),
  'cpu',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu'),
  (SELECT id FROM attribute_values WHERE code = 'am4' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu')),
  TRUE
UNION ALL
SELECT 
  'AM5 Motherboard → AM5 CPU',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'am5' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard')),
  'cpu',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu'),
  (SELECT id FROM attribute_values WHERE code = 'am5' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu')),
  TRUE
UNION ALL
SELECT 
  'LGA1700 Motherboard → LGA1700 CPU',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'lga1700' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'motherboard')),
  'cpu',
  (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu'),
  (SELECT id FROM attribute_values WHERE code = 'lga1700' AND attribute_id = (SELECT id FROM attributes WHERE code = 'socket' AND component_type = 'cpu')),
  TRUE;

-- Reglas DDR4/DDR5
INSERT INTO compatibility_rules (
  rule_name, 
  source_component_type, source_attribute_id, source_value_id,
  target_component_type, target_attribute_id, target_value_id,
  is_active
)
SELECT 
  'DDR4 Motherboard → DDR4 RAM',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'ddr4' AND attribute_id = (SELECT id FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard')),
  'ram',
  (SELECT id FROM attributes WHERE code = 'type' AND component_type = 'ram'),
  (SELECT id FROM attribute_values WHERE code = 'ddr4' AND attribute_id = (SELECT id FROM attributes WHERE code = 'type' AND component_type = 'ram')),
  TRUE
UNION ALL
SELECT 
  'DDR5 Motherboard → DDR5 RAM',
  'motherboard',
  (SELECT id FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard'),
  (SELECT id FROM attribute_values WHERE code = 'ddr5' AND attribute_id = (SELECT id FROM attributes WHERE code = 'ram_type' AND component_type = 'motherboard')),
  'ram',
  (SELECT id FROM attributes WHERE code = 'type' AND component_type = 'ram'),
  (SELECT id FROM attribute_values WHERE code = 'ddr5' AND attribute_id = (SELECT id FROM attributes WHERE code = 'type' AND component_type = 'ram')),
  TRUE;

-- Verificar datos
SELECT 'Tablas creadas y datos insertados exitosamente' AS Status;
SELECT COUNT(*) AS total_attributes FROM attributes;
SELECT COUNT(*) AS total_values FROM attribute_values;
SELECT COUNT(*) AS total_rules FROM compatibility_rules;
