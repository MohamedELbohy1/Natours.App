const User = require('../modules/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const Factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'natours/users', // هيترفع جوه فولدر كده
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const upload = multer({ storage });

// Middleware لرفع صورة واحدة
exports.uploadUserPhoto = upload.single('photo');

// const multerStorage = multer.memoryStorage();
// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new AppError('Not an Image! Please upload Only Images', 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
const filterObj = (obj, ...allowedfileds) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedfileds.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1- لو المستخدم بعت باسورد → امنعه
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  // 2- جهز البيانات اللي هتتحدث
  const filteredBody = {
    name: req.body.name,
    email: req.body.email,
  };

  // 3- لو فيه صورة جديدة اترفع رابطها من Cloudinary
  if (req.file) filteredBody.photo = req.file.path; // Cloudinary بيرجع URL هنا

  // 4- اعمل update
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not defined ,Please Sign Up instead',
  });
};

exports.getallUsers = Factory.getAll(User);
exports.getUser = Factory.getOne(User);
// This not to update Password
exports.updateUsers = Factory.updateOne(User);
exports.deleteUser = Factory.deleteOne(User);
