import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

// Route: /api/auth/social-login
router.post('/social-login', AuthController.socialLogin);

export default router;
