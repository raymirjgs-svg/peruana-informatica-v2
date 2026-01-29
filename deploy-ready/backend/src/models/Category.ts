import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface CategoryAttributes {
  id?: number;
  name: string;
  slug: string;
  appears_in_menu?: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type CategoryCreationAttributes = Optional<CategoryAttributes, 'id' | 'appears_in_menu'>;

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public appears_in_menu!: boolean;
  public seo_title!: string | null;
  public seo_description!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Optional relation property used in routes
  // Optional relation property used in routes
  public products?: any[];

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

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    appears_in_menu: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    seo_title: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    seo_description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    underscored: true,
  }
);

// Associations are wired at server startup to avoid circular import issues.
// No direct imports of other models here to prevent circular dependencies.

export default Category;