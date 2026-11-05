'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      stock_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { isInt: true, min: 0 },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        get() {
          const v = this.getDataValue('price');
          return v === null || v === undefined ? v : Number(v);
        },
      },
    },
    {
      tableName: 'products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  Product.associate = (models) => {
    Product.hasMany(models.OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  };

  return Product;
};
