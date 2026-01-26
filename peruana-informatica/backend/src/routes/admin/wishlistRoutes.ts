import { Router } from 'express';
import { wishlistController } from '../../controllers/wishlistController';
import { authenticateToken } from '../../middleware/authMiddleware';

const router = Router();

// All admin routes require authentication
router.use(authenticateToken);

// Analytics
router.get('/analytics', wishlistController.getWishlistAnalytics.bind(wishlistController));

// List all wishlists
router.get('/', wishlistController.getAllWishlists.bind(wishlistController));

// Wishlists by Product
router.get('/product/:productId', wishlistController.getWishlistsByProduct.bind(wishlistController));

export default router;
