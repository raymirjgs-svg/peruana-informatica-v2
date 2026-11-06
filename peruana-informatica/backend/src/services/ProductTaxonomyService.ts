import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import Product from '../models/Product';
import { ProductSubCategory } from '../models/ProductSubCategory';

/**
 * Servicio para gestionar la asignación de marcas, categorías y subcategorías a productos
 */
export class ProductTaxonomyService {
    /**
     * Busca o crea una marca por nombre
     * @param brandName Nombre de la marca
     * @returns Marca encontrada o creada
     */
    static async findOrCreateBrand(brandName: string): Promise<Brand | null> {
        if (!brandName || brandName.trim() === '') {
            return null;
        }

        const normalizedName = brandName.trim();
        const slug = this.generateSlug(normalizedName);

        // Buscar marca existente (case-insensitive)
        let brand = await Brand.findOne({
            where: {
                name: {
                    [require('sequelize').Op.iLike]: normalizedName
                }
            }
        });

        // Si no existe, crearla
        if (!brand) {
            brand = await Brand.create({
                name: normalizedName,
                slug
            });
            console.log(`✓ Marca creada: ${normalizedName}`);
        }

        return brand;
    }

    /**
     * Busca o crea una categoría por nombre
     * @param categoryName Nombre de la categoría
     * @returns Categoría encontrada o creada
     */
    static async findOrCreateCategory(categoryName: string): Promise<Category | null> {
        if (!categoryName || categoryName.trim() === '') {
            return null;
        }

        const normalizedName = categoryName.trim();
        const slug = this.generateSlug(normalizedName);

        // Buscar categoría existente (case-insensitive)
        let category = await Category.findOne({
            where: {
                name: {
                    [require('sequelize').Op.iLike]: normalizedName
                }
            }
        });

        // Si no existe, crearla
        if (!category) {
            category = await Category.create({
                name: normalizedName,
                slug,
                description: `Productos de la categoría ${normalizedName}`,
                is_active: true
            } as any);
            console.log(`✓ Categoría creada: ${normalizedName}`);
        }

        return category;
    }

    /**
     * Busca o crea una subcategoría por nombre
     * @param subCategoryName Nombre de la subcategoría
     * @param categoryId ID de la categoría padre (opcional)
     * @returns Subcategoría encontrada o creada
     */
    static async findOrCreateSubCategory(
        subCategoryName: string,
        categoryId?: number
    ): Promise<SubCategory | null> {
        if (!subCategoryName || subCategoryName.trim() === '') {
            return null;
        }

        const normalizedName = subCategoryName.trim();
        const slug = this.generateSlug(normalizedName);

        // Buscar subcategoría existente
        const where: any = {
            name: {
                [require('sequelize').Op.iLike]: normalizedName
            }
        };

        if (categoryId) {
            where.category_id = categoryId;
        }

        let subCategory = await SubCategory.findOne({ where });

        // Si no existe, crearla
        if (!subCategory) {
            subCategory = await SubCategory.create({
                name: normalizedName,
                slug,
                description: `Productos de ${normalizedName}`,
                category_id: categoryId || null,
                is_active: true
            } as any);
            console.log(`✓ Subcategoría creada: ${normalizedName}`);
        }

        return subCategory;
    }

