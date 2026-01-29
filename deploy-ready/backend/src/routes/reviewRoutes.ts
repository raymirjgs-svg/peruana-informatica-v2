import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

import { authenticateToken } from '../middleware/authMiddleware';

// Public endpoints
router.post('/', createLimiter, reviewController.createReview.bind(reviewController));
router.get('/product/:productId', reviewController.getProductReviews.bind(reviewController));
router.get('/product/:productId/summary', reviewController.getProductRatingSummary.bind(reviewController));
router.post('/:reviewId/helpful', reviewController.markHelpful.bind(reviewController));

// Admin endpoints (Protected)
router.get('/admin/all', authenticateToken, reviewController.getAllReviews.bind(reviewController));
router.patch('/admin/:reviewId/approve', authenticateToken, reviewController.approveReview.bind(reviewController));
router.patch('/admin/:reviewId/reject', authenticateToken, reviewController.rejectReview.bind(reviewController));
router.delete('/admin/:reviewId', authenticateToken, reviewController.deleteReview.bind(reviewController));

export default router;
