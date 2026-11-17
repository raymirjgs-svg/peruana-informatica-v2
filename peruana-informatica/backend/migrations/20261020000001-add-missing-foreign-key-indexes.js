'use strict';

const addIndexIfMissing = async (queryInterface, table, name, fields) => {
  const indexes = await queryInterface.showIndex(table);
  if (indexes.some((index) => index.name === name)) {
    return;
  }
  await queryInterface.addIndex(table, fields, { name });
};

const removeIndexIfPresent = async (queryInterface, table, name) => {
  const indexes = await queryInterface.showIndex(table);
  if (!indexes.some((index) => index.name === name)) {
    return;
  }
  await queryInterface.removeIndex(table, name);
};

module.exports = {
  async up(queryInterface) {
    await addIndexIfMissing(queryInterface, 'cart_items', 'idx_cart_items_product_id', ['product_id']);
    await addIndexIfMissing(queryInterface, 'discounts', 'idx_discounts_product_id', ['product_id']);
    await addIndexIfMissing(queryInterface, 'discounts', 'idx_discounts_category_id', ['category_id']);
    await addIndexIfMissing(queryInterface, 'discounts', 'idx_discounts_is_active', ['is_active']);
    await addIndexIfMissing(queryInterface, 'img_products', 'idx_img_products_cod_producto', ['cod_producto']);
  },

  async down(queryInterface) {
    await removeIndexIfPresent(queryInterface, 'img_products', 'idx_img_products_cod_producto');
    await removeIndexIfPresent(queryInterface, 'discounts', 'idx_discounts_is_active');
    await removeIndexIfPresent(queryInterface, 'discounts', 'idx_discounts_category_id');
    await removeIndexIfPresent(queryInterface, 'discounts', 'idx_discounts_product_id');
    await removeIndexIfPresent(queryInterface, 'cart_items', 'idx_cart_items_product_id');
  },
};
