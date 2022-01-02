const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file , cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  } else{
    cb(new AppError('The uploaded file is not an image! Please upload an image.', 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  {name: 'imgCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

exports.resizeTourImages =  catchAsync(async (req, res, next) => {
  //If there is no cover image or images posted in the request then exit the function
  if(!req.files.imgCover || !req.files.images) return next();

  // 1) Processing the tour cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imgCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`./public/img/tours/${req.body.imageCover}`);

  // 2) Process the other tour images
  req.body.images = [];

  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({quality:90})
      .toFile(`./public/img/tours/${filename}`);

    req.body.images.push(filename)
    })
  );

  next();
})

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path:'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: {$gte:4.5}}
      },
      {
        $group: {
          _id: {$toUpper:'$difficulty'},
          numTours: {$sum: 1},
          numRatings: {$sum: '$ratingsQuantity'},
          avgRating: {$avg: '$ratingsAverage'},
          avgPrice: {$avg: '$price'},
          minPrice: {$min: '$price'},
          maxPrice: {$max: '$price'}
        }
      },
      {
        $sort:{avgPrice: 1}
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates:
          {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id:{$month: '$startDates'},
          numTourStarts: {$sum: 1},
          tours: {$push: '$name'}
        }
      },
      {
        $addFields: {month: '$_id'}
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: {numTourStarts: -1}
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
})

exports.getToursWithin = catchAsync(async (req, res, next) =>{
  const { distance, latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',') //create array of 2 elements fron latlng string and destructure it into two variables 'lat' and 'lng'

  //Get radians unit by dividing distance from Miles or KM of Earth. MongoDB expects our radius to measured in radians
  const radius = unit === 'mi' ? distance/3936.2 : distance/6378.1;

  if(!lng || !lat){
    next(new AppError('Please provide latitude and longitude in the format of lat,lng.', 400));
  }

 const tours = await Tour.find({
   startLocation:{$geoWithin: {$centerSphere:[ [lng,lat], radius]}}
 });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
})

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',')

  const multipler = unit === 'mi'? 0.000621371 : 0.001;

  if(!lng || !lat){
    next(new AppError('Please provide latitude and longitude in the format of lat,lng.', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField:'distance',
        distanceMultiplier: multipler
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
})
