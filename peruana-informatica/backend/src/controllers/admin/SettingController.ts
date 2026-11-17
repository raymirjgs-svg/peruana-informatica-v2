import { Request, Response } from 'express';
import { Setting } from '../../models/Setting';
import { clearMercadoPagoTokenCache } from '../../services/MercadoPagoService';

// Claves secretas: se devuelven enmascaradas al panel.
const SECRET_KEYS = ['mp_access_token', 'culqi_secret_key', 'niubiz_secret_key'];

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
        const { key } = req.params;
        const { value } = req.body;

        // Si el valor llega enmascarado, el admin no lo modifico: se conserva
        // el valor real guardado.
        if (SECRET_KEYS.includes(key) && String(value).startsWith('••••')) {
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
