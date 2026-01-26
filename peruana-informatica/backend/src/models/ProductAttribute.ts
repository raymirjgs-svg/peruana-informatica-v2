import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface ProductAttributeAttributes {
    id: number;
    product_id: number;
    attribute_id: number;
    value_id?: number;
    value_text?: string;
    value_number?: number;
    value_boolean?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

interface ProductAttributeCreationAttributes extends Optional<ProductAttributeAttributes, 'id' | 'value_id' | 'value_text' | 'value_number' | 'value_boolean' | 'created_at' | 'updated_at'> { }

class ProductAttribute extends Model<ProductAttributeAttributes, ProductAttributeCreationAttributes> implements ProductAttributeAttributes {
    public id!: number;
    public product_id!: number;
    public attribute_id!: number;
    public value_id?: number;
    public value_text?: string;
    public value_number?: number;
    public value_boolean?: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

ProductAttribute.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attributes',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        value_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'attribute_values',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        value_text: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        value_number: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        value_boolean: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
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
        tableName: 'product_attributes',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['product_id', 'attribute_id'],
            },
            {
                fields: ['product_id'],
            },
            {
                fields: ['attribute_id'],
            },
        ],
    }
);

export { ProductAttribute };
export type { ProductAttributeAttributes, ProductAttributeCreationAttributes };
