import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { normalizeTrackingCode } from '../utils/trackingCode';

interface TrackingItem {
    product_name: string;
    quantity: number;
}

export const getOrderByTrackingCode = async (req: Request, res: Response): Promise<Response> => {
    try {
        const trackingCode = normalizeTrackingCode(req.params.code);

        if (!trackingCode) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        const order = await Order.findOne({
            where: { tracking_code: trackingCode },
            include: [{ model: OrderItem, as: 'items' }],
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        const items = ((order as any).items || []) as TrackingItem[];

        return res.json({
            success: true,
            data: {
                tracking_code: order.tracking_code,
                status: order.status,
                payment_status: order.payment_status,
                payment_method: order.payment_method,
                total_amount: Number(order.total_amount),
                items: items.map((item) => ({
                    product_name: item.product_name,
                    quantity: item.quantity,
                })),
                created_at: order.createdAt,
                updated_at: order.updatedAt,
            },
            message: 'Seguimiento del pedido disponible.',
        });
    } catch (error) {
        console.error('Error al consultar el pedido por código de tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'No pudimos consultar el pedido en este momento.',
        });
    }
};
