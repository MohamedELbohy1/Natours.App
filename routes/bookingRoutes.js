const express = require('express');
const bookingController = require('.././Controllers/bookingController');
const authController = require('.././Controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession,
);

module.exports = router;
