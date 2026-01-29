import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface AttributeValueAttributes {
    id: number;
    attribute_id: number;
    value: string;
    code: string;
    display_order: number;
    created_at?: Date;
}

interface AttributeValueCreationAttributes extends Optional<AttributeValueAttributes, 'id' | 'display_order' | 'created_at'> { }

class AttributeValue extends Model<AttributeValueAttributes, AttributeValueCreationAttributes> implements AttributeValueAttributes {
    public id!: number;
    public attribute_id!: number;
    public value!: string;
    public code!: string;
    public display_order!: number;

    public readonly created_at!: Date;
}

AttributeValue.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        value: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'attribute_values',
        timestamps: false,
        indexes: [
            {
                fields: ['attribute_id'],
            },
        ],
    }
);

export { AttributeValue };
export type { AttributeValueAttributes, AttributeValueCreationAttributes };
