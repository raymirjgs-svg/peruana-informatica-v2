import { Router } from 'express';
import { reviewController } from '../../controllers/reviewController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Admin review management
router.get('/', reviewController.getAllReviews.bind(reviewController));
router.patch('/:reviewId/approve', reviewController.approveReview.bind(reviewController));
router.patch('/:reviewId/reject', reviewController.rejectReview.bind(reviewController));
router.delete('/:reviewId', reviewController.deleteReview.bind(reviewController));

export default router;
