import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

interface PageAttributes {
    id?: number;
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    meta_title?: string;
    meta_description?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class Page extends Model<PageAttributes> implements PageAttributes {
    public id!: number;
    public title!: string;
    public slug!: string;
    public content!: string;
    public is_published!: boolean;
    public meta_title?: string;
    public meta_description?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Page.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        content: {
            type: DataTypes.TEXT('long'), // Use LONGTEXT for rich HTML content
            allowNull: false,
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        meta_title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        meta_description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'pages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);
