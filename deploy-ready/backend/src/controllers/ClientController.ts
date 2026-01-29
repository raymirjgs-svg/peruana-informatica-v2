import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import path from 'path';
import fs from 'fs';

// Obtener información del pedido para el cliente
export const getOrderByIdForClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [{
                model: OrderItem,
                as: 'items'
            }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Retornar información del pedido (sin datos sensibles de admin)
        res.json({
            id: order.id,
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            total_amount: order.total_amount,
            status: order.status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            invoice_type: order.invoice_type,
            invoice_number: order.invoice_number,
            invoice_file: order.invoice_file,
            has_invoice: !!order.invoice_file,
            items: (order as any).items,
            createdAt: order.createdAt
        });
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
};

// Descargar comprobante (boleta/factura) para el cliente
export const downloadClientInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

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

        // Enviar archivo para descarga
        res.download(filepath, order.invoice_file, (err) => {
            if (err) {
                console.error('Error downloading invoice:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al descargar comprobante' });
                }
            }
        });
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ error: 'Error al descargar comprobante' });
    }
};
