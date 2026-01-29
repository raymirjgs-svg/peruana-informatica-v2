import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface ProductSubCategoryAttributes {
  id: number;
  product_codigo_interno: string;
  sub_category_id: number;
  created_at?: Date;
}

type ProductSubCategoryCreationAttributes = Optional<ProductSubCategoryAttributes, 'id' | 'created_at'>;

export class ProductSubCategory extends Model<ProductSubCategoryAttributes, ProductSubCategoryCreationAttributes> implements ProductSubCategoryAttributes {
  public id!: number;
  public product_codigo_interno!: string;
  public sub_category_id!: number;
  public created_at!: Date;
}

ProductSubCategory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_codigo_interno: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'products',
      key: 'codigo_interno',
    },
    onDelete: 'CASCADE',
  },
  sub_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sub_categories',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'product_sub_categories',
  timestamps: false,
  underscored: true,
});

export default ProductSubCategory;