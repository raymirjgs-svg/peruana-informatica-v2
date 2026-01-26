import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface AttributeAttributes {
    id: number;
    name: string;
    code: string;
    component_type: string;
    input_type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
    is_filterable: boolean;
    is_required: boolean;
    display_order: number;
    unit?: string;
    created_at?: Date;
}

interface AttributeCreationAttributes extends Optional<AttributeAttributes, 'id' | 'is_filterable' | 'is_required' | 'display_order' | 'unit' | 'created_at'> { }

class Attribute extends Model<AttributeAttributes, AttributeCreationAttributes> implements AttributeAttributes {
    public id!: number;
    public name!: string;
    public code!: string;
    public component_type!: string;
    public input_type!: 'text' | 'number' | 'select' | 'boolean' | 'multiselect';
    public is_filterable!: boolean;
    public is_required!: boolean;
    public display_order!: number;
    public unit?: string;

    public readonly created_at!: Date;
}

Attribute.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        component_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        input_type: {
            type: DataTypes.ENUM('text', 'number', 'select', 'boolean', 'multiselect'),
            allowNull: false,
        },
        is_filterable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'attributes',
        timestamps: false,
        indexes: [
            {
                fields: ['component_type'],
            },
            {
                unique: true,
                fields: ['code'],
            },
        ],
    }
);

export { Attribute };
export type { AttributeAttributes, AttributeCreationAttributes };
