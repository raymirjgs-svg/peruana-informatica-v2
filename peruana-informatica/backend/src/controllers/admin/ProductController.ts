import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Product } from '../../models/Product';
import { Brand } from '../../models/Brand';
import { Category } from '../../models/Category';
import { SubCategory } from '../../models/SubCategory';
import { ProductSubCategory } from '../../models/ProductSubCategory';
import { Image } from '../../models/Image';
import { SyncService } from '../../services/SyncService';
import { PeruanaInformaticaService } from '../../services/PeruanaInformaticaService';

export class ProductController {

    // GET todos los productos con paginación y filtros
    async getProducts(req: Request, res: Response) {
        try {
            // Trigger automatic sync in background (non-blocking)
            SyncService.syncProducts().catch(() => {});

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const where: any = {};

            // Búsqueda inteligente (Smart Search)
            if (req.query.search) {
                const searchTerms = (req.query.search as string).trim().split(/\s+/); // Split by whitespace

                if (searchTerms.length > 0) {
                    // El producto debe coincidir con TODOS los términos de búsqueda (AND implícito entre términos)
                    // Pero cada término puede estar en CUALQUIERA de los campos (OR entre campos)
                    where[Op.and] = searchTerms.map(term => ({
                        [Op.or]: [
                            { name: { [Op.like]: `%${term}%` } },
                            { description: { [Op.like]: `%${term}%` } },
                            { codigo_interno: { [Op.like]: `%${term}%` } },
                            { keywords: { [Op.like]: `%${term}%` } }
                        ]
                    }));
                }
            }

            // Búsqueda por código interno
            if (req.query.codigo) {
                where.codigo_interno = {
                    [Op.like]: `%${req.query.codigo}%`
                };
            }

            if (req.query.category) {
                where.category_id = req.query.category;
            }

            if (req.query.brand) {
                where.brand_id = req.query.brand;
            }

            // Filtro de stock
            if (req.query.stock_filter) {
                switch (req.query.stock_filter) {
                    case 'available':
                        where.stock = { [Op.gt]: 0 };
                        break;
                    case 'low':
                        where.stock = { [Op.and]: [{ [Op.gt]: 0 }, { [Op.lte]: 10 }] };
                        break;
                    case 'out':
                        where.stock = 0;
                        break;
                }
            }

            // Ordenamiento
            const sortField = req.query.sort as string || 'cod_producto';
            const sortOrder = (req.query.order as string || 'desc').toUpperCase();
            const validSortFields: Record<string, string> = {
                'name': 'name',
                'price': 'price',
                'stock': 'stock',
                'cod_producto': 'cod_producto',
                'codigo_interno': 'codigo_interno'
            };
            const orderField = validSortFields[sortField] || 'cod_producto';
            const order: any = [[orderField, sortOrder === 'ASC' ? 'ASC' : 'DESC']];

            const [products, total] = await Promise.all([
                Product.findAll({
                    where,
                    limit,
                    offset,
                    order,
                    attributes: [
                        'cod_producto',
                        'name', 'slug', 'description', 'short_description', 'price', 'price_web', 'price_cot', 'price_dis', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'is_active', 'codigo_interno', 'component_type', 'is_featured', 'is_new', 'is_clearance', 'image'
                    ],
                    include: [
                        {
                            model: Brand,
                            as: 'productBrand',
                            attributes: ['id', 'name', 'slug'],
                        },
                        {
                            model: Category,
                            as: 'productCategory',
                            attributes: ['id', 'name', 'slug'],
                        },
                        {
                            model: Image,
                            as: 'images',
                            attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
                            required: false,
                        }
                    ]
                }),
                Product.count({ where })
            ]);

            // Mapear resultados para incluir 'id' como alias de 'cod_producto'
            const mappedProducts = products.map(p => {
                const json = p.toJSON();
                return {
                    ...json,
                    id: p.cod_producto // Alias manual
                };
            });

            res.json({
                products: mappedProducts,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                filters: {
                    search: req.query.search || null,
                    category: req.query.category || null,
                    brand: req.query.brand || null,
                }
            });
        } catch (error) {
            console.error('Error getting products:', error);
            res.status(500).json({
                error: 'Error al obtener productos',
                code: 'PRODUCTS_FETCH_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    // GET producto por ID
    async getProductById(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findOne({
                where: { cod_producto: productId },
                attributes: [
                    'cod_producto',
                    'name', 'slug', 'description', 'short_description', 'price', 'price_web', 'price_cot', 'price_dis', 'stock', 'category', 'keywords', 'brand_id', 'category_id', 'is_active', 'codigo_interno', 'component_type', 'is_featured', 'is_new', 'is_clearance', 'image',
                    'seo_title', 'seo_description'
                ],
                include: [
                    {
                        model: Brand,
                        as: 'productBrand',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: Category,
                        as: 'productCategory',
                        attributes: ['id', 'name', 'slug'],
                    },
                    {
                        model: SubCategory,
                        as: 'subCategories',
                        attributes: ['id', 'name', 'slug'],
                        through: { attributes: [] }
                    },
                    {
                        model: Image,
                        as: 'images',
                        attributes: ['cod_galeria', 'codigo_interno', 'imagen'],
                        required: false,
                    }
                ]
            });

            if (!product) {
                return res.status(404).json({
                    error: 'Producto no encontrado',
                    code: 'PRODUCT_NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            // Incluir alias id
            const json = product.toJSON();
            // @ts-ignore
            res.json({ ...json, id: product.cod_producto, subcategory_ids: json.subCategories?.map((s: any) => s.id) || [] });
        } catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({
                error: 'Error al obtener producto',
                code: 'PRODUCT_FETCH_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    // GET erp-lookup/:code
    async erpLookup(req: Request, res: Response) {
        try {
            const { code } = req.params;

            // 1. Buscar en BD local primero
            const existingProduct = await Product.findOne({
                where: { codigo_interno: code },
                include: [
                    { model: Brand, as: 'productBrand', attributes: ['id', 'name'] },
                    { model: Category, as: 'productCategory', attributes: ['id', 'name'] },
                    { model: Image, as: 'images', attributes: ['cod_galeria', 'imagen'] }
                ]
            });

            if (existingProduct) {
                return res.json({
                    found: true,
                    source: 'db',
                    message: 'El producto ya existe en la base de datos',
                    product: {
                        ...existingProduct.toJSON(),
                        id: existingProduct.cod_producto
                    }
                });
            }

            // 2. Buscar en API del sistema de ventas (ERP real)
            try {
                console.log(`Buscando producto ${code} en API de ventas...`);
                const erpResult = await PeruanaInformaticaService.consultarArticulo(String(code));
                console.log('Respuesta API:', JSON.stringify(erpResult, null, 2));

                let articulo = null;

                if (erpResult) {
                    if (erpResult.success && erpResult.data) {
                        articulo = erpResult.data;
                    } else if (!erpResult.success && erpResult.message) {
                        return res.json({
                            found: false,
                            message: erpResult.message || 'Error al consultar el sistema de ventas'
                        });
                    }
                }

                if (articulo) {
                    return res.json({
                        found: true,
                        source: 'erp',
                        message: 'Producto encontrado en sistema de ventas',
                        product: {
                            codigo: articulo.cod_articulo || articulo.id || code,
                            nombre: articulo.nombre || articulo.descripcion || 'Sin nombre',
                            precio: parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.pre_web) || parseFloat(articulo.pre_cli) || parseFloat(articulo.pre_cot) || 0,
                            stock: parseFloat(articulo.stock) || 0,
                            marca: articulo.marca || null,
                            categoria: articulo.categoria || null,
                            pre_cot: parseFloat(articulo.precio_lista_preferencial_soles) || parseFloat(articulo.pre_cot) || 0,
                            pre_cli: parseFloat(articulo.precio_lista_premium_soles) || parseFloat(articulo.pre_cli) || 0,
                            pre_web: parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.pre_web) || 0,
                            pre_dis: parseFloat(articulo.pre_dis) || 0
                        }
                    });
                } else {
                    return res.json({
                        found: false,
                        message: 'Producto no encontrado en el sistema de ventas'
                    });
                }
            } catch (apiError: any) {
                console.error('Error consultando API de ventas:', apiError.message);

                if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized') || apiError.message?.includes('autorizado')) {
                    return res.json({
                        found: false,
                        message: 'Token de API expirado. Contacte al administrador para renovar el token.'
                    });
                }

                return res.json({
                    found: false,
                    message: 'Error al consultar sistema de ventas: ' + (apiError.message || 'Error desconocido')
                });
            }

        } catch (error) {
            console.error('Error in ERP lookup:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    // POST crear producto
    async createProduct(req: Request, res: Response) {
        try {
            const { name, description, price, stock, category_id, brand_id, image, keywords, component_type, additional_images, subcategory_ids } = req.body;

            // Generar slug único
            const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let counter = 1;

            while (await Product.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Usar codigo_interno del body (ERP code) si viene, si no generar uno único
            const generateCodigoInterno = async (): Promise<string> => {
                const timestamp = Date.now().toString().slice(-8);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const codigo = `${timestamp}${random}`;

                const exists = await Product.findOne({ where: { codigo_interno: codigo } });
                if (exists) {
                    return generateCodigoInterno();
                }
                return codigo;
            };

            const codigo_interno = req.body.codigo_interno?.trim() || await generateCodigoInterno();

            const product = await Product.create({
                name,
                slug,
                description,
                short_description: description.substring(0, 500),
                price,
                stock,
                category_id,
                brand_id,
                image,
                keywords,
                codigo_interno,
                seo_title: req.body.seo_title ?? null,
                seo_description: req.body.seo_description ?? null,
                component_type: component_type || null
            });

            // Guardar imágenes adicionales
            if (additional_images && additional_images.length > 0) {
                const imagePromises = additional_images.map((imgUrl: string) => {
                    return Image.create({
                        codigo_interno: product.codigo_interno,
                        imagen: imgUrl
                    });
                });
                await Promise.all(imagePromises);
            }

            // Guardar subcategorías
            if (subcategory_ids && Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
                const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                    product_codigo_interno: product.codigo_interno,
                    sub_category_id: subId
                }));
                await ProductSubCategory.bulkCreate(subcategoryRecords);
            }

            // Auto-sincronizar precio y stock desde ERP si tiene código válido
            try {
                const erpResult = await PeruanaInformaticaService.consultarArticulo(String(product.codigo_interno));
                if (erpResult?.success && erpResult.data) {
                    const articulo = erpResult.data;
                    const newStock = parseInt(articulo.stock) || 0;
                    const newPrice = parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.precio) || parseFloat(articulo.pre_cli) || 0;
                    if (newStock > 0 || newPrice > 0) {
                        await Product.update(
                            { stock: newStock, price: newPrice },
                            { where: { cod_producto: product.cod_producto } }
                        );
                    }
                }
            } catch (erpErr) {
                // No bloquear creación si el ERP falla
                console.warn(`ERP sync skipped for new product ${product.codigo_interno}:`, erpErr);
            }

            const newProduct = await Product.findByPk(product.cod_producto, {
                include: [
                    { model: Brand, as: 'productBrand', attributes: ['id', 'name', 'slug'] },
                    { model: Category, as: 'productCategory', attributes: ['id', 'name', 'slug'] },
                    { model: SubCategory, as: 'subCategories', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
                    { model: Image, as: 'images', attributes: ['cod_galeria', 'codigo_interno', 'imagen'], required: false }
                ]
            });

            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({
                error: 'Error al crear producto',
                code: 'PRODUCT_CREATION_ERROR',
                timestamp: new Date().toISOString()
            });
        }
    }

    // PUT actualizar producto
    async updateProduct(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const { subcategory_ids, ...updates } = req.body;

            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            await product.update(updates);

            // Si cambió el codigo_interno, re-sincronizar precio y stock desde ERP
            const newCode = updates.codigo_interno?.trim();
            if (newCode && newCode !== product.getDataValue('codigo_interno')) {
                try {
                    const erpResult = await PeruanaInformaticaService.consultarArticulo(newCode);
                    if (erpResult?.success && erpResult.data) {
                        const articulo = erpResult.data;
                        const newStock = parseInt(articulo.stock) || 0;
                        const newPrice = parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.precio) || parseFloat(articulo.pre_cli) || 0;
                        if (newStock > 0 || newPrice > 0) {
                            await product.update({ stock: newStock, price: newPrice });
                        }
                    }
                } catch (erpErr) {
                    console.warn(`ERP sync skipped on update for ${newCode}:`, erpErr);
                }
            }

            // Actualizar subcategorías si se proporcionan
            if (subcategory_ids && Array.isArray(subcategory_ids)) {
                if (product.codigo_interno) {
                    await ProductSubCategory.destroy({
                        where: { product_codigo_interno: product.codigo_interno }
                    });

                    if (subcategory_ids.length > 0) {
                        const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                            product_codigo_interno: product.codigo_interno,
                            sub_category_id: subId
                        }));
                        await ProductSubCategory.bulkCreate(subcategoryRecords);
                    }
                }
            }

            res.json(product);
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ error: 'Error al actualizar producto' });
        }
    }

