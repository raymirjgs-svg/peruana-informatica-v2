import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Image } from './Image';
import { SubCategory } from './SubCategory';
import { ProductSubCategory } from './ProductSubCategory';
import { Brand } from './Brand';
import { Category } from './Category';

export interface ProductAttributes {
  cod_producto?: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number | string;
  price_dis?: number | string;
  price_cot?: number | string;
  price_web?: number | string;
  stock?: number;
  category?: string;
  image?: string;
  keywords?: string;
  brand_id?: number | null;
  category_id?: number | null;
  is_active?: boolean;
  estado?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  codigo_interno?: string;
  average_rating?: number;
  review_count?: number;
  created_at?: Date;
  updated_at?: Date;
  // Compatibility fields
  component_type?: string;
  socket_type?: string;
  ram_type?: string;
  form_factor?: string;
  tdp_watts?: number;
  has_integrated_graphics?: boolean;
  component_specs?: any;
  is_featured?: boolean;
  is_new?: boolean;
  is_clearance?: boolean;
}

export type ProductCreationAttributes = Optional<
  ProductAttributes,
  'cod_producto' | 'short_description' | 'stock' | 'category' | 'image' | 'keywords' | 'brand_id' | 'category_id' | 'is_active' | 'estado' | 'seo_title' | 'seo_description' | 'codigo_interno' | 'created_at' | 'updated_at' | 'component_type' | 'socket_type' | 'ram_type' | 'form_factor' | 'tdp_watts' | 'has_integrated_graphics' | 'component_specs' | 'is_featured' | 'is_new' | 'is_clearance'
>;

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public cod_producto!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public short_description!: string;
  public price!: number | string;
  public price_dis!: number | string;
  public price_cot!: number | string;
  public price_web!: number | string;
  public stock!: number;
  public category!: string;
  public image!: string;
  public keywords!: string;
  public brand_id!: number | null;
  public category_id!: number | null;
  public is_active!: boolean;
  public estado!: string;
  public seo_title!: string | null;
  public seo_description!: string | null;
  public codigo_interno!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Compatibility fields
  public component_type!: string;
  public socket_type!: string;
  public ram_type!: string;
  public form_factor!: string;
  public tdp_watts!: number;
  public has_integrated_graphics!: boolean;
  public component_specs!: any;
  public is_featured!: boolean;
  public is_new!: boolean;
  public is_clearance!: boolean;

  // Association with images
  public readonly images?: Image[];

  // Helper method to generate slug
  public static generateSlug(name: string): string {
    if (!name) return '';
    return name
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

Product.init(
  {
    cod_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'  // Database uses 'id' as primary key, but we map it to cod_producto in the model
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name'
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'slug'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'description'
    },
    short_description: {
      type: DataTypes.STRING(500),
      field: 'short_description'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'pre_cli'  // Main price (Client)
    },
    price_dis: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'pre_dis'
    },
    price_cot: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'pre_cot'
    },
    price_web: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'pre_web'
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'stock'
    },
    category: {
      type: DataTypes.STRING,
      field: 'category'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image'
    },
    keywords: {
      type: DataTypes.STRING,
      field: 'keywords'
    },
    seo_title: {
      type: DataTypes.STRING(160),
      allowNull: true,
      field: 'seo_title'
    },
    seo_description: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'seo_description'
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'brand_id'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'activo',
      field: 'estado'
    },
    codigo_interno: {
      type: DataTypes.STRING(50),
      unique: true,
      field: 'codigo_interno'
    },
    average_rating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0.0,
      field: 'average_rating'
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'review_count'
    },
    // Compatibility fields for PC Builder
    component_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'component_type'
    },
    socket_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'socket_type'
    },
    ram_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ram_type'
    },
    form_factor: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'form_factor'
    },
    tdp_watts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'tdp_watts'
    },
    has_integrated_graphics: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_integrated_graphics'
    },
    component_specs: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'component_specs'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_new'
    },
    is_clearance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_clearance'
    }
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true, // La tabla tiene created_at y updated_at
    underscored: true,
    hooks: {
      beforeSave: (product: Product) => {
        // Generate slug if it doesn't exist or if name has changed
        if (!product.slug || (product.changed('name') && product.name)) {
          product.slug = Product.generateSlug(product.name);
        }
      }
    }
  }
);

// Define associations
// La tabla img_products usa codigo_interno para relacionarse con products.codigo_interno
Product.hasMany(Image, {
  foreignKey: 'codigo_interno',
  sourceKey: 'codigo_interno',
  as: 'images'
});

Image.belongsTo(Product, {
  foreignKey: 'codigo_interno',
  targetKey: 'codigo_interno',
  as: 'product'
});

// Associations with Brand and Category
Product.belongsTo(Brand, {
  foreignKey: 'brand_id',
  as: 'productBrand'
});

Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'productCategory'
});

// Add associations with subcategories

// Add associations with subcategories
Product.belongsToMany(SubCategory, {
  through: ProductSubCategory,
  foreignKey: 'product_codigo_interno',
  otherKey: 'sub_category_id',
  sourceKey: 'codigo_interno', // Important: Link via codigo_interno, not id
  as: 'subCategories'
});

SubCategory.belongsToMany(Product, {
  through: ProductSubCategory,
  foreignKey: 'sub_category_id',
  otherKey: 'product_codigo_interno',
  targetKey: 'codigo_interno', // Important: Link via codigo_interno, not id
  as: 'products'
});

export default Product;