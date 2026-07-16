const express = require("express");

const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const cookieParser = require('cookie-parser');

const searchRoutes = require("./routes/searchRoutes");

const healthRoutes = require("./routes/healthRoutes");

const app = express();



// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// importing database
const database = require("./config/database")


// Routes
app.use("/api", routes);

app.use("/api", healthRoutes);

app.use(errorHandler);


module.exports = app;