import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface DiscountAttributes {
  id: number;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'category' | 'product';
  category_id?: number;
  product_id?: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface DiscountCreationAttributes extends Optional<DiscountAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> {}

class Discount extends Model<DiscountAttributes, DiscountCreationAttributes> implements DiscountAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public discount_type!: 'percentage' | 'fixed';
  public discount_value!: number;
  public applies_to!: 'all' | 'category' | 'product';
  public category_id?: number;
  public product_id?: number;
  public valid_from!: Date;
  public valid_until!: Date;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Discount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    applies_to: {
      type: DataTypes.ENUM('all', 'category', 'product'),
      allowNull: false,
      defaultValue: 'all',
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'discounts',
    timestamps: true,
    underscored: true,
  }
);

export default Discount;
