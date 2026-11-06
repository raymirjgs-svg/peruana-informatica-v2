import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { EmailService } from '../../services/EmailService';

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

// Generate invoice/boleta
export const generateInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { invoice_number } = req.body;

        const order = await Order.findByPk(id, {
            include: [{
                model: OrderItem,
                as: 'items'
            }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.payment_status !== 'verified') {
            return res.status(400).json({ error: 'El pago debe estar verificado primero' });
        }

        // Create invoices directory
        const invoiceDir = path.join(__dirname, '../../../uploads/invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true });
        }

        const filename = `${order.invoice_type}-${invoice_number}-${Date.now()}.pdf`;
        const filepath = path.join(invoiceDir, filename);

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('PERUANA INFORMÁTICA', { align: 'center' });
        doc.fontSize(12).text('RUC: 20123456789', { align: 'center' });
        doc.moveDown();

        // Invoice type and number
        doc.fontSize(16).text(
            order.invoice_type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA',
            { align: 'center' }
        );
        doc.fontSize(12).text(`N° ${invoice_number}`, { align: 'center' });
        doc.moveDown();

        // Customer info
        doc.fontSize(10);
        doc.text(`Cliente: ${order.customer_name}`);
        doc.text(`${order.invoice_type === 'factura' ? 'RUC' : 'DNI'}: ${order.invoice_type === 'factura' ? order.ruc : order.customer_document}`);
        if (order.invoice_type === 'factura') {
            doc.text(`Razón Social: ${order.business_name}`);
            doc.text(`Dirección: ${order.tax_address}`);
        }
        doc.text(`Email: ${order.customer_email}`);
        doc.text(`Teléfono: ${order.customer_phone}`);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`);
        doc.moveDown();

        // Items table header
        doc.fontSize(10).text('─'.repeat(80));
        doc.text('CANT.  DESCRIPCIÓN                                    P.UNIT    TOTAL');
        doc.text('─'.repeat(80));

        // Items
        const items = (order as any).items || [];
        items.forEach((item: any) => {
            const quantity = item.quantity.toString().padEnd(6);
            const description = item.product_name.substring(0, 40).padEnd(42);
            const price = `S/ ${parseFloat(item.price).toFixed(2)}`.padEnd(10);
            const total = `S/ ${(parseFloat(item.price) * item.quantity).toFixed(2)}`;

            doc.text(`${quantity} ${description} ${price} ${total}`);
        });

        doc.text('─'.repeat(80));
        doc.moveDown();

        // Totals — total_amount is IGV-inclusive
        const total = parseFloat(order.total_amount.toString());
        const subtotal = total / 1.18;
        const igv = total - subtotal;

        doc.text(`Subtotal: S/ ${subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`IGV (18%): S/ ${igv.toFixed(2)}`, { align: 'right' });
        doc.fontSize(12).text(`TOTAL: S/ ${total.toFixed(2)}`, { align: 'right', underline: true });

        doc.end();

        stream.on('error', (err) => {
            console.error('Error writing invoice PDF:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error al escribir el comprobante' });
            }
        });

        // Wait for PDF to be written
        stream.on('finish', async () => {
            // Update order with invoice info
            order.invoice_number = invoice_number;
            order.invoice_file = filename;
            await order.save();

            // Enviar factura/boleta al cliente por email
            try {
                const emailService = new EmailService();
                await emailService.sendInvoiceToClient(order, filename);
                console.log(`✅ Comprobante enviado por email al cliente para pedido #${order.id}`);
            } catch (emailError) {
                console.error('⚠️ Error enviando comprobante por email:', emailError);
            }

            res.json({
                success: true,
                message: 'Comprobante generado exitosamente',
                invoice_file: filename,
                invoice_number
            });
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Error al generar comprobante' });
    }
};

// Download invoice
export const downloadInvoice = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        if (!filename) {
            return res.status(400).json({ error: 'Nombre de archivo requerido' });
        }

        const invoiceDir = path.join(__dirname, '../../../uploads/invoices');
        const safeFilename = path.basename(filename);
        const filepath = path.join(invoiceDir, safeFilename);
        if (!filepath.startsWith(invoiceDir + path.sep) && filepath !== invoiceDir) {
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
