'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM('ADMIN', 'USER'),
        allowNull: false,
        defaultValue: 'USER',
      },
      access: {
        type: DataTypes.ENUM('VIEW', 'CREATE'),
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
    }
  );

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  };

  User.associate = (models) => {
    User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
  };

  return User;
};
