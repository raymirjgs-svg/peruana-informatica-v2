import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { logger } from '../config/logger';

/**
 * Check if user has specific permission
 */
export const checkPermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            // Get user with role and permissions
            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['slug']
                    }]
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Super admin bypasses all permission checks
            if ((user as any).role?.slug === 'super-admin') {
                return next();
            }

            // Check if user has required permission
            const permissions = (user as any).role?.permissions || [];
            const hasPermission = permissions.some(
                (p: any) => p.slug === requiredPermission
            );

            if (!hasPermission) {
                logger.warn(`Permission denied for user ${userId}: ${requiredPermission}`);
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            next();
        } catch (error) {
            logger.error('Error checking permission:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos'
            });
        }
    };
};

/**
 * Check if user has any of the specified permissions
 */
export const checkAnyPermission = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['slug']
                    }]
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Super admin bypasses
            if ((user as any).role?.slug === 'super-admin') {
                return next();
            }

            // Check if user has any of the required permissions
            const permissions = (user as any).role?.permissions || [];
            const hasAnyPermission = requiredPermissions.some(reqPerm =>
                permissions.some((p: any) => p.slug === reqPerm)
            );

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            next();
        } catch (error) {
            logger.error('Error checking permissions:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos'
            });
        }
    };
};

/**
 * Check if user has specific role
 */
export const checkRole = (requiredRole: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role',
                    attributes: ['slug']
                }]
            });

            if (!user || (user as any).role?.slug !== requiredRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            next();
        } catch (error) {
            logger.error('Error checking role:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar rol'
            });
        }
    };
};
