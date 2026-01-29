import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/connection';

// Junction table for Role-Permission many-to-many
export class RolePermission extends Model {
    public id!: number;
    public role_id!: number;
    public permission_id!: number;
}

RolePermission.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id',
            },
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'permissions',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'role_permissions',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['role_id', 'permission_id'],
            },
        ],
    }
);

// Update User model to add role relationship
export function setupRoleAssociations() {
    const { User } = require('./User');
    const { Role } = require('./Role');
    const { Permission } = require('./Permission');

    // User belongs to Role
    User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
    Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

    // Role has many Permissions (many-to-many)
    Role.belongsToMany(Permission, {
        through: RolePermission,
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'permissions',
    });

    Permission.belongsToMany(Role, {
        through: RolePermission,
        foreignKey: 'permission_id',
        otherKey: 'role_id',
        as: 'roles',
    });
}
