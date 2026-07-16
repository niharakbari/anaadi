const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const { searchService } = require("../services/ai");

const searchByImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError("No image file provided.", 400);
    }

    const { k, distanceThreshold, includeDistance } = req.body || {};

    const results = await searchService.searchByImage(req.file.buffer, {
        k,
        distanceThreshold,
        includeDistance,
    });

    return res.status(200).json({
        success: true,
        count: results.length,
        results,
    });
});

module.exports = {
    searchByImage,
};