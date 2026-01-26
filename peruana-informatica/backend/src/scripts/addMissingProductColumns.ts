import { sequelize } from '../database/connection';
import { DataTypes } from 'sequelize';

async function addMissingProductColumns() {
    const queryInterface = sequelize.getQueryInterface();
    const tableName = 'products';

    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();

        const descriptions = await queryInterface.describeTable(tableName);
        console.log('📊 Current columns:', Object.keys(descriptions));

        const columnsToAdd = [
            { name: 'is_featured', type: DataTypes.BOOLEAN, defaultValue: false },
            { name: 'is_new', type: DataTypes.BOOLEAN, defaultValue: false },
            { name: 'is_clearance', type: DataTypes.BOOLEAN, defaultValue: false },
            { name: 'component_type', type: DataTypes.STRING(50), allowNull: true },
            { name: 'socket_type', type: DataTypes.STRING(50), allowNull: true },
            { name: 'ram_type', type: DataTypes.STRING(50), allowNull: true },
            { name: 'form_factor', type: DataTypes.STRING(50), allowNull: true },
            { name: 'tdp_watts', type: DataTypes.INTEGER, allowNull: true },
            { name: 'has_integrated_graphics', type: DataTypes.BOOLEAN, defaultValue: false },
            { name: 'component_specs', type: DataTypes.JSON, allowNull: true },
            { name: 'estado', type: DataTypes.STRING, defaultValue: 'activo', allowNull: true }
        ];

        for (const col of columnsToAdd) {
            if (!descriptions[col.name]) {
                console.log(`➕ Adding column: ${col.name}`);
                await queryInterface.addColumn(tableName, col.name, {
                    type: col.type,
                    defaultValue: col.defaultValue,
                    allowNull: col.allowNull
                });
            } else {
                console.log(`✅ Column ${col.name} already exists`);
            }
        }

        console.log('🎉 Columns added successfully!');

    } catch (error) {
        console.error('❌ Failed to add columns:', error);
    } finally {
        await sequelize.close();
    }
}

addMissingProductColumns();
