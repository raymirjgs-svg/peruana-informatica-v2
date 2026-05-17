import { Request, Response } from 'express';
import { Setting } from '../../models/Setting';

// Keys that hold secret values — never returned in full to the frontend
const SECRET_KEYS = ['culqi_secret_key', 'niubiz_secret_key', 'mp_access_token'];

function maskSecret(value: string): string {
    if (!value || value.length < 8) return '••••••••';
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
                'payment_culqi_enabled',
                'culqi_public_key',
                'culqi_secret_key',
                'payment_niubiz_enabled',
                'niubiz_merchant_id',
                'niubiz_secret_key',
                'payment_transfer_enabled',
                'payment_cod_enabled',
                'payment_mode', // 'test' | 'live'
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
                'payment_culqi_enabled',
                'culqi_public_key',
                'culqi_secret_key',
                'payment_niubiz_enabled',
                'niubiz_merchant_id',
                'niubiz_secret_key',
                'payment_transfer_enabled',
                'payment_cod_enabled',
                'payment_mode',
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

            res.json({ success: true, message: 'Configuración guardada correctamente' });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    async testCulqi(req: Request, res: Response) {
        try {
            const secretKey = (await getSetting('culqi_secret_key')) || process.env.CULQI_SECRET_KEY;
            if (!secretKey) {
                return res.status(400).json({ success: false, error: 'Clave secreta de Culqi no configurada' });
            }

            // Culqi doesn't have a dedicated "ping" endpoint, so we hit the tokens list
            // A 401 means wrong key, 200 means valid
            const resp = await fetch('https://api.culqi.com/v2/tokens?limit=1', {
                headers: { Authorization: `Bearer ${secretKey}` }
            });

            if (resp.status === 200 || resp.status === 204) {
                return res.json({ success: true, message: 'Conexión con Culqi exitosa ✓' });
            }
            if (resp.status === 401) {
                return res.status(400).json({ success: false, error: 'Clave secreta inválida (401 Unauthorized)' });
            }
            return res.json({ success: true, message: `Culqi respondió con estado ${resp.status}` });
        } catch (err: any) {
            res.status(500).json({ success: false, error: `Error de conexión: ${err.message}` });
        }
    },
};
