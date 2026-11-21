import { Request, Response } from 'express';
import { Setting } from '../../models/Setting';
import { clearMercadoPagoTokenCache } from '../../services/MercadoPagoService';

// Claves secretas: se devuelven enmascaradas al panel.
const SECRET_KEYS = ['mp_access_token'];

/**
 * Claves que el panel puede guardar. Todo lo demas se rechaza para que un
 * typo no cree ajustes basura en la tabla `settings`.
 */
const ALLOWED_KEYS = [
    'announcement_bar_color',
    'announcement_bar_enabled',
    'announcement_bar_link',
    'announcement_bar_text',
    'checkout_mode',
    'cotizador_price_type',
    'home_section_brands',
    'home_section_categories',
    'home_section_clearance',
    'home_section_featured',
    'home_section_new',
    'mp_access_token',
    'primary_color',
    'return_policy_lines',
    'secondary_color',
    'shipping_express_badge',
    'shipping_express_subtitle',
    'shipping_express_title',
    'shipping_standard_badge',
    'shipping_standard_subtitle',
    'shipping_standard_title',
];

const maskSecret = (value: string): string => {
    if (!value || value.length < 8) return '';
    return `••••••••${value.slice(-4)}`;
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await Setting.findAll();
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = SECRET_KEYS.includes(s.key) ? maskSecret(s.value) : s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching settings' });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const key = String(req.params.key || '');
        const value = req.body?.value === undefined ? '' : String(req.body.value);

        if (!key) {
            return res.status(400).json({ error: 'Falta el nombre de la configuracion' });
        }

        if (!ALLOWED_KEYS.includes(key)) {
            return res.status(400).json({ error: `Configuracion desconocida: ${key}` });
        }

        // Si el valor llega enmascarado, el admin no lo modifico: se conserva
        // el valor real guardado.
        if (SECRET_KEYS.includes(key) && value.startsWith('••••')) {
            return res.json({ success: true, unchanged: true });
        }

        let setting = await Setting.findByPk(key);
        if (setting) {
            setting.value = value;
            await setting.save();
        } else {
            await Setting.create({ key, value });
        }

        if (key === 'mp_access_token') {
            clearMercadoPagoTokenCache();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error updating setting' });
    }
};

export const getCheckoutMode = async (req: Request, res: Response) => {
    try {
        const setting = await Setting.findByPk('checkout_mode');
        res.json({ mode: setting?.value || 'direct' });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching checkout mode' });
    }
};
