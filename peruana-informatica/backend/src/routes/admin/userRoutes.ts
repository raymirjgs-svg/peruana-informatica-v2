import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { UserController } from '../../controllers/admin/UserController';

const router = express.Router();

// GET /api/admin/users
router.get('/', UserController.getUsers);

// POST /api/admin/users
router.post('/', [
    body('email').isEmail().withMessage('Email válido es requerido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('first_name').notEmpty().withMessage('El nombre es requerido'),
    body('last_name').notEmpty().withMessage('El apellido es requerido')
], (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    next();
}, UserController.createUser);

// PUT /api/admin/users/:id
router.put('/:id', [
    body('password').optional().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
], (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    next();
}, UserController.updateUser);

export default router;
