const Sequelize = require('sequelize');
const CartCouponsRulesModel = require('./cart_coupons');
const ProductCouponsRulesModel = require('./product_coupons_rules');
const BxgyCouponsRulesModel = require('./bxgy_coupons_rules');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('coupons', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('cart_wise', 'product_wise', 'bxgy'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: false
    },
    repetition_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'coupons',
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
        name: "idx_coupons_type",
        using: "BTREE",
        fields: [
          { name: "type" },
        ]
      },
      {
        name: "idx_coupons_active",
        using: "BTREE",
        fields: [
          { name: "is_active" },
        ]
      },
    ],
    associate: function(models) {
      // associations can be defined here
      this.hasOne(CartCouponsRulesModel, { foreignKey: 'coupon_id' });
      this.hasOne(ProductCouponsRulesModel, { foreignKey: 'coupon_id' });
      this.hasMany(BxgyCouponsRulesModel, { foreignKey: 'coupon_id' });
    }
  });
};