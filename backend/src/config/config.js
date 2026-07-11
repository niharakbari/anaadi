require("dotenv").config();

module.exports = {
    port: process.env.PORT,

    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },

};