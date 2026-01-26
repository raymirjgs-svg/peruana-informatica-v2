import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export class Setting extends Model {
    public key!: string;
    public value!: string;
}

Setting.init(
    {
        key: {
            type: DataTypes.STRING(50),
            primaryKey: true,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'settings',
        timestamps: false,
    }
);
