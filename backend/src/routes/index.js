const express = require("express");

const authRoutes = require("./authRoutes");
const designImageRoutes = require("./designImageRoutes");
const searchRoutes = require("./searchRoutes");

const router = express.Router();


router.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});


router.use("/auth", authRoutes);
router.use("/design-images", designImageRoutes);
router.use("/search", searchRoutes);

module.exports = router;