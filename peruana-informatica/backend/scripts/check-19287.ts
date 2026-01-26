
import { PeruanaInformaticaService } from '../src/services/PeruanaInformaticaService';
import { Product } from '../src/models/Product';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkProduct() {
    const code = '19287';
    console.log(`\n--- VERIFICANDO PRODUCTO ${code} ---\n`);

    try {
        // 1. Consultar API Externa Directamente
        console.log('1. Consultando API EXTERNA...');
        const apiData = await PeruanaInformaticaService.obtenerStockYPrecio(code);

        if (apiData) {
            console.log('   [API EXTERNA] Datos encontrados:');
            console.log(`   - Nombre: ${apiData.nombre}`);
            console.log(`   - Stock: ${apiData.stock}`);
            console.log(`   - Pre_CLI (Base): S/. ${apiData.pre_cli}`);
            console.log(`   - Pre_WEB (Online): S/. ${apiData.pre_web}`);
            console.log(`   - Pre_COT (Especial): S/. ${apiData.pre_cot}`);
            console.log(`   - Pre_DIS (Distribuidor): S/. ${apiData.pre_dis}`);
        } else {
            console.log('   [API EXTERNA] No se encontraron datos o hubo error.');
        }

        console.log('\n-----------------------------------\n');

        // 2. Simular mapeo (lo que debería tener la DB)
        if (apiData) {
            console.log('2. Mapeo esperado en Base de Datos:');
            console.log(`   - price (Lista): ${apiData.pre_cli}`);
            console.log(`   - price_web (Web): ${apiData.pre_web}`);
            console.log(`   - price_cot (Cotiza): ${apiData.pre_cot}`);
            console.log(`   - price_dis (Distrib): ${apiData.pre_dis}`);

            // Verificar si hay diferencias
            const hasThreePrices =
                (apiData.pre_web !== 0) &&
                (apiData.pre_dis !== 0) &&
                (apiData.pre_web !== apiData.pre_dis); // Identificar si hay variación real

            console.log(`\n   ¿Tiene precios diferenciados? ${hasThreePrices ? 'SÍ' : 'NO (algunos son iguales)'}`);
        }

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkProduct();
