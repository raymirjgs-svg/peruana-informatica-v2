import { sequelize } from '../database/connection';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Brand } from '../models/Brand';
import { ProductAttribute } from '../models/ProductAttribute';
import { Attribute } from '../models/Attribute';
import { AttributeValue } from '../models/AttributeValue';

/**
 * Script para asignar automáticamente categorías, subcategorías y atributos
 * a productos existentes basándose en análisis de nombres y descripciones
 */

interface AssignmentRule {
    keywords: string[];
    category?: string;
    subCategory?: string;
    componentType?: string;
    attributes?: {
        [key: string]: string | number | boolean;
    };
}

// Reglas de asignación basadas en palabras clave
const assignmentRules: AssignmentRule[] = [
    // PROCESADORES
    {
        keywords: ['procesador', 'processor', 'cpu', 'ryzen', 'intel core', 'i3', 'i5', 'i7', 'i9'],
        category: 'Componentes PC',
        subCategory: 'Procesadores',
        componentType: 'cpu',
        attributes: {
            brand: 'detectar', // Se detectará de AMD o Intel
            socket: 'detectar'  // Se detectará del nombre
        }
    },
    // PLACAS MADRE
    {
        keywords: ['motherboard', 'placa madre', 'mainboard', 'tarjeta madre'],
        category: 'Componentes PC',
        subCategory: 'Placas Madre',
        componentType: 'motherboard',
        attributes: {
            platform: 'detectar',
            socket: 'detectar',
            ram_type: 'detectar'
        }
    },
    // MEMORIAS RAM
    {
        keywords: ['memoria ram', 'ram', 'ddr4', 'ddr5'],
        category: 'Componentes PC',
        subCategory: 'Memorias RAM',
        componentType: 'ram',
        attributes: {
            type: 'detectar',
            capacity: 'detectar'
        }
    },
    // TARJETAS GRÁFICAS
    {
        keywords: ['tarjeta grafica', 'gpu', 'video card', 'geforce', 'radeon', 'rtx', 'gtx'],
        category: 'Componentes PC',
        subCategory: 'Tarjetas Gráficas',
        componentType: 'gpu'
    },
    // ALMACENAMIENTO
    {
        keywords: ['disco duro', 'ssd', 'nvme', 'hard drive', 'hdd'],
        category: 'Componentes PC',
        subCategory: 'Almacenamiento',
        componentType: 'storage'
    },
    // FUENTES DE PODER
    {
        keywords: ['fuente de poder', 'power supply', 'psu'],
        category: 'Componentes PC',
        subCategory: 'Fuentes de Poder',
        componentType: 'psu'
    },
    // LAPTOPS
    {
        keywords: ['laptop', 'notebook', 'portátil', 'portatil'],
        category: 'Laptops',
        subCategory: 'Laptops Gaming', // Por defecto, se puede ajustar
        componentType: 'laptop'
    },
    // MONITORES
    {
        keywords: ['monitor', 'pantalla', 'display'],
        category: 'Periféricos',
        subCategory: 'Monitores',
        componentType: 'monitor'
    },
    // TECLADOS
    {
        keywords: ['teclado', 'keyboard'],
        category: 'Periféricos',
        subCategory: 'Teclados',
        componentType: 'keyboard'
    },
    // MOUSE
    {
        keywords: ['mouse', 'ratón', 'raton'],
        category: 'Periféricos',
        subCategory: 'Mouse',
        componentType: 'mouse'
    }
];

// Detectores de valores específicos
const detectors = {
    // Detectar marca de CPU
    cpuBrand: (productName: string) => {
        const lowerName = productName.toLowerCase();
        if (lowerName.includes('ryzen') || lowerName.includes('amd')) {
            return 'amd';
        }
        if (lowerName.includes('intel') || lowerName.includes('core i')) {
            return 'intel';
        }
        return null;
    },

    // Detectar socket
    socket: (productName: string) => {
        const lowerName = productName.toLowerCase();
        if (lowerName.includes('am4')) return 'am4';
        if (lowerName.includes('am5')) return 'am5';
        if (lowerName.includes('lga1700')) return 'lga1700';
        if (lowerName.includes('lga1200')) return 'lga1200';
        return null;
    },

    // Detectar tipo de RAM
    ramType: (productName: string) => {
        const lowerName = productName.toLowerCase();
        if (lowerName.includes('ddr5')) return 'ddr5';
        if (lowerName.includes('ddr4')) return 'ddr4';
        return null;
    },

    // Detectar capacidad de RAM (en GB)
    ramCapacity: (productName: string) => {
        const match = productName.match(/(\d+)\s*gb/i);
        return match ? parseInt(match[1]) : null;
    },

    // Detectar plataforma de motherboard
    motherboardPlatform: (productName: string) => {
        const lowerName = productName.toLowerCase();
        if (lowerName.includes('amd') || lowerName.includes('am4') || lowerName.includes('am5')) {
            return 'amd';
        }
        if (lowerName.includes('intel') || lowerName.includes('lga')) {
            return 'intel';
        }
        return null;
    }
};

