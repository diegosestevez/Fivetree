const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({id:id}, process.env.JWT_SECRET, {
    expiresIn:process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = (user, s req,tatusCode, req, res) => {
  const token = signToken(user._id)

  //create cookie to send to client. res.cookie(name, data, {options})
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), //convert to millisecondes
    secure: cookieOptions.secure = req.secure || req.headers('x-forwarded-proto') === 'https', //this line is specific to heroku's security deployment options. cookie can only be sent through HTTPS
    httpOnly: true, // cookie cannot be modified by browser
  });

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data:{
      user: user
    }
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome() //sends a welcome email to client

  createSendToken(newUser, 2 req,01, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email && password exist
  if(!email || !password){
    return next(new AppError('Please provide email and password!', 400))
  }

  //2) check if user && password is correct
  const user = await User.findOne({email:email}).select('+password')

  if(!user || !(await user.correctPassword(password, user.password))){
    return next(new AppError('Incorrect email or password', 401))
  }

  //3) If everything is ok then send token to client
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000), //expires in ten seconds
    httpOnly: true,
  });
  res.status(200).json({status:'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //1) Getting the token and checking if it is there
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1];
  } else if(req.cookies.jwt && req.cookies.jwt !== 'logout') {
    token = req.cookies.jwt;
  }

  if(!token){
    return next(new AppError('You are not logged in! Please log in to get access!', 401))
  }

  //2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check to see if the user still exists
  const currentUser = await User.findById({_id:decoded.id})
  if(!currentUser){
    return next(new AppError('The user whom this token belongs to no longer exists!', 401))
  }

  //4) Check if user changed password after token was issued
  if(currentUser.changedPasswordAfter(decoded.iat)){
    return next(new AppError('User recently changed their password. Please log in again.', 401))
  };

  //IF CODE PASSES THE 4 CHECKS ABOVE THEN GRANT USER ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // req.user now stores the current user document
  res.locals.user = currentUser
  next();
});

// This function applies to rendered pages only - contains no error handling
exports.isLoggedIn = async (req, res, next) => {
  if(req.cookies.jwt) {
    try{
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      // 2) Check if user exists
      const currentUser = await User.findById({_id:decoded.id})
      if(!currentUser){
        return next();
      }

      // 3) Check if user changed password after token was issued
      if(currentUser.changedPasswordAfter(decoded.iat)){
        return next()
      };

      res.locals.user = currentUser // pug templates will have access to a 'user' variable.
      return next();
    }catch(err){};
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role)){
      return next(new AppError('You do not have permission to perform this action!', 403))
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTed email
  const user = await User.findOne({email:req.body.email})
  if(!user){
    return next(new AppError('There is no user with that email address', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({validateBeforeSave: false});

  //3) Send it to user's email
  try{
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to user email!',
    });
  }catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({validateBeforeSave: false});
    return next(new AppError('There was an error sending the email, try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on Token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:hashedToken,
    passwordResetExpires:{$gt:Date.now()}
  });

  //2) If token has not expired and there is a user sets a new password
  if(!user){
    return next(new AppError('Token in invalid or has expired', 400))
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) update changedPasswordAt property for user
  //4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
})

exports.updatePassword = catchAsync(async(req, res, next) => {
  //1) Get user from collection. This is a protected route req.user will not be defined until the user logs in with a token
  const user = await User.findById(req.user.id).select('+password')

  //2) Check if POSTed current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
    return next(new AppError('Incorrect password', 401));
  }

  //3) If so, update password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save();

  //4) Log in user, send JWT
  createSendToken(user, 200, req, res);
})
