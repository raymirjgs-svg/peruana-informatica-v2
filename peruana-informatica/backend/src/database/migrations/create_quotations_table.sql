-- Migración para crear la tabla de cotizaciones
CREATE TABLE quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  igv DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_company VARCHAR(255),
  client_ruc VARCHAR(11),
  client_address TEXT,
  status ENUM('pending', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_client_email (client_email)
);

-- Migración para crear la tabla de items de cotización
CREATE TABLE quotation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_quotation_id (quotation_id),
  INDEX idx_product_id (product_id)
);

-- Migración para crear la tabla de compatibilidades de componentes
CREATE TABLE component_compatibilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_component_type VARCHAR(50) NOT NULL,
  parent_component_id INT NOT NULL,
  child_component_type VARCHAR(50) NOT NULL,
  child_component_id INT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  compatibility_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_component_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (child_component_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_compatibility (parent_component_id, child_component_id),
  INDEX idx_parent_type (parent_component_type),
  INDEX idx_child_type (child_component_type)
);

-- Agregar campos a la tabla de productos para soportar componentes de PC
ALTER TABLE products 
ADD COLUMN component_type VARCHAR(50) NULL,
ADD COLUMN component_specs JSON NULL,
ADD COLUMN socket_type VARCHAR(50) NULL,
ADD COLUMN ram_type VARCHAR(20) NULL,
ADD COLUMN has_integrated_graphics BOOLEAN DEFAULT FALSE,
ADD COLUMN tdp_watts INT NULL,
ADD COLUMN form_factor VARCHAR(20) NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Crear índices para los nuevos campos
CREATE INDEX idx_component_type ON products(component_type);
CREATE INDEX idx_socket_type ON products(socket_type);
CREATE INDEX idx_ram_type ON products(ram_type);
CREATE INDEX idx_form_factor ON products(form_factor);