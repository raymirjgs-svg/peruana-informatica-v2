import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../../models/User';
import { AuthController } from '../../controllers/authController';
import { authLimiter } from '../../middleware/rateLimiter';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = express.Router();

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

// POST /api/admin/login - Login del administrador
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Email válido es requerido'),
  body('password').notEmpty().withMessage('Contraseña es requerida'),
], validateRequest, AuthController.adminLogin);

// GET /api/admin/me - Información del usuario actual (requires auth)
router.get('/me', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk((req as Request & { user?: { id: number } }).user?.id);

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

export default router;