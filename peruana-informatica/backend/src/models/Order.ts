import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export class Order extends Model {
    public id!: number;
    public customer_name!: string;
    public customer_email!: string;
    public customer_phone!: string;
    public customer_document?: string;
    public user_id?: number; // Relación con usuario registrado
    public total_amount!: number;
    public status!: string; // 'pending', 'processed', 'cancelled'

    // Payment fields
    public payment_method?: string; // 'efectivo', 'transferencia', 'tarjeta', 'yape', 'plin'
    public payment_status!: string; // 'pending', 'verified', 'rejected'
    public payment_proof?: string;
    public payment_verified_at?: Date;
    public payment_verified_by?: string;

    // Card payment fields (solo últimos 4 dígitos por seguridad PCI)
    public card_last_four?: string;
    public card_type?: string; // 'visa', 'mastercard', 'amex'
    public card_holder?: string;

    // Invoice fields
    public invoice_type!: string; // 'boleta', 'factura'
    public invoice_number?: string;
    public invoice_file?: string;
    public ruc?: string;
    public business_name?: string;
    public tax_address?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Order.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        customer_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        customer_email: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        customer_phone: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        customer_document: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            }
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'pending',
        },
        payment_method: {
            type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta', 'yape', 'plin'),
            allowNull: true,
        },
        payment_status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        payment_proof: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        payment_verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        payment_verified_by: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        card_last_four: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        card_type: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        card_holder: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        invoice_type: {
            type: DataTypes.ENUM('boleta', 'factura'),
            allowNull: false,
            defaultValue: 'boleta',
        },
        invoice_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        invoice_file: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        ruc: {
            type: DataTypes.STRING(11),
            allowNull: true,
        },
        business_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        tax_address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

    },
    {
        sequelize,
        tableName: 'orders',
    }
);
