import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

export interface AnnouncementAttributes {
  id?: number;
  icon: string;
  text: string;
  order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Announcement extends Model<AnnouncementAttributes> implements AnnouncementAttributes {
  public id!: number;
  public icon!: string;
  public text!: string;
  public order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Announcement.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    icon: { type: DataTypes.STRING(10), allowNull: false, defaultValue: '📢' },
    text: { type: DataTypes.STRING(255), allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'announcements',
    timestamps: true,
    underscored: true,
  }
);
