import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getImagesByProduct, createImage, deleteImage } from '../../controllers/imageController';

const router = express.Router();

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

// GET images by product ID
router.get('/product/:productId', [
  param('productId').isInt({ min: 1 }).withMessage('ID de producto debe ser un número entero positivo'),
], validateRequest, getImagesByProduct);

// POST create a new image for a product
router.post('/product/:productId', [
  param('productId').isInt({ min: 1 }).withMessage('ID de producto debe ser un número entero positivo'),
  body('imagen').notEmpty().isURL().withMessage('Imagen debe ser una URL válida'),
], validateRequest, createImage);

// DELETE an image
router.delete('/:imageId', [
  param('imageId').isInt({ min: 1 }).withMessage('ID de imagen debe ser un número entero positivo'),
], validateRequest, deleteImage);

export default router;