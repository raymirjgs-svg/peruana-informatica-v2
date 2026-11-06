import { Request, Response } from 'express';
import { CompanySettings } from '../../models/CompanySettings';

// Obtener configuración de la empresa
export const getCompanySettings = async (req: Request, res: Response) => {
    try {
        // Siempre devolver el primer registro (solo debe haber uno)
        let settings = await CompanySettings.findByPk(1);

        // Si no existe, crear uno por defecto
        if (!settings) {
            settings = await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: 'Av. Principal 123, Lima - Perú',
                company_phone: '(01) 123-4567',
                company_email: 'ventas@peruanainformatica.com',
                store_address: 'Av. Principal 123, Lima - Perú',
                store_hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM',
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error getting company settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración de empresa' });
    }
};

// Actualizar configuración de la empresa
export const updateCompanySettings = async (req: Request, res: Response) => {
    try {
        const {
            company_name,
            company_ruc,
            company_address,
            company_phone,
            company_email,
            company_whatsapp,
            company_website,
            store_address,
            store_hours,
            facebook_url,
            instagram_url,
            twitter_url,
            linkedin_url,
            logo_url,
            favicon_url,
            show_distributor_price_in_detail,
        } = req.body;

        // Buscar o crear el registro de configuración
        let settings = await CompanySettings.findByPk(1);

        if (!settings) {
            // Crear si no existe
            settings = await CompanySettings.create({
                id: 1,
                company_name: company_name || 'Peruana Informática',
                company_ruc: company_ruc || '20123456789',
                company_address: company_address || 'Av. Principal 123, Lima - Perú',
                company_phone: company_phone || '(01) 123-4567',
                company_email: company_email || 'ventas@peruanainformatica.com',
                company_whatsapp,
                company_website,
                store_address,
                store_hours,
                facebook_url,
                instagram_url,
                twitter_url,
                linkedin_url,
                logo_url,
                favicon_url,
                show_distributor_price_in_detail: show_distributor_price_in_detail !== undefined ? show_distributor_price_in_detail : false,
            } as any);
        } else {
            // Actualizar si existe
            await settings.update({
                company_name,
                company_ruc,
                company_address,
                company_phone,
                company_email,
                company_whatsapp,
                company_website,
                store_address,
                store_hours,
                facebook_url,
                instagram_url,
                twitter_url,
                linkedin_url,

                // Si se envía undefined/null no actualizar, si se envía string actualizar
                ...(logo_url !== undefined && { logo_url }),
                ...(favicon_url !== undefined && { favicon_url }),

                show_distributor_price_in_detail: show_distributor_price_in_detail !== undefined ? show_distributor_price_in_detail : settings.show_distributor_price_in_detail,
            } as any);
        }

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            settings,
        });
    } catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración de empresa' });
    }
};

// Subir Logo
export const uploadLogo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }

        const relativePath = `/uploads/settings/${req.file.filename}`;

        let settings = await CompanySettings.findByPk(1);
        if (settings) {
            await settings.update({ logo_url: relativePath });
        } else {
            // Create minimal settings
            await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: '-',
                company_phone: '-',
                company_email: '-',
                logo_url: relativePath
            } as any);
        }

        res.json({ success: true, url: relativePath });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ error: 'Error al subir logo' });
    }
};

// Subir Favicon
export const uploadFavicon = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }

        const relativePath = `/uploads/settings/${req.file.filename}`;

        let settings = await CompanySettings.findByPk(1);
        if (settings) {
            // @ts-ignore
            await settings.update({ favicon_url: relativePath });
        } else {
            await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: '-',
                company_phone: '-',
                company_email: '-',
                // @ts-ignore
                favicon_url: relativePath
            } as any);
        }

        res.json({ success: true, url: relativePath });
    } catch (error) {
        console.error('Error uploading favicon:', error);
        res.status(500).json({ error: 'Error al subir favicon' });
    }
};

// Obtener configuración pública (para frontend sin autenticación)
export const getPublicCompanySettings = async (req: Request, res: Response) => {
    try {
        let settings = await CompanySettings.findByPk(1);

        if (!settings) {
            settings = await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: 'Av. Principal 123, Lima - Perú',
                company_phone: '(01) 123-4567',
                company_email: 'ventas@peruanainformatica.com',
                store_address: 'Av. Principal 123, Lima - Perú',
                store_hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM',
            });
        }

        // Devolver solo datos públicos (excluir datos sensibles si los hubiera)
        // Usar any para acceder a favicon_url si TS se queja
        const s = settings as any;
        res.json({
            company_name: s.company_name,
            company_ruc: s.company_ruc,
            company_address: s.company_address,
            company_phone: s.company_phone,
            company_email: s.company_email,
            company_whatsapp: s.company_whatsapp,
            company_website: s.company_website,
            store_address: s.store_address,
            store_hours: s.store_hours,
            facebook_url: s.facebook_url,
            instagram_url: s.instagram_url,
            twitter_url: s.twitter_url,
            linkedin_url: s.linkedin_url,
            logo_url: s.logo_url,
            favicon_url: s.favicon_url,
            show_distributor_price_in_detail: s.show_distributor_price_in_detail,
        });
    } catch (error) {
        console.error('Error getting public company settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración de empresa' });
    }
};
