import { Request, Response } from 'express';
import { Setting } from '../../models/Setting';
import { checkMercadoPagoStatus, clearMercadoPagoTokenCache } from '../../services/MercadoPagoService';

// Keys that hold secret values — never returned in full to the frontend
const SECRET_KEYS = ['mp_access_token'];

function maskSecret(value: string): string {
    if (!value || value.length < 8) return '';
    return `••••••••${value.slice(-4)}`;
}

async function getSetting(key: string): Promise<string> {
    const row = await Setting.findByPk(key);
    return row?.value ?? '';
}

async function setSetting(key: string, value: string): Promise<void> {
    const existing = await Setting.findByPk(key);
    if (existing) {
        existing.value = value;
        await existing.save();
    } else {
        await Setting.create({ key, value });
    }
}

export const PaymentSettingsController = {
    async getSettings(req: Request, res: Response) {
        try {
            const keys = [
                'payment_mode', // 'test' | 'live'
                'mp_access_token',
            ];

            const raw: Record<string, string> = {};
            await Promise.all(keys.map(async k => { raw[k] = await getSetting(k); }));

            // Mask secrets before sending to frontend
            const response: Record<string, string> = { ...raw };
            for (const k of SECRET_KEYS) {
                if (response[k]) response[k] = maskSecret(response[k]);
            }

            res.json({ success: true, data: response });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async saveSettings(req: Request, res: Response) {
        try {
            const allowed = [
                'payment_mode',
                'mp_access_token',
            ];

            const updates: Record<string, string> = {};
            for (const key of allowed) {
                if (key in req.body) {
                    const val: string = String(req.body[key] ?? '').trim();

                    // Ignore masked values — user didn't change the secret
                    if (SECRET_KEYS.includes(key) && val.startsWith('••••')) continue;

                    updates[key] = val;
                }
            }

            await Promise.all(Object.entries(updates).map(([k, v]) => setSetting(k, v)));

            // El token de Mercado Pago se cachea: se invalida para que el
            // nuevo valor entre en vigor de inmediato.
            clearMercadoPagoTokenCache();

            res.json({ success: true, message: 'Configuración guardada correctamente' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async testMercadoPago(req: Request, res: Response) {
        try {
            const status = await checkMercadoPagoStatus();

            if (!status.configured || !status.authorized) {
                return res.status(400).json({ success: false, error: status.message });
            }

            return res.json({ success: true, message: status.message, data: status });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: `Error de conexión: ${err.message}` });
        }
    },
};
