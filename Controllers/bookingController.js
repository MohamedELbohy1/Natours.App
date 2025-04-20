const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../modules/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppErorr = require('../utils/appError');
const Factory = require('./handlerFactory');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2)Create a checkout session
  const session = await stripe.checkout.sessions.create({
    // Information about checkout session
    payment_method_types: ['card'],
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // Information about the Product that user about to take in
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  //3)Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.webhookCheckout = (req, res, next) => {
//   const signature = req.headers['stripe-signature'];
//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET,
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook error: ${err.message}`);
//   }
//   if (event.type === 'checkout.session.completed') {
//   }
// };
