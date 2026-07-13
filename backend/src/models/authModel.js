const database = require("../config/database");

exports.getUserByEmail = async (email) => {
    const [rows] = await database.execute(
        `SELECT * FROM users WHERE email = ? LIMIT 1`,
        [email]
    );

    return rows[0];
};