async function bulkAssignProducts() {
    try {
        console.log('🚀 Iniciando asignación masiva de productos...\n');

        // Obtener todos los productos sin categoría
        const productsWithoutCategory = await Product.findAll({
            where: {
                category_id: null
            }
        });

        console.log(`📦 Productos sin categoría: ${productsWithoutCategory.length}\n`);

        let assigned = 0;
        let skipped = 0;

        for (const product of productsWithoutCategory) {
            const productName = (product as any).nombre?.toLowerCase() || '';
            const productDesc = (product as any).descripcion?.toLowerCase() || '';
            const searchText = `${productName} ${productDesc}`;

            // Buscar regla que coincida
            const matchedRule = assignmentRules.find(rule =>
                rule.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
            );

            if (!matchedRule) {
                skipped++;
                console.log(`⏭️  SKIP: ${(product as any).nombre}`);
                continue;
            }

            // Buscar o crear categoría
            let category = null;
            if (matchedRule.category) {
                [category] = await Category.findOrCreate({
                    where: { nombre: matchedRule.category },
                    defaults: { nombre: matchedRule.category }
                });
            }

            // Buscar o crear subcategoría
            let subCategory = null;
            if (matchedRule.subCategory && category) {
                [subCategory] = await SubCategory.findOrCreate({
                    where: {
                        nombre: matchedRule.subCategory,
                        category_id: category.id
                    },
                    defaults: {
                        nombre: matchedRule.subCategory,
                        category_id: category.id
                    }
                });
            }

            // Actualizar producto
            await product.update({
                category_id: category?.id || null,
                subcategory_id: subCategory?.id || null,
                component_type: matchedRule.componentType || null
            } as any);

            // Asignar atributos dinámicos si aplica
            if (matchedRule.componentType && matchedRule.attributes) {
                await assignAttributes(product, matchedRule);
            }

            assigned++;
            console.log(`✅ ASIGNADO: ${(product as any).nombre} → ${matchedRule.category} > ${matchedRule.subCategory}`);
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Asignados: ${assigned}`);
        console.log(`   ⏭️  Omitidos: ${skipped}`);
        console.log(`   📦 Total: ${productsWithoutCategory.length}`);

    } catch (error) {
        console.error('❌ Error en asignación masiva:', error);
        throw error;
    }
}

async function assignAttributes(product: any, rule: AssignmentRule) {
    if (!rule.attributes || !rule.componentType) return;

    const productName = product.nombre || '';

    for (const [attrCode, value] of Object.entries(rule.attributes)) {
        let detectedValue = value;

        // Detectar valores automáticamente
        if (value === 'detectar') {
            if (attrCode === 'brand') {
                detectedValue = detectors.cpuBrand(productName);
            } else if (attrCode === 'socket') {
                detectedValue = detectors.socket(productName);
            } else if (attrCode === 'type' && rule.componentType === 'ram') {
                detectedValue = detectors.ramType(productName);
            } else if (attrCode === 'capacity' && rule.componentType === 'ram') {
                detectedValue = detectors.ramCapacity(productName);
            } else if (attrCode === 'platform') {
                detectedValue = detectors.motherboardPlatform(productName);
            } else if (attrCode === 'ram_type') {
                detectedValue = detectors.ramType(productName);
            }
        }

        if (!detectedValue) continue;

        // Buscar el atributo
        const attribute = await Attribute.findOne({
            where: {
                code: attrCode,
                component_type: rule.componentType
            }
        });

        if (!attribute) continue;

        // Si es tipo select, buscar el value_id
        if (attribute.input_type === 'select') {
            const attributeValue = await AttributeValue.findOne({
                where: {
                    attribute_id: attribute.id,
                    code: detectedValue as string
                }
            });

            if (attributeValue) {
                await ProductAttribute.findOrCreate({
                    where: {
                        product_id: product.cod_producto,
                        attribute_id: attribute.id
                    },
                    defaults: {
                        product_id: product.cod_producto,
                        attribute_id: attribute.id,
                        value_id: attributeValue.id
                    } as any
                });
            }
        } else if (attribute.input_type === 'number' && typeof detectedValue === 'number') {
            await ProductAttribute.findOrCreate({
                where: {
                    product_id: product.cod_producto,
                    attribute_id: attribute.id
                },
                defaults: {
                    product_id: product.cod_producto,
                    attribute_id: attribute.id,
                    value_number: detectedValue
                } as any
            });
        }
    }
}

// Ejecutar solo si se llama directamente
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

export { bulkAssignProducts };
