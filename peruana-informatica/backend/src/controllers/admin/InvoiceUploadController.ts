import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EmailService } from '../../services/EmailService';

// Configurar multer para subir comprobantes (facturas/boletas)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads/invoices');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Solo aceptar archivos PDF
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'));
    }
};

export const uploadInvoice = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: fileFilter
});

// Upload invoice/boleta generada externamente
export const uploadInvoiceFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { invoice_number } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.payment_status !== 'verified') {
            return res.status(400).json({ error: 'El pago debe estar verificado primero' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Debe subir un archivo PDF' });
        }

        if (!invoice_number) {
            return res.status(400).json({ error: 'Debe proporcionar el número de comprobante' });
        }

        // Update order with invoice info
        order.invoice_number = invoice_number;
        order.invoice_file = req.file.filename;
        await order.save();

        // Enviar factura/boleta al cliente por email
        try {
            const emailService = new EmailService();
            await emailService.sendInvoiceToClient(order, req.file.filename);
            console.log(`✅ Comprobante enviado por email al cliente para pedido #${order.id}`);
        } catch (emailError) {
            console.error('⚠️ Error enviando comprobante por email:', emailError);
            // No fallar la operación si el email falla
        }

        res.json({
            success: true,
            message: 'Comprobante cargado exitosamente',
            invoice_file: req.file.filename,
            invoice_number
        });
    } catch (error) {
        console.error('Error uploading invoice:', error);
        res.status(500).json({ error: 'Error al cargar comprobante' });
    }
};
