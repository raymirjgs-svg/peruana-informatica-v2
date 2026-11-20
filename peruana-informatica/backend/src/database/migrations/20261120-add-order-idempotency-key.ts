import { DataTypes, QueryInterface } from 'sequelize';

export const ORDERS_TABLE = 'orders';
export const IDEMPOTENCY_COLUMN = 'idempotency_key';
export const IDEMPOTENCY_INDEX = 'uq_orders_idempotency_key';

/**
 * Evita pedidos duplicados por doble clic o reintentos del navegador.
 *
 * El cliente genera una clave por intento de compra y la envia en cada
 * reintento. Si la clave ya existe, el servidor devuelve el pedido creado en
 * lugar de crear otro.
 *
 * La columna es NULLABLE y con indice UNIQUE: MySQL permite varios NULL en
 * un indice unico, asi que los pedidos sin clave (ERP, importaciones o uso
 * directo de la API) siguen funcionando.
 *
 * No se usa sequelize.sync({ alter: true }).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
    const columns = await queryInterface.describeTable(ORDERS_TABLE);

    if (!columns[IDEMPOTENCY_COLUMN]) {
        await queryInterface.addColumn(ORDERS_TABLE, IDEMPOTENCY_COLUMN, {
            type: DataTypes.STRING(64),
            allowNull: true,
        });
    }

    const indexes = (await queryInterface.showIndex(ORDERS_TABLE)) as Array<{ name: string }>;
    if (!indexes.some((index) => index.name === IDEMPOTENCY_INDEX)) {
        await queryInterface.addIndex(ORDERS_TABLE, {
            name: IDEMPOTENCY_INDEX,
            unique: true,
            fields: [IDEMPOTENCY_COLUMN],
        });
    }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    const indexes = (await queryInterface.showIndex(ORDERS_TABLE)) as Array<{ name: string }>;
    if (indexes.some((index) => index.name === IDEMPOTENCY_INDEX)) {
        await queryInterface.removeIndex(ORDERS_TABLE, IDEMPOTENCY_INDEX);
    }

    const columns = await queryInterface.describeTable(ORDERS_TABLE);
    if (columns[IDEMPOTENCY_COLUMN]) {
        await queryInterface.removeColumn(ORDERS_TABLE, IDEMPOTENCY_COLUMN);
    }
}
