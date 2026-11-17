import { Setting } from '../models/Setting';
import { isMercadoPagoEnabled } from './MercadoPagoService';

export interface PublicPaymentMethods {
    methods: string[];
    details: {
        transferencia?: {
            holder?: string;
            bcp_account?: string;
            bcp_cci?: string;
            ibk_account?: string;
            ibk_cci?: string;
        };
        yape?: { phone?: string };
        plin?: { phone?: string };
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
 * Metodos de pago habilitados por el administrador.
 * La lista se define en Admin > Ajustes > Pago (payment_methods_enabled).
 */
export const getEnabledPaymentMethods = async (): Promise<string[]> => {
    const raw = await readSetting('payment_methods_enabled');
    const methods = raw
        .split(',')
        .map((method) => method.trim())
        .filter(Boolean);

    // Mercado Pago solo se ofrece si hay token configurado.
    return methods.filter((method) => (method === 'mercadopago' ? isMercadoPagoEnabled() : true));
};

/**
 * Datos publicos de los metodos habilitados.
 * Nunca se exponen datos que no correspondan a un metodo habilitado, para no
 * publicar cuentas vacias o informacion obsoleta.
 */
export const getPublicPaymentMethods = async (): Promise<PublicPaymentMethods> => {
    const methods = await getEnabledPaymentMethods();
    const details: PublicPaymentMethods['details'] = {};

    if (methods.includes('transferencia')) {
        const [holder, bcpAccount, bcpCci, ibkAccount, ibkCci] = await Promise.all([
            readSetting('payment_holder'),
            readSetting('payment_bcp_account'),
            readSetting('payment_bcp_cci'),
            readSetting('payment_ibk_account'),
            readSetting('payment_ibk_cci'),
        ]);

        details.transferencia = {
            ...(holder ? { holder } : {}),
            ...(bcpAccount ? { bcp_account: bcpAccount } : {}),
            ...(bcpCci ? { bcp_cci: bcpCci } : {}),
            ...(ibkAccount ? { ibk_account: ibkAccount } : {}),
            ...(ibkCci ? { ibk_cci: ibkCci } : {}),
        };
    }

    if (methods.includes('yape')) {
        const phone = await readSetting('payment_yape_phone');
        if (phone) details.yape = { phone };
    }

    if (methods.includes('plin')) {
        const phone = await readSetting('payment_plin_phone');
        if (phone) details.plin = { phone };
    }

    if (methods.includes('mercadopago')) {
        details.mercadopago = { enabled: isMercadoPagoEnabled() };
    }

    return { methods, details };
};
