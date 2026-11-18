import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import fs from 'fs';
import path from 'path';
import { EmailService } from '../../services/EmailService';
import { INVOICE_DIR, resolveInvoicePath } from '../../utils/invoicePaths';

// Verify payment
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { verified, verified_by } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        order.payment_status = verified ? 'verified' : 'rejected';
        order.payment_verified_at = new Date();
        order.payment_verified_by = verified_by || 'Admin';

        if (verified) {
            order.status = 'processed';
        }

        await order.save();

        // Enviar email al cliente si el pago fue verificado
        if (verified) {
            try {
                const emailService = new EmailService();
                await emailService.sendPaymentVerifiedToClient(order);
                console.log(`✅ Email de verificación enviado al cliente para pedido #${order.id}`);
            } catch (emailError) {
                console.error('⚠️ Error enviando email de verificación:', emailError);
            }
        }

        res.json({
            success: true,
            message: verified ? 'Pago verificado correctamente' : 'Pago rechazado',
            order
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Error al verificar pago' });
    }
};

// Download invoice
export const downloadInvoice = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        if (!filename) {
            return res.status(400).json({ error: 'Nombre de archivo requerido' });
        }

        const invoiceDir = INVOICE_DIR;
        const filepath = resolveInvoicePath(filename);
        if (!filepath) {
            return res.status(400).json({ error: 'Nombre de archivo inválido' });
        }

        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Comprobante no encontrado' });
        }

        res.download(filepath);
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ error: 'Error al descargar comprobante' });
    }
};
