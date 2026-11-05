'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      stock_qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('products', {
      fields: ['stock_qty'],
      type: 'check',
      where: { stock_qty: { [Sequelize.Op.gte]: 0 } },
      name: 'chk_products_stock_qty_non_negative',
    });

    await queryInterface.addConstraint('products', {
      fields: ['price'],
      type: 'check',
      where: { price: { [Sequelize.Op.gte]: 0 } },
      name: 'chk_products_price_non_negative',
    });

    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_products_sku_trgm ON products USING gin (sku gin_trgm_ops);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products'); 
  },
};