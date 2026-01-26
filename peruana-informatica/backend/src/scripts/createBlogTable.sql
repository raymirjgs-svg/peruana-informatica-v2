-- Script para crear las tablas del blog en la base de datos peruana_informatica
-- Ejecutar este script en phpMyAdmin

USE peruana_informatica;

-- Tabla principal de posts del blog
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Título del post',
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'URL amigable del post',
  `excerpt` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Resumen/extracto del post',
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contenido completo del post en markdown/HTML',
  `featured_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL de la imagen destacada',
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Título SEO',
  `meta_description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción SEO',
  `meta_keywords` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Keywords SEO',
  `author_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Peruana Informática' COMMENT 'Nombre del autor',
  `author_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email del autor',
  `reading_time` int(11) DEFAULT 5 COMMENT 'Tiempo estimado de lectura en minutos',
  `views` int(11) DEFAULT 0 COMMENT 'Número de visualizaciones',
  `likes` int(11) DEFAULT 0 COMMENT 'Número de likes',
  `status` enum('draft','published','scheduled','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT 'Estado del post',
  `published_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha de publicación',
  `scheduled_at` timestamp NULL DEFAULT NULL COMMENT 'Fecha programada de publicación',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Si es un post destacado',
  `ai_generated` tinyint(1) DEFAULT 0 COMMENT 'Si fue generado por IA',
  `ai_prompt` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Prompt usado para generar el contenido',
  `ai_model` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modelo de IA usado (gpt-4, gpt-3.5-turbo, etc)',
  `tags` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tags separados por comas',
  `categories` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Categorías separadas por comas',
  `external_links` json DEFAULT NULL COMMENT 'Enlaces externos relacionados',
  `word_count` int(11) DEFAULT 0 COMMENT 'Número de palabras del contenido',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_status` (`status`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_ai_generated` (`ai_generated`),
  KEY `idx_author_email` (`author_email`),
  KEY `idx_created_at` (`createdAt`),
  KEY `idx_views` (`views`),
  FULLTEXT KEY `search_content` (`title`, `excerpt`, `content`, `tags`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Posts del blog con soporte para contenido generado por IA';

-- Tabla para sugerencias de títulos generadas por IA
CREATE TABLE IF NOT EXISTS `blog_title_suggestions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `suggested_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Título sugerido por IA',
  `topic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tema/categoría del título',
  `ai_prompt` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Prompt usado para generar el título',
  `ai_model` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modelo de IA usado',
  `status` enum('pending','selected','rejected','used') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Estado de la sugerencia',
  `blog_post_id` int(11) DEFAULT NULL COMMENT 'ID del post creado a partir de esta sugerencia',
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `selected_at` timestamp NULL DEFAULT NULL COMMENT 'Cuándo fue seleccionado',
  `used_at` timestamp NULL DEFAULT NULL COMMENT 'Cuándo fue usado para crear un post',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_topic` (`topic`),
  KEY `idx_blog_post_id` (`blog_post_id`),
  KEY `idx_generated_at` (`generated_at`),
  CONSTRAINT `fk_title_suggestion_post` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sugerencias de títulos generadas por IA';

-- Tabla para comentarios del blog (opcional)
CREATE TABLE IF NOT EXISTS `blog_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `blog_post_id` int(11) NOT NULL COMMENT 'ID del post',
  `author_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del comentarista',
  `author_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email del comentarista',
  `author_website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sitio web del comentarista',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contenido del comentario',
  `parent_id` int(11) DEFAULT NULL COMMENT 'ID del comentario padre (para respuestas)',
  `status` enum('pending','approved','rejected','spam') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Estado del comentario',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP del comentarista',
  `user_agent` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User agent del navegador',
  `likes` int(11) DEFAULT 0 COMMENT 'Número de likes del comentario',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_blog_post_id` (`blog_post_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`createdAt`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `blog_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Comentarios de los posts del blog';

-- Insertar algunos posts de ejemplo
INSERT INTO `blog_posts` (`title`, `slug`, `excerpt`, `content`, `author_name`, `reading_time`, `status`, `published_at`, `is_featured`, `tags`, `categories`, `word_count`) VALUES
('Bienvenidos al Blog de Peruana Informática', 'bienvenidos-blog-peruana-informatica', 'Te damos la bienvenida a nuestro nuevo blog donde compartiremos las últimas novedades en tecnología, reviews de productos y guías útiles.', '# Bienvenidos al Blog de Peruana Informática\n\n¡Estamos emocionados de lanzar nuestro nuevo blog! Aquí encontrarás:\n\n- **Últimas novedades tecnológicas**\n- **Reviews detallados de productos**\n- **Guías de compra y uso**\n- **Tips y consejos técnicos**\n\nManténte conectado para no perderte ninguna actualización.', 'Equipo Peruana Informática', 3, 'published', NOW(), 1, 'bienvenida, blog, tecnología', 'General', 150),

('Las Mejores Laptops para Trabajar desde Casa', 'mejores-laptops-trabajo-casa', 'Descubre cuáles son las laptops más recomendadas para maximizar tu productividad trabajando desde casa en 2024.', '# Las Mejores Laptops para Trabajar desde Casa\n\nEl trabajo remoto se ha vuelto la nueva normalidad, y contar con el equipo adecuado es esencial...\n\n## Características Importantes\n\n1. **Procesador potente**\n2. **RAM suficiente (mínimo 16GB)**\n3. **Buena conectividad**\n4. **Batería de larga duración**\n\n## Nuestras Recomendaciones\n\n### Dell XPS 13\n- Procesador Intel i7\n- 16GB RAM\n- Pantalla 4K\n\n*Continuará...*', 'Peruana Informática', 7, 'published', DATE_SUB(NOW(), INTERVAL 2 DAY), 1, 'laptops, trabajo remoto, productividad, dell, lenovo', 'Laptops, Trabajo', 800),

('Guía Completa: Cómo Elegir un Monitor Gaming', 'guia-elegir-monitor-gaming', 'Todo lo que necesitas saber para elegir el monitor gaming perfecto: resolución, tasa de refresco, tecnologías y más.', '# Guía Completa: Cómo Elegir un Monitor Gaming\n\n¿Buscas el monitor gaming perfecto? Esta guía te ayudará...\n\n## Especificaciones Clave\n\n### Resolución\n- **1080p (Full HD)**: Ideal para presupuestos ajustados\n- **1440p (QHD)**: El sweet spot actual\n- **4K**: Para los más exigentes\n\n### Tasa de Refresco\n- **60Hz**: Básico\n- **144Hz**: Recomendado para gaming\n- **240Hz**: Para competitivo\n\n*Continuará...*', 'Peruana Informática', 10, 'published', DATE_SUB(NOW(), INTERVAL 5 DAY), 0, 'monitor, gaming, resolución, fps, tecnología', 'Gaming, Monitores', 1200);

-- Insertar algunas sugerencias de título de ejemplo
INSERT INTO `blog_title_suggestions` (`suggested_title`, `topic`, `ai_prompt`, `ai_model`, `status`) VALUES
('Inteligencia Artificial en el Gaming: El Futuro está Aquí', 'tecnología', 'Genera títulos sobre las últimas tendencias tecnológicas', 'gpt-4', 'pending'),
('5 Tendencias de Hardware que Dominarán 2024', 'hardware', 'Genera títulos sobre las últimas tendencias tecnológicas', 'gpt-4', 'pending'),
('Realidad Virtual vs Realidad Aumentada: ¿Cuál Elegir?', 'realidad virtual', 'Genera títulos sobre las últimas tendencias tecnológicas', 'gpt-4', 'pending'),
('Procesadores Cuánticos: La Próxima Revolución', 'procesadores', 'Genera títulos sobre las últimas tendencias tecnológicas', 'gpt-4', 'pending'),
('Ciberseguridad en 2024: Nuevas Amenazas y Defensas', 'seguridad', 'Genera títulos sobre las últimas tendencias tecnológicas', 'gpt-4', 'pending');

-- Verificar que las tablas se crearon correctamente
DESCRIBE blog_posts;
DESCRIBE blog_title_suggestions;
DESCRIBE blog_comments;

-- Mostrar los datos insertados
SELECT * FROM blog_posts;
SELECT * FROM blog_title_suggestions;
