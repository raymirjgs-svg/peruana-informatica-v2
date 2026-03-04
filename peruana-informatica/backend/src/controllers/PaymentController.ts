import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { Product } from '../models/Product';
import { sequelize } from '../database/connection';
import { User } from '../models/User';

// Initialize MP
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN'
});

export const paymentController = {
    // Upload Payment Proof
    async uploadProof(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const { payment_method, invoice_type } = req.body;
            const file = req.file;

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Update payment details
            order.payment_method = payment_method;
            order.invoice_type = invoice_type;
            
            // Payment Proof (if uploaded)
            if (file) {
                order.payment_proof = `/uploads/${file.filename}`;
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
            console.error('Error uploading proof:', error);
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
            const preferenceItems = [];

            for (const item of cartItems) {
                // @ts-ignore
                const product = item.product;
                const price = Number(product.priceWeb) > 0 ? Number(product.priceWeb) : Number(product.price);

                totalAmount += price * item.quantity;

                preferenceItems.push({
                    id: String(product.id),
                    title: product.name,
                    unit_price: price,
                    quantity: item.quantity,
                    currency_id: 'PEN'
                });
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
            const preference = new Preference(client);
            const result = await preference.create({
                body: {
                    items: preferenceItems,
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
            console.error('Create preference error:', error);
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
            console.error('Create preference from order error:', error);
            res.status(500).json({ error: 'Error al crear preferencia' });
        }
    },

    // Culqi Charge — recibe token de Culqi.js y cobra al instante
    async culqiCharge(req: Request, res: Response) {
        try {
            const { orderId, culqiToken, email, invoiceType, ruc, business_name, tax_address } = req.body;

            if (!orderId || !culqiToken || !email) {
                return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos' });
            }

            const secretKey = process.env.CULQI_SECRET_KEY;
            if (!secretKey) {
                console.error('CULQI_SECRET_KEY no configurada');
                return res.status(500).json({ success: false, error: 'Pasarela de pago no configurada' });
            }

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
            }

            // Monto en céntimos (PEN)
            const amountCentimos = Math.round(Number(order.total_amount) * 100);

            const culqiResponse = await fetch('https://api.culqi.com/v2/charges', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amountCentimos,
                    currency_code: 'PEN',
                    email: email,
                    source_id: culqiToken,
                    description: `Pedido #${orderId} - Peruana Informática`,
                    capture: true,
                    metadata: { order_id: String(orderId) }
                })
            });

            const culqiData = await culqiResponse.json() as any;

            if (!culqiResponse.ok || culqiData.object === 'error') {
                const userMessage = culqiData.user_message || culqiData.merchant_message || 'El cargo fue rechazado';
                return res.status(402).json({ success: false, error: userMessage });
            }

            // Cobro exitoso — actualizar orden
            order.payment_method = 'tarjeta';
            order.payment_status = 'verified';
            order.payment_verified_at = new Date();
            order.status = 'processed';
            order.culqi_charge_id = culqiData.id;
            order.card_last_four = culqiData.source?.last_four || culqiData.source?.card_number?.slice(-4);
            order.card_type = culqiData.source?.brand?.toLowerCase() || undefined;
            order.invoice_type = invoiceType || 'boleta';

            if (invoiceType === 'factura') {
                order.ruc = ruc;
                order.business_name = business_name;
                order.tax_address = tax_address;
            }

            await order.save();

            return res.json({ success: true, chargeId: culqiData.id, message: 'Pago procesado exitosamente' });

        } catch (error) {
            console.error('Error en cargo Culqi:', error);
            return res.status(500).json({ success: false, error: 'Error al procesar el pago' });
        }
    },

    // Webhook
    async receiveWebhook(req: Request, res: Response) {
        try {
            const { query } = req;
            const topic = query.topic || query.type;
            const paymentId = query.id || query['data.id'];

            if (topic === 'payment') {
                // Check status with MP (optional but recommended verification)
                // const payment = await new Payment(client).get({ id: paymentId });
                // For now, simpler implementation:
                // Find order by external_reference if passed in webhook, usually we need to query MP

                // Logic to update order status would go here
                console.log('Webhook received for payment:', paymentId);
            }

            res.sendStatus(200);
        } catch (error) {
            console.error('Webhook error:', error);
            res.sendStatus(500);
        }
    }
};
