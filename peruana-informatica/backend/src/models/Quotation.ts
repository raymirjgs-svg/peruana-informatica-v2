import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

// Tipos para la cotización
interface QuotationAttributes {
  id: number;
  code: string;
  subtotal: number;
  igv: number;
  total: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_ruc?: string;
  client_address?: string;
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: Date;
  created_at?: Date;
  updated_at?: Date;
}

type QuotationCreationAttributes = Optional<QuotationAttributes, 'id' | 'created_at' | 'updated_at'>;

export class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
  public id!: number;
  public code!: string;
  public subtotal!: number;
  public igv!: number;
  public total!: number;
  public client_name!: string;
  public client_email!: string;
  public client_phone!: string;
  public client_company!: string;
  public client_ruc!: string;
  public client_address!: string;
  public status!: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  public valid_until!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

Quotation.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  igv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  client_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  client_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  client_company: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  client_ruc: {
    type: DataTypes.STRING(11),
    allowNull: true,
  },
  client_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'accepted', 'rejected', 'expired'),
    defaultValue: 'pending',
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'quotations',
  timestamps: true,
  underscored: true,
});