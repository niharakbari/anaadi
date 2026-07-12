const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {

    logger.error(err);

    return res.status( err.statusCode || 500 ).json({
        message: err.message || "Internal server error"
    });
}

module.exports = errorHandler;
