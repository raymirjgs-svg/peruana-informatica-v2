
import { CompanySettings } from '../src/models/CompanySettings';
import { sequelize } from '../src/database/connection';

async function enableFeature() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida.');

        let settings = await CompanySettings.findByPk(1);
        if (!settings) {
            console.log('⚠️ No se encontraron settings, creando uno nuevo...');
            settings = await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: 'Av. Principal 123, Lima - Perú',
                company_phone: '(01) 123-4567',
                company_email: 'ventas@peruanainformatica.com',
                show_distributor_price_in_detail: true
            } as any);
        } else {
            console.log('🔄 Actualizando settings existentes...');
            await settings.update({
                show_distributor_price_in_detail: true,
                company_whatsapp: '988552455'
            });
        }

        console.log('✅ Feature flag "show_distributor_price_in_detail" activada.');
        console.log('✅ WhatsApp configurado a: 988552455');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

enableFeature();
