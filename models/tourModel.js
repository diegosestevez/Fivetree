const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const toursSchema = new mongoose.Schema({
  name:{
    type:String,
    required:[true, 'tour must have a name'],
    unique:true,
    trim: true,
    maxlength: [40, 'Tour name must be 40 characters or less'],
    minlength: [10, 'Tour name must be 10 or more characters long'],
  },
  slug:{
    type:String
  },
  duration:{
    type:Number,
    required:[true, 'A tour must have a duration']
  },
  maxGroupSize:{
    type:Number,
    required:[true, 'tour must have a group size']
  },
  difficulty:{
    type:String,
    required:[true, 'tour must have a difficulty'],
    enum: {
      values:['easy', 'medium', 'difficult'],
      message: 'Tour difficulty must be set to: easy, medium or difficult'
    }
  },
  ratingsAverage:{
    type:Number,
    default:4.5,
    min:[1, 'Ratings must be 1.0 or above'],
    max:[5, 'Ratings must be 5.0 or below'],
    set: val => Math.round(val * 10)/10 //4.6666 -> 47 -> 4.7
  },
  ratingsQuantity:{
    type:Number,
    default:0
  },
  price:{
    type:Number,
    required:[true, 'tour must have a price']
  },
  priceDiscount:{
    type:Number,
    validate:{
      validator:function(val){
        return val < this.price
      },
      message: 'Discounts values cannot exceed the regular Price value.'
    }

  },
  summary:{
    type:String,
    trim: [true, 'tour must have description']
  },
  description:{
    type:String,
    trim:true
  },
  imageCover:{
    type:String,
    required:[true, 'A tour must have a cover image']
  },
  images:[String],
  createdAt:{
    type: Date,
    default: Date.now(),
    select:false
  },
  startDates:[Date],
  secret:{
    type: Boolean,
    default: false
  },
  startLocation:{
    //GeoJSON - a special property from mongoDB
    type:{
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates:[Number],
    address: String,
    description: String
  },
  locations: [
    {
      type:{
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
   }
 ],
 guides: [
   {
     type: mongoose.Schema.ObjectId,
     ref:'User'
   }
 ]
}, {
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
})

//INDEXES
toursSchema.index({price: 1, ratingsAverage: -1});
toursSchema.index({slug: 1});
toursSchema.index({startLocation: '2dsphere' });


//VIRTUAL PROPERTIES
toursSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
})

//VIRTUAL POPULATE
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})

//DOCUMENT MIDDLEWARE
toursSchema.pre('save', function(next){
  this.slug = slugify(this.name, {lower: true});
  next();
});

//QUERY MIDDLEWARE
toursSchema.pre(/^find/, function(next){
  this.find({secret: {$ne: true}})
  this.start = Date.now()
  next();
});

toursSchema.pre(/^find/, function(next){
  this.populate({
    path:'guides',
    select: '-__v -passwordChangeAt'
  })
  next();
})

// toursSchema.post(/^find/, function(docs, next){
//   next();
// });

const Tour = mongoose.model('Tour', toursSchema);

module.exports = Tour;
