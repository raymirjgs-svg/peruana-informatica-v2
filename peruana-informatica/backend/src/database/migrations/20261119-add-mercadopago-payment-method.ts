import { QueryInterface, QueryTypes } from 'sequelize';

export const ORDERS_TABLE = 'orders';
export const PAYMENT_METHOD_COLUMN = 'payment_method';

/**
 * Todo el cobro pasa por Mercado Pago: el webhook escribe
 * `payment_method = 'mercadopago'`, pero el ENUM de la tabla `orders` en
 * produccion era:
 *
 *   enum('efectivo','transferencia','tarjeta','yape','plin')
 *
 * MySQL (modo STRICT) rechazaba el UPDATE con:
 *
 *   Data truncated for column 'payment_method'
 *
 * por lo que el pedido nunca llegaba a marcarse como pagado.
 *
 * Esta migracion agrega 'mercadopago' al ENUM. Es aditiva: los pedidos
 * historicos conservan su metodo de pago. No se usa sequelize.sync({ alter }).
 *
 * Los valores viejos se conservan a proposito: 11 pedidos historicos usan
 * 'transferencia', 'yape' o 'efectivo'.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
    const rows = (await queryInterface.sequelize.query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
        {
            replacements: { table: ORDERS_TABLE, column: PAYMENT_METHOD_COLUMN },
            type: QueryTypes.SELECT,
        }
    )) as unknown as Array<{ COLUMN_TYPE: string }>;

    const current: string = rows?.[0]?.COLUMN_TYPE || '';
    if (!current) return;
    if (current.includes("'mercadopago'")) return;

    // Reconstruye el ENUM agregando 'mercadopago' al final, sin tocar los
    // valores existentes.
    const values = current
        .replace(/^enum\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map((value: string) => value.trim().replace(/^'|'$/g, ''))
        .filter(Boolean);

    const next = [...values, 'mercadopago']
        .map((value: string) => `'${value}'`)
        .join(',');

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${ORDERS_TABLE}\` MODIFY \`${PAYMENT_METHOD_COLUMN}\` ENUM(${next}) NULL`
    );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    const rows = (await queryInterface.sequelize.query(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
        {
            replacements: { table: ORDERS_TABLE, column: PAYMENT_METHOD_COLUMN },
            type: QueryTypes.SELECT,
        }
    )) as unknown as Array<{ COLUMN_TYPE: string }>;

    const current: string = rows?.[0]?.COLUMN_TYPE || '';
    if (!current || !current.includes("'mercadopago'")) return;

    // Revertir solo es seguro si no hay pedidos con el metodo nuevo.
    const countRows = (await queryInterface.sequelize.query(
        `SELECT COUNT(*) AS total FROM \`${ORDERS_TABLE}\` WHERE \`${PAYMENT_METHOD_COLUMN}\` = 'mercadopago'`
    )) as unknown as Array<{ total: number }>;
    const total = Number(countRows?.[0]?.total || 0);
    if (total > 0) {
        throw new Error(
            `No se puede revertir: hay ${total} pedidos con payment_method='mercadopago'. ` +
            'Reasignalos a otro metodo antes de revertir.'
        );
    }

    const values = current
        .replace(/^enum\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map((value: string) => value.trim().replace(/^'|'$/g, ''))
        .filter((value: string) => value && value !== 'mercadopago')
        .map((value: string) => `'${value}'`)
        .join(',');

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${ORDERS_TABLE}\` MODIFY \`${PAYMENT_METHOD_COLUMN}\` ENUM(${values}) NULL`
    );
}
