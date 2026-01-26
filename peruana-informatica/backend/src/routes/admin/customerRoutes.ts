import { Router } from 'express';
import { CustomerController } from '../../controllers/admin/CustomerController';

const router = Router();

// All routes require admin authentication (handled by server.ts middleware)

// Get customer statistics
router.get('/stats', CustomerController.getCustomerStats);

// Get paginated list of customers with filters
router.get('/', CustomerController.getCustomers);

// Get customer by ID
router.get('/:id', CustomerController.getCustomerById);

// Toggle block/unblock customer
router.patch('/:id/block', CustomerController.toggleBlockCustomer);

// Get customer orders
router.get('/:id/orders', CustomerController.getCustomerOrders);

export default router;
