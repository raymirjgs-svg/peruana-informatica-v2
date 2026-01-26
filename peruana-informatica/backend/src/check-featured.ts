import { Product } from './models/Product';
import { connectDatabase } from './database/connection';

async function check() {
    try {
        await connectDatabase();
        const featured = await Product.count({ where: { is_featured: true } });
        console.log('Current Featured products count:', featured);

        // Check columns of the table physically if possible, or just trust count
        // Let's try to set one product to featured if count is 0, just to see if it works
        if (featured === 0) {
            console.log('No featured products found. Attempting to set key product as featured...');
            const product = await Product.findOne();
            if (product) {
                console.log(`Setting product ${product.cod_producto} (${product.name}) to featured...`);
                await product.update({ is_featured: true });
                console.log('Update done. Re-checking...');
                const countAfter = await Product.count({ where: { is_featured: true } });
                console.log('New Featured count:', countAfter);
            }
        } else {
            const prods = await Product.findAll({ where: { is_featured: true }, limit: 5 });
            console.log('Featured products found:');
            prods.forEach(p => console.log(`- [${p.cod_producto}] ${p.name}`));
        }
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}
check();
