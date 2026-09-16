import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Farmer DBT payments & summary
router.get('/my-payments', authenticate, PaymentController.getMyPayments);

// Admin & Manager all payments oversight
router.get('/admin/all', authenticate, requireRole(['ADMIN', 'PROCUREMENT_CENTRE_MANAGER']), PaymentController.getAllPayments);

// Single payment & J-form receipt details
router.get('/:id', authenticate, PaymentController.getPaymentById);

// Download official APMC weighment slip / J-Form PDF
router.get('/:id/receipt-pdf', authenticate, PaymentController.downloadReceiptPdf);

// Admin & Manager status update / fund disbursement
router.patch('/:id/status', authenticate, requireRole(['ADMIN', 'PROCUREMENT_CENTRE_MANAGER']), PaymentController.updatePaymentStatus);

export default router;
