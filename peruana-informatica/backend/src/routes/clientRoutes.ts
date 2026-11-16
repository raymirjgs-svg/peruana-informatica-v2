import { Router } from 'express';

const router = Router();

// Las consultas públicas de pedidos usan exclusivamente el código opaco
// de seguimiento en /api/orders/track/:code.
export default router;
