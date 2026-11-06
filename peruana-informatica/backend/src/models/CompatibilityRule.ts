import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface CompatibilityRuleAttributes {
    id: number;
    rule_name: string;
    source_component_type: string;
    source_attribute_id: number;
    source_value_id: number;
    target_component_type: string;
    target_attribute_id: number;
    target_value_id: number;
    is_active: boolean;
    created_at?: Date;
}

interface CompatibilityRuleCreationAttributes extends Optional<CompatibilityRuleAttributes, 'id' | 'is_active' | 'created_at'> { }

class CompatibilityRule extends Model<CompatibilityRuleAttributes, CompatibilityRuleCreationAttributes> implements CompatibilityRuleAttributes {
    public id!: number;
    public rule_name!: string;
    public source_component_type!: string;
    public source_attribute_id!: number;
    public source_value_id!: number;
    public target_component_type!: string;
    public target_attribute_id!: number;
    public target_value_id!: number;
    public is_active!: boolean;

    public readonly created_at!: Date;
}

CompatibilityRule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        rule_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        source_component_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        source_attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attributes',
                key: 'id',
            },
        },
        source_value_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attribute_values',
                key: 'id',
            },
        },
        target_component_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        target_attribute_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attributes',
                key: 'id',
            },
        },
        target_value_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attribute_values',
                key: 'id',
            },
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'compatibility_rules',
        timestamps: false,
        indexes: [
            {
                fields: ['source_component_type', 'source_attribute_id'],
            },
            {
                fields: ['target_component_type', 'target_attribute_id'],
            },
        ],
    }
);

export { CompatibilityRule };
export type { CompatibilityRuleAttributes, CompatibilityRuleCreationAttributes };
