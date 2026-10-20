import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';
import { CarouselController } from '../../controllers/admin/CarouselController';

const router = express.Router();

// All routes require admin authentication, except the public /active endpoint (home carousel)
router.use((req, res, next) => {
    if (req.method === 'GET' && req.path === '/active') {
        return next();
    }
    authenticateToken(req, res, () => requireAdmin(req, res, next));
});

// Configuración de multer para subir imágenes
const uploadDir = path.join(__dirname, '../../../public/images/carousel');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slide-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Middleware de validación
const validateRequest = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
    }
    next();
};

// GET todos los slides del carrusel
router.get('/', CarouselController.getAll);

// GET slides activos para el frontend
router.get('/active', CarouselController.getActive);

// PUT actualizar orden de slides
router.put('/reorder', [
    body('slides').isArray().withMessage('slides debe ser un array'),
    body('slides.*.id').isInt({ min: 1 }).withMessage('ID de slide debe ser un número entero mayor a 0'),
    body('slides.*.order').isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, CarouselController.reorder);

// POST subir imagen de carousel
router.post('/upload', upload.single('image'), CarouselController.uploadImage);

// GET slide por ID
router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, CarouselController.getById);

// POST crear slide
router.post('/', [
    body('title').notEmpty().isLength({ min: 1, max: 200 }).withMessage('Título es requerido y debe tener entre 1 y 200 caracteres'),
    body('description').notEmpty().isLength({ min: 1, max: 1000 }).withMessage('Descripción es requerida y debe tener entre 1 y 1000 caracteres'),
    body('buttonText').notEmpty().isLength({ min: 1, max: 100 }).withMessage('Texto del botón es requerido y debe tener entre 1 y 100 caracteres'),
    body('buttonUrl').notEmpty().isString().withMessage('URL del botón es requerida y debe ser una cadena válida'),
    body('backgroundColor').optional().isLength({ max: 100 }).withMessage('Color de fondo no puede exceder 100 caracteres'),
    body('imageUrl').optional().isString().withMessage('URL de imagen debe ser una cadena válida'),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
    body('order').optional().isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, CarouselController.create);

// PUT actualizar slide
router.put('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
    body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Título debe tener entre 1 y 200 caracteres'),
    body('description').optional().isLength({ min: 1, max: 1000 }).withMessage('Descripción debe tener entre 1 y 1000 caracteres'),
    body('buttonText').optional().isLength({ min: 1, max: 100 }).withMessage('Texto del botón debe tener entre 1 y 100 caracteres'),
    body('buttonUrl').optional().isString().withMessage('URL del botón debe ser una cadena válida'),
    body('backgroundColor').optional().isLength({ max: 100 }).withMessage('Color de fondo no puede exceder 100 caracteres'),
    body('imageUrl').optional().isString().withMessage('URL de imagen debe ser una cadena válida'),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
    body('order').optional().isInt({ min: 0 }).withMessage('Orden debe ser un número entero mayor o igual a 0'),
], validateRequest, CarouselController.update);

// DELETE eliminar slide
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero mayor a 0'),
], validateRequest, CarouselController.delete);

export default router;