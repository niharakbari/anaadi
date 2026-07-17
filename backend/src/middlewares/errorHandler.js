const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
    // Log full error details internally
    logger.error(err);

    const statusCode = err.statusCode || 500;
    const isOperational = err instanceof AppError || (statusCode >= 400 && statusCode < 500);

    return res.status(statusCode).json({
        message: isOperational ? (err.message || "Internal Server Error") : "Internal Server Error"
    });
}

module.exports = errorHandler;
