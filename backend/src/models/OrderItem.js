'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { isInt: true, min: 1 },
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const v = this.getDataValue('unit_price');
          return v === null || v === undefined ? v : Number(v);
        },
      },
    },
    {
      tableName: 'order_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    OrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return OrderItem;
};
