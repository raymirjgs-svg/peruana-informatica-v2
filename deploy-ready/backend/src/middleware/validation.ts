import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * Common validation rules
 */
export const validationRules = {
    // Product validations
    createProduct: [
        body('name').trim().notEmpty().withMessage('El nombre es requerido')
            .isLength({ min: 3, max: 255 }).withMessage('El nombre debe tener entre 3 y 255 caracteres'),
        body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
        body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
        body('brand_id').optional().isInt().withMessage('ID de marca inválido'),
        body('category_id').optional().isInt().withMessage('ID de categoría inválido'),
    ],

    // Order validations
    createOrder: [
        body('customer_name').trim().notEmpty().withMessage('El nombre es requerido'),
        body('customer_email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('customer_phone').optional().isMobilePhone('any').withMessage('Teléfono inválido'),
        body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
        body('items.*.product_id').isInt().withMessage('ID de producto inválido'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser al menos 1'),
    ],

    // Review validations
    createReview: [
        body('product_id').isInt().withMessage('ID de producto inválido'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Calificación debe estar entre 1 y 5'),
        body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Título debe tener entre 3 y 100 caracteres'),
        body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comentario debe tener entre 10 y 1000 caracteres'),
    ],

    // Contact form validations
    contactForm: [
        body('name').trim().notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Mensaje debe tener entre 10 y 1000 caracteres'),
    ],

    // Auth validations
    login: [
        body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    ],

    register: [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Usuario debe tener entre 3 y 50 caracteres'),
        body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener mayúsculas, minúsculas y números'),
    ],
};
