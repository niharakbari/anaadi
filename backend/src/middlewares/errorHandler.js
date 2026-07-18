const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const multer = require("multer");

const config = require("../config/config");

function errorHandler(err, req, res, next) {
    // Log full error details internally
    logger.error(err);

    const isMulterError = err instanceof multer.MulterError;
    const statusCode = err.statusCode || (isMulterError ? 400 : 500);
    const isOperational = err instanceof AppError || (statusCode >= 400 && statusCode < 500);
    const maxFiles = Number.isFinite(config.upload.maxFiles) && config.upload.maxFiles > 0
        ? config.upload.maxFiles
        : 100;

    let message = isOperational ? (err.message || "Internal Server Error") : "Internal Server Error";

    if (isMulterError) {
        if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
            message = `You can upload up to ${maxFiles} images at a time.`;
        }
    }

    return res.status(statusCode).json({
        message,
    });
}

module.exports = errorHandler;
