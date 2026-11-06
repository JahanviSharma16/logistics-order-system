'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      order_number: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('orders', {
      fields: ['total_amount'],
      type: 'check',
      where: { total_amount: { [Sequelize.Op.gte]: 0 } },
      name: 'chk_orders_total_amount_non_negative',
    });

    await queryInterface.addIndex('orders', ['user_id', 'created_at'], {
      name: 'idx_orders_user_id_created_at',
    });
    await queryInterface.addIndex('orders', ['status', 'created_at'], {
      name: 'idx_orders_status_created_at',
    });
    await queryInterface.addIndex('orders', ['created_at'], {
      name: 'idx_orders_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
