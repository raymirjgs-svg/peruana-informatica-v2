import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

export interface BrandAttributes {
  id?: number;
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Brand extends Model<BrandAttributes> implements BrandAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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

Brand.init(
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
  },
  {
    sequelize,
    tableName: 'brands',
    timestamps: true,
    underscored: true,
  }
);