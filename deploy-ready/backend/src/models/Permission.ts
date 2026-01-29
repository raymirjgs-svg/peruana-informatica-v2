import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export class Permission extends Model {
    public id!: number;
    public name!: string;
    public slug!: string;
    public module!: string;
    public description?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Permission.init(
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
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        module: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Module this permission belongs to (products, orders, users, etc.)'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'permissions',
        timestamps: true,
        underscored: true,
    }
);
