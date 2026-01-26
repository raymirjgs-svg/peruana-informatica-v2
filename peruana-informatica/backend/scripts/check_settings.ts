
import { CompanySettings } from '../src/models/CompanySettings';
import { sequelize } from '../src/database/connection';

async function checkSettings() {
    try {
        await sequelize.authenticate();
        const settings = await CompanySettings.findByPk(1);
        console.log('Current Settings Status:');
        if (settings) {
            console.log(`- show_distributor_price_in_detail: ${settings.show_distributor_price_in_detail}`);
            console.log(`- company_whatsapp: ${settings.company_whatsapp}`);
        } else {
            console.log('No settings found!');
        }
    } catch (error) {
        console.error('Error checking settings:', error);
    } finally {
        await sequelize.close();
    }
}

checkSettings();
