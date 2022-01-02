const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

//Applies protect middlware to all routes below this line
router.use(authController.protect);

router.get('/checkout-session/:tourID', bookingController.getCheckoutSession);

//Applies role restriction middlware to all routes below this line
router.use(authController.restrictTo('admin', 'lead-guide'))

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking)

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking)

module.exports = router;
