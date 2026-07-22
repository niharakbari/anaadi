const express = require("express");

const authRoutes = require("./authRoutes");
const designImageRoutes = require("./designImageRoutes");
const searchRoutes = require("./searchRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const savedSearchRoutes = require("./savedSearchRoutes");

const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/design-images", verifyToken, designImageRoutes);
router.use("/search", verifyToken, searchRoutes);
router.use("/dashboard", verifyToken, dashboardRoutes);
router.use("/saved-searches", verifyToken, savedSearchRoutes);

module.exports = router;