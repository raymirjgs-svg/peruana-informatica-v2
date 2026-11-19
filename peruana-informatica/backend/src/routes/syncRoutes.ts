import { Router, Request, Response } from 'express';
import { SyncController } from '../controllers/SyncController';
import { SyncService } from '../services/SyncService';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

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
 * @desc Inicia una sincronización inmediata en background (no bloquea)
 * @access Admin only
 */
router.post('/force', authenticateToken, requireAdmin, (req: Request, res: Response) => {
    const status = SyncService.getSyncStatus();
    if (status.isSyncing) {
        return res.json({ success: true, message: 'Sync ya en progreso', data: status });
    }
    // Ejecutar en background sin bloquear la respuesta HTTP
    SyncService.forceSyncProducts().catch(err => console.error('Force sync error:', err));
    res.json({ success: true, message: 'Sync iniciado en background', data: SyncService.getSyncStatus() });
});

/**
 * @route POST /api/sync/token
 * @desc Solicita un nuevo token a la API externa de Peruana Informática
 * @body { usuario: string, dias: number }
 * @access Admin only
 */
router.post('/token', authenticateToken, requireAdmin, SyncController.solicitarToken);

/**
 * @route GET /api/sync/verify-token
 * @desc Verifica el estado del token actual y lo renueva si es necesario
 * @access Admin only
 */
router.get('/verify-token', authenticateToken, requireAdmin, SyncController.verificarToken);

/**
 * @route POST /api/sync/product/:id
 * @desc Sincroniza un producto específico con la API externa
 * @param id - External ID del producto
 * @access Admin only
 */
router.post('/product/:id', authenticateToken, requireAdmin, SyncController.sincronizarProducto);

/**
 * @route POST /api/sync/products
 * @desc Sincroniza múltiples productos con la API externa
 * @body { ids: string[] }
 * @access Admin only
 */
router.post('/products', authenticateToken, requireAdmin, SyncController.sincronizarProductos);

/**
 * @route POST /api/sync/all-products
 * @desc Sincroniza todos los productos que tienen externalId con la API externa
 * @access Admin only
 */
router.post('/all-products', authenticateToken, requireAdmin, SyncController.sincronizarTodosLosProductos);

export default router;
