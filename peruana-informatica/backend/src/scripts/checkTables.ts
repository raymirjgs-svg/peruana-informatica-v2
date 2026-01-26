import { sequelize, connectDatabase } from '../database/connection';

async function checkTables() {
    try {
        await connectDatabase();
        const tables = await sequelize.getQueryInterface().showAllSchemas();
        // showAllSchemas might return different structs depending on dialect
        // For MySQL, let's use raw query for certainty
        const [results] = await sequelize.query("SHOW TABLES");
        console.log("📊 Tablas en la base de datos:", results);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error verificando tablas:", error);
        process.exit(1);
    }
}

checkTables();
