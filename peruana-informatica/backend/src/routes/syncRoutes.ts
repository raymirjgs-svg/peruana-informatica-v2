import { Router } from 'express';
import { SyncController } from '../controllers/SyncController';

const router = Router();

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
