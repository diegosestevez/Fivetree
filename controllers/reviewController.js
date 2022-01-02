const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

//This function is use for getReview and createReview because of 'tours/:tourId/reviews' routes both they use
exports.setTourUserIds = (req, res, next) => {
   if(!req.body.tour) req.body.tour = req.params.tourId;
   if(!req.body.user) req.body.user = req.user.id; // you get req.user from the exports.protect in authController.js
   next();
}

exports.getReview = factory.getOne(Review);
exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
