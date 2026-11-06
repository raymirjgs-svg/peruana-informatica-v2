import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';
import { User } from './User';

export class Cart extends Model {
    public id!: number;
    public user_id!: number;
    public status!: string; // 'active', 'converted', 'abandoned'

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Cart.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active',
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'carts',
    }
);
