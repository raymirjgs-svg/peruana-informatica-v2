import { Setting } from '../models/Setting';
import { isMercadoPagoEnabled } from './MercadoPagoService';

export interface PublicPaymentMethods {
    methods: string[];
    details: {
        mercadopago?: { enabled: boolean };
    };
}

const readSetting = async (key: string): Promise<string> => {
    try {
        const row = await Setting.findByPk(key);
        return row?.value || '';
    } catch {
        return '';
    }
};

/**
 * Metodos de pago habilitados.
 * Todo el cobro pasa por Mercado Pago: el metodo solo se ofrece si hay
 * un access token valido configurado.
 */
export const getEnabledPaymentMethods = async (): Promise<string[]> => {
    const mpEnabled = await isMercadoPagoEnabled();
    return mpEnabled ? ['mercadopago'] : [];
};

/**
 * Datos publicos de los metodos habilitados.
 * Nunca se exponen datos que no correspondan a un metodo habilitado, para no
 * publicar cuentas vacias o informacion obsoleta.
 */
export const getPublicPaymentMethods = async (): Promise<PublicPaymentMethods> => {
    const methods = await getEnabledPaymentMethods();
    const details: PublicPaymentMethods['details'] = {};

    if (methods.includes('mercadopago')) {
        details.mercadopago = { enabled: await isMercadoPagoEnabled() };
    }

    return { methods, details };
};
