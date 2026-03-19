/**
 * Safe column migrations — runs at backend startup.
 * Adds missing columns WITHOUT touching existing data or structure.
 * Safe to run multiple times (idempotent).
 */
import { Sequelize } from 'sequelize';

interface ColumnMigration {
  table: string;
  column: string;
  definition: string; // SQL type + constraints
}

const MIGRATIONS: ColumnMigration[] = [
  // Carousel customization (added 2026-03-14)
  { table: 'carousel', column: 'show_title',       definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { table: 'carousel', column: 'show_description', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { table: 'carousel', column: 'show_button',      definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { table: 'carousel', column: 'text_position',    definition: "ENUM('left','center','right') NOT NULL DEFAULT 'left'" },
  { table: 'carousel', column: 'title_size',       definition: "ENUM('sm','md','lg','xl') NOT NULL DEFAULT 'lg'" },
];

export async function runMigrations(sequelize: Sequelize, dbName: string): Promise<void> {
  let applied = 0;
  let skipped = 0;

  for (const m of MIGRATIONS) {
    try {
      const [rows]: any = await sequelize.query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
        { replacements: { db: dbName, table: m.table, column: m.column } }
      );

      const exists = rows[0]?.cnt > 0;

      if (!exists) {
        await sequelize.query(
          `ALTER TABLE \`${m.table}\` ADD COLUMN \`${m.column}\` ${m.definition}`
        );
        console.log(`  ✅ Migration: added \`${m.table}\`.\`${m.column}\``);
        applied++;
      } else {
        skipped++;
      }
    } catch (err: any) {
      console.error(`  ❌ Migration failed for \`${m.table}\`.\`${m.column}\`: ${err.message}`);
    }
  }

  if (applied > 0) {
    console.log(`🔄 Migrations: ${applied} applied, ${skipped} already exist.`);
  } else {
    console.log(`✅ Migrations: all ${skipped} columns already exist.`);
  }
}
