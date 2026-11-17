import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Order } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { Setting } from '../models/Setting';

/**
 * Integracion con Mercado Pago.
 *
 * El token se puede administrar desde el panel (Admin > Ajustes > Pago) y
 * tiene prioridad sobre la variable de entorno. Nunca se expone al cliente.
 * El codigo de seguimiento funciona como credencial: el backend resuelve el
 * pedido internamente y nunca expone el id numerico.
 */

let cachedToken: string | null = null;
let cachedTokenCheckedAt = 0;
const TOKEN_CACHE_MS = 60 * 1000;

const readTokenFromSettings = async (): Promise<string> => {
    try {
        const row = await Setting.findByPk('mp_access_token');
        return row?.value?.trim() || '';
    } catch {
        return '';
    }
};

/** Token vigente: primero el panel de administracion, luego el entorno. */
export const getMercadoPagoToken = async (): Promise<string> => {
    const now = Date.now();
    if (cachedToken && now - cachedTokenCheckedAt < TOKEN_CACHE_MS) {
        return cachedToken;
    }

    const fromSettings = await readTokenFromSettings();
    const token = fromSettings || (process.env.MP_ACCESS_TOKEN || '').trim();

    cachedToken = token;
    cachedTokenCheckedAt = now;
    return token;
};

/** Limpia la cache del token (tras guardarlo desde el panel). */
export const clearMercadoPagoTokenCache = (): void => {
    cachedToken = null;
    cachedTokenCheckedAt = 0;
};

const buildClient = (token: string): MercadoPagoConfig =>
    new MercadoPagoConfig({ accessToken: token || 'TEST-TOKEN' });

const getClient = async (): Promise<MercadoPagoConfig> =>
    buildClient(await getMercadoPagoToken());

export const isMercadoPagoEnabled = async (): Promise<boolean> => {
    const token = await getMercadoPagoToken();
    return Boolean(token && token !== 'TEST-TOKEN');
};

export interface MercadoPagoStatus {
    configured: boolean;
    authorized: boolean;
    site_id?: string;
    message: string;
}

/**
 * Verifica si el token configurado es aceptado por Mercado Pago.
 * Se usa en el panel de administracion para saber si el cobro funcionara.
 */
