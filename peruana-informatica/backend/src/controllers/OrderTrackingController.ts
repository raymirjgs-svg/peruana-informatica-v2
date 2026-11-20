import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { normalizeTrackingCode } from '../utils/trackingCode';
import { resolveInvoicePath } from '../utils/invoicePaths';
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
 * Directorio de los comprobantes (boletas/facturas en PDF) cargados por el
 * administrador. Vive dentro del volumen persistente `uploads_data`.
 */

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
    // Solo un booleano: el cliente ve que su comprobante esta listo, pero el
    // PDF se descarga con el codigo de seguimiento (que es la credencial).
    invoice_available: Boolean(order.invoice_file && fs.existsSync(resolveInvoicePath(order.invoice_file) || '')),
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
 * Descarga la boleta/factura del pedido. El codigo de seguimiento es la
 * credencial, igual que para consultar el pedido.
 */
export const downloadInvoiceByTrackingCode = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const order = await findOrderByCode(req.params.code || '');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No encontramos un pedido con ese código de seguimiento.',
            });
        }

        const filepath = resolveInvoicePath(order.invoice_file);
        if (!filepath || !fs.existsSync(filepath)) {
            return res.status(404).json({
                success: false,
                message: 'Tu comprobante todavía no está disponible. Te lo enviaremos por WhatsApp cuando esté listo.',
            });
        }

        const tipo = order.invoice_type === 'factura' ? 'Factura' : 'Boleta';
        const numero = order.invoice_number ? `-${order.invoice_number}` : '';
        res.download(filepath, `${tipo}${numero}.pdf`);
        return;
    } catch (error) {
        console.error('Error al descargar el comprobante por código de tracking:', error);
        return res.status(500).json({
            success: false,
            message: 'No pudimos descargar tu comprobante en este momento.',
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

        if (!(await isMercadoPagoEnabled())) {
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

        let preference;
        try {
            preference = await createOrderPreference(order, order.tracking_code);
        } catch (error: any) {
            const message = String(error?.message || '');
            if (message.includes('MERCADO_PAGO_NOT_ENABLED')) {
                return res.status(503).json({
                    success: false,
                    message: 'El pago en línea no está disponible en este momento. Contáctanos para coordinar tu pago.',
                });
            }
            console.error('Mercado Pago rechazo la preferencia:', error?.message || error);
            return res.status(503).json({
                success: false,
                message: 'No pudimos conectar con la pasarela de pago. Escríbenos por WhatsApp para coordinar tu pago.',
            });
        }

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
