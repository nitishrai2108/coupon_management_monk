var express = require('express');
var router = express.Router();
const validate = require('../middleware/validate')
const controller=require('../controllers/controller')

// router.get('/test',controller.testing_api)

router.post('/coupon',validate.createCoupon,controller.createCoupon)
router.get('/coupons',controller.getAllCoupons)
router.post('/applicable-coupons',controller.getApplicableCoupons)
router.post('/apply-coupon/:id',controller.applyCoupon)
router.delete('/coupon/:id',controller.deleteCoupon)
router.get('/coupon/:id',controller.getCoupon)
router.put('/coupon/:id',controller.updateCoupon)
module.exports = router;
