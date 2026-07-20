const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const savedSearchModel = require("../models/savedSearchModel");

const createSavedSearch = asyncHandler(async (req, res) => {
  const { searchHistoryId, designImageId, name, dealerName, notes } = req.body;
  const userId = req.user.id;

  if (!searchHistoryId || !designImageId || !name) {
    throw new AppError("searchHistoryId, designImageId, and name are required", 400);
  }

  const id = await savedSearchModel.saveSearch(userId, { searchHistoryId, designImageId, name, dealerName, notes });

  res.status(201).json({
    success: true,
    message: "Search saved successfully",
    id
  });
});

const getSavedSearches = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const searchStr = req.query.search || "";

  const savedSearches = await savedSearchModel.getSavedSearchesByUserId(userId, searchStr);

  res.status(200).json({
    success: true,
    data: savedSearches
  });
});

const updateSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, dealerName, notes } = req.body;
  const userId = req.user.id;

  if (!name) {
    throw new AppError("Name is required", 400);
  }

  const updated = await savedSearchModel.updateSavedSearch(id, userId, { name, dealerName, notes });

  if (!updated) {
    throw new AppError("Saved search not found or you do not have permission to update it", 404);
  }

  res.status(200).json({
    success: true,
    message: "Saved search updated successfully"
  });
});

const deleteSavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deleted = await savedSearchModel.deleteSavedSearch(id, userId);

  if (!deleted) {
    throw new AppError("Saved search not found or you do not have permission to delete it", 404);
  }

  res.status(200).json({
    success: true,
    message: "Saved search deleted successfully"
  });
});

module.exports = {
  createSavedSearch,
  getSavedSearches,
  updateSavedSearch,
  deleteSavedSearch
};
