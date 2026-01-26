// Script en JavaScript puro para evitar problemas de TypeScript
const { Product } = require('../models/Product');
const { Category } = require('../models/Category');
const { SubCategory } = require('../models/SubCategory');
const { ProductAttribute } = require('../models/ProductAttribute');
const { Attribute } = require('../models/Attribute');
const { AttributeValue } = require('../models/AttributeValue');

// Reglas de asignación
const assignmentRules = [
    {
        keywords: ['procesador', 'processor', 'cpu', 'ryzen', 'intel core', 'i3', 'i5', 'i7', 'i9'],
        category: 'Componentes PC',
        subCategory: 'Procesadores',
        componentType: 'cpu',
        attributes: { brand: 'detectar', socket: 'detectar' }
    },
    {
        keywords: ['motherboard', 'placa madre', 'mainboard', 'tarjeta madre'],
        category: 'Componentes PC',
        subCategory: 'Placas Madre',
        componentType: 'motherboard',
        attributes: { platform: 'detectar', socket: 'detectar', ram_type: 'detectar' }
    },
    {
        keywords: ['memoria ram', 'ram', 'ddr4', 'ddr5'],
        category: 'Componentes PC',
        subCategory: 'Memorias RAM',
        componentType: 'ram',
        attributes: { type: 'detectar', capacity: 'detectar' }
    },
    {
        keywords: ['tarjeta grafica', 'gpu', 'video card', 'geforce', 'radeon', 'rtx', 'gtx'],
        category: 'Componentes PC',
        subCategory: 'Tarjetas Gráficas',
        componentType: 'gpu'
    },
    {
        keywords: ['disco duro', 'ssd', 'nvme', 'hard drive', 'hdd'],
        category: 'Componentes PC',
        subCategory: 'Almacenamiento',
        componentType: 'storage'
    },
    {
        keywords: ['fuente de poder', 'power supply', 'psu'],
        category: 'Componentes PC',
        subCategory: 'Fuentes de Poder',
        componentType: 'psu'
    },
    {
        keywords: ['laptop', 'notebook', 'portátil', 'portatil'],
        category: 'Laptops',
        subCategory: 'Laptops Gaming',
        componentType: 'laptop'
    },
    {
        keywords: ['monitor', 'pantalla', 'display'],
        category: 'Periféricos',
        subCategory: 'Monitores',
        componentType: 'monitor'
    },
    {
        keywords: ['teclado', 'keyboard'],
        category: 'Periféricos',
        subCategory: 'Teclados',
        componentType: 'keyboard'
    },
    {
        keywords: ['mouse', 'ratón', 'raton'],
        category: 'Periféricos',
        subCategory: 'Mouse',
        componentType: 'mouse'
    }
];

// Detectores
const detectors = {
    cpuBrand: (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('ryzen') || lower.includes('amd')) return 'amd';
        if (lower.includes('intel') || lower.includes('core i')) return 'intel';
        return null;
    },
    socket: (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('am4')) return 'am4';
        if (lower.includes('am5')) return 'am5';
        if (lower.includes('lga1700')) return 'lga1700';
        if (lower.includes('lga1200')) return 'lga1200';
        return null;
    },
    ramType: (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('ddr5')) return 'ddr5';
        if (lower.includes('ddr4')) return 'ddr4';
        return null;
    },
    ramCapacity: (name) => {
        const match = name.match(/(\d+)\s*gb/i);
        return match ? parseInt(match[1]) : null;
    },
    motherboardPlatform: (name) => {
        const lower = name.toLowerCase();
        if (lower.includes('amd') || lower.includes('am4') || lower.includes('am5')) return 'amd';
        if (lower.includes('intel') || lower.includes('lga')) return 'intel';
        return null;
    }
};

async function bulkAssignProducts() {
    try {
        console.log('🚀 Iniciando asignación masiva de productos...\n');

        const productsWithoutCategory = await Product.findAll({
            where: { category_id: null }
        });

        console.log(`📦 Productos sin categoría: ${productsWithoutCategory.length}\n`);

        let assigned = 0;
        let skipped = 0;

        for (const product of productsWithoutCategory) {
            const productName = (product.nombre || '').toLowerCase();
            const productDesc = (product.descripcion || '').toLowerCase();
            const searchText = `${productName} ${productDesc}`;

            const matchedRule = assignmentRules.find(rule =>
                rule.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
            );

            if (!matchedRule) {
                skipped++;
                console.log(`⏭️  SKIP: ${product.nombre}`);
                continue;
            }

            // Buscar o crear categoría
            let category = null;
            if (matchedRule.category) {
                [category] = await Category.findOrCreate({
                    where: { name: matchedRule.category },
                    defaults: { name: matchedRule.category }
                });
            }

            // Buscar o crear subcategoría
            let subCategory = null;
            if (matchedRule.subCategory && category) {
                [subCategory] = await SubCategory.findOrCreate({
                    where: { name: matchedRule.subCategory, category_id: category.id },
                    defaults: { name: matchedRule.subCategory, category_id: category.id }
                });
            }

            // Actualizar producto
            await product.update({
                category_id: category?.id || null,
                subcategory_id: subCategory?.id || null,
                component_type: matchedRule.componentType || null
            });

            // Asignar atributos si aplica
            if (matchedRule.componentType && matchedRule.attributes) {
                await assignAttributes(product, matchedRule);
            }

            assigned++;
            console.log(`✅ ASIGNADO: ${product.nombre} → ${matchedRule.category} > ${matchedRule.subCategory}`);
        }

        console.log(`\n📊 Resumen:`);
console        console.log(`   ✅ Asignados: ${assigned}`);
        console.log(`   ⏭️  Omitidos: ${skipped}`);
        console.log(`   📦 Total: ${productsWithoutCategory.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function assignAttributes(product, rule) {
    if (!rule.attributes || !rule.componentType) return;

    const productName = product.nombre || '';

    for (const [attrCode, value] of Object.entries(rule.attributes)) {
        let detectedValue = value;

        if (value === 'detectar') {
            if (attrCode === 'brand') detectedValue = detectors.cpuBrand(productName);
            else if (attrCode === 'socket') detectedValue = detectors.socket(productName);
            else if (attrCode === 'type') detectedValue = detectors.ramType(productName);
            else if (attrCode === 'capacity') detectedValue = detectors.ramCapacity(productName);
            else if (attrCode === 'platform') detectedValue = detectors.motherboardPlatform(productName);
            else if (attrCode === 'ram_type') detectedValue = detectors.ramType(productName);
        }

        if (!detectedValue) continue;

        const attribute = await Attribute.findOne({
            where: { code: attrCode, component_type: rule.componentType }
        });

        if (!attribute) continue;

        if (attribute.input_type === 'select') {
            const attributeValue = await AttributeValue.findOne({
                where: { attribute_id: attribute.id, code: detectedValue }
            });

            if (attributeValue) {
                await ProductAttribute.findOrCreate({
                    where: { product_id: product.cod_producto, attribute_id: attribute.id },
                    defaults: { product_id: product.cod_producto, attribute_id: attribute.id, value_id: attributeValue.id }
                });
            }
        } else if (attribute.input_type === 'number' && typeof detectedValue === 'number') {
            await ProductAttribute.findOrCreate({
                where: { product_id: product.cod_producto, attribute_id: attribute.id },
                defaults: { product_id: product.cod_producto, attribute_id: attribute.id, value_number: detectedValue }
            });
        }
    }
}

// Ejecutar
if (require.main === module) {
    bulkAssignProducts()
        .then(() => {
            console.log('\n✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { bulkAssignProducts };
