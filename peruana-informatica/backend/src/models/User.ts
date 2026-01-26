import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';
import bcrypt from 'bcryptjs';

export class User extends Model {
    public id!: number;
    public email!: string;
    public password_hash!: string;
    public first_name!: string;
    public last_name!: string;
    public phone?: string;
    public role!: string; // 'customer', 'admin' (future proofing)
    public google_id?: string | null;
    public auth_provider!: string;
    public is_blocked!: boolean;
    public last_login?: Date;
    public reset_token?: string;
    public reset_token_expiry?: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Instance method to check password
    public async validatePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password_hash);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: true, // Allow null for Google users
        },
        first_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING(20),
            defaultValue: 'customer',
            allowNull: false,
        },
        google_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        auth_provider: {
            type: DataTypes.STRING(20),
            defaultValue: 'local', // 'local' or 'google'
            allowNull: false,
        },
        is_blocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reset_token: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        reset_token_expiry: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users'
    }
);
