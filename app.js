const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
//Start Express App
const app = express();

const AppErorr = require('./utils/appError');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoutes');
const { nextTick, title } = require('process');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set a Security HTTPS headers
app.use(helmet());

// Development logging
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Rate limiting on Requests On IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP , please try again in one hour',
});
app.use('/api', limiter);

//Body Praser, reading from body from req.body
app.use(express.json({ limit: '10kb' })); //Middleware
app.use(cookieParser());

//Data Sanitization aginst NoSQL Query Injection
app.use(mongoSanitize());

// Data Sanitizaton against XSS
app.use(xss());

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com",
  );
  next();
});

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//app.get('/api/v1/tours', getallTours);
//app.post('/api/v1/tours', createTour);
//app.get('/api/v1/tours/:id', getTour);
//app.patch('/api/v1/tours/:id', updateTour)
//app.delete('/api/v1/tours/:id', deleteTour);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  /*
   const err=new Error(`Cant find ${req.originalUrl} on this srever!`);
   err.status='fail';
   err.statusCode=404;*/
  next(new AppErorr(`Cant find ${req.originalUrl} on this srever!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
