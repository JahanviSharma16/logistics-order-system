'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('order_items', {
      fields: ['quantity'],
      type: 'check',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
      name: 'chk_order_items_quantity_positive',
    });

    await queryInterface.addConstraint('order_items', {
      fields: ['order_id', 'product_id'],
      type: 'unique',
      name: 'uq_order_items_order_product',
    });

    await queryInterface.addIndex('order_items', ['product_id'], {
      name: 'idx_order_items_product_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};