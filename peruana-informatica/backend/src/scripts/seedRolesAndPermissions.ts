/**
 * Siembra roles y permisos del panel de administracion.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada.
 * Para revertirlo: `npm run seed:roles -- --delete`.
 */
import { sequelize } from '../database/connection';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { RolePermission } from '../models/RolePermission';
import { setupRoleAssociations } from '../models/RolePermission';

setupRoleAssociations();

const PERMISSIONS = [
    { name: 'Gestionar roles y permisos', slug: 'manage-roles', module: 'usuarios' },
    { name: 'Gestionar usuarios', slug: 'manage-users', module: 'usuarios' },
    { name: 'Gestionar productos', slug: 'manage-products', module: 'catalogo' },
    { name: 'Gestionar pedidos', slug: 'manage-orders', module: 'ventas' },
    { name: 'Gestionar clientes', slug: 'manage-customers', module: 'ventas' },
    { name: 'Gestionar contenido', slug: 'manage-content', module: 'contenido' },
    { name: 'Gestionar marketing', slug: 'manage-marketing', module: 'marketing' },
    { name: 'Gestionar configuracion', slug: 'manage-settings', module: 'sistema' },
    { name: 'Ver reportes', slug: 'view-reports', module: 'sistema' },
];

const ROLES = [
    {
        name: 'Super Administrador',
        slug: 'super-admin',
        description: 'Acceso total, no se puede eliminar ni modificar',
        is_default: true,
        permissions: PERMISSIONS.map((p) => p.slug),
    },
    {
        name: 'Administrador',
        slug: 'admin',
        description: 'Acceso a todo el panel',
        is_default: true,
        permissions: PERMISSIONS.map((p) => p.slug),
    },
    {
        name: 'Vendedor',
        slug: 'vendedor',
        description: 'Catalogo y pedidos',
        is_default: false,
        permissions: ['manage-products', 'manage-orders', 'view-reports'],
    },
    {
        name: 'Soporte',
        slug: 'soporte',
        description: 'Clientes y consultas de pedidos',
        is_default: false,
        permissions: ['manage-customers', 'manage-orders', 'view-reports'],
    },
];

async function seed(): Promise<void> {
    const remove = process.argv.includes('--delete');

    try {
        await sequelize.authenticate();

        if (remove) {
            await RolePermission.destroy({ where: {}, truncate: true });
            await Permission.destroy({ where: {}, truncate: true });
            await Role.destroy({ where: {}, truncate: true });
            console.log('Roles y permisos eliminados.');
            return;
        }

        const permBySlug = new Map<string, Permission>();
        for (const p of PERMISSIONS) {
            const [row, created] = await Permission.findOrCreate({
                where: { slug: p.slug },
                defaults: p,
            });
            if (!created) await row.update(p);
            permBySlug.set(p.slug, row);
        }
        console.log(`Permisos: ${permBySlug.size}`);

        for (const r of ROLES) {
            const [role, created] = await Role.findOrCreate({
                where: { slug: r.slug },
                defaults: {
                    name: r.name,
                    slug: r.slug,
                    description: r.description,
                    is_default: r.is_default,
                },
            });
            if (!created) {
                await role.update({
                    name: r.name,
                    description: r.description,
                    is_default: r.is_default,
                });
            }

            const ids = r.permissions
                .map((slug) => permBySlug.get(slug)?.id)
                .filter((id): id is number => typeof id === 'number');

            await RolePermission.destroy({ where: { role_id: role.id } });
            if (ids.length) {
                await RolePermission.bulkCreate(ids.map((permission_id) => ({ role_id: role.id, permission_id })));
            }
            console.log(`Rol ${r.slug}: ${ids.length} permisos`);
        }

        console.log('Roles y permisos sembrados correctamente.');
    } catch (error) {
        console.error('Error al sembrar roles:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

seed();
