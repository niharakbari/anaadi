const mysql2 = require("mysql2");
const config = require("./config");
const logger = require("../utils/logger");

const connection = mysql2.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
});

connection.connect((err) => {
    if (err) {
        logger.error(err);
        logger.error("Database Connection failed");
        return;
    }

    logger.info("Database connected successfuly")
});

module.exports = connection;