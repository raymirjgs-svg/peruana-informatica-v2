import { Router } from 'express';
import {
    getOrderByTrackingCode,
    downloadInvoiceByTrackingCode,
} from '../controllers/ClientController';

const router = Router();

// Seguimiento público por código opaco (el código es el secreto del cliente)
router.get('/orders/track/:code/invoice', downloadInvoiceByTrackingCode);
router.get('/orders/track/:code', getOrderByTrackingCode);

export default router;
