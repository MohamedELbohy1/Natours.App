const { query } = require('express');
const Tour = require('../modules/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppErorr = require('../utils/appError');
const Factory = require('./handlerFactory');

//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));  //to convert javascript object

/*exports.CheckID = (req, res, next, val) => {
    console.log(`Tour ID : ${val}`);
    if (+req.params.id > tours.length) {
        console.log("Error");
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid id'
        });
    }
    next();
};*/

/*exports.Checkbody = (req, res, next) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            status: 'fail',
            message: 'missing name or price'
        });
    }
    next();
}*/
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price,ratingsAverage,summary,difficulty';
  next();
};

exports.getallTours = Factory.getAll(Tour);

exports.getTour = Factory.getOne(Tour, { path: 'reviews' });

exports.createTour = Factory.createOne(Tour);
/*try{

}catch(err){
    res.status(400).json({
        status:'fail',
        message:err
    });
});*/
//console.log(req.body);
/*const newId = tours[tours.length - 1].id + 1;
    const newtour = Object.assign({ id: newId }, req.body);
    tours.push(newtour);
    fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
        res.status(201).json({
            status: 'sucess',
            data: {
                tours: newtour
            }
        });
    });*/

exports.updateTour = Factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppErorr('No tour found with that id', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
exports.deleteTour = Factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStart: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// tours-within/:distance/center/:latling/unit/:unit
// tours-within/233/center/:34.11174,-118.113491/unit/:mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppErorr(
        'please provide latitude and longitude in the format of lat,lng',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(
      new AppErorr(
        'please provide latitude and longitude in the format of lat,lng',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
