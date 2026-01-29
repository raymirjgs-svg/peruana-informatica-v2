-- Agregar campos de precios múltiples a la tabla products

-- Renombrar el precio actual a precio_retail
ALTER TABLE products 
  CHANGE COLUMN price price_retail DECIMAL(10,2) NOT NULL COMMENT 'Precio al público (retail)';

-- Agregar precio para cotizaciones
ALTER TABLE products 
  ADD COLUMN price_quotation DECIMAL(10,2) NULL 
  COMMENT 'Precio especial para cotizaciones' 
  AFTER price_retail;

-- Agregar precio mayorista (opcional)
ALTER TABLE products 
  ADD COLUMN price_wholesale DECIMAL(10,2) NULL 
  COMMENT 'Precio mayorista/distribuidor' 
  AFTER price_quotation;

-- Agregar precio en oferta (opcional)
ALTER TABLE products 
  ADD COLUMN price_offer DECIMAL(10,2) NULL 
  COMMENT 'Precio en oferta/promoción' 
  AFTER price_wholesale;

-- Agregar fecha de vigencia de oferta
ALTER TABLE products 
  ADD COLUMN offer_valid_until DATE NULL 
  COMMENT 'Fecha hasta la que la oferta es válida' 
  AFTER price_offer;

-- Actualizar productos existentes: copiar price a price_retail y price_quotation
-- UPDATE products 
-- SET price_quotation = price_retail * 0.95  -- 5% descuento en cotizaciones
-- WHERE price_quotation IS NULL;

-- Ver resultado
SELECT id, name, price_retail, price_quotation, price_wholesale, price_offer, offer_valid_until
FROM products 
LIMIT 10;
