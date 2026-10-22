import { Request, Response } from 'express';
import { CompanySettings } from '../../models/CompanySettings';
import { sequelize } from '../../database/connection';
import { sendError } from '../../middleware/errorHandler';

const DEFAULT_SETTINGS = {
    id: 1,
    company_name: 'Peruana Informática',
    company_ruc: '20123456789',
    company_address: 'Av. Principal 123, Lima - Perú',
    company_phone: '(01) 123-4567',
    company_email: 'ventas@peruanainformatica.com',
    store_address: 'Av. Principal 123, Lima - Perú',
    store_hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM',
};

// Obtener configuración de la empresa
export const getCompanySettings = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        // Siempre devolver el primer registro (solo debe haber uno)
        const [settings] = await CompanySettings.findOrCreate({
            where: { id: 1 },
            defaults: DEFAULT_SETTINGS,
            transaction,
        });

        await transaction.commit();

        res.json(settings);
    } catch (error) {
        await transaction.rollback();
        return sendError(res, error, 'Error al obtener configuración de empresa');
    }
};

// Actualizar configuración de la empresa
export const updateCompanySettings = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
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

        // Buscar o crear el registro de configuración de forma atómica
        const [settings] = await CompanySettings.findOrCreate({
            where: { id: 1 },
            defaults: {
                id: 1,
                company_name: company_name || DEFAULT_SETTINGS.company_name,
                company_ruc: company_ruc || DEFAULT_SETTINGS.company_ruc,
                company_address: company_address || DEFAULT_SETTINGS.company_address,
                company_phone: company_phone || DEFAULT_SETTINGS.company_phone,
                company_email: company_email || DEFAULT_SETTINGS.company_email,
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
            },
            transaction,
        });

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
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            settings,
        });
    } catch (error) {
        await transaction.rollback();
        return sendError(res, error, 'Error al actualizar configuración de empresa');
    }
};

// Obtener configuración pública (para frontend sin autenticación)
export const getPublicCompanySettings = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const [settings] = await CompanySettings.findOrCreate({
            where: { id: 1 },
            defaults: DEFAULT_SETTINGS,
            transaction,
        });

        await transaction.commit();

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
        await transaction.rollback();
        return sendError(res, error, 'Error al obtener configuración de empresa');
    }
};
