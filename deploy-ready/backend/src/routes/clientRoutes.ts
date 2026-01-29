import { Router } from 'express';
import { getOrderByIdForClient, downloadClientInvoice } from '../controllers/ClientController';

const router = Router();

// Ruta para que el cliente consulte su pedido
router.get('/orders/:id', getOrderByIdForClient);

// Ruta para que el cliente descargue su comprobante
router.get('/orders/:id/invoice', downloadClientInvoice);

export default router;
