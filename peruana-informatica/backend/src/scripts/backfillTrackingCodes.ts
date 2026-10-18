import { sequelize } from '../database/connection';
import { Order } from '../models/Order';
import { generateTrackingCode } from '../utils/trackingCode';
import { DataTypes } from 'sequelize';

async function ensureColumn() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable('orders');
  if (!columns['tracking_code']) {
    console.log('➕ Adding column orders.tracking_code ...');
    await qi.addColumn('orders', 'tracking_code', {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    });
    console.log('✅ Column added');
  } else {
    console.log('ℹ️ Column orders.tracking_code already exists');
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
    console.log('✅ DB connected');

    await ensureColumn();

    const orders = await Order.findAll({ where: { tracking_code: null } });
    console.log(`🛠️ Orders needing a code: ${orders.length}`);

    let failed = 0;
    for (const order of orders) {
      const ok = await assignCode(order);
      if (!ok) {
        failed++;
        console.error(`❌ Could not assign a code to order ${order.id}`);
      }
    }

    console.log(`✅ Backfill done. Updated: ${orders.length - failed}, failed: ${failed}`);
  } catch (error) {
    console.error('❌ Backfill error:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

backfillTrackingCodes();
