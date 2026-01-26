import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Product } from './Product';

// Tipos para las compatibilidades de componentes
interface ComponentCompatibilityAttributes {
  id: number;
  parent_component_type: string;
  parent_component_id: number;
  child_component_type: string;
  child_component_id: number;
  is_required: boolean;
  compatibility_notes?: string;
  created_at?: Date;
}

type ComponentCompatibilityCreationAttributes = Optional<ComponentCompatibilityAttributes, 'id' | 'is_required' | 'compatibility_notes' | 'created_at'>;

export class ComponentCompatibility extends Model<ComponentCompatibilityAttributes, ComponentCompatibilityCreationAttributes> implements ComponentCompatibilityAttributes {
  public id!: number;
  public parent_component_type!: string;
  public parent_component_id!: number;
  public child_component_type!: string;
  public child_component_id!: number;
  public is_required!: boolean;
  public compatibility_notes!: string;
  public created_at!: Date;
}

ComponentCompatibility.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parent_component_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  parent_component_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  child_component_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  child_component_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  compatibility_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'component_compatibilities',
  timestamps: false,
  underscored: true,
});

// Definir asociaciones
Product.hasMany(ComponentCompatibility, { 
  foreignKey: 'parent_component_id', 
  as: 'parentCompatibilities' 
});
ComponentCompatibility.belongsTo(Product, { 
  foreignKey: 'parent_component_id', 
  as: 'parentComponent' 
});

Product.hasMany(ComponentCompatibility, { 
  foreignKey: 'child_component_id', 
  as: 'childCompatibilities' 
});
ComponentCompatibility.belongsTo(Product, { 
  foreignKey: 'child_component_id', 
  as: 'childComponent' 
});