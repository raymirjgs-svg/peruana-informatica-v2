'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const description = await queryInterface.describeTable('img_products');
    const imagen = description.imagen;

    if (!imagen) {
      return;
    }

    const currentType = String(imagen.type || '').toLowerCase();
    if (currentType === 'varchar(500)') {
      return;
    }

    await queryInterface.changeColumn('img_products', 'imagen', {
      type: DataTypes.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const description = await queryInterface.describeTable('img_products');
    const imagen = description.imagen;

    if (!imagen) {
      return;
    }

    const currentType = String(imagen.type || '').toLowerCase();
    if (currentType === 'varchar(255)') {
      return;
    }

    await queryInterface.changeColumn('img_products', 'imagen', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  },
};
