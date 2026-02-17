import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { createRateLimit } from '../middleware/security';

const router = Router();

const socialLoginRateLimit = createRateLimit(15 * 60 * 1000, 10, 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.');

// Route: /api/auth/social-login
router.post('/social-login', socialLoginRateLimit, AuthController.socialLogin);

export default router;
