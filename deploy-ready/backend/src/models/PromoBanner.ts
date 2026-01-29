import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface PromoBannerAttributes {
    id: number;
    title: string;
    description?: string;
    image_url: string;
    coupon_code?: string;
    show_as_popup: boolean;
    popup_delay: number; // seconds before showing
    is_active: boolean;
    priority: number; // For ordering multiple banners
    created_at?: Date;
    updated_at?: Date;
}

interface PromoBannerCreationAttributes extends Optional<PromoBannerAttributes, 'id' | 'description' | 'coupon_code' | 'show_as_popup' | 'popup_delay' | 'priority' | 'created_at' | 'updated_at'> { }

class PromoBanner extends Model<PromoBannerAttributes, PromoBannerCreationAttributes> implements PromoBannerAttributes {
    public id!: number;
    public title!: string;
    public description?: string;
    public image_url!: string;
    public coupon_code?: string;
    public show_as_popup!: boolean;
    public popup_delay!: number;
    public is_active!: boolean;
    public priority!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

PromoBanner.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        coupon_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        show_as_popup: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        popup_delay: {
            type: DataTypes.INTEGER,
            defaultValue: 3, // 3 seconds
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
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
        tableName: 'promo_banners',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['is_active'],
            },
            {
                fields: ['priority'],
            },
        ],
    }
);

export { PromoBanner };
export type { PromoBannerAttributes, PromoBannerCreationAttributes };
