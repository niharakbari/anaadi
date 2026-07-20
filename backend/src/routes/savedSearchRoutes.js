const express = require("express");
const savedSearchController = require("../controllers/savedSearchController");

const router = express.Router();

router.post("/", savedSearchController.createSavedSearch);
router.get("/", savedSearchController.getSavedSearches);
router.put("/:id", savedSearchController.updateSavedSearch);
router.delete("/:id", savedSearchController.deleteSavedSearch);

module.exports = router;
