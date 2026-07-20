const express = require("express");
const searchUpload = require("../middlewares/searchUpload");
const searchController = require("../controllers/searchController");

const router = express.Router();

router.post(
    "/image",
    searchUpload.single("image"),
    searchController.searchByImage
);

router.get("/history", searchController.getHistory);
router.delete("/history", searchController.clearHistory);

module.exports = router;