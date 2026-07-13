const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authModel = require("../models/authModel");
const config = require("../config/config");

const generateToken = require("../utils/generateToken");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

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

exports.login = async (req, res, next) => {

    const { email, password } = req.body;

    const existingToken = getTokenFromRequest(req);

    if (existingToken) {
        try {
            jwt.verify(existingToken, config.jwt.token);

            return res.status(200).json({
                success: true,
                message: "User already logged in.",
            });
        } catch (_) {
            // Ignore invalid or expired cookies and continue with login.
        }
    }

    const user = await authModel.getUserByEmail(email);

    if (!user) {
        return next(new AppError("Invalid email or password.", 401));
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        return next(new AppError("Invalid email or password.", 401));
    }

    const token = generateToken({
        id: user.user_id,
        email: user.email,
        role: user.user_type,
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json({
        success: true,
        message: "Login successful.",
    });

};

exports.logout = (req, res) => {

    res.clearCookie("token");

    logger.info(`User logged out: ${req.user?.email || "Unknown"}`);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });

};

exports.me = (req, res) => {

    return res.status(200).json({
        success: true,
        user: req.user
    });

};