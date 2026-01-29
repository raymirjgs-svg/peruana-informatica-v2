import { sequelize } from '../database/connection';
import { CompanySettings } from '../models/CompanySettings';
import { PromoBanner } from '../models/PromoBanner';
import { Setting } from '../models/Setting';
import { Page } from '../models/Page';
import { Review } from '../models/Review';

async function fix() {
    try {
        console.log('🔧 Fixing database tables...');
        await CompanySettings.sync({ alter: true });
        console.log('✅ CompanySettings synced');

        await PromoBanner.sync({ alter: true });
        console.log('✅ PromoBanner synced');

        await Setting.sync({ alter: true });
        console.log('✅ Setting synced');

        await Page.sync({ alter: true });
        console.log('✅ Page synced');

        await Review.sync({ alter: true });
        console.log('✅ Review synced');

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
            console.log('✅ Default settings created');
        }

        console.log('🎉 Fix completed');
    } catch (error) {
        console.error('❌ Error fixing DB:', error);
    } finally {
        await sequelize.close();
    }
}

fix();
