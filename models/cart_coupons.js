const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('cart_coupons', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'coupons',
        key: 'id'
      }
    },
    threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    is_fixed: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    max_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'cart_coupons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "coupon_id",
        using: "BTREE",
        fields: [
          { name: "coupon_id" },
        ]
      },
      {
        name: "idx_cart_coupons_threshold",
        using: "BTREE",
        fields: [
          { name: "threshold" },
        ]
      },
    ]
  });
};