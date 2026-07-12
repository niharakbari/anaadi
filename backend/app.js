const express = require("express");

const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const database = require("./src/config/database")


// Routes
app.use("/api", routes);

app.use(errorHandler);


module.exports = app;