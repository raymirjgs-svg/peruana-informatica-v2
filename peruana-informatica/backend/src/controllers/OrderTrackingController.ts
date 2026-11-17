import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { normalizeTrackingCode } from '../utils/trackingCode';
import {
    createOrderPreference,
    isMercadoPagoEnabled,
    syncMercadoPagoStatus,
} from '../services/MercadoPagoService';
import { getPublicPaymentMethods } from '../services/PaymentSettingsService';

interface TrackingItem {
    product_name: string;
    quantity: number;
}

const APPROVED_STATUSES = ['processed', 'approved'];

/**
 * Un pedido puede pagarse cuando fue aprobado por el administrador y todavia
 * no tiene un pago verificado.
 */
const canPayForOrder = (order: Order): boolean => {
    if (!APPROVED_STATUSES.includes(order.status)) return false;
    if (order.payment_status === 'verified') return false;
    if (order.payment_proof) return false;
    return true;
};

const buildTrackingPayload = (order: Order, items: TrackingItem[]) => ({
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
    can_pay: canPayForOrder(order),
});

const findOrderByCode = async (rawCode: string): Promise<Order | null> => {
    const trackingCode = normalizeTrackingCode(rawCode);
    if (!trackingCode) return null;

    return Order.findOne({
        where: { tracking_code: trackingCode },
        include: [{ model: OrderItem, as: 'items' }],
    });
};

export const getOrderByTrackingCode = async (req: Request, res: Response): Promise<Response> => {
    try {
        const order = await findOrderByCode(req.params.code || '');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        // Si el pago se hizo con Mercado Pago, se sincroniza el estado real
        // (respaldo del webhook, para que el cliente vea el pago al volver).
        if (order.payment_method === 'mercadopago' && order.payment_status !== 'verified') {
            await syncMercadoPagoStatus(order);
        }

        const items = ((order as any).items || []) as TrackingItem[];
        const paymentMethods = await getPublicPaymentMethods();

        return res.json({
            success: true,
            data: {
                ...buildTrackingPayload(order, items),
                payment_methods: paymentMethods.methods,
                payment_details: paymentMethods.details,
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

/**
 * Crea la preferencia de Mercado Pago de un pedido aprobado.
 * El codigo de seguimiento es la credencial: el id interno nunca se expone.
 */
export const createPaymentPreferenceByTrackingCode = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const order = await findOrderByCode(req.params.code || '');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        if (!isMercadoPagoEnabled()) {
            return res.status(503).json({
                success: false,
                message: 'El pago en línea no está disponible en este momento. Contáctanos para coordinar tu pago.',
            });
        }

        if (!canPayForOrder(order)) {
            return res.status(409).json({
                success: false,
                message: 'Este pedido no está habilitado para pago en este momento.',
            });
        }

        const preference = await createOrderPreference(order, order.tracking_code);

        return res.json({
            success: true,
            data: {
                init_point: preference.init_point,
                preference_id: preference.preferenceId,
            },
            message: 'Link de pago generado.',
        });
    } catch (error: any) {
        console.error('Error al crear preferencia de pago por código de tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'No pudimos generar el link de pago. Inténtalo en unos minutos.',
        });
    }
};

/**
 * Sincroniza el estado del pago (Mercado Pago) y devuelve el estado actual.
 */
export const syncPaymentStatusByTrackingCode = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const order = await findOrderByCode(req.params.code || '');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        await syncMercadoPagoStatus(order);

        const items = ((order as any).items || []) as TrackingItem[];

        return res.json({
            success: true,
            data: buildTrackingPayload(order, items),
            message: 'Estado actualizado.',
        });
    } catch (error) {
        console.error('Error al sincronizar el estado del pago:', error);
        return res.status(500).json({
            success: false,
            message: 'No pudimos actualizar el estado del pago.',
        });
    }
};

/**
 * Permite al cliente enviar su comprobante de pago usando el codigo de
 * seguimiento (para metodos que no sean Mercado Pago).
 */
export const uploadPaymentProofByTrackingCode = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const order = await findOrderByCode(req.params.code || '');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        if (!canPayForOrder(order)) {
            return res.status(409).json({
                success: false,
                message: 'Este pedido no está habilitado para recibir comprobantes en este momento.',
            });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Adjunta el archivo de tu comprobante de pago.',
            });
        }

        const { payment_method, invoice_type, ruc, business_name, tax_address } = req.body;

        if (payment_method) order.payment_method = payment_method;
        if (invoice_type) order.invoice_type = invoice_type;
        if (invoice_type === 'factura') {
            if (ruc) order.ruc = ruc;
            if (business_name) order.business_name = business_name;
            if (tax_address) order.tax_address = tax_address;
        }

        order.payment_proof = `/payment-proofs/${file.filename}`;
        order.payment_status = 'pending';
        // El pedido sigue aprobado: no se revierte a 'pending'.
        await order.save();

        return res.json({
            success: true,
            message: 'Comprobante recibido. Verificaremos tu pago y te avisaremos.',
        });
    } catch (error) {
        console.error('Error al subir comprobante por código de tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'No pudimos registrar tu comprobante. Inténtalo nuevamente.',
        });
    }
};
