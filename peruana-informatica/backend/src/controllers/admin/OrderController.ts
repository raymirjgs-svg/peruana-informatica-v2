import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import { getFrontendPublicUrl } from '../../services/MercadoPagoService';
import { sendError } from '../../middleware/errorHandler';

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.findAll({
            include: [{
                model: OrderItem,
                as: 'items'
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Error obteniendo pedidos' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending', 'pending_approval', 'processed', 'cancelled'

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const previousStatus = order.status;
        order.status = status;
        await order.save();

        // Cuando el pedido queda aprobado, el cliente debe poder pagar.
        // Se devuelve el enlace de seguimiento para que el administrador
        // pueda compartirlo (el email automatico dependera de que SMTP este
        // operativo).
        const frontend = getFrontendPublicUrl();
        const trackingCode = order.tracking_code || null;
        const trackingUrl = trackingCode && frontend ? `${frontend}/seguimiento/${trackingCode}` : null;

        res.json({
            success: true,
            message: 'Estado actualizado',
            status: order.status,
            previous_status: previousStatus,
            tracking_code: trackingCode,
            tracking_url: trackingUrl,
            can_pay: status === 'processed' || status === 'approved',
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
    }
};

/**
 * Descarga del comprobante de pago subido por el cliente.
 * Solo accesible desde el panel admin y con validacion de ruta (no path traversal).
 */
export const getPaymentProof = async (req: Request, res: Response) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order || !order.payment_proof) {
            return res.status(404).json({ error: 'Comprobante no encontrado' });
        }

        const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
        const relativePath = String(order.payment_proof).replace(/^\/?uploads\//, '');
        const filePath = path.resolve(uploadsRoot, relativePath);

        if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
            return res.status(400).json({ error: 'Ruta de comprobante invalida' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        res.sendFile(filePath);
    } catch (error) {
        return sendError(res, error, 'Error al obtener el comprobante');
    }
};
