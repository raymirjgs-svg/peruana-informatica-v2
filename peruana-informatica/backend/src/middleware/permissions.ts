import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { logger } from '../config/logger';
import { sendError } from './errorHandler';

/**
 * Check if user has specific permission
 */
export const checkPermission = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const role = user.role
                ? await Role.findOne({
                    where: { slug: user.role },
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['slug']
                    }]
                })
                : null;

            if (role?.slug === 'super-admin') {
                return next();
            }

            const permissions = role?.permissions || [];
            const hasPermission = permissions.some(
                (p) => p.slug === requiredPermission
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
            return sendError(res, error, 'Error al verificar permisos');
        }
    };
};

/**
 * Check if user has any of the specified permissions
 */
export const checkAnyPermission = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const role = user.role
                ? await Role.findOne({
                    where: { slug: user.role },
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        attributes: ['slug']
                    }]
                })
                : null;

            if (role?.slug === 'super-admin') {
                return next();
            }

            const permissions = role?.permissions || [];
            const hasAnyPermission = requiredPermissions.some(reqPerm =>
                permissions.some((p) => p.slug === reqPerm)
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
            return sendError(res, error, 'Error al verificar permisos');
        }
    };
};

/**
 * Check if user has specific role
 */
export const checkRole = (requiredRole: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const user = await User.findByPk(userId);

            if (!user || user.role !== requiredRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado'
                });
            }

            next();
        } catch (error) {
            logger.error('Error checking role:', error);
            return sendError(res, error, 'Error al verificar rol');
        }
    };
};
