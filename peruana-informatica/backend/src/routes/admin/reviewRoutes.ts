import { Router } from 'express';
import { reviewController } from '../../controllers/reviewController';

const router = Router();

// Admin review management
router.get('/', reviewController.getAllReviews.bind(reviewController));
router.patch('/:reviewId/approve', reviewController.approveReview.bind(reviewController));
router.patch('/:reviewId/reject', reviewController.rejectReview.bind(reviewController));
router.delete('/:reviewId', reviewController.deleteReview.bind(reviewController));

export default router;
