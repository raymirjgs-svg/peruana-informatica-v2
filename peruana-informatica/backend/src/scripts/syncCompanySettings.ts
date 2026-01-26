import { connectDatabase } from '../database/connection';
import { CompanySettings } from '../models/CompanySettings';

async function syncCompanySettings() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await connectDatabase();

        console.log('📋 Sincronizando tabla company_settings...');
        await CompanySettings.sync({ alter: true });

        console.log('✅ Tabla company_settings sincronizada correctamente');

        // Verificar si existe configuración
        const existing = await CompanySettings.findByPk(1);
        
        if (!existing) {
            console.log('📝 Creando configuración por defecto...');
            await CompanySettings.create({
                id: 1,
                company_name: 'Peruana Informática',
                company_ruc: '20123456789',
                company_address: 'Av. Principal 123, Lima - Perú',
                company_phone: '(01) 123-4567',
                company_email: 'ventas@peruanainformatica.com',
                store_address: 'Av. Principal 123, Lima - Perú',
                store_hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM',
            });
            console.log('✅ Configuración por defecto creada');
        } else {
            console.log('ℹ️ Ya existe configuración de empresa');
        }

        console.log('\n✨ Proceso completado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

syncCompanySettings();