export const checkMercadoPagoStatus = async (): Promise<MercadoPagoStatus> => {
    const token = await getMercadoPagoToken();

    if (!token || token === 'TEST-TOKEN') {
        return {
            configured: false,
            authorized: false,
            message: 'No hay un Access Token de Mercado Pago configurado.',
        };
    }

    try {
        const response = await fetch('https://api.mercadopago.com/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
            const data: any = await response.json().catch(() => ({}));
            const siteId = data?.site_id || '';
            return {
                configured: true,
                authorized: true,
                site_id: siteId,
                message: siteId === 'TEST'
                    ? 'Credenciales de prueba activas: los pagos no son reales.'
                    : 'Credenciales de produccion activas.',
            };
        }

        return {
            configured: true,
            authorized: false,
            message:
                response.status === 403
                    ? 'Mercado Pago rechazo el token (403). Genera un Access Token nuevo en Mercado Pago > Developers > Credenciales.'
                    : `Mercado Pago respondio con estado ${response.status}.`,
        };
    } catch (error: any) {
        return {
            configured: true,
            authorized: false,
            message: `No se pudo conectar con Mercado Pago: ${error?.message || 'error de red'}`,
        };
    }
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/** Base publica del backend (para el webhook de Mercado Pago). */
export const getBackendPublicUrl = (): string =>
    stripTrailingSlash(process.env.BACKEND_PUBLIC_URL || process.env.FRONTEND_URL || '');

/** Base publica del frontend (para las back_urls de Mercado Pago). */
export const getFrontendPublicUrl = (): string =>
    stripTrailingSlash(process.env.FRONTEND_URL || process.env.BACKEND_PUBLIC_URL || '');

export interface OrderPreferenceResult {
    preferenceId: string;
    init_point: string;
    sandbox_init_point?: string;
}

interface PreferenceItemRow {
    product_id: number;
    product_name: string;
    price: number | string;
    quantity: number;
}

/**
 * Crea la preferencia de pago de un pedido ya aprobado.
 * `trackingCode` se usa para construir la URL de retorno: el cliente vuelve
 * a la pagina de seguimiento (no a una URL numerica).
 */
export const createOrderPreference = async (
    order: Order,
    trackingCode?: string | null
): Promise<OrderPreferenceResult> => {
    if (!(await isMercadoPagoEnabled())) {
        throw new Error('MERCADO_PAGO_NOT_ENABLED');
    }

    const orderItems = (await OrderItem.findAll({
        where: { order_id: order.id },
    })) as unknown as PreferenceItemRow[];

    if (!orderItems.length) {
        throw new Error('ORDER_WITHOUT_ITEMS');
    }

    const items = orderItems.map((item) => ({
        id: String(item.product_id),
        title: item.product_name,
        unit_price: Number(item.price),
        quantity: item.quantity,
        currency_id: 'PEN',
    }));

    const frontend = getFrontendPublicUrl();
    const backend = getBackendPublicUrl();
    const code = trackingCode || order.tracking_code || '';
    const returnBase = code ? `${frontend}/seguimiento/${code}` : `${frontend}/checkout/success`;

    const customerName = (order.customer_name || 'Cliente').trim();
    const nameParts = customerName.split(' ');

    const body: Record<string, unknown> = {
        items,
        payer: {
            email: order.customer_email || 'cliente@peruanainformatica.com.pe',
            name: nameParts[0] || 'Cliente',
            surname: nameParts.slice(1).join(' '),
        },
        external_reference: String(order.id),
        back_urls: {
            success: `${returnBase}?pago=aprobado`,
            failure: `${returnBase}?pago=rechazado`,
            pending: `${returnBase}?pago=pendiente`,
        },
        auto_return: 'approved',
    };

    // Webhook: el panel de Mercado Pago tambien tiene una URL de notificacion,
    // pero se envia aqui para que el pedido se actualice aunque no se configure.
    if (backend) {
        body.notification_url = `${backend}/api/payments/webhook`;
    }

    const preference = new Preference(await getClient());
    const result = await preference.create({ body: body as any });

    if (!result.init_point) {
        throw new Error('MERCADO_PAGO_NO_INIT_POINT');
    }

    return {
        preferenceId: result.id || '',
        init_point: result.init_point,
        sandbox_init_point: result.sandbox_init_point,
    };
};

/**
 * Sincroniza el estado del pago de Mercado Pago con el pedido.
 * Se usa como respaldo del webhook (el cliente tambien puede volver por
 * `?pago=aprobado` y disparar la sincronizacion).
 */
export const syncMercadoPagoStatus = async (order: Order): Promise<void> => {
    if (!(await isMercadoPagoEnabled()) || !order?.id) return;
    if (order.payment_status === 'verified' && order.payment_method === 'mercadopago') return;

    try {
        const search: any = await new Payment(await getClient()).search({
            options: {
                external_reference: String(order.id),
                limit: 1,
                sort: 'date_created',
                criteria: 'desc',
            },
        } as any);

        const payments: any[] = search?.results || [];
        const payment = payments[0];
        if (!payment) return;

        const status = String(payment.status || '').toLowerCase();
        if (!status) return;

        order.payment_method = 'mercadopago';

        if (status === 'approved') {
            order.payment_status = 'verified';
            order.status = 'processed';
            order.payment_verified_at = new Date();
        } else if (status === 'rejected' || status === 'cancelled' || status === 'charged_back') {
            order.payment_status = 'rejected';
        } else {
            // in_process / pending / authorized: el pago sigue en curso
            order.payment_status = 'pending';
        }

        await order.save();
    } catch (error) {
        console.error('Error al sincronizar estado de Mercado Pago:', error);
    }
};

/**
 * Procesa una notificacion de Mercado Pago y actualiza el pedido.
 * Devuelve el id del pedido actualizado (o null).
 */
export const handleMercadoPagoNotification = async (paymentId: string): Promise<number | null> => {
    if (!(await isMercadoPagoEnabled()) || !paymentId) return null;

    try {
        const payment: any = await new Payment(await getClient()).get({ id: String(paymentId) });
        const orderId = payment?.external_reference;
        if (!orderId) return null;

        const order = await Order.findByPk(orderId);
        if (!order) return null;

        const status = String(payment.status || '').toLowerCase();
        order.payment_method = 'mercadopago';

        if (status === 'approved') {
            order.payment_status = 'verified';
            order.status = 'processed';
            order.payment_verified_at = new Date();
        } else if (status === 'rejected' || status === 'cancelled' || status === 'charged_back') {
            order.payment_status = 'rejected';
        } else {
            order.payment_status = 'pending';
        }

        await order.save();
        return order.id;
    } catch (error) {
        console.error('Error procesando notificacion de Mercado Pago:', error);
        return null;
    }
};
