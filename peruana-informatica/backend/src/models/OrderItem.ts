import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';
import { Order } from './Order';
import { Product } from './Product';

export class OrderItem extends Model {
    public id!: number;
    public order_id!: number;
    public product_id!: number;
    public quantity!: number;
    public price!: number;
    public product_name!: string;
}

OrderItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Order,
                key: 'id',
            },
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // References removed to prevent errno 150 (type mismatch or index missing in products table)
        },
        product_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'order_items',
    }
);
