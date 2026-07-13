const jwt = require("jsonwebtoken");

const config = require("../config/config");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

function getTokenFromRequest(req) {
    const parsedToken = req.cookies && req.cookies.token;

    if (parsedToken) {
        return parsedToken;
    }

    const cookieHeader = req.headers && req.headers.cookie;

    if (!cookieHeader) {
        return null;
    }

    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : null;
}

const verifyToken = (req, res, next) => {

    const token = getTokenFromRequest(req);

    if (!token) {
        return next(new AppError("Please login first.", 401));
    }

    try {

        const decoded = jwt.verify(
            token,
            config.jwt.token
        );

        req.user = decoded;

        next();

    } catch (error) {

        logger.error(`JWT Verification Failed: ${error.message}`);

        return next(new AppError("Invalid or expired token.", 401));

    }

};

module.exports = verifyToken;