import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface WishlistAttributes {
    id: number;
    user_id: number;
    product_id: number;
    created_at?: Date;
}

interface WishlistCreationAttributes extends Optional<WishlistAttributes, 'id' | 'created_at'> { }

class Wishlist extends Model<WishlistAttributes, WishlistCreationAttributes> implements WishlistAttributes {
    public id!: number;
    public user_id!: number;
    public product_id!: number;
    public readonly created_at!: Date;
}

Wishlist.init(
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
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'wishlists',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'product_id'], // Prevent duplicates
            },
            {
                fields: ['user_id'],
            },
        ],
    }
);

export { Wishlist };
export type { WishlistAttributes, WishlistCreationAttributes };