    /**
     * Asigna marca, categoría y subcategorías a un producto
     * @param productId ID del producto
     * @param brandName Nombre de la marca
     * @param categoryName Nombre de la categoría
     * @param subCategoryNames Array de nombres de subcategorías
     * @returns Producto actualizado
     */
    static async assignTaxonomy(
        productId: number,
        brandName?: string,
        categoryName?: string,
        subCategoryNames?: string[]
    ) {
        const producto = await Product.findByPk(productId);

        if (!producto) {
            throw new Error(`Producto ${productId} no encontrado`);
        }

        const updates: any = {};

        // Asignar marca
        if (brandName) {
            const brand = await this.findOrCreateBrand(brandName);
            if (brand) {
                updates.brand_id = brand.id;
            }
        }

        // Asignar categoría
        if (categoryName) {
            const category = await this.findOrCreateCategory(categoryName);
            if (category) {
                updates.category_id = category.id;
            }
        }

        // Actualizar producto si hay cambios
        if (Object.keys(updates).length > 0) {
            await producto.update(updates);
        }

        // Asignar subcategorías
        if (subCategoryNames && subCategoryNames.length > 0 && producto.codigo_interno) {
            // Eliminar subcategorías existentes
            await ProductSubCategory.destroy({
                where: { product_codigo_interno: producto.codigo_interno }
            });

            // Crear nuevas asociaciones
            for (const subCatName of subCategoryNames) {
                const subCategory = await this.findOrCreateSubCategory(
                    subCatName,
                    updates.category_id
                );

                if (subCategory) {
                    await ProductSubCategory.create({
                        product_codigo_interno: producto.codigo_interno,
                        sub_category_id: subCategory.id
                    } as any);
                }
            }
        }

        // Recargar producto con relaciones
        return await Product.findByPk(productId, {
            include: [
                { model: Brand, as: 'productBrand', attributes: ['id', 'name', 'slug'] },
                { model: Category, as: 'productCategory', attributes: ['id', 'name', 'slug'] },
                { model: SubCategory, as: 'subCategories', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
            ]
        });
    }

    /**
     * Asigna taxonomía a un producto usando codigo_interno
     * @param codigoInterno Código interno del producto
     * @param brandName Nombre de la marca
     * @param categoryName Nombre de la categoría
     * @param subCategoryNames Array de nombres de subcategorías
     */
    static async assignTaxonomyByCode(
        codigoInterno: string,
        brandName?: string,
        categoryName?: string,
        subCategoryNames?: string[]
    ) {
        const producto = await Product.findOne({
            where: { codigo_interno: codigoInterno }
        });

        if (!producto) {
            throw new Error(`Producto con código ${codigoInterno} no encontrado`);
        }

        return await this.assignTaxonomy(
            producto.cod_producto,
            brandName,
            categoryName,
            subCategoryNames
        );
    }

    /**
     * Obtiene todas las marcas
     */
    static async getAllBrands() {
        return await Brand.findAll({
            attributes: ['id', 'name', 'slug', 'is_active'],
            order: [['name', 'ASC']]
        });
    }

    /**
     * Obtiene todas las categorías
     */
    static async getAllCategories() {
        return await Category.findAll({
            attributes: ['id', 'name', 'slug', 'is_active'],
            order: [['name', 'ASC']]
        });
    }

    /**
     * Obtiene todas las subcategorías
     * @param categoryId ID de categoría para filtrar (opcional)
     */
    static async getAllSubCategories(categoryId?: number) {
        const where: any = {};
        if (categoryId) {
            where.category_id = categoryId;
        }

        return await SubCategory.findAll({
            where,
            attributes: ['id', 'name', 'slug', 'category_id', 'is_active'],
            order: [['name', 'ASC']]
        });
    }

    /**
     * Genera un slug a partir de un texto
     */
    private static generateSlug(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9\s-]/g, '')    // Eliminar caracteres especiales
            .replace(/\s+/g, '-')            // Reemplazar espacios por guiones
            .replace(/-+/g, '-')             // Eliminar guiones múltiples
            .replace(/^-|-$/g, '');          // Eliminar guiones al inicio/fin
    }

    /**
     * Sincroniza taxonomía desde datos de API externa
     * @param apiData Datos del artículo de la API
     * @param codigoInterno Código interno del producto
     */
    static async syncTaxonomyFromAPI(apiData: any, codigoInterno: string) {
        const brandName = apiData.marca || apiData.brand || apiData.fabricante;
        const categoryName = apiData.categoria || apiData.category || apiData.linea;
        const subCategoryName = apiData.subcategoria || apiData.sub_category || apiData.familia;

        const subCategoryNames = subCategoryName ? [subCategoryName] : undefined;

        return await this.assignTaxonomyByCode(
            codigoInterno,
            brandName,
            categoryName,
            subCategoryNames
        );
    }
}
