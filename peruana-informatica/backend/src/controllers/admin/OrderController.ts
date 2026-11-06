import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';

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

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error actualizando estado' });
    }
};
