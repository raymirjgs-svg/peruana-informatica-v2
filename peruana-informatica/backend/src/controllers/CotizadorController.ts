import { Request, Response } from 'express';
import { Product } from '../models/Product';
import { SubCategory } from '../models/SubCategory';
import { Setting } from '../models/Setting';
import { Op, Sequelize } from 'sequelize';

// Helper to determine active price column
const getActivePriceColumn = async () => {
    const setting = await Setting.findByPk('cotizador_price_type');
    return setting ? setting.value : 'pre_cot';
};

// Helper function to extract component specs (copied from LaptopController logic)
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
        const activePriceCol = await getActivePriceColumn(); // e.g., 'pre_cot', 'pre_cli'

        // Map column name to model field if needed (Sequelize maps pre_cli to price, others are exact)
        // But here we need to READ the correct column.
        // Product model has: price (pre_cli), price_dis (pre_dis), price_cot (pre_cot), price_web (pre_web)

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

        // Price filters must apply to the ACTIVE price column
        // We can't easily filter by a dynamic column name in Sequelize 'where' unless we use literal or if we know the mapped name.
        // Since we added price_dis, price_cot, price_web to the model, we can use them.

        // Mapping:
        // pre_cli -> price
        // pre_dis -> price_dis
        // pre_cot -> price_cot
        // pre_web -> price_web

        let priceField = 'price'; // Default (pre_cli)
        if (activePriceCol === 'pre_dis') priceField = 'price_dis';
        if (activePriceCol === 'pre_cot') priceField = 'price_cot';
        if (activePriceCol === 'pre_web') priceField = 'price_web';

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

        // Subcategory Logic (simplified from LaptopController)
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
            let finalPrice = laptopData.price; // Default
            if (activePriceCol === 'pre_dis') finalPrice = laptopData.price_dis;
            if (activePriceCol === 'pre_cot') finalPrice = laptopData.price_cot;
            if (activePriceCol === 'pre_web') finalPrice = laptopData.price_web;

            // If the specific price is 0 or null, fallback to standard price (pre_cli)?
            // The user said "quiero elegir cualquiera de esos precios". If it's 0, it might be an error or free product.
            // Let's assume strict selection, but if null/0, maybe fallback to price?
            // "SyncService" sets them to 0 if missing.

            if (!finalPrice || finalPrice == 0) {
                // Option: fallback to pre_cli (laptopData.price) if desired, but user might want strict usage.
                // For now, let's keep it as is, or fallback if 0/null.
                if (laptopData.price > 0) finalPrice = laptopData.price;
            }

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
