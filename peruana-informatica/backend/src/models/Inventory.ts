import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface InventoryAttributes {
  id: number;
  product_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location?: string;
  last_restocked?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public product_id!: number;
  public quantity!: number;
  public min_stock!: number;
  public max_stock!: number;
  public location?: string;
  public last_restocked?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    max_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_restocked: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'inventory',
    timestamps: true,
    underscored: true,
  }
);

export default Inventory;
