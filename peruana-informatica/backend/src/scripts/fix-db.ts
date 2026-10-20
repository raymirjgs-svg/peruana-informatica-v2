import { sequelize } from '../database/connection';
import { CompanySettings } from '../models/CompanySettings';
import { PromoBanner } from '../models/PromoBanner';
import { Setting } from '../models/Setting';
import { Page } from '../models/Page';
import { Review } from '../models/Review';
import { logger } from '../config/logger';

async function fix() {
    try {
        logger.info('🔧 Fixing database tables...');
        await CompanySettings.sync({ alter: true });
        logger.info('✅ CompanySettings synced');

        await PromoBanner.sync({ alter: true });
        logger.info('✅ PromoBanner synced');

        await Setting.sync({ alter: true });
        logger.info('✅ Setting synced');

        await Page.sync({ alter: true });
        logger.info('✅ Page synced');

        await Review.sync({ alter: true });
        logger.info('✅ Review synced');

        // Create default company settings if none exist
        const count = await CompanySettings.count();
        if (count === 0) {
            await CompanySettings.create({
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: 'Av. Principal 123, Lima - Perú',
                company_phone: '(01) 123-4567',
                company_email: 'ventas@peruanainformatica.com'
            });
            logger.info('✅ Default settings created');
        }

        logger.info('🎉 Fix completed');
    } catch (error) {
        logger.error('❌ Error fixing DB:', error);
    } finally {
        await sequelize.close();
    }
}

fix();
