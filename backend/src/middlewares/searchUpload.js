"use strict";

const multer = require("multer");

const AppError = require("../utils/AppError");

// -----------------------------------------------------------------------------
// Multer Memory Storage
// -----------------------------------------------------------------------------
// Query images are used only for AI inference.
// They are never persisted to disk.
// -----------------------------------------------------------------------------

const storage = multer.memoryStorage();

// -----------------------------------------------------------------------------
// Image Validation
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Multer Instance
// -----------------------------------------------------------------------------

const searchUpload = multer({
    storage,
    fileFilter,
    limits: {
        files: 1,
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

module.exports = searchUpload;