import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface CompanySettingsAttributes {
  id: number;
  company_name: string;
  company_ruc: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_whatsapp?: string;
  company_website?: string;
  store_address?: string;
  store_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  logo_url?: string;
  show_distributor_price_in_detail?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface CompanySettingsCreationAttributes extends Optional<CompanySettingsAttributes, 'id' | 'company_whatsapp' | 'company_website' | 'store_address' | 'store_hours' | 'facebook_url' | 'instagram_url' | 'twitter_url' | 'linkedin_url' | 'logo_url' | 'show_distributor_price_in_detail' | 'created_at' | 'updated_at'> { }

class CompanySettings extends Model<CompanySettingsAttributes, CompanySettingsCreationAttributes> implements CompanySettingsAttributes {
  public id!: number;
  public company_name!: string;
  public company_ruc!: string;
  public company_address!: string;
  public company_phone!: string;
  public company_email!: string;
  public company_whatsapp?: string;
  public company_website?: string;
  public store_address?: string;
  public store_hours?: string;
  public facebook_url?: string;
  public instagram_url?: string;
  public twitter_url?: string;
  public linkedin_url?: string;
  public logo_url?: string;
  public show_distributor_price_in_detail?: boolean;
  public readonly created_at?: Date;
  public readonly updated_at?: Date;
}

CompanySettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Peruana Informática',
    },
    company_ruc: {
      type: DataTypes.STRING(11),
      allowNull: false,
      defaultValue: '20123456789',
    },
    company_address: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: 'Av. Principal 123, Lima - Perú',
    },
    company_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '(01) 123-4567',
    },
    company_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'ventas@peruanainformatica.com',
    },
    company_whatsapp: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    company_website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    store_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: 'Av. Principal 123, Lima - Perú',
    },
    store_hours: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM',
    },
    facebook_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    instagram_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    twitter_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    show_distributor_price_in_detail: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'company_settings',
    timestamps: true,
    underscored: true,
  }
);

export { CompanySettings };
