import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';
import { EmailService } from '../services/EmailService';

import { Setting } from '../models/Setting';

export const createOrder = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();

    try {
        const { customer_name, customer_email, customer_phone, customer_document, items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // 1. Batch load all products at once (avoid N+1)
        const productIds = items.map((item: any) => item.product_id);
        const products = await Product.findAll({
            where: { cod_producto: { [Op.in]: productIds } }
        });
        const productMap = new Map(products.map(p => [p.cod_producto, p]));

        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = productMap.get(item.product_id);

            if (!product) {
                await t.rollback();
                return res.status(404).json({ error: `Producto con ID ${item.product_id} no encontrado` });
            }

            const quantity = item.quantity || 1;
            const price = Number(product.price);

            totalAmount += price * quantity;

            processedItems.push({
                product_id: product.cod_producto,
                product_name: product.name,
                price: price,
                quantity: quantity
            });
        }

        // Determine Checkout Mode
        const checkoutModeSetting = await Setting.findByPk('checkout_mode');
        const checkoutMode = checkoutModeSetting?.value || 'direct';
        const initialStatus = checkoutMode === 'approval' ? 'pending_approval' : 'pending';

        // 2. Create Order
        const order = await Order.create({
            customer_name,
            customer_email,
            customer_phone,
            customer_document,
            total_amount: totalAmount,
            status: initialStatus
        }, { transaction: t });

        // 3. Create OrderItems in bulk
        await OrderItem.bulkCreate(
            processedItems.map(pItem => ({
                order_id: order.id,
                product_id: pItem.product_id,
                product_name: pItem.product_name,
                price: pItem.price,
                quantity: pItem.quantity
            })),
            { transaction: t }
        );

        await t.commit();

        // Enviar emails de notificación
        try {
            const emailService = new EmailService();

            // Email al cliente
            await emailService.sendOrderConfirmationToClient(order, processedItems);

            // Email al operador/admin
            await emailService.sendNewOrderNotificationToAdmin(order, processedItems);

            console.log(`✅ Emails enviados para pedido #${order.id}`);
        } catch (emailError) {
            console.error('⚠️ Error enviando emails:', emailError);
            // No fallar el pedido si el email falla
        }

        return res.status(201).json({
            success: true,
            message: 'Pedido creado correctamente',
            order_id: order.id,
            status: order.status
        });

    } catch (error) {
        await t.rollback();
        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Error al procesar el pedido' });
    }
};
