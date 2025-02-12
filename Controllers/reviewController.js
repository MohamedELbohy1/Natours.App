// const catchAsync = require('express-async-handler');
// const appError = require('../utils/appError');
const Review = require('.././modules/reviewModel');
const Factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = Factory.getAll(Review);
exports.getReview = Factory.getOne(Review);
exports.createReview = Factory.createOne(Review);
exports.deleteReview = Factory.deleteOne(Review);
exports.updateReview = Factory.updateOne(Review);
