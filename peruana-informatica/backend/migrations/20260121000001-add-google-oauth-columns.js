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

    if (!(await hasColumn(queryInterface, 'users', 'google_id'))) {
      await queryInterface.addColumn('users', 'google_id', {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      });
    }

    if (!(await hasColumn(queryInterface, 'users', 'auth_provider'))) {
      await queryInterface.addColumn('users', 'auth_provider', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'local',
      });
    }

    const description = await queryInterface.describeTable('users');
    if (description.password_hash && description.password_hash.allowNull === false) {
      await queryInterface.changeColumn('users', 'password_hash', {
        type: DataTypes.STRING(255),
        allowNull: true,
      });
    }

    if (!(await hasIndex(queryInterface, 'users', 'idx_google_id'))) {
      await queryInterface.addIndex('users', ['google_id'], { name: 'idx_google_id' });
    }

    if (!(await hasIndex(queryInterface, 'users', 'idx_auth_provider'))) {
      await queryInterface.addIndex('users', ['auth_provider'], { name: 'idx_auth_provider' });
    }
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    if (await hasIndex(queryInterface, 'users', 'idx_auth_provider')) {
      await queryInterface.removeIndex('users', 'idx_auth_provider');
    }

    if (await hasIndex(queryInterface, 'users', 'idx_google_id')) {
      await queryInterface.removeIndex('users', 'idx_google_id');
    }

    if (await hasColumn(queryInterface, 'users', 'auth_provider')) {
      await queryInterface.removeColumn('users', 'auth_provider');
    }

    if (await hasColumn(queryInterface, 'users', 'google_id')) {
      await queryInterface.removeColumn('users', 'google_id');
    }

    await queryInterface.changeColumn('users', 'password_hash', {
      type: DataTypes.STRING(255),
      allowNull: false,
    });
  },
};
