import { sequelize } from '../database/connection';
import { Page } from '../models/Page';

async function createPagesTable() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync the Page model to create the table
        await Page.sync({ force: true });
        console.log('Pages table created successfully.');

        // Add some initial data if needed
        await Page.create({
            title: 'Sobre Nosotros',
            slug: 'about-us',
            content: '<h1>Sobre Nosotros</h1><p>Contenido de ejemplo...</p>',
            is_published: true,
            meta_title: 'Sobre Nosotros - Peruana de Informática',
            meta_description: 'Conoce más sobre nuestra empresa.'
        });

        await Page.create({
            title: 'Términos y Condiciones',
            slug: 'terms',
            content: '<h1>Términos y Condiciones</h1><p>Contenido de ejemplo...</p>',
            is_published: true,
            meta_title: 'Términos y Condiciones',
            meta_description: 'Nuestros términos y condiciones.'
        });

        console.log('Initial pages created.');

        await sequelize.close();
    } catch (error) {
        console.error('Unable to create pages table:', error);
    }
}

createPagesTable();
