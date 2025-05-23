const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../modules/userModel');
// const catchAsync = require('../utils/catchAsync');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if the email and password are exist
  if (!email || !password) {
    return next(new AppError('Please provide a email and password', 400));
  }
  //2) check if the user exists and password is correct
  // ('12345pass)===('$2a$12$faETZlBwWmiuoecY2Cfa8u8UHwD9Ad64NaKth.a8IXt0ftGqXSpNu')
  // we should encrypt the orginal password to compare the encrypted password with it  because we couldnt
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
    messagge: 'Logged out successfully',
  });
};
exports.protect = asyncHandler(async (req, res, next) => {
  //1) Getting token and checking if its there
  const token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : req.cookies?.jwt;

  if (!token) {
    return next(
      new AppError('your are not logged in ! please log in to get access', 401),
    );
  }
  //2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user is still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(
      new AppError('The user is belonging to token is no longer exist', 401),
    );
  }

  //4) check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'The user recently changed password!,please login again.',
        401,
      ),
    );
  }

  // Griant access protected route
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// for rendered pages,no errors
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify tokens
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //2) check if user is still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3) check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE LOGGED IN USER

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

////    Restricto  to define the role ( user , admin ,lead-guide ,guide)  Protecting //
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles [admin,lead-guide]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      );
    }
    next();
  };
};
///  Forget Password of User ////
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  //1)Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There no user with email address', 404));
  }

  //2)Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send its to user email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token has sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'there was an error sending this email,please try again later',
        500,
      ),
    );
  }
});

/// Reset Password ///
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2)if token not expired, and there is user ,set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) Update changPasswordAt proprety for user
  // middleware function to update before send the token

  //4) log in user ,send JWT
  createSendToken(user, 200, res);
});

///// Update  Currrent User Password  /////

exports.updatePassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on collection
  const user = await User.findById(req.user.id).select('+password');
  //2) check  if POSTed current user is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your current password is wrong', 401));
  }
  //3) if so , update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4) log in user,send JWT
  createSendToken(user, 200, res);
});
