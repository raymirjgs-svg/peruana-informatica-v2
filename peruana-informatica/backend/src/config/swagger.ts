import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Peruana de Informática API',
            version: version,
            description: 'API Documentation for Peruana de Informática E-commerce Platform',
            contact: {
                name: 'API Support',
                email: 'support@peruanainformatica.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001/api',
                description: 'Development Server',
            },
            {
                url: 'https://peruanainformatica.com/api',
                description: 'Production Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/**/*.ts', './src/models/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
