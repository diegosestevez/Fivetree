const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewsSchema = new mongoose.Schema({
  review:{
    type: String,
    required: [true, 'Review must be filled in!']
  },
  rating:{
    type: Number,
    default: 3.5,
    min:[1, 'Ratings must be 1 or above'],
    max:[5, 'Ratings must be 5 or below']
  },
  createdAt:{
    type: Date,
    default: Date.now(),
    select: false
  },
  tour:{
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
  },
  user:{
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
  }
},
{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

//Index with a 'unique' options object. This line prevents the same user from writing more than one review for the same tour
reviewsSchema.index({tour:1, user:1}, {unique: true})

reviewsSchema.pre(/^find/, function(next){
  this.populate({
    path:'user',
    select:'name photo'
  })
  next();
})

//STATIC METHODS
reviewsSchema.statics.calcAverageRatings = async function(tourId){
  const stats = await this.aggregate([
      {
        $match: {tour: tourId}
      },
      {
        $group: {
          _id: '$tour',
          nRating: { $sum: 1},
          avgRating: {$avg: '$rating'}
        }
      }
  ])

if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  } else{
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

reviewsSchema.post('save', function(){
  this.constructor.calcAverageRatings(this.tour)
})

reviewsSchema.pre(/^findOneAnd/, async function(next){
  this.r = await this.findOne();
  next();
})

//This middleware works by passing data from the pre middleware above. This works by grabbing 'this.r' which was created in the pre and uses it here
reviewsSchema.post(/^findOneAnd/, async function(){
  await this.r.constructor.calcAverageRatings(this.r.tour);
})

const Review = mongoose.model('Review', reviewsSchema);

module.exports = Review;
