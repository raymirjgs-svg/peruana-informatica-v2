import { Router } from 'express';
import { createOrder } from '../controllers/OrderController';
import { validationRules, handleValidationErrors } from '../middleware/validation';

const router = Router();

router.post('/', validationRules.createOrder, handleValidationErrors, createOrder);

export default router;
