import { Router } from 'express';
import * as PaymentController from '../../controllers/admin/PaymentController';
import { uploadInvoice, uploadInvoiceFile } from '../../controllers/admin/InvoiceUploadController';

const router = Router();

// Verify payment
router.patch('/:id/verify', PaymentController.verifyPayment);

// Generate invoice/boleta (auto-generación)
router.post('/:id/generate-invoice', PaymentController.generateInvoice);

// Upload invoice/boleta (carga manual desde sistema externo)
router.post('/:id/upload-invoice', uploadInvoice.single('invoice_file'), uploadInvoiceFile);

// Download invoice
router.get('/invoices/:filename', PaymentController.downloadInvoice);

export default router;
