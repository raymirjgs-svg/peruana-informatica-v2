import { Request, Response } from 'express';
import { Setting } from '../../models/Setting';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await Setting.findAll();
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
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

        let setting = await Setting.findByPk(key);
        if (setting) {
            setting.value = value;
            await setting.save();
        } else {
            await Setting.create({ key, value });
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
