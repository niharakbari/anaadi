const bcrypt = require("bcrypt");
const authModel = require("../models/authModel");
const AppError = require("../utils/AppError");

/**
 * Authenticates user by email and password, validating hash with bcrypt.
 * Throws AppError 401 on failure with generic message.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The authenticated user object
 */
async function authenticate(email, password) {
    if (!email || !password) {
        throw new AppError("Invalid email or password.", 401);
    }

    const user = await authModel.getUserByEmail(email);
    if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new AppError("Invalid email or password.", 401);
    }

    return user;
}

module.exports = {
    authenticate,
};
