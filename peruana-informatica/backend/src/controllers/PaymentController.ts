import { Request, Response } from 'express';
import { handleMercadoPagoNotification } from '../services/MercadoPagoService';

/**
 * Rutas publicas de pago.
 *
 * El flujo real de cobro vive en `/api/orders/track/:code/*`
 * (OrderTrackingController): el codigo de seguimiento es la credencial y el
 * cliente nunca expone su id interno.
 *
 * Aqui solo queda el webhook de Mercado Pago (lo llama la pasarela).
 * Las rutas legacy (`create-preference`, `create-preference-order`,
 * `culqi/charge` y `upload-proof` por id numerico) se eliminaron: no las
 * usaba nadie, la de preferencias era publica y la de comprobantes exponia
 * el id del pedido.
 */
export const paymentController = {
    // Webhook de Mercado Pago
    async receiveWebhook(req: Request, res: Response) {
        try {
            // Mercado Pago envia la notificacion en el BODY (form o json),
            // no en la query string: leer solo req.query hacia que el pago
            // nunca se procesara.
            const payload: any = { ...(req.query as any), ...(req.body as any) };
            const topic = payload.topic || payload.type;
            const action = typeof payload.action === 'string' ? payload.action : '';

            // OJO: `data.id` es el id del PAGO; el `id` de nivel superior es el
            // id de la notificacion. Por eso data.id tiene prioridad.
            let paymentId = payload['data.id'] || payload.data?.id || payload.id;
            if (!paymentId && typeof payload.data === 'string') {
                try {
                    paymentId = JSON.parse(payload.data).id;
                } catch {
                    // data no es JSON: se ignora
                }
            }

            if ((topic === 'payment' || action.startsWith('payment')) && paymentId) {
                const updatedOrderId = await handleMercadoPagoNotification(String(paymentId));
                console.log('Webhook de Mercado Pago procesado:', paymentId, '-> pedido', updatedOrderId);
            }

            res.sendStatus(200);
        } catch (error) {
            console.error('Webhook error:', error);
            res.sendStatus(500);
        }
    }
};
