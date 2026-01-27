import { sequelize } from './src/database/connection';
import { Product } from './src/models/Product';
import { Setting } from './src/models/Setting';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Check Setting
        const setting = await Setting.findByPk('cotizador_price_type');
        console.log('Current Setting (cotizador_price_type):', setting?.value);

        // Check Product
        // Try to find by code 15953 (check internal code or ID)
        let product = await Product.findOne({ where: { codigo_interno: '15953' } });

        if (!product) {
            console.log('Product not found by codigo_interno 15953, trying by ID...');
            product = await Product.findByPk(15953);
        }

        if (!product) {
            // Try searching by name?
            const productByName = await Product.findOne({ where: { name: 'LAPTOP HP Chromebook 14A-NA0031 PENTIUM N5000 14' } });
            if (productByName) {
                console.log('Product found by Name!');
                product = productByName;
            }
        }

        if (product) {
            console.log('Product Found:');
            console.log('ID:', product.cod_producto);
            console.log('Name:', product.name);
            console.log('Internal Code:', product.codigo_interno);
            console.log('Price (pre_cli):', product.price);
            console.log('Price Web (pre_web):', product.price_web);
            console.log('Price Dis (pre_dis):', product.price_dis);
            console.log('Price Cot (pre_cot):', product.price_cot);
        } else {
            console.log('Product 15953 NOT FOUND in DB.');
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

run();
