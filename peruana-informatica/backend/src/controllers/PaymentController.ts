import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import crypto from 'crypto';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Product } from '../models/Product';
import { sequelize } from '../database/connection';
import { User } from '../models/User';
import { logger } from '../config/logger';

// Initialize MP
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN'
});

export const paymentController = {
    // Upload Payment Proof
    async uploadProof(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const file = req.file;

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            const userId = (req as any).user?.id;
            const isOwner = order.user_id != null && userId != null && String(order.user_id) === String(userId);
            const providedTrackingCode = req.body?.tracking_code;
            const hasValidTrackingCode = !!order.tracking_code && !!providedTrackingCode &&
                String(order.tracking_code) === String(providedTrackingCode);

            if (!isOwner && !hasValidTrackingCode) {
                return res.status(403).json({ error: 'No autorizado para subir el comprobante de este pedido' });
            }

            const { payment_method, invoice_type } = req.body || {};

            // Update payment details
            if (payment_method !== undefined) {
                order.payment_method = payment_method;
            }
            if (invoice_type !== undefined) {
                order.invoice_type = invoice_type;
            }
            
            // Payment Proof (if uploaded)
            if (file) {
                order.payment_proof = `/uploads/proofs/${file.filename}`;
            }

            // Card details (if applicable)
            if (payment_method === 'tarjeta') {
                order.card_last_four = req.body.card_last_four;
                order.card_type = req.body.card_type;
                order.card_holder = req.body.card_holder;
            }

            // Invoice details (if invoice)
            if (invoice_type === 'factura') {
                order.ruc = req.body.ruc;
                order.business_name = req.body.business_name;
                order.tax_address = req.body.tax_address;
            }

            // Update status
            order.status = 'payment_review'; // Or keep as pending but mark payment as pending_review?
            // Let's use 'payment_review' for status if your system supports it, or keep 'pending'
            // The frontend displays "Received" in success page, so maybe status doesn't matter too much for immediate feedback
            // But let's set a flag or status.
            order.status = 'pending'; // Keep as pending until admin verifies

            await order.save();

            res.json({ success: true, message: 'Comprobante subido correctamente' });

        } catch (error) {
            logger.error('Error uploading proof:', error);
            res.status(500).json({ error: 'Error al subir comprobante' });
        }
    },

    // Create Payment Preference
    async createPreference(req: Request, res: Response) {
        const t = await sequelize.transaction();
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) {
                await t.rollback();
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { address, phone, document } = req.body; // Checkout form data

            // 1. Get Cart
            const cart = await Cart.findOne({ where: { user_id: userId, status: 'active' } });
            if (!cart) {
                await t.rollback();
                return res.status(404).json({ error: 'Carrito no encontrado' });
            }

            const cartItems = await CartItem.findAll({
                where: { cart_id: cart.id },
                include: [{ model: Product, as: 'product' }]
            });

            if (cartItems.length === 0) {
                await t.rollback();
                return res.status(400).json({ error: 'El carrito está vacío' });
            }

            // 2. Create Order (Pending)
            let totalAmount = 0;

            for (const item of cartItems) {
                // @ts-ignore
                const product = item.product;
                const price = Number(product.priceWeb) > 0 ? Number(product.priceWeb) : Number(product.price);

                totalAmount += price * item.quantity;
            }

            const user = await User.findByPk(userId);

            const order = await Order.create({
                user_id: userId,
                customer_name: `${user?.first_name} ${user?.last_name}`,
                customer_email: user?.email,
                customer_phone: phone || user?.phone,
                customer_document: document,
                total_amount: totalAmount,
                status: 'pending_payment' // New status
            }, { transaction: t });

            // Save Order Items
            for (const item of cartItems) {
                // @ts-ignore
                const product = item.product;
                const price = Number(product.priceWeb) > 0 ? Number(product.priceWeb) : Number(product.price);

                await OrderItem.create({
                    order_id: order.id,
                    product_id: product.id,
                    product_name: product.name,
                    price: price,
                    quantity: item.quantity
                }, { transaction: t });
            }

            // 3. Create MP Preference
            // El monto cobrado se deriva del total persistido del pedido (fuente única de verdad)
            const chargedTotal = Number(order.total_amount);

            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: String(order.id),
                            title: `Pedido #${order.id}`,
                            unit_price: chargedTotal,
                            quantity: 1,
                            currency_id: 'PEN'
                        }
                    ],
                    payer: {
                        email: user?.email,
                        name: user?.first_name,
                        surname: user?.last_name,
                    },
                    external_reference: String(order.id),
                    back_urls: {
                        success: `${process.env.FRONTEND_URL}/checkout/success`,
                        failure: `${process.env.FRONTEND_URL}/checkout/failure`,
                        pending: `${process.env.FRONTEND_URL}/checkout/pending`,
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.API_URL || 'https://tu-dominio.com'}/api/payment/webhook` // Must be HTTPS and public
                }
            });

            // 4. Update Order with Preference ID (Optional)
            // await order.update({ preference_id: result.id }, { transaction: t });

            // 5. Commit and Return
            await t.commit();

            res.json({
                preferenceId: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point
            });

        } catch (error) {
            await t.rollback();
            logger.error('Create preference error:', error);
            res.status(500).json({ error: 'Error al procesar el pago' });
        }
    },

    // Create Preference from existing Order
    async createPreferenceFromOrder(req: Request, res: Response) {
        try {
            const { orderId } = req.body;
            const order = await Order.findByPk(orderId, { include: ['items'] });

            if (!order) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // @ts-ignore
            const user = req.user;

            const preferenceItems = [];
            // @ts-ignore
            if (order.items) {
                // @ts-ignore
                for (const item of order.items) {
                    preferenceItems.push({
                        id: String(item.product_id),
                        title: item.product_name,
                        unit_price: Number(item.price),
                        quantity: item.quantity,
                        currency_id: 'PEN'
                    });
                }
            }

            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: preferenceItems,
                    payer: {
                        email: order.customer_email || user?.email || 'test_user_123@testuser.com', // Fallback for testing
                        name: order.customer_name?.split(' ')[0] || 'Cliente',
                        surname: order.customer_name?.split(' ').slice(1).join(' ') || '',
                    },
                    external_reference: String(order.id),
                    back_urls: {
                        success: `${process.env.FRONTEND_URL}/checkout/success?order_id=${order.id}`,
                        failure: `${process.env.FRONTEND_URL}/checkout/failure?order_id=${order.id}`,
                        pending: `${process.env.FRONTEND_URL}/checkout/pending?order_id=${order.id}`,
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.API_URL}/api/payment/webhook`
                }
            });

            res.json({
                preferenceId: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point
            });

        } catch (error) {
            logger.error('Create preference from order error:', error);
            res.status(500).json({ error: 'Error al crear preferencia' });
        }
    },

    // Webhook
    async receiveWebhook(req: Request, res: Response) {
        try {
            const topic = (req.query.type || req.query.topic || req.body?.type || req.body?.action) as string | undefined;
            const paymentId = (req.query['data.id'] || req.query.id || req.body?.data?.id) as string | undefined;

            // Only handle payment notifications
            if (!topic || !topic.includes('payment')) {
                return res.sendStatus(200);
            }

            if (!paymentId) {
                return res.sendStatus(200);
            }

            // Fail closed when the webhook secret is not configured
            const secret = process.env.MP_WEBHOOK_SECRET;
            if (!secret) {
                if (process.env.NODE_ENV === 'production') {
                    logger.error('Webhook rechazado: MP_WEBHOOK_SECRET no configurado');
                    return res.sendStatus(500);
                }
            } else {
                const signature = req.headers['x-signature'] as string | undefined;
                const requestId = req.headers['x-request-id'] as string | undefined;

                if (!signature || !requestId) {
                    logger.warn('Webhook rechazado: faltan headers de firma');
                    return res.sendStatus(401);
                }

                const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
                    const [k, v] = part.split('=');
                    if (k && v) acc[k.trim()] = v.trim();
                    return acc;
                }, {});

                const ts = parts['ts'];
                const v1 = parts['v1'];
                const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
                const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

                let signatureValid = false;
                if (ts && v1) {
                    const expectedBuffer = Buffer.from(expected, 'hex');
                    const providedBuffer = Buffer.from(v1, 'hex');
                    if (expectedBuffer.length === providedBuffer.length) {
                        signatureValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
                    }
                }

                if (!ts || !v1 || !signatureValid) {
                    logger.warn('Webhook rechazado: firma inválida');
                    return res.sendStatus(401);
                }
            }

            // Fetch the payment from MercadoPago to confirm its real status
            const payment = await new Payment(client).get({ id: paymentId });
            const orderId = payment.external_reference;

            if (!orderId) {
                return res.sendStatus(200);
            }

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.sendStatus(200);
            }

            // Idempotency: ignore an already-verified approved payment
            if (order.payment_status === 'verified' && payment.status === 'approved') {
                return res.sendStatus(200);
            }

            if (payment.status === 'approved') {
                order.payment_status = 'verified';
                order.payment_verified_at = new Date();
                order.payment_verified_by = 'mercadopago';
                if (order.status === 'pending' || order.status === 'pending_approval') {
                    order.status = 'processed';
                }
            } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                order.payment_status = 'rejected';
            } else {
                order.payment_status = 'pending';
            }

            await order.save();

            res.sendStatus(200);
        } catch (error) {
            logger.error('Webhook error:', error);
            res.sendStatus(500);
        }
    }
};
