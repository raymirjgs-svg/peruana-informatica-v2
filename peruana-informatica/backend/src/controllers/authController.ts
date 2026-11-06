import { Request, Response } from 'express';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

export class AuthController {
    // Customer Login
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: 'Correo y contraseña son requeridos' });
                return;
            }

            const user = await User.findOne({ where: { email } });

            if (!user || !user.password_hash) {
                res.status(401).json({ message: 'Credenciales incorrectas' });
                return;
            }

            if (user.is_blocked) {
                res.status(403).json({ message: 'Cuenta bloqueada. Contacta al soporte.' });
                return;
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                res.status(401).json({ message: 'Credenciales incorrectas' });
                return;
            }

            user.last_login = new Date();
            await user.save();

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: `${user.first_name} ${user.last_name}`,
                    role: user.role,
                }
            });
        } catch (error) {
            logger.error('Login error', { error });
            res.status(500).json({ message: 'Error al iniciar sesión' });
        }
    }

    // Customer Registration
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const { first_name, last_name, email, password, phone } = req.body;

            if (!first_name || !last_name || !email || !password) {
                res.status(400).json({ message: 'Nombre, apellido, correo y contraseña son requeridos' });
                return;
            }

            if (password.length < 6) {
                res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
                return;
            }

            const existing = await User.findOne({ where: { email } });
            if (existing) {
                res.status(400).json({ message: 'Ya existe una cuenta con ese correo electrónico' });
                return;
            }

            const password_hash = await bcrypt.hash(password, 10);

            await User.create({
                first_name,
                last_name,
                email,
                password_hash,
                phone: phone || null,
                role: 'customer',
                auth_provider: 'local',
                is_blocked: false,
            });

            res.status(201).json({ message: 'Cuenta creada exitosamente' });
        } catch (error) {
            logger.error('Register error', { error });
            res.status(500).json({ message: 'Error al crear la cuenta' });
        }
    }

    // Social Login (Google)
    static async socialLogin(req: Request, res: Response): Promise<void> {
        try {
            const { email, googleId, firstName, lastName, photoUrl } = req.body;

            if (!email) {
                res.status(400).json({ message: 'Email is required' });
                return;
            }

            // 1. Check if user exists
            let user = await User.findOne({ where: { email } });

            if (user) {
                // Check if user is blocked
                if (user.is_blocked) {
                    res.status(403).json({ message: 'Account has been blocked. Please contact support.' });
                    return;
                }

                // 2. If exists, update google_id if missing (Link Account)
                if (!user.google_id) {
                    user.google_id = googleId;
                    user.auth_provider = user.auth_provider === 'local' ? 'local_and_google' : 'google';
                    await user.save();
                }

                // Update last login
                user.last_login = new Date();
                await user.save();
            } else {
                // 3. If new, create user with Google data
                user = await User.create({
                    email,
                    google_id: googleId,
                    first_name: firstName || 'Usuario',
                    last_name: lastName || 'Google',
                    password_hash: crypto.randomBytes(32).toString('hex'), // Random secure string
                    auth_provider: 'google',
                    role: 'customer',
                    last_login: new Date()
                });
            }

            // 4. Generate Token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

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
            logger.error('Social login error', { error });
            res.status(500).json({ message: 'Error processing social login', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
}
