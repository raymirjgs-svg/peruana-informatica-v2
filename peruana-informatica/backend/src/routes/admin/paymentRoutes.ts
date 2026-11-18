import { Router } from 'express';
import * as PaymentController from '../../controllers/admin/PaymentController';
import { uploadInvoice, uploadInvoiceFile } from '../../controllers/admin/InvoiceUploadController';
import { authenticateToken, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken, requireAdmin);

// Verify payment
router.patch('/:id/verify', PaymentController.verifyPayment);

// Upload invoice/boleta (carga manual desde el ERP del cliente)
router.post('/:id/upload-invoice', uploadInvoice.single('invoice_file'), uploadInvoiceFile);

// Download invoice
router.get('/invoices/:filename', PaymentController.downloadInvoice);

export default router;
