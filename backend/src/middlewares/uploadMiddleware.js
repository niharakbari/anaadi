const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const config = require("../config");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.upload.directory);
  },

  filename(req, file, cb) {
    const uniqueName =
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