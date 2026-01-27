import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SubCategory } from '../models/SubCategory';
import { Setting } from '../models/Setting';
import { Op, Sequelize } from 'sequelize';

// Helper to determine active price column
const getActivePriceColumn = async () => {
    const setting = await Setting.findByPk('cotizador_price_type');
    return setting ? setting.value : 'pre_web';
};

// Helper function to extract component specs
const extractComponentSpecs = (product: any) => {
    const description = product.description || '';
    const cleanDescription = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Processor patterns
    let processor = 'No especificado';
    const processorPatterns = [
        /(Intel\s+Core\s+i[3579]-?\d+[A-Z]*)/i,
        /(AMD\s+Ryzen\s+\d+\s*\d*)/i,
    ];

    for (const pattern of processorPatterns) {
        const match = cleanDescription.match(pattern);
        if (match) {
            processor = match[0].replace(/\s+/g, ' ').trim();
            break;
        }
    }

    // RAM patterns
    let ram = 'No especificado';
    const ramMatch = cleanDescription.match(/(\d+)\s*(GB|GB DDR4|GB DDR5|GB RAM)/i);
    if (ramMatch) {
        ram = ramMatch[0].trim();
    }

    // Storage patterns
    let storage = 'No especificado';
    const storageMatch = cleanDescription.match(/(\d+)\s*(GB|TB)\s*(SSD|HDD|NVMe)/i);
    if (storageMatch) {
        storage = storageMatch[0].trim();
    }

    return {
        processor,
        ram,
        storage,
    };
};

export const getCotizadorLaptops = async (req: Request, res: Response) => {
    try {
        const { subcategory, minPrice, maxPrice, search } = req.query;
        let activePriceCol = await getActivePriceColumn(); // e.g., 'pre_web', 'pre_cli', 'pre_dis'

        console.log('--- COTIZADOR DEBUG ---');
        console.log('Active Price Column Setting:', activePriceCol);

        // Handle legacy or fallback
        if (activePriceCol === 'pre_cot') activePriceCol = 'pre_web';

        // Map setting value to actual DB column name
        let priceField = 'price'; // Default to pre_cli (price property)
        if (activePriceCol === 'pre_web') priceField = 'price_web';
        if (activePriceCol === 'pre_dis') priceField = 'price_dis';
        if (activePriceCol === 'pre_cli') priceField = 'price';

        console.log('Mapped Price Field for Sorting:', priceField);

        // Build filter conditions
        let whereClause: any = {
            [Op.or]: [
                { category_id: 1 },
                { name: { [Op.like]: '%laptop%' } },
                { name: { [Op.like]: '%Laptop%' } }
            ],
            is_active: true,
            stock: { [Op.gt]: 0 }
        };

        if (minPrice) {
            whereClause[priceField] = { ...whereClause[priceField] || {}, [Op.gte]: parseFloat(minPrice as string) };
        }
        if (maxPrice) {
            whereClause[priceField] = { ...whereClause[priceField] || {}, [Op.lte]: parseFloat(maxPrice as string) };
        }

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        // Subcategory Logic
        let includeConditions: any = [
            {
                model: SubCategory,
                as: 'subCategories',
                attributes: ['id', 'name', 'slug'],
                through: { attributes: [] },
                required: false
            }
        ];

        if (subcategory) {
            includeConditions[0].required = true;
            includeConditions[0].where = { slug: subcategory };
        }

        // Processor/RAM/Storage filters
        const { processor, ram, storage } = req.query;
        if (!whereClause[Op.and]) whereClause[Op.and] = [];

        const addSubcategoryFilter = (slug: string) => {
            const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-]/g, '');
            whereClause[Op.and].push(Sequelize.literal(`
                EXISTS (
                SELECT 1 
                FROM product_sub_categories psc
                JOIN sub_categories sc ON psc.sub_category_id = sc.id
                WHERE psc.product_codigo_interno = Product.codigo_interno
                AND sc.slug = '${sanitizedSlug}'
                )
            `));
        };
        if (processor) addSubcategoryFilter(processor as string);
        if (ram) addSubcategoryFilter(ram as string);
        if (storage) addSubcategoryFilter(storage as string);

        const laptops = await Product.findAll({
            where: whereClause,
            include: includeConditions,
            order: [[priceField, 'ASC']] // Order by the active price
        });

        const laptopsWithDynamicPrice = laptops.map(laptop => {
            const laptopData: any = laptop.toJSON();

            // Swap price with the selected price type
            let finalPrice = laptopData.price; // Default (pre_cli)

            if (activePriceCol === 'pre_web') finalPrice = laptopData.price_web;
            if (activePriceCol === 'pre_dis') finalPrice = laptopData.price_dis;

            // DEBUG LOG FOR SPECIFIC ITEM
            if (laptopData.codigo_interno === '15953') {
                console.log(`Product 15953 Prices: CLI=${laptopData.price}, WEB=${laptopData.price_web}, DIS=${laptopData.price_dis}`);
                console.log(`Selected Price Type: ${activePriceCol}, Raw Final Price: ${finalPrice}`);
            }

            // If the specific price is 0 or null, check fallback policy
            if (!finalPrice || Number(finalPrice) === 0) {
                // Fallback to standard price (pre_cli) if the specific price is missing/zero
                if (laptopData.price > 0) {
                    if (laptopData.codigo_interno === '15953') console.log('Falling back to CLI price because selected price is 0/null');
                    finalPrice = laptopData.price;
                }
            }

            if (laptopData.codigo_interno === '15953') console.log(`Final Price Used: ${finalPrice}`);

            laptopData.price = finalPrice; // Overwrite the main price field for the frontend

            // Specs
            if (!laptopData.component_specs || Object.keys(laptopData.component_specs).length === 0) {
                laptopData.component_specs = extractComponentSpecs(laptopData);
            }
            return laptopData;
        });

        res.json(laptopsWithDynamicPrice);

    } catch (error: any) {
        console.error('Error fetching cotizador laptops:', error);
        res.status(500).json({ error: error.message });
    }
};
