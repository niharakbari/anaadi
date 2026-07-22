"use strict";

const multer = require("multer");

const AppError = require("../utils/AppError");
const storage = multer.memoryStorage();
function fileFilter(req, file, cb) {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(
        new AppError(
            "Only JPEG, PNG and WEBP images are allowed.",
            400
        )
    );
}
const searchUpload = multer({
    storage,
    fileFilter,
    limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

module.exports = searchUpload;