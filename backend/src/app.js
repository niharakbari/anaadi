const express = require("express");
const cors = require("cors");

const config = require("./config/config");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const cookieParser = require('cookie-parser');

const app = express();

// CORS configuration
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));

const path = require("path");

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for uploads
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// importing database
const database = require("./config/database")


// Routes
app.use("/api", routes);

app.use(errorHandler);


module.exports = app;