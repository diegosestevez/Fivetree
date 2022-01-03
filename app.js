const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const pug = require('pug');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require(`./routes/tourRoutes`);
const userRouter = require(`./routes/userRoutes`);
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. GLOBAL MIDDLEWARE //
//Will serve static html files and their associated css and img files. The file you pass in as an argument will become the root file
app.use(express.static(path.join(__dirname,'public')));

//cors for client to access data from api routes on server
app.use(cors());
app.options('*', cors());

//Sets security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',

        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

//Used for development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Used to limit number of calls an IP can make to the server in a specified limit of time. Prevents brute force attacks and too much server traffic
const limiter = rateLimit({
  max:100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests have been made from this IP. Please try again in an hour'
})
app.use('/api', limiter) //apply limiter to /api routes

//These two will tell express to read JSON payloads when they are posted to a route in req.body (bodyparser)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

//Parses data from cookies should come after the bodyparser
app.use(cookieParser())

//Data sanitization against noSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevents parameter pollution
app.use(
  hpp({
    whitelist:[
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

//Custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3. ROUTES //
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Catches all other routes not accepted by the five above. This overides the default html 404 code data sent back from express for routes that do not exist
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} route on this server!`, 404))
});

// 4. ERROR HANDLING MIDDLEWARE //
app.use(globalErrorHandler);

// 5. EXPORT TO APP ENTRY POINT SERVER.JS
module.exports = app;
