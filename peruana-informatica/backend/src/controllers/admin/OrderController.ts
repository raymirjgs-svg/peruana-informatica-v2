import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import { sendError } from '../../middleware/errorHandler';

const ALLOWED_ORDER_STATUSES = [
    'pending',
    'pending_approval',
    'pending_payment',
    'payment_review',
    'processed',
    'shipped',
    'delivered',
    'cancelled'
];

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['processed', 'payment_review', 'shipped', 'cancelled'],
    pending_approval: ['processed', 'cancelled'],
    pending_payment: ['processed', 'cancelled'],
    payment_review: ['processed', 'cancelled'],
    processed: ['shipped', 'delivered', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const parsedPage = parseInt(String(req.query.page ?? ''), 10);
        const parsedLimit = parseInt(String(req.query.limit ?? ''), 10);

        const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
        const limit = Number.isFinite(parsedLimit) && parsedLimit >= 1
            ? Math.min(parsedLimit, 100)
            : 20;

        const { rows, count } = await Order.findAndCountAll({
            include: [{
                model: OrderItem,
                as: 'items'
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset: (page - 1) * limit
        });

        res.json({
            success: true,
            orders: rows,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        return sendError(res, error, 'Error obteniendo pedidos');
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending', 'processed', 'cancelled'

        if (!status || !ALLOWED_ORDER_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Estado de pedido inválido' });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        if (order.status === status) {
            return res.json({ success: true, message: 'Estado actualizado' });
        }

        const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];

        if (!allowedTransitions.includes(status)) {
            return res.status(400).json({
                error: `Transición de estado no permitida: ${order.status} -> ${status}`
            });
        }

        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        return sendError(res, error, 'Error actualizando estado');
    }
};

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
            return res.status(400).json({ error: 'Ruta de comprobante inválida' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        res.sendFile(filePath);
    } catch (error) {
        return sendError(res, error, 'Error al obtener el comprobante');
    }
};
