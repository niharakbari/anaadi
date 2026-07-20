const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const config = require("../config/config");
const searchHistoryModel = require("../models/searchHistoryModel");
const { searchService } = require("../services/ai");

const searchByImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError("No image file provided.", 400);
    }

    const { k, distanceThreshold, includeDistance } = req.body || {};

    // 1. Perform AI Inference
    const results = await searchService.searchByImage(req.file.buffer, {
        k,
        distanceThreshold,
        includeDistance,
    });

    // 2. Persist the query image to disk for Search History
    const originalName = req.file.originalname;
    const ext = path.extname(originalName) || '.jpeg';
    const storedName = `${randomUUID()}${ext}`;
    const uploadDir = path.resolve(config.upload.queryUploadDirectory || 'uploads/query_uploads');
    
    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    const storedPath = path.join(uploadDir, storedName);
    await fs.writeFile(storedPath, req.file.buffer);
    
    const dbImagePath = `/uploads/query_uploads/${storedName}`;

    // 3. Save Search History to Database
    const userId = req.user.id;
    const searchHistoryId = await searchHistoryModel.saveSearchHistory(userId, {
        originalName,
        storedName,
        path: dbImagePath
    }, results);

    return res.status(200).json({
        success: true,
        count: results.length,
        searchHistoryId,
        results,
    });
});

const getHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    
    const historyData = await searchHistoryModel.getSearchHistoryByUserId(userId, page, limit);
    
    return res.status(200).json({
        success: true,
        ...historyData
    });
});

const clearHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await searchHistoryModel.clearSearchHistoryByUserId(userId);
    
    return res.status(200).json({
        success: true,
        message: "Search history cleared successfully."
    });
});

module.exports = {
    searchByImage,
    getHistory,
    clearHistory
};