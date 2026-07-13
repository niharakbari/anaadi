const mysql2 = require("mysql2");
const config = require("./config");
const logger = require("../utils/logger");

const pool = mysql2.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection((err, connection) => {
    if (err) {
        logger.error(err);
        logger.error("Database Connection failed");
        return;
    }

    logger.info("Database connected successfuly")

    connection.release();
});

module.exports = pool.promise();