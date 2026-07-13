const jwt = require("jsonwebtoken");

const config = require("../config/config");

const generateToken = (payload) => {

    return jwt.sign(
        payload,
        config.jwt.token,
        {
            expiresIn: config.jwt.expireTime,
        }
    );

};

module.exports = generateToken;