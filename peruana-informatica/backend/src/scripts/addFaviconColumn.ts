
import { sequelize } from '../database/connection';
import { QueryTypes } from 'sequelize';

async function addFaviconColumn() {
    try {
        console.log('Checking if favicon_url column exists in company_settings table...');

        // Check if column exists
        const [results] = await sequelize.query(
            `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'company_settings' 
       AND COLUMN_NAME = 'favicon_url'`,
            { type: QueryTypes.SELECT }
        ) as any[];

        if (results) {
            console.log('favicon_url column already exists.');
        } else {
            console.log('Adding favicon_url column...');
            await sequelize.query(
                `ALTER TABLE company_settings ADD COLUMN favicon_url VARCHAR(255) DEFAULT NULL AFTER logo_url`
            );
            console.log('favicon_url column added successfully.');
        }

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
}

addFaviconColumn();
