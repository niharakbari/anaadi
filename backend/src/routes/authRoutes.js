const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const verifyToken = require("../middlewares/verifyToken");
const asyncHandler = require("../utils/asyncHandler");

router.post(
    "/login",
    asyncHandler(authController.login)
);

router.post(
    "/logout",
    verifyToken,
    authController.logout
);

router.get(
    "/me",
    verifyToken,
    authController.me
);

module.exports = router;