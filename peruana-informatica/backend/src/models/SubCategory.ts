import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface SubCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  category_id?: number | null;
  description?: string | null;
  order?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type SubCategoryCreationAttributes = Optional<
  SubCategoryAttributes,
  'id' | 'category_id' | 'order' | 'is_active' | 'created_at' | 'updated_at'
>;

export class SubCategory extends Model<SubCategoryAttributes, SubCategoryCreationAttributes> implements SubCategoryAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public category_id!: number | null;
  public description!: string | null;
  public order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Relación con Category (se define en server.ts para evitar dependencias circulares)
  // Relación con Category (se define en server.ts para evitar dependencias circulares)
  public category?: any;

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

SubCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Relación con la tabla categories'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'sub_categories',
    timestamps: true,
    underscored: true,
  }
);

export default SubCategory;