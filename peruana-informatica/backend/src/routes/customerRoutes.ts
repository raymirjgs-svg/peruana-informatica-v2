import { Router } from 'express';
import { CustomerProfileController } from '../controllers/CustomerProfileController';

const router = Router();

// All routes require customer authentication (handled by server.ts middleware)

// Get current user's profile
router.get('/profile', CustomerProfileController.getProfile);

// Update current user's profile
router.patch('/profile', CustomerProfileController.updateProfile);

// Change password (only for local auth users)
router.patch('/password', CustomerProfileController.changePassword);

// Get current user's orders
router.get('/orders', CustomerProfileController.getMyOrders);

export default router;
