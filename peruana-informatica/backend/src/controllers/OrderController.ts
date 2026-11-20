import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../database/connection';
import { EmailService } from '../services/EmailService';

import { Setting } from '../models/Setting';
import { generateTrackingCode } from '../utils/trackingCode';

interface OrderCreationValues {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_document?: string;
    total_amount: number;
    status: string;
    invoice_type: 'boleta' | 'factura';
    ruc?: string | null;
    business_name?: string | null;
    tax_address?: string | null;
    coupon_code?: string | null;
    discount_amount: number;
    idempotency_key?: string | null;
}

/**
 * Clave de idempotencia del cliente: un mismo intento de compra, incluso si
 * se repite por doble clic, produce un unico pedido.
 */
const readIdempotencyKey = (raw: unknown): string | null => {
    const key = String(raw || '').trim();
    if (!key) return null;
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) return null;
    return key;
};

async function createOrderWithTrackingCode(
    values: OrderCreationValues,
    transaction: Transaction
): Promise<Order> {
    for (let attempt = 0; attempt < 8; attempt++) {
        try {
            return await Order.create(
                { ...values, tracking_code: generateTrackingCode() },
                { transaction }
            );
        } catch (error) {
            const isUniqueConflict =
                error instanceof Error && error.name === 'SequelizeUniqueConstraintError';
            if (!isUniqueConflict) throw error;
        }
    }

    throw new Error('No se pudo generar un código de seguimiento único');
}

export const createOrder = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    const idempotencyKey = readIdempotencyKey(req.body.idempotency_key);

    try {
        const { customer_name, customer_email, customer_phone, customer_document, items } = req.body;

        // ── Idempotencia ──────────────────────────────────────────────────
        // Si la clave ya se uso, el pedido ya existe: se devuelve el mismo
        // en vez de crear otro (doble clic o reintento del navegador).
        if (idempotencyKey) {
            const existing = await Order.findOne({ where: { idempotency_key: idempotencyKey } });
            if (existing) {
                await t.rollback();
                return res.status(200).json({
                    success: true,
                    message: 'El pedido ya fue registrado',
                    order_id: existing.id,
                    tracking_code: existing.tracking_code,
                    status: existing.status,
                    duplicate: true,
                });
            }
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // ── Datos de facturación ───────────────────────────────────────────
        // El cliente elige boleta o factura en el checkout. Estos datos se
        // guardan en el pedido porque el vendedor los necesita para registrar
        // la venta en el ERP y emitir el comprobante.
        const invoiceTypeRaw = String(req.body.invoice_type || 'boleta').trim().toLowerCase();
        if (invoiceTypeRaw !== 'boleta' && invoiceTypeRaw !== 'factura') {
            await t.rollback();
            return res.status(400).json({
                error: 'Tipo de comprobante inválido. Elige boleta o factura.',
                code: 'INVALID_INVOICE_TYPE'
            });
        }
        const invoiceType: 'boleta' | 'factura' = invoiceTypeRaw;

        let ruc: string | null = null;
        let businessName: string | null = null;
        let taxAddress: string | null = null;

        if (invoiceType === 'factura') {
            const rucClean = String(req.body.ruc || '').replace(/\D/g, '');
            businessName = String(req.body.business_name || '').trim() || null;
            taxAddress = String(req.body.tax_address || '').trim() || null;

            if (rucClean.length !== 11) {
                await t.rollback();
                return res.status(400).json({
                    error: 'El RUC debe tener 11 dígitos para emitir factura.',
                    code: 'INVALID_RUC'
                });
            }

            if (!businessName) {
                await t.rollback();
                return res.status(400).json({
                    error: 'Ingresa la razón social para emitir factura.',
                    code: 'MISSING_BUSINESS_NAME'
                });
            }

            ruc = rucClean;
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

            const quantity = item.quantity === undefined ? 1 : Number(item.quantity);
            const price = Number(product.price);
            const stock = Number(product.stock || 0);

            // Validaciones de integridad comercial: el precio y el stock se
            // toman SIEMPRE del servidor. Un producto sin precio publicado no
            // se puede comprar en linea (precio a consultar).
            if (!Number.isInteger(quantity) || quantity < 1) {
                await t.rollback();
                return res.status(400).json({
                    error: `Cantidad invalida para el producto "${product.name}".`,
                    code: 'INVALID_QUANTITY'
                });
            }

            if (!Number.isFinite(price) || price <= 0) {
                await t.rollback();
                return res.status(400).json({
                    error: `El producto "${product.name}" no tiene precio publicado. Contactanos por WhatsApp para coordinarlo.`,
                    code: 'PRODUCT_WITHOUT_PRICE'
                });
            }

            if (quantity > stock) {
                await t.rollback();
                return res.status(400).json({
                    error: `No hay stock suficiente de "${product.name}" (disponible: ${stock}).`,
                    code: 'INSUFFICIENT_STOCK'
                });
            }

            totalAmount += price * quantity;

            processedItems.push({
                product_id: product.cod_producto,
                product_name: product.name,
                price: price,
                quantity: quantity
            });
        }

        // ── Cupón ──────────────────────────────────────────────────────────
        // El descuento lo calcula el SERVIDOR (el cliente puede mandar un
        // total falseado). Si el cupón no existe o no es válido, el pedido se
        // rechaza en vez de cobrar una cifra distinta a la que se mostro.
        let couponCode: string | null = null;
        let discountAmount = 0;
        let appliedCoupon: Coupon | null = null;

        const rawCouponCode = String(req.body.coupon_code || '').trim().toUpperCase();
        if (rawCouponCode) {
            const coupon = await Coupon.findOne({
                where: { code: rawCouponCode },
                transaction: t,
            });

            if (!coupon) {
                await t.rollback();
                return res.status(400).json({
                    error: 'El cupón no existe.',
                    code: 'INVALID_COUPON',
                });
            }

            const validation = coupon.isValid(totalAmount);
            if (!validation.valid) {
                await t.rollback();
                return res.status(400).json({
                    error: validation.message || 'El cupón no es válido.',
                    code: 'INVALID_COUPON',
                });
            }

            discountAmount = Math.round(coupon.calculateDiscount(totalAmount) * 100) / 100;
            couponCode = coupon.code;
            appliedCoupon = coupon;
        }

        const finalTotal = Math.max(0, Math.round((totalAmount - discountAmount) * 100) / 100);

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
            total_amount: finalTotal,
            status: initialStatus,
            invoice_type: invoiceType,
            ruc,
            business_name: businessName,
            tax_address: taxAddress,
            coupon_code: couponCode,
            discount_amount: discountAmount,
            idempotency_key: idempotencyKey,
        }, t);

        if (appliedCoupon) {
            await appliedCoupon.increment('current_uses', { transaction: t });
        }

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
            tracking_code: order.tracking_code,
            status: order.status
        });

    } catch (error) {
        await t.rollback();

        // Dos clics simultaneos con la misma clave: el indice unico bloquea
        // el segundo INSERT. Se devuelve el pedido que gano la carrera.
        const isUniqueConflict =
            error instanceof Error && error.name === 'SequelizeUniqueConstraintError';
        if (isUniqueConflict && idempotencyKey) {
            const existing = await Order.findOne({ where: { idempotency_key: idempotencyKey } });
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'El pedido ya fue registrado',
                    order_id: existing.id,
                    tracking_code: existing.tracking_code,
                    status: existing.status,
                    duplicate: true,
                });
            }
        }

        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Error al procesar el pedido' });
    }
};
