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
                show_distributor_price_in_detail: show_distributor_price_in_detail !== undefined ? show_distributor_price_in_detail : false,
            });
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
                logo_url,
                show_distributor_price_in_detail: show_distributor_price_in_detail !== undefined ? show_distributor_price_in_detail : settings.show_distributor_price_in_detail,
            });
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
        res.json({
            company_name: settings.company_name,
            company_address: settings.company_address,
            company_phone: settings.company_phone,
            company_email: settings.company_email,
            company_whatsapp: settings.company_whatsapp,
            company_website: settings.company_website,
            store_address: settings.store_address,
            store_hours: settings.store_hours,
            facebook_url: settings.facebook_url,
            instagram_url: settings.instagram_url,
            twitter_url: settings.twitter_url,
            linkedin_url: settings.linkedin_url,
            logo_url: settings.logo_url,
            show_distributor_price_in_detail: settings.show_distributor_price_in_detail,
        });
    } catch (error) {
        console.error('Error getting public company settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración de empresa' });
    }
};
