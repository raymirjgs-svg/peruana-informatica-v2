import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import path from 'path';
import fs from 'fs';
import { logger } from '../config/logger';

function maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return '';
    const parts = email.split('@');
    const local = parts[0] ?? '';
    const domain = parts[1] ?? '';
    if (local.length <= 2) return `***@${domain}`;
    return `${local.slice(0, 1)}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
}

function sendInvoiceFile(order: Order, res: Response) {
    if (!order.invoice_file) {
        return res.status(404).json({
            error: 'Comprobante aún no disponible',
            message: 'El comprobante será generado una vez que se verifique el pago'
        });
    }

    const filepath = path.join(__dirname, '../../uploads/invoices', order.invoice_file);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'Archivo de comprobante no encontrado' });
    }

    return res.download(filepath, order.invoice_file, (err) => {
        if (err) {
            logger.error('Error downloading invoice:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error al descargar comprobante' });
            }
        }
    });
}

// Obtener pedido por código de seguimiento (público, payload reducido)
export const getOrderByTrackingCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        const order = await Order.findOne({
            where: { tracking_code: code },
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({
            id: order.id,
            tracking_code: order.tracking_code,
            customer_name: order.customer_name,
            customer_email: maskEmail(order.customer_email),
            total_amount: order.total_amount,
            status: order.status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            invoice_type: order.invoice_type,
            invoice_number: order.invoice_number,
            has_invoice: !!order.invoice_file,
            items: (order as any).items.map((item: any) => ({
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.price
            })),
            createdAt: order.createdAt
        });
    } catch (error) {
        logger.error('Error getting order by tracking code:', error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
};

// Descargar comprobante por código de seguimiento (público, requiere el código secreto)
export const downloadInvoiceByTrackingCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const order = await Order.findOne({ where: { tracking_code: code } });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        return sendInvoiceFile(order, res);
    } catch (error) {
        logger.error('Error downloading invoice by tracking code:', error);
        res.status(500).json({ error: 'Error al descargar comprobante' });
    }
};

