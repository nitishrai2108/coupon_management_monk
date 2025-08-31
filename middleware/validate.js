const { check, validationResult } = require('express-validator')
// const { validationResult } = require('express-validator')
// const helper = require("../helpers/api_helper")
const CouponType = {
    CART: 'cart',
    PRODUCT: 'product',
    BXGY: 'bxgy'
};
exports.validationResult = (req, res, next) => {
    try {
        validationResult(req).throw()
        return next()
    } catch (err) {
        return res.status(400).json({
            success: false,
            code: 400,
            message: "Validation",
            body: err.array(),
        });
    }
}
exports.createCoupon = [
    // Type validation
    check('type')
        .exists()
        .withMessage('Type is required')
        .not()
        .isEmpty()
        .withMessage('Type cannot be empty')
        .isIn([CouponType.CART, CouponType.PRODUCT, CouponType.BXGY])
        .withMessage(`Type must be one of: ${CouponType.CART}, ${CouponType.PRODUCT}, ${CouponType.BXGY}`),

    // Name validation
    check('name')
        .exists()
        .withMessage('Name is required')
        .not()
        .isEmpty()
        .withMessage('Name cannot be empty')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ max: 255 })
        .withMessage('Name cannot exceed 255 characters'),

    // Description validation (optional)
    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 255 })
        .withMessage('Description cannot exceed 255 characters'),

    // Valid_from validation (optional)
    check('valid_from')
        .optional()
        .isISO8601()
        .withMessage('Valid_from must be a valid date string'),

    // Valid_to validation (optional)
    check('valid_to')
        .optional()
        .isISO8601()
        .withMessage('Valid_to must be a valid date string'),

    // Repetition_limit validation (optional)
    check('repetition_limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Repetition_limit must be a positive integer'),

    // Is_active validation (optional)
    check('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is_active must be a boolean'),
    (req, res, next) => {
        this.validationResult(req, res, next)
    }
]