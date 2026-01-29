import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface ReviewAttributes {
    id: number;
    product_id: number;
    user_id?: number;
    customer_name: string;
    customer_email: string;
    rating: number; // 1-5 stars
    title: string;
    comment: string;
    verified_purchase: boolean;
    helpful_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at?: Date;
    updated_at?: Date;
}

interface ReviewCreationAttributes extends Optional<ReviewAttributes, 'id' | 'user_id' | 'helpful_count' | 'status' | 'verified_purchase' | 'created_at' | 'updated_at'> { }

class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
    public id!: number;
    public product_id!: number;
    public user_id?: number;
    public customer_name!: string;
    public customer_email!: string;
    public rating!: number;
    public title!: string;
    public comment!: string;
    public verified_purchase!: boolean;
    public helpful_count!: number;
    public status!: 'pending' | 'approved' | 'rejected';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Review.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        customer_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        customer_email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        verified_purchase: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        helpful_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
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
        tableName: 'reviews',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['product_id'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['rating'],
            },
        ],
    }
);

export { Review };
export type { ReviewAttributes, ReviewCreationAttributes };
