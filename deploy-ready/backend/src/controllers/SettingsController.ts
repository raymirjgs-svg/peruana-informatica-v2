import { Request, Response } from 'express';
import { Setting } from '../models/Setting';

export const settingsController = {
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
