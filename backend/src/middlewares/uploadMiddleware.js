const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const  AppError  = require("../utils/AppError");

const config = require("../config/config");

const MAX_FILES_PER_UPLOAD = Number.isFinite(config.upload.maxFiles) && config.upload.maxFiles > 0
  ? config.upload.maxFiles
  : Infinity;

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
    "image/bmp",
    "image/tiff",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-zip"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  // Also check extension as a fallback just in case some browsers don't send standard zip mime type
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.zip' && !file.mimetype.startsWith('image/')) {
     return cb(null, true);
  }

  cb(new AppError("Only JPEG, PNG, WEBP images and ZIP archives are allowed", 400));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_FILES_PER_UPLOAD,
    // fileSize: config.upload.maxFileSize,
  },
});

module.exports = {
  upload,
  MAX_FILES_PER_UPLOAD,
};