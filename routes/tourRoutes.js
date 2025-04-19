const express = require('express');
const tourController = require('../Controllers/controllerTour');
const authController = require('./../Controllers/authController');
const reviewRouter = require('./../routes/reviewRoute');

const router = express.Router();

//router.param('id', tourContoller.CheckID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getallTours);
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/')
  .get(tourController.getallTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
// POST /tour/65767/reviews
// Get /tour/65767/reviews
// Get /tour/65767/reviews/978798798
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
