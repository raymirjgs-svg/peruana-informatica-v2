import { sequelize } from './src/database/connection';
import { Product } from './src/models/Product';

const run = async () => {
    try {
        await sequelize.authenticate();

        // Find Product
        const product = await Product.findOne({ where: { codigo_interno: '15953' } });

        if (product) {
            console.log('Updating prices for product 15953...');
            // Set distinct prices
            product.price = 599.00;      // Cliente
            product.price_web = 598.00;  // Web
            product.price_dis = 595.00;  // Distribuidor

            await product.save();

            console.log('Product Updated!');
            console.log('Price (pre_cli):', product.price);
            console.log('Price Web (pre_web):', product.price_web);
            console.log('Price Dis (pre_dis):', product.price_dis);
        } else {
            console.log('Product 15953 NOT FOUND.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
