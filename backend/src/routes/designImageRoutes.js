const express = require("express");

const upload = require("../middlewares/uploadMiddleware");
const designImageController = require("../controllers/designImageController");

const router = express.Router();

router.post(
  "/import",
  upload.array("images"),
  designImageController.importImages
);

module.exports = router;