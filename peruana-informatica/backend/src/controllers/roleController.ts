import { Request, Response } from 'express';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { User } from '../models/User';
import { RolePermission } from '../models/RolePermission';
import { logger, logAudit } from '../config/logger';

export class RoleController {
    /**
     * Get all roles with permissions
     */
    async getAllRoles(req: Request, res: Response) {
        try {
            const roles = await Role.findAll({
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }],
                order: [['created_at', 'DESC']]
            });

            return res.json({
                success: true,
                data: roles
            });
        } catch (error) {
            logger.error('Error fetching roles:', error);
            return res.status(500).json({ error: 'Error al obtener roles' });
        }
    }

    /**
     * Get single role by ID
     */
    async getRoleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id, {
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            });

            if (!role) {
                return res.status(404).json({ error: 'Rol no encontrado' });
            }

            return res.json({
                success: true,
                data: role
            });
        } catch (error) {
            logger.error('Error fetching role:', error);
            return res.status(500).json({ error: 'Error al obtener rol' });
        }
    }

    /**
     * Create new role
     */
    async createRole(req: Request, res: Response) {
        try {
            const { name, slug, description, permissions } = req.body;
            const userId = (req as any).user?.id;

            const role = await Role.create({
                name,
                slug,
                description
            });

            // Assign permissions manually if provided
            if (permissions && Array.isArray(permissions)) {
                await RolePermission.bulkCreate(
                    permissions.map(permId => ({
                        role_id: role.id,
                        permission_id: permId
                    }))
                );
            }

            logAudit('CREATE_ROLE', userId, { roleId: role.id, name: role.name });

            return res.status(201).json({
                success: true,
                data: role,
                message: 'Rol creado exitosamente'
            });
        } catch (error: any) {
            logger.error('Error creating role:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Ya existe un rol con ese nombre o slug' });
            }
            return res.status(500).json({ error: 'Error al crear rol' });
        }
    }

    /**
     * Update role
     */
    async updateRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, slug, description, permissions } = req.body;
            const userId = (req as any).user?.id;

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ error: 'Rol no encontrado' });
            }

            await role.update({ name, slug, description });

            // Update permissions manually if provided
            if (permissions && Array.isArray(permissions)) {
                // Delete existing permissions
                await RolePermission.destroy({ where: { role_id: id } });

                // Add new permissions
                if (permissions.length > 0) {
                    await RolePermission.bulkCreate(
                        permissions.map(permId => ({
                            role_id: role.id,
                            permission_id: permId
                        }))
                    );
                }
            }

            logAudit('UPDATE_ROLE', userId, { roleId: role.id, name: role.name });

            return res.json({
                success: true,
                data: role,
                message: 'Rol actualizado exitosamente'
            });
        } catch (error: any) {
            logger.error('Error updating role:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: 'Ya existe un rol con ese nombre o slug' });
            }
            return res.status(500).json({ error: 'Error al actualizar rol' });
        }
    }

    /**
     * Delete role
     */
    async deleteRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id;

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({ error: 'Rol no encontrado' });
            }

            // Check if role is in use
            const usersCount = await User.count({ where: { role_id: id } });
            if (usersCount > 0) {
                return res.status(400).json({
                    error: `No se puede eliminar. ${usersCount} usuario(s) tienen este rol asignado`
                });
            }

            await role.destroy();
            logAudit('DELETE_ROLE', userId, { roleId: id });

            return res.json({
                success: true,
                message: 'Rol eliminado exitosamente'
            });
        } catch (error) {
            logger.error('Error deleting role:', error);
            return res.status(500).json({ error: 'Error al eliminar rol' });
        }
    }

    /**
     * Get all permissions (grouped by module)
     */
    async getAllPermissions(req: Request, res: Response) {
        try {
            const permissions = await Permission.findAll({
                order: [['module', 'ASC'], ['name', 'ASC']]
            });

            // Group by module
            const grouped = permissions.reduce((acc: any, perm: any) => {
                if (!acc[perm.module]) {
                    acc[perm.module] = [];
                }
                acc[perm.module].push(perm);
                return acc;
            }, {});

            return res.json({
                success: true,
                data: {
                    all: permissions,
                    grouped
                }
            });
        } catch (error) {
            logger.error('Error fetching permissions:', error);
            return res.status(500).json({ error: 'Error al obtener permisos' });
        }
    }

    /**
     * Assign role to user
     */
    async assignRoleToUser(req: Request, res: Response) {
        try {
            const { userId, roleId } = req.body;
            const adminId = (req as any).user?.id;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const role = await Role.findByPk(roleId);
            if (!role) {
                return res.status(404).json({ error: 'Rol no encontrado' });
            }

            await user.update({ role_id: roleId });
            logAudit('ASSIGN_ROLE', adminId, { userId, roleId, roleName: role.name });

            return res.json({
                success: true,
                message: 'Rol asignado exitosamente'
            });
        } catch (error) {
            logger.error('Error assigning role:', error);
            return res.status(500).json({ error: 'Error al asignar rol' });
        }
    }
}

export const roleController = new RoleController();
