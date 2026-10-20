'use strict';

const hasColumn = async (queryInterface, table, column) => {
  const description = await queryInterface.describeTable(table);
  return Boolean(description[column]);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    if (!(await hasColumn(queryInterface, 'orders', 'coupon_code'))) {
      await queryInterface.addColumn('orders', 'coupon_code', {
        type: DataTypes.STRING(50),
        allowNull: true,
      });
    }

    if (!(await hasColumn(queryInterface, 'orders', 'discount_amount'))) {
      await queryInterface.addColumn('orders', 'discount_amount', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    if (await hasColumn(queryInterface, 'orders', 'discount_amount')) {
      await queryInterface.removeColumn('orders', 'discount_amount');
    }

    if (await hasColumn(queryInterface, 'orders', 'coupon_code')) {
      await queryInterface.removeColumn('orders', 'coupon_code');
    }
  },
};
