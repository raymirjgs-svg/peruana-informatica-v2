import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export class CartItem extends Model {
    public id!: number;
    public cart_id!: number;
    public product_id!: number;
    public quantity!: number;

    // Snapshot prices (optional, to track price at time of add)
    public price_at_add?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CartItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cart_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'carts',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // References product table (assumed 'products')
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        price_at_add: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    },
    {
        sequelize,
        tableName: 'cart_items',
    }
);
