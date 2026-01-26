import { Router } from 'express';
import { getCotizadorLaptops } from '../controllers/CotizadorController';

const router = Router();

router.get('/laptops', getCotizadorLaptops);
// Add other cotizador routes here (e.g., /pc) if needed later

export default router;
