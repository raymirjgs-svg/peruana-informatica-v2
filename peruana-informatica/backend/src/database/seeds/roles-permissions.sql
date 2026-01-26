-- Seed script for roles and permissions
-- Run this manually after creating tables

-- Insert default roles
INSERT INTO roles (name, slug, description, is_default, created_at, updated_at) VALUES
('Super Admin', 'super-admin', 'Acceso total al sistema', false, NOW(), NOW()),
('Admin', 'admin', 'Administrador con permisos limitados', true, NOW(), NOW()),
('Editor', 'editor', 'Puede gestionar productos y contenido', false, NOW(), NOW()),
('Moderador', 'moderator', 'Puede moderar reviews y contactos', false, NOW(), NOW()),
('Viewer', 'viewer', 'Solo lectura', false, NOW(), NOW());

-- Insert permissions
INSERT INTO permissions (name, slug, module, description, created_at, updated_at) VALUES
-- Products
('Ver Productos', 'view-products', 'products', 'Ver listado de productos', NOW(), NOW()),
('Crear Productos', 'create-products', 'products', 'Crear nuevos productos', NOW(), NOW()),
('Editar Productos', 'edit-products', 'products', 'Editar productos existentes', NOW(), NOW()),
('Eliminar Productos', 'delete-products', 'products', 'Eliminar productos', NOW(), NOW()),

-- Orders
('Ver Pedidos', 'view-orders', 'orders', 'Ver listado de pedidos', NOW(), NOW()),
('Gestionar Pedidos', 'manage-orders', 'orders', 'Aprobar, rechazar pedidos', NOW(), NOW()),
('Eliminar Pedidos', 'delete-orders', 'orders', 'Eliminar pedidos', NOW(), NOW()),

-- Users
('Ver Usuarios', 'view-users', 'users', 'Ver listado de usuarios', NOW(), NOW()),
('Gestionar Usuarios', 'manage-users', 'users', 'Crear, editar, eliminar usuarios', NOW(), NOW()),

-- Roles
('Gestionar Roles', 'manage-roles', 'roles', 'Gestionar roles y permisos', NOW(), NOW()),

-- Reviews
('Ver Reviews', 'view-reviews', 'reviews', 'Ver listado de reseñas', NOW(), NOW()),
('Moderar Reviews', 'moderate-reviews', 'reviews', 'Aprobar, rechazar reseñas', NOW(), NOW()),

-- Content
('Gestionar Páginas', 'manage-pages', 'content', 'Crear y editar páginas', NOW(), NOW()),
('Gestionar Blog', 'manage-blog', 'content', 'Crear y editar posts de blog', NOW(), NOW()),
('Gestionar Carrusel', 'manage-carousel', 'content', 'Gestionar banners del carrusel', NOW(), NOW()),

-- Categories & Brands
('Gestionar Categorías', 'manage-categories', 'catalog', 'Gestionar categorías', NOW(), NOW()),
('Gestionar Marcas', 'manage-brands', 'catalog', 'Gestionar marcas', NOW(), NOW()),

-- Settings
('Ver Configuración', 'view-settings', 'settings', 'Ver configuración del sistema', NOW(), NOW()),
('Editar Configuración', 'edit-settings', 'settings', 'Modificar configuración', NOW(), NOW()),

-- Analytics
('Ver Analytics', 'view-analytics', 'analytics', 'Ver estadísticas y reportes', NOW(), NOW());

-- Assign all permissions to Super Admin (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign permissions to Admin (role_id = 2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE slug NOT IN ('manage-roles', 'edit-settings');

-- Assign permissions to Editor (role_id = 3)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE module IN ('products', 'catalog', 'content') OR slug = 'view-analytics';

-- Assign permissions to Moderator (role_id = 4)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE slug IN ('view-reviews', 'moderate-reviews', 'view-orders', 'view-products');

-- Assign permissions to Viewer (role_id = 5)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE slug LIKE 'view-%';
