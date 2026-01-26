-- Script para crear la tabla seo_settings en la base de datos peruana_informatica
-- Ejecutar este script en phpMyAdmin

USE peruana_informatica;

CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de página (global, home, products, categories, etc.)',
  `page_identifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Identificador específico de la página (slug, id, etc.)',
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Título SEO de la página',
  `meta_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción meta de la página',
  `meta_keywords` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Palabras clave separadas por comas',
  `og_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Título para Open Graph (Facebook)',
  `og_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción para Open Graph',
  `og_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL de imagen para Open Graph',
  `twitter_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Título para Twitter Card',
  `twitter_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción para Twitter Card',
  `twitter_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL de imagen para Twitter Card',
  `canonical_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL canónica de la página',
  `robots` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'index,follow' COMMENT 'Directivas para robots (index,follow, noindex, etc.)',
  `schema_markup` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'JSON-LD schema markup',
  `custom_head` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HTML personalizado para el head',
  `priority` decimal(2,1) DEFAULT 0.5 COMMENT 'Prioridad en sitemap (0.0 a 1.0)',
  `change_frequency` enum('always','hourly','daily','weekly','monthly','yearly','never') COLLATE utf8mb4_unicode_ci DEFAULT 'weekly' COMMENT 'Frecuencia de cambio para sitemap',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Si está activo o no',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page` (`page_type`, `page_identifier`),
  KEY `idx_page_type` (`page_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones SEO para diferentes páginas del sitio';

-- Insertar configuraciones SEO por defecto
INSERT INTO `seo_settings` (`page_type`, `page_identifier`, `meta_title`, `meta_description`, `meta_keywords`, `og_title`, `og_description`, `canonical_url`, `priority`, `change_frequency`) VALUES
('global', NULL, 'Peruana de Informática | Equipos Tecnológicos en Perú', 'Venta de laptops, computadoras, monitores, periféricos y equipos informáticos de calidad en todo Perú. Las mejores marcas y precios.', 'laptop, computadora, monitor, periféricos, tecnología, informática, Perú, equipos', 'Peruana de Informática - Tecnología de Calidad', 'Tu tienda de confianza para equipos informáticos en Perú', '/', 1.0, 'weekly'),

('home', NULL, 'Inicio | Peruana de Informática', 'Descubre las mejores ofertas en laptops, computadoras y equipos informáticos. Envíos a todo Perú. ¡Compra ahora!', 'inicio, ofertas, laptops, computadoras, envíos Perú', 'Peruana de Informática - Inicio', 'Las mejores ofertas en tecnología', '/', 1.0, 'daily'),

('products', NULL, 'Productos | Peruana de Informática', 'Explora nuestro catálogo completo de productos tecnológicos: laptops, monitores, periféricos y más. Calidad garantizada.', 'productos, catálogo, laptops, monitores, periféricos, tecnología', 'Catálogo de Productos - Peruana de Informática', 'Descubre todos nuestros productos tecnológicos', '/products', 0.9, 'daily'),

('categories', NULL, 'Categorías | Peruana de Informática', 'Navega por nuestras categorías de productos tecnológicos organizadas para encontrar exactamente lo que necesitas.', 'categorías, productos, organizado, tecnología', 'Categorías de Productos', 'Productos organizados por categorías', '/categories', 0.8, 'weekly'),

('contact', NULL, 'Contacto | Peruana de Informática', 'Contáctanos para consultas, soporte técnico o información sobre nuestros productos. Estamos aquí para ayudarte.', 'contacto, soporte, consultas, información, ayuda', 'Contáctanos - Peruana de Informática', 'Estamos aquí para ayudarte', '/contacto', 0.7, 'monthly'),

('blog', NULL, 'Blog | Peruana de Informática', 'Mantente al día con las últimas noticias, reviews y guías sobre tecnología en nuestro blog especializado.', 'blog, noticias, reviews, guías, tecnología', 'Blog de Tecnología', 'Noticias y guías tecnológicas', '/blog', 0.6, 'weekly');

-- Verificar que la tabla se creó correctamente
DESCRIBE seo_settings;

-- Mostrar los datos insertados
SELECT * FROM seo_settings;
