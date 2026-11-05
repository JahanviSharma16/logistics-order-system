'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      order_number: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        get() {
          const v = this.getDataValue('total_amount');
          return v === null || v === undefined ? v : Number(v);
        },
      },
    },
    {
      tableName: 'orders',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
  };

  return Order;
};
