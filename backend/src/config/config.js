require("dotenv").config();

module.exports = {
    port: process.env.PORT,
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    ai: {
        model: process.env.AI_MODEL
    },

    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },

    upload: {
        designLibraryDirectory: process.env.DESIGN_LIBRARY_DIRECTORY,
        queryUploadDirectory: process.env.QUERY_UPLOAD_DIRECTORY,
        maxFiles: Number(process.env.MAX_FILES_PER_UPLOAD),
        // maxFileSize: Number(process.env.MAX_FILE_SIZE),
    },

    jwt : {
        token: process.env.JWT_SECRET,
        expireTime: process.env.JWT_EXPIRES_IN
    },

    admin : {
        email : process.env.ADMIN_EMAIL,
        password : process.env.ADMIN_PASSWORD
    },

    
  

};