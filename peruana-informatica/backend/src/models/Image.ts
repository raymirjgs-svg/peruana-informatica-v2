import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface ImageAttributes {
  cod_galeria: number;
  cod_producto: number | null;
  codigo_interno: string | null;
  imagen: string | null;
}

export type ImageCreationAttributes = Optional<ImageAttributes, 'cod_galeria' | 'cod_producto' | 'codigo_interno' | 'imagen'>;

export class Image extends Model<ImageAttributes, ImageCreationAttributes> implements ImageAttributes {
  public cod_galeria!: number;
  public cod_producto!: number | null;
  public codigo_interno!: string | null;
  public imagen!: string | null;
}

Image.init(
  {
    cod_galeria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cod_producto: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    codigo_interno: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imagen: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'img_products',
    timestamps: false,
  }
);

export default Image;