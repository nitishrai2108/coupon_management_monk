const models = require("../models/index")
const helper = require("../helpers/api_helper")
const CouponsModel = models["coupons"]
const CartCouponsRulesModel = models["cart_coupons"]
const ProductCouponsRulesModel = models["product_coupons_rules"]
const BxgyCouponsRulesModel = models["bxgy_coupons_rules"]
const productsModel = models["products"]
CouponsModel.hasOne(CartCouponsRulesModel, { foreignKey: 'coupon_id' });
CouponsModel.hasOne(ProductCouponsRulesModel, { foreignKey: 'coupon_id' });
CouponsModel.hasMany(BxgyCouponsRulesModel, { foreignKey: 'coupon_id' });
const sequelize = models.sequelize; // Add this line to get sequelize instance
const { Op } = require("sequelize");
const CouponType = {
    CART: 'cart',
    PRODUCT: 'product',
    BXGY: 'bxgy'
};
const BxgyType = {
    GET: 'get',
    BUY: 'buy'
};
module.exports = {
    // testing_api: async (req, res) => {
    //     try {
    //         const data = await models["coupons"].findAll()
    //         console.log(data);

    //         console.log("Testing Api");

    //     } catch (error) {
    //         console.log(error);

    //     }
    // },
    createCoupon: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            console.log(req.body, "===>");
            const data = req.body
            const createCoupon = await CouponsModel.create({
                type: data.type,
                name: data.name,
                description: data.description,
                valid_from: data.valid_from,
                valid_to: data.valid_to,
                repetition_limit: data.repetition_limit,
                is_active: data.is_active
            }, { transaction });
            const couponId = createCoupon.id
            switch (data.type) {
                case CouponType.CART:
                    if (data.cart_discount_rules) {
                        await CartCouponsRulesModel.create(
                            {
                                coupon_id: couponId,
                                ...data.cart_discount_rules,
                            },
                            { transaction }
                        );
                    }
                    break;

                case CouponType.PRODUCT:
                    if (data.product_discount_rules) {
                        await ProductCouponsRulesModel.create(
                            {
                                coupon_id: couponId,
                                ...data.product_discount_rules,
                            },
                            { transaction }
                        );
                    }
                    break;

                case CouponType.BXGY:
                    if (data.bxgy_discount_rules) {
                        await Promise.all([
                            ...data.bxgy_discount_rules.buy_products.map((product) =>
                                BxgyCouponsRulesModel.create(
                                    {
                                        coupon_id: couponId,
                                        type: BxgyType.BUY,
                                        ...product,
                                    },
                                    { transaction }
                                )
                            ),
                        ]);
                        await Promise.all([
                            ...data.bxgy_discount_rules.get_products.map((product) =>
                                BxgyCouponsRulesModel.create(
                                    {
                                        coupon_id: couponId,
                                        type: BxgyType.GET,
                                        ...product,
                                    },
                                    { transaction }
                                )
                            ),
                        ]);
                    }
                    break;
            }
            await transaction.commit();
            return helper.success(res, "Coupon created successfully", createCoupon);
        } catch (error) {
            await transaction.rollback();
            console.log(error);
            return helper.failed(res, "Coupon creation failed", error.message);
        }
    },
    getAllCoupons: async (req, res) => {
        try {
            const coupons = await CouponsModel.findAll({
                include: [
                    {
                        model: CartCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: CouponType.CART }, // Only include if coupon type is CART_WISE
                    },
                    {
                        model: ProductCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: CouponType.PRODUCT }, // Only include if coupon type is PRODUCT_WISE
                    },
                    {
                        model: BxgyCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: 'BXGY' }, // Only include if coupon type is BXGY
                    }
                ],
            });
            return helper.success(res, "Coupons fetched successfully", coupons);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Failed to fetch coupons", error.message);
        }
    },
    getApplicableCartCoupons: async (cart) => {
        try {
            const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const currentDate = new Date();
            const coupons = await CouponsModel.findAll({
                attributes: {
                    exclude: ["created_at", "updated_at"]
                },
                where: {
                    type: CouponType.CART,
                    is_active: 1,
                    valid_from: {
                        [Op.lte]: currentDate
                    },
                    valid_to: {
                        [Op.gte]: currentDate
                    }
                },
                include: [{
                    model: CartCouponsRulesModel,
                    attributes: {
                        exclude: ["created_at", "updated_at"]
                    },
                    where: {
                        threshold: {
                            [Op.lte]: cartTotal
                        }
                    },
                    required: true
                }],
                logging: false
            });


            const applicable_coupons = coupons.map((coupon) => {
                const rule = coupon?.cart_coupon;

                let discount = 0;

                if (rule) {
                    // Calculate discount based on is_fixed flag
                    if (rule.is_fixed) {
                        discount = Number(rule.discount_value);
                    } else {
                        // Percentage discount
                        discount = (cartTotal * Number(rule.discount_value)) / 100;

                        // Apply max discount if exists
                        if (rule.max_discount && discount > rule.max_discount) {
                            discount = Number(rule.max_discount);
                        }
                    }
                }

                return {
                    coupon_id: coupon.id,
                    coupon_name: coupon.name,
                    type: coupon.type,
                    discount: Number(discount.toFixed(2))
                };
            });

            return applicable_coupons;
        } catch (error) {
            console.log("Error fetching applicable cart coupons:", error);
            throw error;
        }
    },
    getApplicableProductCoupons: async (cart) => {
        try {
            const currentDate = new Date();

            // Map of product_id to its details for easy access
            const productMap = new Map(
                cart.items.map(item => [
                    item.product_id,
                    { quantity: item.quantity, price: item.price }
                ])
            );

            const coupons = await CouponsModel.findAll({
                where: {
                    type: CouponType.PRODUCT,
                    is_active: 1,
                    valid_from: {
                        [Op.lte]: currentDate
                    },
                    valid_to: {
                        [Op.gte]: currentDate
                    }
                },
                include: [{
                    model: ProductCouponsRulesModel,
                    where: {
                        product_id: {
                            [Op.in]: [...productMap.keys()]
                        }
                    },
                    required: true,
                }],
                logging: false,
                // raw: true
            });
            const applicable_coupons = coupons.map((coupon) => {
                const rule = coupon.product_coupons_rule;
                let discount = 0;

                if (rule) {
                    const productDetails = productMap.get(rule.product_id);
                    if (productDetails) {
                        const subtotal = productDetails.quantity * productDetails.price;
                        if (rule.is_fixed) {
                            discount = Number(rule.discount_value);
                        } else {
                            // Percentage discount
                            discount = (subtotal * Number(rule.discount_value)) / 100;
                            // Apply max discount if exists
                            if (rule.max_discount && discount > rule.max_discount) {
                                discount = Number(rule.max_discount);
                            }
                        }
                    }
                }

                return {
                    coupon_id: coupon.id,
                    coupon_name: coupon.name,
                    type: coupon.type,
                    discount: Number(discount.toFixed(2))
                };
            });

            return applicable_coupons;
        } catch (error) {
            console.log("Error fetching applicable product coupons:", error);
            throw error;
        }
    },
    getApplicableBxgyCoupons: async (cart) => {
        try {
            const currentDate = new Date();

            // Map of product_id to its details for easy access
            const productMap = new Map(
                cart.items.map(item => [
                    item.product_id,
                    { quantity: item.quantity, price: item.price }
                ])
            );


            // Fetch all active BXGY coupons with their rules
            const coupons = await CouponsModel.findAll({
                where: {
                    type: CouponType.BXGY,
                    is_active: 1,
                    valid_from: {
                        [Op.lte]: currentDate
                    },
                    valid_to: {
                        [Op.gte]: currentDate
                    }
                },
                include: [{
                    model: BxgyCouponsRulesModel,
                    required: true,
                    // where: {
                    //     product_id: {
                    //         [Op.in]: [...productMap.keys()]
                    //     }
                    // }
                }],
                logging: false
            });


            const applicable_coupons = (await Promise.all(coupons.map(async (coupon) => {
                const buyRules = coupon.bxgy_coupons_rules.filter(rule => rule.type === 'buy');
                const getRules = coupon.bxgy_coupons_rules.filter(rule => rule.type === 'get');


                let totalDiscount = 0;

                // Check if all buy quantity requirements are fulfilled
                const areAllBuyRequirementsFulfilled = buyRules.every(buyRule => {
                    const buyProduct = productMap.get(buyRule.product_id);

                    return buyProduct && buyProduct.quantity >= buyRule.quantity;
                });

                if (areAllBuyRequirementsFulfilled) {
                    // Calculate the maximum number of times the coupon can be applied
                    const timesApplicable = Math.min(
                        ...buyRules.map(buyRule => {
                            const buyProduct = productMap.get(buyRule.product_id);
                            return Math.floor((buyProduct?.quantity ?? 0) / buyRule.quantity);
                        })
                    );

                    // Apply the repetition limit (if any)
                    const repetitionLimit = coupon.repetition_limit || Infinity;
                    const actualTimesApplicable = Math.min(timesApplicable, repetitionLimit);

                    // Calculate the total free items and discount for each get rule
                    getRules.forEach(getRule => {
                        const getProduct = productMap.get(getRule.product_id);

                        if (getProduct) {
                            const totalFreeItems = actualTimesApplicable * getRule.quantity;
                            const actualFreeItems = Math.min(totalFreeItems, getProduct.quantity);

                            // Calculate discount based on free items
                            totalDiscount += actualFreeItems * getProduct.price;
                        }
                    });
                }

                // Return coupon details only if totalDiscount is greater than 0
                if (totalDiscount > 0) {
                    return {
                        coupon_id: coupon.id,
                        coupon_name: coupon.name,
                        type: coupon.type,
                        discount: Number(totalDiscount.toFixed(2))
                    };
                } else {
                    return null; // Return null for coupons with no discount
                }
            }))).filter(coupon => coupon !== null); // Filter out null values
            return applicable_coupons;
        } catch (error) {
            console.log("Error fetching applicable BXGY coupons:", error);
            throw error;
        }
    },
    getApplicableCoupons: async (req, res) => {
        try {
            const { cart } = req.body;
            const cartCoupons = await module.exports.getApplicableCartCoupons(cart);
            const productCoupons = await module.exports.getApplicableProductCoupons(cart);
            const bxgyCoupons = await module.exports.getApplicableBxgyCoupons(cart);

            const coupons = [...cartCoupons, ...productCoupons, ...bxgyCoupons]
            return helper.success(res, "Applicable coupons fetched successfully", coupons);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Failed to fetch applicable coupons", error.message);
        }
    },
    applyCartCoupon: (coupon, cart) => {
        const cartRule = coupon.cart_coupon;
        if (!cartRule) return 0;

        const totalCartValue = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (totalCartValue >= cartRule.threshold) {
            if (cartRule.is_fixed) {
                // For fixed discount, max_discount is not considered
                return cartRule.discount_value;
            } else {
                // For percentage discount, calculate discount and apply max_discount if provided
                const discount = (totalCartValue * cartRule.discount_value) / 100;
                return cartRule.max_discount ? Math.min(discount, cartRule.max_discount) : discount;
            }
        }

        return 0;
    },
    applyProductCoupon: (coupon, cart) => {
        const productRule = coupon.product_coupons_rule;
        if (!productRule) return 0;

        let totalDiscount = 0;

        cart.items.forEach(item => {
            if (item.product_id === productRule.product_id) {
                if (productRule.is_fixed) {
                    // For fixed discount, max_discount is not considered
                    item.total_discount = productRule.discount_value * item.quantity;
                } else {
                    // For percentage discount, calculate discount and apply max_discount if provided
                    item.total_discount = (item.price * item.quantity * productRule.discount_value) / 100;
                    if (productRule.max_discount) {
                        item.total_discount = Math.min(item.total_discount, productRule.max_discount);
                    }
                }
                totalDiscount += item.total_discount;
            }
        });

        return totalDiscount;
    },
    applyBxgyCoupon: (coupon, cart) => {
        const buyRules = coupon.bxgy_coupons_rules.filter(rule => rule.type === 'buy');
        const getRules = coupon.bxgy_coupons_rules.filter(rule => rule.type === 'get');

        let totalDiscount = 0;

        // Check if all buy quantity requirements are fulfilled
        const areAllBuyRequirementsFulfilled = buyRules.every(buyRule => {
            const buyProduct = cart.items.find(item => item.product_id === buyRule.product_id);
            return buyProduct && buyProduct.quantity >= buyRule.quantity;
        });

        if (areAllBuyRequirementsFulfilled) {
            // Calculate the maximum number of times the coupon can be applied
            const timesApplicable = Math.min(
                ...buyRules.map(buyRule => {
                    const buyProduct = cart.items.find(item => item.product_id === buyRule.product_id);
                    return Math.floor((buyProduct?.quantity ?? 0) / buyRule.quantity);
                })
            );

            // Apply the repetition limit (if any)
            const repetitionLimit = coupon.repetition_limit || Infinity;
            const actualTimesApplicable = Math.min(timesApplicable, repetitionLimit);

            // Calculate the total free items and discount for each get rule
            getRules.forEach(getRule => {
                const getProduct = cart.items.find(item => item.product_id === getRule.product_id);

                if (getProduct) {
                    const totalFreeItems = actualTimesApplicable * getRule.quantity;
                    const actualFreeItems = Math.min(totalFreeItems, getProduct.quantity);

                    // Calculate discount based on free items
                    getProduct.total_discount = actualFreeItems * getProduct.price;
                    totalDiscount += getProduct.total_discount;

                    // Update the quantity of the get product in the cart
                    getProduct.quantity += actualFreeItems;
                }
            });
        }

        return totalDiscount;
    },
    applyCoupon: async (req, res) => {
        try {
            const { cart } = req.body;
            const couponId = parseInt(req.params.id)
            const currentDate = new Date();

            // Fetch the coupon and its associated rules
            const coupon = await CouponsModel.findOne({
                where: {
                    id: couponId,
                    is_active: true,
                    valid_from: { [Op.lte]: currentDate },
                    valid_to: { [Op.gte]: currentDate }
                },
                include: [
                    { model: CartCouponsRulesModel, required: false },
                    { model: ProductCouponsRulesModel, required: false },
                    { model: BxgyCouponsRulesModel, required: false }
                ]
            });

            if (!coupon) {
                throw new Error('Coupon not found or invalid');
            }

            let totalDiscount = 0;
            const updatedCart = { ...cart, items: [...cart.items] };

            // Calculate total price of the cart
            const totalPrice = updatedCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Apply coupon based on its type
            switch (coupon.type) {
                case CouponType.CART:
                    totalDiscount = module.exports.applyCartCoupon(coupon, updatedCart);
                    break;

                case CouponType.PRODUCT:
                    totalDiscount = module.exports.applyProductCoupon(coupon, updatedCart);
                    break;

                case CouponType.BXGY:
                    totalDiscount = module.exports.applyBxgyCoupon(coupon, updatedCart);
                    break;

                default:
                    throw new Error('Unsupported coupon type');
            }

            // Ensure total discount does not exceed total price
            totalDiscount = Math.min(totalDiscount, totalPrice);

            // Calculate final price
            const finalPrice = totalPrice - totalDiscount;

            // Prepare response
            const response = {
                updated_cart: {
                    items: updatedCart.items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price,
                        total_discount: item.total_discount || 0
                    })),
                    total_price: totalPrice,
                    total_discount: totalDiscount,
                    final_price: finalPrice
                }
            };
            return helper.success(res, "Coupon applied successfully", response);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Failed to apply coupon", error.message);
        }
    },
    deleteCoupon: async (req, res) => {
        try {
            const couponId = parseInt(req.params.id);
            await CouponsModel.destroy({
                where: {
                    id: couponId
                }
            });
            return helper.success(res, "Coupon deleted successfully", {});
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Failed to delete coupon", error.message);
        }
    },
    getCoupon: async (req, res) => {
        try {
            const couponId = parseInt(req.params.id)
            const coupon = await CouponsModel.findOne({
                where: {
                    id: couponId
                },
                include: [
                    {
                        model: CartCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: CouponType.CART }, // Only include if coupon type is CART_WISE
                    },
                    {
                        model: ProductCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: CouponType.PRODUCT }, // Only include if coupon type is PRODUCT_WISE
                    },
                    {
                        model: BxgyCouponsRulesModel,
                        required: false, // Make the inclusion optional
                        // where: { type: 'BXGY' }, // Only include if coupon type is BXGY
                    }
                ],
            });
            return helper.success(res, "Coupon fetched successfully", coupon);
        } catch (error) {
            console.log(error);
            return helper.failed(res, "Failed to fetch coupon", error.message);
        }
    },
    updateCoupon: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            // console.log(req.body, "===>");
            const data = req.body
            const couponId = parseInt(req.params.id)
            const coupon = await CouponsModel.findOne({
                where: {
                    id: couponId,
                    type: data.type
                }
            });

            if (!coupon) {
                throw new Error('Coupon not found');
            }

            // Update base coupon
            const [rowsUpdated] = await CouponsModel.update(
                {
                    type: data.type,
                    name: data.name,
                    description: data.description,
                    valid_from: data.valid_from,
                    valid_to: data.valid_to,
                    repetition_limit: data.repetition_limit,
                    is_active: data.is_active,
                },
                {
                    where: { id: couponId },
                    transaction,
                }
            );

            if (rowsUpdated === 0) {
                throw new Error('Coupon not found');
            }

            // Update type-specific rules
            switch (data.type) {
                case CouponType.CART:
                    if (data.cart_discount_rules) {
                        await CartCouponsRulesModel.destroy({
                            where: { coupon_id: couponId },
                            transaction,
                        });
                        await CartCouponsRulesModel.create(
                            {
                                coupon_id: couponId,
                                ...data.cart_discount_rules,
                            },
                            { transaction }
                        );
                    }
                    break;

                case CouponType.PRODUCT:
                    if (data.product_discount_rules) {
                        await ProductCouponsRulesModel.destroy({
                            where: { coupon_id: couponId },
                            transaction,
                        });
                        await ProductCouponsRulesModel.create(
                            {
                                coupon_id: couponId,
                                ...data.product_discount_rules,
                            },
                            { transaction }
                        );
                    }
                    break;

                case CouponType.BXGY:
                    if (data.bxgy_discount_rules) {
                        await BxgyCouponsRulesModel.destroy({
                            where: { coupon_id: couponId },
                            transaction,
                        });
                        await Promise.all([
                            ...data.bxgy_discount_rules.buy_products.map((product) =>
                                BxgyCouponsRulesModel.create(
                                    {
                                        coupon_id: couponId,
                                        type: BxgyType.BUY,
                                        ...product,
                                    },
                                    { transaction }
                                )
                            ),
                            ...data.bxgy_discount_rules.get_products.map((product) =>
                                BxgyCouponsRulesModel.create(
                                    {
                                        coupon_id: couponId,
                                        type: BxgyType.GET,
                                        ...product,
                                    },
                                    { transaction }
                                )
                            ),
                        ]);
                    }
                    break;
            }
            await transaction.commit();
            return helper.success(res, "Coupon updated successfully", {});
        } catch (error) {
            await transaction.rollback();
            console.log(error);
            return helper.failed(res, "Coupon updation failed", error.message);
        }
    },
}