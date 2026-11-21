import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { createRateLimit } from '../../middleware/security';

const router = express.Router();

const loginRateLimit = createRateLimit(15 * 60 * 1000, 20, 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.');

// POST /api/admin/login - Login del administrador
router.post('/login', loginRateLimit, [
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('password').notEmpty().withMessage('Contraseña es requerida'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar que sea admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos de administrador'
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0], // For compatibility
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al procesar el login'
    });
  }
});

// GET /api/admin/me - Información del usuario actual (requires auth)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// PATCH /api/admin/password - Cambiar la contraseña del admin autenticado
router.patch('/password', authenticateToken, requireAdmin, [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.auth_provider !== 'local' && user.auth_provider !== 'local_and_google') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar la contraseña de una cuenta de login social'
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser distinta de la actual'
      });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar el cambio de contraseña' });
  }
});

export default router;
