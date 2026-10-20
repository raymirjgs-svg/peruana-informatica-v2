import { Transaction } from 'sequelize';
import { Product } from '../models/Product';
import { Image } from '../models/Image';
import { ProductSubCategory } from '../models/ProductSubCategory';

export async function createProductRecord(data: any, transaction: Transaction) {
        const {
            name,
            description,
            price,
            stock,
            category_id,
            brand_id,
            image,
            keywords,
            component_type,
            additional_images,
            subcategory_ids
        } = data;

        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (await Product.findOne({ where: { slug }, transaction })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const generateCodigoInterno = async (): Promise<string> => {
            const timestamp = Date.now().toString().slice(-8);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const codigo = `${timestamp}${random}`;

            const exists = await Product.findOne({ where: { codigo_interno: codigo }, transaction });
            if (exists) {
                return generateCodigoInterno();
            }
            return codigo;
        };

        let codigo_interno: string;
        const providedCodigo = data.codigo_interno;

        if (providedCodigo !== undefined && providedCodigo !== null && String(providedCodigo).trim() !== '') {
            codigo_interno = String(providedCodigo).trim();

            const duplicate = await Product.findOne({ where: { codigo_interno }, transaction });
            if (duplicate) {
                const duplicateError: any = new Error(`El código interno '${codigo_interno}' ya está registrado`);
                duplicateError.code = 'DUPLICATE_CODIGO_INTERNO';
                throw duplicateError;
            }
        } else {
            codigo_interno = await generateCodigoInterno();
        }

        const product = await Product.create({
            name,
            slug,
            description,
            short_description: (description || '').substring(0, 500),
            price,
            stock,
            category_id,
            brand_id,
            image,
            keywords,
            codigo_interno,
            seo_title: data.seo_title ?? null,
            seo_description: data.seo_description ?? null,
            component_type: component_type || null
        }, { transaction });

        if (additional_images && additional_images.length > 0) {
            await Image.bulkCreate(
                additional_images.map((imgUrl: string) => ({
                    codigo_interno: product.codigo_interno,
                    imagen: imgUrl
                })),
                { transaction }
            );
        }

        if (subcategory_ids && Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
            const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                product_codigo_interno: product.codigo_interno,
                sub_category_id: subId
            }));
            await ProductSubCategory.bulkCreate(subcategoryRecords, { transaction });
        }

        return product;
    }
