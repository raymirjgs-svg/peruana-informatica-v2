import { DataTypes, QueryInterface } from 'sequelize';

export const ORDERS_TABLE = 'orders';
export const COUPON_COLUMN = 'coupon_code';
export const DISCOUNT_COLUMN = 'discount_amount';

/**
 * El modelo `Order` declara `coupon_code` y `discount_amount`, pero la tabla
 * `orders` de produccion nunca los tuvo. Sequelize los incluia en el INSERT
 * y la creacion de pedidos fallaba con:
 *
 *   ER_BAD_FIELD_ERROR: Unknown column 'discount_amount' in 'field list'
 *
 * Esta migracion agrega ambas columnas de forma explicita y reversible.
 * No se usa sequelize.sync({ alter: true }).
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
    const columns = await queryInterface.describeTable(ORDERS_TABLE);

    if (!columns[COUPON_COLUMN]) {
        await queryInterface.addColumn(ORDERS_TABLE, COUPON_COLUMN, {
            type: DataTypes.STRING(50),
            allowNull: true,
        });
    }

    if (!columns[DISCOUNT_COLUMN]) {
        await queryInterface.addColumn(ORDERS_TABLE, DISCOUNT_COLUMN, {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        });
    }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    const columns = await queryInterface.describeTable(ORDERS_TABLE);

    if (columns[DISCOUNT_COLUMN]) {
        await queryInterface.removeColumn(ORDERS_TABLE, DISCOUNT_COLUMN);
    }

    if (columns[COUPON_COLUMN]) {
        await queryInterface.removeColumn(ORDERS_TABLE, COUPON_COLUMN);
    }
}
