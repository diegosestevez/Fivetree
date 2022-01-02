const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
}

const handleDuplicateErrorDB = err => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value '${value}'. Please use another value`
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `Invalid input data! ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token. Please log in again', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  //A) API
  if(req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //B) RENDERED WEBSITE
  console.error('ERROR 💥', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
}

const sendErrorProd = (err, req, res) => {
  //A) API
  if(req.originalUrl.startsWith('/api')){
    //Operational error: send detailed message to client since error is caused by their actions
    if(err.isOperational){
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //Programming error or unknown error: sends a simple message to client, error is caused by code
    //1) Log Error in console
    console.error('ERROR 💥', err)

    //2) Send simple message to client
   return res.status(500).json({
    status:'fail',
    message: 'something went very wrong!'
   })
  }
    // B) RENDERED WEBSITE
    if(err.isOperational){
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    }
    console.error('ERROR 💥', err)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    })
}

//ERROR HANDLING MIDDLEWARE ENTRY POINT//

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.errorName = err.name;

  if(process.env.NODE_ENV === 'development'){
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production'){

  //Generally overwriting the express err object is not good practice. However to validate mongoose operational errors I've spread the err object into an error variable
  //and inserted a new errorName object into the express err object in line 80 above
  let error = {...err};
  error.message = err.message;

  if(error.errorName === 'CastError') error = handleCastErrorDB(error);
  if(error.code === 11000) error = handleDuplicateErrorDB(error);
  if(error.errorName === 'ValidationError') error = handleValidationErrorDB(error);
  if(error.errorName === 'JsonWebTokenError') error = handleJWTError();
  if(error.errorName === 'TokenExpiredError') error = handleJWTExpiredError();

  sendErrorProd(error, req, res);
  }
};
