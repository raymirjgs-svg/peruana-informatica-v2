import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';

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
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
    }
};
