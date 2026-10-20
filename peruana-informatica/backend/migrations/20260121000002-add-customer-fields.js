'use strict';

const hasColumn = async (queryInterface, table, column) => {
  const description = await queryInterface.describeTable(table);
  return Boolean(description[column]);
};

const hasIndex = async (queryInterface, table, name) => {
  const indexes = await queryInterface.showIndex(table);
  return indexes.some((index) => index.name === name);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    if (!(await hasColumn(queryInterface, 'users', 'is_blocked'))) {
      await queryInterface.addColumn('users', 'is_blocked', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!(await hasColumn(queryInterface, 'users', 'last_login'))) {
      await queryInterface.addColumn('users', 'last_login', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    if (!(await hasIndex(queryInterface, 'users', 'idx_is_blocked'))) {
      await queryInterface.addIndex('users', ['is_blocked'], { name: 'idx_is_blocked' });
    }

    if (!(await hasIndex(queryInterface, 'users', 'idx_last_login'))) {
      await queryInterface.addIndex('users', ['last_login'], { name: 'idx_last_login' });
    }
  },

  async down(queryInterface) {
    if (await hasIndex(queryInterface, 'users', 'idx_last_login')) {
      await queryInterface.removeIndex('users', 'idx_last_login');
    }

    if (await hasIndex(queryInterface, 'users', 'idx_is_blocked')) {
      await queryInterface.removeIndex('users', 'idx_is_blocked');
    }

    if (await hasColumn(queryInterface, 'users', 'last_login')) {
      await queryInterface.removeColumn('users', 'last_login');
    }

    if (await hasColumn(queryInterface, 'users', 'is_blocked')) {
      await queryInterface.removeColumn('users', 'is_blocked');
    }
  },
};
