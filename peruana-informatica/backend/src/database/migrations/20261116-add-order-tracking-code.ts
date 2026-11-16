import { DataTypes, QueryInterface } from 'sequelize';

export const TRACKING_TABLE = 'orders';
export const TRACKING_COLUMN = 'tracking_code';
export const TRACKING_SENT_COLUMN = 'tracking_code_sent_at';
export const TRACKING_INDEX = 'orders_tracking_code_unique';

export async function up(queryInterface: QueryInterface): Promise<void> {
    const columns = await queryInterface.describeTable(TRACKING_TABLE);

    if (!columns[TRACKING_COLUMN]) {
        await queryInterface.addColumn(TRACKING_TABLE, TRACKING_COLUMN, {
            type: DataTypes.STRING(20),
            allowNull: true,
        });
    } else {
        const column = columns[TRACKING_COLUMN] as unknown as {
            type?: string;
            length?: number;
            allowNull?: boolean;
        };
        const isExpectedLength =
            Number(column.length) === 20 || /^VARCHAR\(20\)/i.test(String(column.type || ''));
        if (!isExpectedLength || column.allowNull !== true) {
            throw new Error(
                `Columna ${TRACKING_TABLE}.${TRACKING_COLUMN} incompatible; se esperaba VARCHAR(20) NULL`
            );
        }
    }

    if (!columns[TRACKING_SENT_COLUMN]) {
        await queryInterface.addColumn(TRACKING_TABLE, TRACKING_SENT_COLUMN, {
            type: DataTypes.DATE,
            allowNull: true,
        });
    }

    const indexes = (await queryInterface.showIndex(TRACKING_TABLE)) as unknown as Array<{
        name: string;
        unique: boolean;
        fields: Array<{ attribute: string }>;
    }>;
    const hasUniqueTrackingIndex = indexes.some(
        (index) => index.unique && index.fields.some((field) => field.attribute === TRACKING_COLUMN)
    );

    if (!hasUniqueTrackingIndex) {
        await queryInterface.addIndex(TRACKING_TABLE, [TRACKING_COLUMN], {
            name: TRACKING_INDEX,
            unique: true,
        });
    }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    const indexes = (await queryInterface.showIndex(TRACKING_TABLE)) as unknown as Array<{
        name: string;
        unique: boolean;
        fields: Array<{ attribute: string }>;
    }>;
    const trackingIndex = indexes.find(
        (index) =>
            index.name === TRACKING_INDEX ||
            (index.unique && index.fields.some((field) => field.attribute === TRACKING_COLUMN))
    );

    if (trackingIndex) {
        await queryInterface.removeIndex(TRACKING_TABLE, trackingIndex.name);
    }

    const columns = await queryInterface.describeTable(TRACKING_TABLE);
    if (columns[TRACKING_SENT_COLUMN]) {
        await queryInterface.removeColumn(TRACKING_TABLE, TRACKING_SENT_COLUMN);
    }
    if (columns[TRACKING_COLUMN]) {
        await queryInterface.removeColumn(TRACKING_TABLE, TRACKING_COLUMN);
    }
}
