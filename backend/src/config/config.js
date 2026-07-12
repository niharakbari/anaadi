require("dotenv").config();

module.exports = {
    port: process.env.PORT,

    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },

    upload: {
        directory: process.env.UPLOAD_DIRECTORY,
        maxFiles: Number(process.env.MAX_FILES_PER_UPLOAD),
        // maxFileSize: Number(process.env.MAX_FILE_SIZE),
    },

};