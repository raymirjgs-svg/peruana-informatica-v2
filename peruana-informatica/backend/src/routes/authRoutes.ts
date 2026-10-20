import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/social-login', authLimiter, AuthController.socialLogin);

router.post('/register', authLimiter, [
    body('email').isEmail().withMessage('Email válido es requerido'),
    body('password').notEmpty().withMessage('Contraseña es requerida'),
    body('first_name').notEmpty().withMessage('Nombre es requerido'),
    body('last_name').notEmpty().withMessage('Apellido es requerido'),
], (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
        return;
    }
    AuthController.register(req, res).catch(next);
});

router.post('/login', authLimiter, [
    body('email').isEmail().withMessage('Email válido es requerido'),
    body('password').notEmpty().withMessage('Contraseña es requerida'),
], (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
        return;
    }
    AuthController.login(req, res).catch(next);
});

export default router;