    // PATCH toggle active
    async toggleActive(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            await product.update({ is_active: !product.is_active });
            res.json({
                message: `Producto ${product.is_active ? 'activado' : 'desactivado'} correctamente`,
                is_active: product.is_active
            });
        } catch (error) {
            console.error('Error toggling product status:', error);
            res.status(500).json({ error: 'Error al cambiar estado del producto' });
        }
    }

    // DELETE eliminar producto
    async deleteProduct(req: Request, res: Response) {
        try {
            const productId = parseInt(req.params.id as string);
            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            // Eliminar imágenes asociadas primero
            if (product.codigo_interno) {
                await Image.destroy({
                    where: { codigo_interno: product.codigo_interno }
                });

                await ProductSubCategory.destroy({
                    where: { product_codigo_interno: product.codigo_interno }
                });
            }

            // Eliminar el producto
            await product.destroy();

            res.json({
                message: 'Producto eliminado correctamente',
                id: productId
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Error al eliminar producto' });
        }
    }

    // PATCH bulk update
    async bulkUpdate(req: Request, res: Response) {
        try {
            const { product_ids, subcategory_ids, ...updates } = req.body;

            // Filtrar campos permitidos para actualización masiva
            const allowedFields = ['category_id', 'brand_id', 'component_type', 'socket_type', 'ram_type', 'form_factor'];
            const cleanUpdates: any = {};

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key) && updates[key] !== undefined) {
                    cleanUpdates[key] = updates[key];
                }
            });

            let updatedCount = 0;

            // Actualizar campos de producto si hay alguno
            if (Object.keys(cleanUpdates).length > 0) {
                const [count] = await Product.update(cleanUpdates, {
                    where: {
                        cod_producto: {
                            [Op.in]: product_ids
                        }
                    }
                });
                updatedCount = count;
            }

            // Actualizar subcategorías si se proporcionaron
            if (subcategory_ids && Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
                // Obtener los productos con sus codigo_interno
                const products = await Product.findAll({
                    where: {
                        cod_producto: {
                            [Op.in]: product_ids
                        }
                    },
                    attributes: ['cod_producto', 'codigo_interno']
                });

                // Para cada producto, eliminar sus subcategorías actuales y agregar las nuevas
                for (const product of products) {
                    if (product.codigo_interno) {
                        // Eliminar subcategorías existentes
                        await ProductSubCategory.destroy({
                            where: {
                                product_codigo_interno: product.codigo_interno
                            }
                        });

                        // Agregar nuevas subcategorías
                        const subcategoryRecords = subcategory_ids.map((subId: number) => ({
                            product_codigo_interno: product.codigo_interno,
                            sub_category_id: subId
                        }));

                        await ProductSubCategory.bulkCreate(subcategoryRecords, {
                            ignoreDuplicates: true
                        });
                    }
                }

                // Si no hubo actualizaciones de campos, contar productos actualizados por subcategorías
                if (updatedCount === 0) {
                    updatedCount = products.length;
                }
            }

            if (Object.keys(cleanUpdates).length === 0 && (!subcategory_ids || subcategory_ids.length === 0)) {
                return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
            }

            res.json({
                message: 'Actualización masiva completada',
                updated: updatedCount
            });
        } catch (error) {
            console.error('Error in bulk update:', error);
            res.status(500).json({ error: 'Error al actualizar productos en bloque' });
        }
    }

    // GET brand-check — detecta productos con marca inconsistente respecto al nombre
    async brandCheck(req: Request, res: Response) {
        try {
            const [products, brands] = await Promise.all([
                Product.findAll({
                    attributes: ['cod_producto', 'name', 'brand_id'],
                    include: [{ model: Brand, as: 'productBrand', attributes: ['id', 'name'] }],
                    where: { is_active: true }
                }),
                Brand.findAll({ attributes: ['id', 'name'] })
            ]);

            // Normaliza: uppercase, sin guiones/puntos/espacios extras
            const normalize = (s: string) => s.toUpperCase().replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim();

            // Precompute normalized brand names and tokens
            const brandTokens = brands.map(b => ({
                id: b.id,
                name: b.name,
                normalized: normalize(b.name),
                // Also keep short 2-char brands (HP, LG) as exact tokens
                tokens: normalize(b.name).split(' ').filter(t => t.length >= 2)
            }));

            const inconsistencies: any[] = [];

            for (const product of products) {
                const productNameNorm = normalize(product.name || '');
                const currentBrand = (product as any).productBrand;
                const currentBrandId = currentBrand?.id || null;

                for (const bt of brandTokens) {
                    if (currentBrandId === bt.id) continue; // already assigned

                    // Match: all tokens of brand name must appear consecutively in product name
                    let matched = false;

                    // Strategy 1: exact normalized substring match
                    if (productNameNorm.includes(bt.normalized)) {
                        matched = true;
                    }

                    // Strategy 2: all tokens appear in product name (handles word reorder)
                    if (!matched && bt.tokens.length >= 2) {
                        const productTokens = productNameNorm.split(' ');
                        matched = bt.tokens.every(t => productTokens.includes(t));
                    }

                    // Strategy 3: single short brand (>=2 chars) as whole word
                    if (!matched && bt.tokens.length === 1) {
                        const token = bt.tokens[0] ?? '';
                        if (token.length >= 2) {
                            const re = new RegExp(`(^|\\s)${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
                            matched = re.test(productNameNorm);
                        }
                    }

                    if (matched) {
                        inconsistencies.push({
                            cod_producto: product.cod_producto,
                            name: product.name,
                            current_brand_id: currentBrandId,
                            current_brand_name: currentBrand?.name || 'Sin marca',
                            suggested_brand_id: bt.id,
                            suggested_brand_name: bt.name
                        });
                        break; // First match wins
                    }
                }
            }

            res.json({ total: inconsistencies.length, items: inconsistencies });
        } catch (error) {
            console.error('Error in brand-check:', error);
            res.status(500).json({ error: 'Error al analizar marcas' });
        }
    }

    // POST brand-fix — aplica correcciones de marca en lote (agrupado por brand_id)
    async brandFix(req: Request, res: Response) {
        try {
            const { fixes } = req.body; // [{ cod_producto, brand_id }]
            if (!Array.isArray(fixes) || fixes.length === 0) {
                return res.status(400).json({ error: 'Se requiere un array de correcciones' });
            }

            // Group by brand_id for bulk UPDATE per brand (much faster)
            const byBrand: Record<number, number[]> = {};
            for (const fix of fixes) {
                const { cod_producto, brand_id } = fix;
                if (!cod_producto || !brand_id) continue;
                if (!byBrand[brand_id]) byBrand[brand_id] = [];
                byBrand[brand_id].push(cod_producto);
            }

            let updated = 0;
            for (const [brandId, productIds] of Object.entries(byBrand)) {
                const [count] = await Product.update(
                    { brand_id: Number(brandId) },
                    { where: { cod_producto: { [Op.in]: productIds } } }
                );
                updated += count;
            }

            res.json({ success: true, updated });
        } catch (error) {
            console.error('Error in brand-fix:', error);
            res.status(500).json({ error: 'Error al corregir marcas' });
        }
    }

    // POST sync-all
    async syncAll(req: Request, res: Response) {
        try {
            // Obtener todos los productos
            const allProducts = await Product.findAll({
                attributes: ['cod_producto', 'codigo_interno', 'price', 'stock']
            });

            // Filtrar productos con código interno
            const products = allProducts.filter(p => p.codigo_interno && p.codigo_interno.trim() !== '');

            let updated = 0;
            let errors = 0;

            // Sincronizar cada producto
            for (const product of products) {
                try {
                    const erpResult = await PeruanaInformaticaService.consultarArticulo(String(product.codigo_interno));

                    if (erpResult && erpResult.success && erpResult.data) {
                        const articulo = erpResult.data;
                        const newStock = parseInt(articulo.stock) || 0;
                        const newPrice = parseFloat(articulo.precio_unitario_soles) || parseFloat(articulo.precio) || parseFloat(articulo.pre_cli) || product.price;

                        await Product.update(
                            { stock: newStock, price: newPrice },
                            { where: { cod_producto: product.cod_producto } }
                        );
                        updated++;
                    }
                } catch (err) {
                    errors++;
                    console.error(`Error syncing product ${product.codigo_interno}:`, err);
                }
            }

            res.json({
                message: 'Sincronización completada',
                total: products.length,
                updated,
                errors
            });
        } catch (error) {
            console.error('Error in sync-all:', error);
            res.status(500).json({ error: 'Error al sincronizar productos' });
        }
    }
}

export const productController = new ProductController();
