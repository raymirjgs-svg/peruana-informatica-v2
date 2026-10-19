import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';
import { sequelize } from '../database/connection';
import { EmailService } from '../services/EmailService';

import { Setting } from '../models/Setting';
import { Coupon } from '../models/Coupon';
import { generateTrackingCode } from '../utils/trackingCode';

async function createOrderWithTrackingCode(values: any, transaction: any) {
    for (let attempt = 0; attempt < 8; attempt++) {
        try {
            return await Order.create(
                { ...values, tracking_code: generateTrackingCode() },
                { transaction }
            );
        } catch (error: any) {
            if (error?.name === 'SequelizeUniqueConstraintError') continue;
            throw error;
        }
    }
    throw new Error('No se pudo generar un código de seguimiento único');
}

export const createOrder = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();

    try {
        const { customer_name, customer_email, customer_phone, customer_document, items, coupon_code } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // 1. Calculate total server-side
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });

            if (!product) {
                // If product doesn't exist (or was deleted), we skip or error. 
                // For safety, let's error.
                await t.rollback();
                return res.status(404).json({ error: `Producto con ID ${item.product_id} no encontrado` });
            }

            const quantity = item.quantity || 1;
            const availableStock = Number(product.stock) || 0;

            if (quantity > availableStock) {
                await t.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente para "${product.name}". Disponible: ${availableStock}, solicitado: ${quantity}`
                });
            }

            const price = Number(product.price);

            totalAmount += price * quantity;

            processedItems.push({
                product_id: product.cod_producto, // Helper: cod_producto is the model property for DB 'id'
                product_name: product.name,
                price: price, // Current snapshot price
                quantity: quantity
            });
        }

        // 1.b Apply coupon server-side (never trust client-computed totals)
        const subtotal = totalAmount;
        let discountAmount = 0;
        let coupon: Coupon | null = null;

        if (coupon_code) {
            coupon = await Coupon.findOne({ where: { code: String(coupon_code).toUpperCase() } });

            if (!coupon) {
                await t.rollback();
                return res.status(400).json({ error: 'El cupón ingresado no existe' });
            }

            const validation = coupon.isValid(subtotal);
            if (!validation.valid) {
                await t.rollback();
                return res.status(400).json({ error: validation.message || 'Cupón inválido' });
            }

            discountAmount = Math.round(coupon.calculateDiscount(subtotal) * 100) / 100;
        }

        totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

        // Determine Checkout Mode
        const checkoutModeSetting = await Setting.findByPk('checkout_mode');
        const checkoutMode = checkoutModeSetting?.value || 'direct';
        const initialStatus = checkoutMode === 'approval' ? 'pending_approval' : 'pending';

        // 2. Create Order
        const order = await createOrderWithTrackingCode({
            customer_name,
            customer_email,
            customer_phone,
            customer_document,
            total_amount: totalAmount,
            coupon_code: coupon ? coupon.code : null,
            discount_amount: discountAmount,
            status: initialStatus
        }, t);

        // 3. Create OrderItems
        for (const pItem of processedItems) {
            await OrderItem.create({
                order_id: order.id,
                product_id: pItem.product_id,
                product_name: pItem.product_name,
                price: pItem.price,
                quantity: pItem.quantity
            }, { transaction: t });
        }

        if (coupon) {
            await coupon.update({ current_uses: coupon.current_uses + 1 }, { transaction: t });
        }

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
            tracking_code: order.tracking_code,
            total_amount: order.total_amount,
            discount_amount: order.discount_amount,
            coupon_code: order.coupon_code,
            status: order.status
        });

    } catch (error) {
        await t.rollback();
        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Error al procesar el pedido' });
    }
};
