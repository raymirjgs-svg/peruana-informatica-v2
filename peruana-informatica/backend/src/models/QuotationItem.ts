import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Quotation } from './Quotation';
import { Product } from './Product';

// Tipos para los items de cotización
interface QuotationItemAttributes {
  id: number;
  quotation_id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  created_at?: Date;
}

type QuotationItemCreationAttributes = Optional<QuotationItemAttributes, 'id' | 'created_at'>;

export class QuotationItem extends Model<QuotationItemAttributes, QuotationItemCreationAttributes> implements QuotationItemAttributes {
  public id!: number;
  public quotation_id!: number;
  public product_id!: number;
  public product_name!: string;
  public product_price!: number;
  public quantity!: number;
  public subtotal!: number;
  public created_at!: Date;
}

QuotationItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quotation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quotations',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  product_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'quotation_items',
  timestamps: false,
  underscored: true,
});

// Definir asociaciones
Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });

QuotationItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });