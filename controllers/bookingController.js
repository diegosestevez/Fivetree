const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
// 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID)

// 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items:[{
      name: `${tour.name} Tour`,
      description: tour.summary,
      images:[`https://www.natours.dev/img/tours/${tour.imageCover}`],
      amount: tour.price * 100,
      currency: 'cad',
      quantity: 1
    }]
  })

  // 3) Create session as a response
  res.status(200).json({
    status: 'success',
    session
  });
})

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //Temporary measure - this url is unsecure will be replaced before deployed to production
//   const {tour, user, price} = req.query;
//
//   if(!tour && !user && !price) return next();
//   await Booking.create({
//     tour: tour,
//     user: user,
//     price: price
//   });
//
//   res.redirect(req.originalUrl.split('?')[0])
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email:session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({
      tour: tour,
      user: user,
      price: price
    });
}

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let evt;

  try{
    let evt = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }catch(err){
    return res.status(400).send(`Webhook Error:${err.message}`);
  };

  if(evt === 'checkout.session.completed'){
    createBookingCheckout(evt.data.object);
  }

  res.status(200).json({received: true})
}

exports.getAllBookings = factory.getAll(Booking)
exports.getBooking = factory.getOne(Booking)
exports.createBooking = factory.createOne(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
