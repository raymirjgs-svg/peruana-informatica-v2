import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Op, WhereOptions } from 'sequelize';
import bcrypt from 'bcryptjs';
import { logger } from '../../config/logger';
import { sendError } from '../../middleware/errorHandler';

interface AuthRequest extends Request {
    user?: { id: number; email: string; role?: string };
}

const STAFF_ATTRIBUTES = {
    exclude: ['password_hash', 'reset_token', 'reset_token_expiry']
};

/**
 * Gestión de usuarios del staff (todo lo que no es 'customer').
 */
export class UserController {
    /**
     * GET /api/admin/users?page=1&limit=10&search=
     */
    static async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || '';

            const where: WhereOptions = { role: { [Op.ne]: 'customer' } };

            if (search) {
                Object.assign(where, {
                    [Op.or]: [
                        { email: { [Op.like]: `%${search}%` } },
                        { first_name: { [Op.like]: `%${search}%` } },
                        { last_name: { [Op.like]: `%${search}%` } }
                    ]
                });
            }

            const { count, rows: users } = await User.findAndCountAll({
                where,
                attributes: STAFF_ATTRIBUTES,
                limit,
                offset: (page - 1) * limit,
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        totalPages: Math.ceil(count / limit)
                    }
                }
            });
        } catch (error) {
            logger.error('❌ Error fetching staff users:', error);
            return void sendError(res, error, 'Error al obtener usuarios');
        }
    }

    /**
     * POST /api/admin/users
     */
    static async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, first_name, last_name, role } = req.body;

            const existing = await User.findOne({ where: { email } });
            if (existing) {
                res.status(409).json({ success: false, message: 'El email ya está registrado' });
                return;
            }

            const user = await User.create({
                email,
                password_hash: await bcrypt.hash(password, 10),
                first_name,
                last_name,
                role: role || 'admin',
                auth_provider: 'local',
                is_blocked: false
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: { id: user.id, email: user.email, role: user.role }
            });
        } catch (error) {
            logger.error('❌ Error creating staff user:', error);
            return void sendError(res, error, 'Error al crear usuario');
        }
    }

    /**
     * PUT /api/admin/users/:id
     * Actualiza datos del staff. `password` es opcional (reset).
     */
    static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const callerId = (req as AuthRequest).user?.id;

            const user = await User.findByPk(id);
            if (!user) {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
                return;
            }

            const { first_name, last_name, role, is_blocked, password } = req.body;

            // Un admin no puede bloquearse ni desactivarse a sí mismo
            if (Number(id) === Number(callerId) && is_blocked === true) {
                res.status(400).json({
                    success: false,
                    message: 'No puedes desactivar tu propia cuenta'
                });
                return;
            }

            if (first_name !== undefined) user.first_name = first_name;
            if (last_name !== undefined) user.last_name = last_name;
            if (role !== undefined) user.role = role;
            if (is_blocked !== undefined) user.is_blocked = is_blocked;
            if (password) user.password_hash = await bcrypt.hash(password, 10);

            await user.save();

            res.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    is_blocked: user.is_blocked
                }
            });
        } catch (error) {
            logger.error('❌ Error updating staff user:', error);
            return void sendError(res, error, 'Error al actualizar usuario');
        }
    }
}
