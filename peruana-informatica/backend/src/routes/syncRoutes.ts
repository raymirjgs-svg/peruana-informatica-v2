import { Router, Request, Response } from 'express';
import { SyncController } from '../controllers/SyncController';
import { SyncService } from '../services/SyncService';

const router = Router();

/**
 * @route GET /api/sync/status
 * @desc Retorna el estado actual del sync ERP (último sync, próximo sync, si está en progreso)
 */
router.get('/status', (req: Request, res: Response) => {
    res.json({ success: true, data: SyncService.getSyncStatus() });
});

/**
 * @route POST /api/sync/force
 * @desc Fuerza una sincronización inmediata ignorando el cooldown
 */
router.post('/force', async (req: Request, res: Response) => {
    try {
        const result = await SyncService.forceSyncProducts();
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /api/sync/token
 * @desc Solicita un nuevo token a la API externa de Peruana Informática
 * @body { usuario: string, dias: number }
 * @access Private (debería tener autenticación en producción)
 */
router.post('/token', SyncController.solicitarToken);

/**
 * @route GET /api/sync/verify-token
 * @desc Verifica el estado del token actual y lo renueva si es necesario
 * @access Private
 */
router.get('/verify-token', SyncController.verificarToken);

/**
 * @route POST /api/sync/product/:id
 * @desc Sincroniza un producto específico con la API externa
 * @param id - External ID del producto
 * @access Private
 */
router.post('/product/:id', SyncController.sincronizarProducto);

/**
 * @route POST /api/sync/products
 * @desc Sincroniza múltiples productos con la API externa
 * @body { ids: string[] }
 * @access Private
 */
router.post('/products', SyncController.sincronizarProductos);

/**
 * @route POST /api/sync/all-products
 * @desc Sincroniza todos los productos que tienen externalId con la API externa
 * @access Private
 */
router.post('/all-products', SyncController.sincronizarTodosLosProductos);

export default router;
