const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
})

exports.getTour = catchAsync(async (req, res, next) => {
 const tour = await Tour.findOne({slug:req.params.slug})
 .populate({path: 'reviews', fields: 'review rating user'})

 if(!tour){
   return next(new AppError('There is no tour with that name', 404));
 }

 res
   .status(200)
   .render('tour', {
     title: `${tour.name} Tour`,
     tour,
   });
})

exports.getLoginForm = (req, res) => {
  res.status(200).set(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com"
  ).render('login', {
    title: 'Log in your account'
  })
}

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account'
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user:req.user.id })

  // 2) Find tours with the returned Id's
  const tourIds = bookings.map(el => el.tour)
  const tours = await Tour.find({ _id: {$in: tourIds} })

  res.status(200).render('mytour', {
    title: 'My Tours',
    tours
  });
})

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
  req.user.id,
  {
    name: req.body.name,
    email: req.body.email
  },
  {
    new: true,
    runValidators: true
  });

  res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser
  });
});


exports.getResourcePage = (req, res, next) => {
  const pages = ['about', 'guides', 'careers', 'contact']
  const {resource} = req.params;

  const title = pages.filter(el => el === resource);

  if(title.length > 0){
    res.status(200).render('resource', {
      title: title[0]
    });
  }else{
    res.status(404).render('404', {
      title: 'Page does not exist'
    });
  }
}
