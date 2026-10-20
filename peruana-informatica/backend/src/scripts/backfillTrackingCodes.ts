import { sequelize } from '../database/connection';
import { Order } from '../models/Order';
import { generateTrackingCode } from '../utils/trackingCode';
import { DataTypes } from 'sequelize';
import { logger } from '../config/logger';

async function ensureColumn() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('orders');
  if (!columns['tracking_code']) {
    logger.info('➕ Adding column orders.tracking_code ...');
    await qi.addColumn('orders', 'tracking_code', {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    });
    logger.info('✅ Column added');
  } else {
    logger.info('ℹ️ Column orders.tracking_code already exists');
  }
}

async function assignCode(order: Order) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      order.tracking_code = generateTrackingCode();
      await order.save();
      return true;
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') continue;
      throw error;
    }
  }
  return false;
}

async function backfillTrackingCodes() {
  try {
    await sequelize.authenticate();
    logger.info('✅ DB connected');

    await ensureColumn();

    const orders = await Order.findAll({ where: { tracking_code: null } });
    logger.info(`🛠️ Orders needing a code: ${orders.length}`);

    let failed = 0;
    for (const order of orders) {
      const ok = await assignCode(order);
      if (!ok) {
        failed++;
        logger.error(`❌ Could not assign a code to order ${order.id}`);
      }
    }

    logger.info(`✅ Backfill done. Updated: ${orders.length - failed}, failed: ${failed}`);
  } catch (error) {
    logger.error('❌ Backfill error:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

backfillTrackingCodes();
