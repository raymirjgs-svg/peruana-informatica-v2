import { Request, Response } from 'express';
import { Setting } from '../models/Setting';
import { getPublicPaymentMethods } from '../services/PaymentSettingsService';

/**
 * Clave publicas que puede leer el navegador.
 * Cualquier otra clave (secretos de pasarelas, tokens, claves de API) queda
 * fuera: este endpoint es publico.
 */
const PUBLIC_SETTING_KEYS = new Set([
    'checkout_mode',
    'payment_methods_enabled',
    'payment_holder',
    'payment_bcp_account',
    'payment_bcp_cci',
    'payment_ibk_account',
    'payment_ibk_cci',
    'payment_yape_phone',
    'payment_plin_phone',
    'primary_color',
    'secondary_color',
    'return_policy_lines',
    'cotizador_price_type',
]);

const PUBLIC_SETTING_PREFIXES = ['announcement_bar_', 'shipping_', 'home_section_'];

const isPublicSetting = (key: string): boolean =>
    PUBLIC_SETTING_KEYS.has(key) || PUBLIC_SETTING_PREFIXES.some((prefix) => key.startsWith(prefix));

export const settingsController = {
    // GET public settings (solo claves publicas)
    async getAllSettings(req: Request, res: Response) {
        try {
            const settings = await Setting.findAll();
            // Convert to { key: value } object, filtrando claves privadas
            const settingsObj: Record<string, string> = {};
            settings.forEach(setting => {
                if (isPublicSetting(setting.key)) {
                    settingsObj[setting.key] = setting.value;
                }
            });
            res.json(settingsObj);
        } catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({ error: 'Error al obtener configuración' });
        }
    },

    // GET metodos de pago disponibles (publico)
    async getPaymentMethods(req: Request, res: Response) {
        try {
            const paymentMethods = await getPublicPaymentMethods();
            res.json({ success: true, data: paymentMethods });
        } catch (error) {
            console.error('Error getting payment methods:', error);
            res.status(500).json({ error: 'Error al obtener métodos de pago' });
        }
    },

    // GET checkout-mode
    async getCheckoutMode(req: Request, res: Response) {
        try {
            const setting = await Setting.findByPk('checkout_mode');
            // Default to 'direct' if not set
            res.json({ mode: setting?.value || 'direct' });
        } catch (error) {
            console.error('Error getting checkout mode:', error);
            res.status(500).json({ error: 'Error al obtener modo de compra' });
        }
    },

    // PUT checkout-mode
    async updateCheckoutMode(req: Request, res: Response) {
        try {
            const { mode } = req.body;
            if (!['direct', 'approval'].includes(mode)) {
                return res.status(400).json({ error: 'Modo inválido. Debe ser "direct" o "approval"' });
            }

            // Upsert setting
            const [setting, created] = await Setting.upsert({
                key: 'checkout_mode',
                value: mode
            });

            res.json({
                success: true,
                message: `Modo de compra actualizado a: ${mode}`,
                mode: setting.value
            });
        } catch (error) {
            console.error('Error updating checkout mode:', error);
            res.status(500).json({ error: 'Error al actualizar modo de compra' });
        }
    }
};
