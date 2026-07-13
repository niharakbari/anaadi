const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const  AppError  = require("../utils/AppError");

const config = require("../config/config");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.upload.designLibraryDirectory);
  },

  filename(req, file, cb) {
    const uniqueName =
      "design_" +
      Date.now() +
      "-" +
      crypto.randomBytes(8).toString("hex") +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new AppError("Only JPEG, PNG and WEBP images are allowed", 400));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: config.upload.maxFiles,
    // fileSize: config.upload.maxFileSize,
  },
});

module.exports = upload;