const express = require("express");

const { upload, MAX_FILES_PER_UPLOAD } = require("../middlewares/uploadMiddleware");
const designImageController = require("../controllers/designImageController");

const router = express.Router();

router.get("/", designImageController.getAllImages);

router.post(
  "/import",
  upload.array("images", MAX_FILES_PER_UPLOAD),
  designImageController.importImages
);

router.delete("/", designImageController.deleteAllImages);
router.delete("/:id", designImageController.deleteImage);

module.exports = router;