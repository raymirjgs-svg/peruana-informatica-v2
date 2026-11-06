import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

export interface QuickCategoryAttributes {
  id?: number;
  icon: string;
  label: string;
  href: string;
  order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class QuickCategory extends Model<QuickCategoryAttributes> implements QuickCategoryAttributes {
  public id!: number;
  public icon!: string;
  public label!: string;
  public href!: string;
  public order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

QuickCategory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    icon: { type: DataTypes.STRING(10), allowNull: false, defaultValue: '📦' },
    label: { type: DataTypes.STRING(60), allowNull: false },
    href: { type: DataTypes.STRING(255), allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'quick_categories',
    timestamps: true,
    underscored: true,
  }
);
