import { Request, Response } from 'express';
import { User } from '../models/User';
import { sequelize } from '../database/connection';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireJwtSecret } from '../config/env';
import { logger } from '../config/logger';

export class AuthController {
    static async socialLogin(req: Request, res: Response): Promise<void> {
        logger.info('🔐 Social Login >> Request received');
        logger.info('🔐 Social Login >> Body:', JSON.stringify(req.body, null, 2));

        try {
            const { email, googleId, firstName, lastName, photoUrl } = req.body;

            logger.info('🔐 Social Login >> Email:', email);
            logger.info('🔐 Social Login >> Google ID:', googleId);
            logger.info('🔐 Social Login >> Name:', firstName, lastName);

            if (!email) {
                logger.info('❌ Social Login >> Email is missing');
                res.status(400).json({ message: 'Email is required' });
                return;
            }

            logger.info('🔍 Social Login >> Searching for user with email:', email);
            let user = await User.findOne({ where: { email } });

            if (user) {
                logger.info('✅ Social Login >> User found:', user.id);

                if (user.is_blocked) {
                    logger.info('❌ Social Login >> User is blocked:', user.email);
                    res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
                    return;
                }

                if (!user.google_id) {
                    logger.info('🔗 Social Login >> Linking Google account to existing user');
                    user.google_id = googleId;
                    user.auth_provider = user.auth_provider === 'local' ? 'local_and_google' : 'google';
                    await user.save();
                    logger.info('✅ Social Login >> Google account linked successfully');
                }

                user.last_login = new Date();
                await user.save();
            } else {
                logger.info('➕ Social Login >> Creating new user');
                user = await User.create({
                    email,
                    google_id: googleId,
                    first_name: firstName || 'Usuario',
                    last_name: lastName || 'Google',
                    password_hash: crypto.randomBytes(32).toString('hex'),
                    auth_provider: 'google',
                    role: 'customer',
                    last_login: new Date()
                });
                logger.info('✅ Social Login >> New user created:', user.id);
            }

            logger.info('🔑 Social Login >> Generating JWT token');
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                requireJwtSecret(),
                { expiresIn: '24h' }
            );

            logger.info('✅ Social Login >> Token generated successfully');
            logger.info('✅ Social Login >> Sending success response');

            res.json({
                message: 'Login successful',
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.first_name,
                    role: user.role,
                    photo: photoUrl
                }
            });

        } catch (error) {
            logger.error('❌ Social Login Error:', error);
            logger.error('❌ Social Login Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
            res.status(500).json({ message: 'Error processing social login', error: 'Error interno' });
        }
    }

    static async register(req: Request, res: Response): Promise<void> {
        try {
            const { first_name, last_name, email, phone, password } = req.body;

            const normalizedEmail = String(email).trim().toLowerCase();

            const existing = await User.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')),
                    normalizedEmail
                )
            });

            if (existing) {
                res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
                return;
            }

            const password_hash = await bcrypt.hash(password, 12);

            const user = await User.create({
                email: normalizedEmail,
                password_hash,
                first_name,
                last_name,
                phone: phone || null,
                role: 'customer',
                auth_provider: 'local'
            });

            res.status(201).json({
                success: true,
                message: 'Cuenta creada exitosamente',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.first_name,
                    role: user.role
                }
            });
        } catch (error) {
            logger.error('Error in register:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la cuenta'
            });
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const normalizedEmail = String(email).trim().toLowerCase();

            const user = await User.findOne({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('email')),
                    normalizedEmail
                )
            });

            if (!user || !user.password_hash) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
                return;
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
                return;
            }

            if (user.is_blocked) {
                res.status(403).json({
                    success: false,
                    message: 'La cuenta ha sido bloqueada'
                });
                return;
            }

            user.last_login = new Date();
            await user.save();

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                requireJwtSecret(),
                { expiresIn: '24h' }
            );

res.json({
            success: true,
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.first_name,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el login'
        });
    }
}

static async adminLogin(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('email')),
                normalizedEmail
            )
        });

        if (!user || !user.password_hash) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
            return;
        }

        if (user.is_blocked) {
            res.status(403).json({
                success: false,
                message: 'La cuenta ha sido bloqueada'
            });
            return;
        }

        // Verificar que sea admin
        if (!['admin', 'super-admin'].includes(user.role)) {
            res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
            return;
        }

        user.last_login = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            requireJwtSecret(),
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.first_name,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Error in admin login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar el login'
        });
    }
}
}
