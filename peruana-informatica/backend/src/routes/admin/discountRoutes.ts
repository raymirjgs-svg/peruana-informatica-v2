import { Router } from 'express';
import { discountController } from '../../controllers/admin/DiscountController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin (editor, admin, super-admin)
router.use(authenticateToken);

// Listar todos los descuentos
router.get('/', discountController.getAllDiscounts);

// Crear descuento
router.post('/', discountController.createDiscount);

// Actualizar descuento
router.put('/:id', discountController.updateDiscount);

// Eliminar descuento
router.delete('/:id', discountController.deleteDiscount);

export default router;
