/**
 * Script de prueba para la sincronización con la API externa
 * Ejecutar con: npx ts-node scripts/test-sync.ts
 */

import { PeruanaInformaticaService } from '../src/services/PeruanaInformaticaService';

async function testSyncAPI() {
    console.log('🧪 Iniciando pruebas de sincronización con API externa...\n');

    try {
        // 1. Solicitar nuevo token
        console.log('1️⃣ Solicitando nuevo token...');
        const tokenResult = await PeruanaInformaticaService.solicitarToken('Raymir', 30);

        if (tokenResult.success) {
            console.log('✅ Token obtenido exitosamente');
            console.log('   Token:', tokenResult.token?.substring(0, 50) + '...');
            console.log('   Expira:', tokenResult.expiresAt);
        } else {
            console.log('❌ Error al obtener token:', tokenResult.message);
            return;
        }

        console.log('\n---\n');

        // 2. Verificar token
        console.log('2️⃣ Verificando estado del token...');
        const tokenValido = await PeruanaInformaticaService.verificarYRenovarToken();
        console.log(tokenValido ? '✅ Token válido' : '❌ Token inválido');

        console.log('\n---\n');

        // 3. Consultar un artículo de ejemplo
        console.log('3️⃣ Consultando artículo de prueba (ID: 19287)...');
        const articulo = await PeruanaInformaticaService.consultarArticulo('19287');

        if (articulo.success) {
            console.log('✅ Artículo consultado exitosamente');
            console.log('   Datos:', JSON.stringify(articulo.data, null, 2));
        } else {
            console.log('❌ Error al consultar artículo:', articulo.message);
        }

        console.log('\n---\n');

        // 4. Obtener stock y precio
        console.log('4️⃣ Obteniendo stock y precio...');
        const stockPrecio = await PeruanaInformaticaService.obtenerStockYPrecio('19287');

        if (stockPrecio) {
            console.log('✅ Stock y precios obtenidos');
            console.log('   Nombre:', stockPrecio.nombre);
            console.log('   Stock:', stockPrecio.stock);
            console.log('   Disponible:', stockPrecio.disponible);
            console.log('   ---');
            console.log('   📊 PRECIOS:');
            console.log('   Pre_CLI (Cliente):', stockPrecio.pre_cli);
            console.log('   Pre_COT (Cotización):', stockPrecio.pre_cot);
            console.log('   Pre_WEB (Web):', stockPrecio.pre_web);
            console.log('   Pre_DIS (Distribuidor):', stockPrecio.pre_dis);
        } else {
            console.log('❌ No se pudo obtener stock y precios');
        }

        console.log('\n---\n');

        // 5. Sincronizar múltiples productos (ejemplo con 3 IDs)
        console.log('5️⃣ Sincronizando múltiples productos...');
        const idsEjemplo = ['19287', '19288', '19289']; // Reemplaza con IDs válidos
        const resultados = await PeruanaInformaticaService.sincronizarProductos(idsEjemplo);

        console.log('✅ Sincronización completada');
        console.log('   Total procesados:', resultados.length);
        console.log('   Exitosos:', resultados.filter(r => r.success).length);
        console.log('   Fallidos:', resultados.filter(r => !r.success).length);

        resultados.forEach((resultado, index) => {
            if (resultado.success && 'datos' in resultado && resultado.datos) {
                console.log(`   ${index + 1}. ✓ ${resultado.id}: ${resultado.datos.nombre} - Stock: ${resultado.datos.stock}`);
            } else if ('error' in resultado) {
                console.log(`   ${index + 1}. ✗ ${resultado.id}: ${resultado.error}`);
            }
        });

        console.log('\n✅ Todas las pruebas completadas exitosamente!');

    } catch (error: any) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Ejecutar las pruebas
console.log('═══════════════════════════════════════════════════════════');
console.log('  PRUEBA DE SINCRONIZACIÓN CON API EXTERNA                ');
console.log('  Sistema de Peruana Informática                          ');
console.log('═══════════════════════════════════════════════════════════\n');

testSyncAPI()
    .then(() => {
        console.log('\n🎉 Script de prueba finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error fatal:', error);
        process.exit(1);
    });
