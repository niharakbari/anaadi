const express = require("express");

const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const cookieParser = require('cookie-parser');

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const database = require("./config/database")


// Routes
app.use("/api", routes);

app.use(errorHandler);


module.exports = app;