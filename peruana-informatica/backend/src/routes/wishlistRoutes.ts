import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Wishlist endpoints
router.get('/', wishlistController.getUserWishlist.bind(wishlistController));
router.post('/', wishlistController.addToWishlist.bind(wishlistController));
router.delete('/:productId', wishlistController.removeFromWishlist.bind(wishlistController));
router.delete('/', wishlistController.clearWishlist.bind(wishlistController));
router.get('/check/:productId', wishlistController.checkWishlist.bind(wishlistController));

export default router;
