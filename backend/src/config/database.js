const mysql2 = require("mysql2");
const config = require("./config");

const connection = mysql2.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
});

connection.connect((err) => {
    if (err) {
        console.error(err);
        console.error("Database Connection failed");
        return;
    }

    console.log("Database connected");
});

module.exports = connection;