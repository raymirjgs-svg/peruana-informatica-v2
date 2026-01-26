import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

export interface CarouselAttributes {
  id?: number;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Carousel extends Model<CarouselAttributes> implements CarouselAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public buttonText!: string;
  public buttonUrl!: string;
  public backgroundColor!: string;
  public imageUrl?: string;
  public isActive!: boolean;
  public order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Carousel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    buttonText: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    buttonUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    backgroundColor: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'from-blue-500 to-blue-700',
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'carousel',
    timestamps: true,
    underscored: true,
  }
);
