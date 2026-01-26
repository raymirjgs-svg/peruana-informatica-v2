import { Product } from './models/Product';
import { connectDatabase } from './database/connection';

async function check() {
    try {
        await connectDatabase();
        const prods = await Product.findAll({ where: { is_featured: true } });
        console.log('Featured products found:', prods.length);
        prods.forEach(p => {
            console.log(`- ID: ${p.cod_producto}`);
            console.log(`  Name: ${p.name}`);
            console.log(`  Stock: ${p.stock}`);
            console.log(`  Active: ${p.is_active}`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}
check();
