import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export class Role extends Model {
    public id!: number;
    public name!: string;
    public slug!: string;
    public description?: string;
    public is_default!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Role.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'roles',
        timestamps: true,
        underscored: true,
    }
);
