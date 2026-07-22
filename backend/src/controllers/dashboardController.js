const asyncHandler = require("../utils/asyncHandler");
const db = require("../config/database");

const getDashboardStats = asyncHandler(async (req, res) => {

    const [[{ totalDesigns }]] = await db.query("SELECT COUNT(*) as totalDesigns FROM design_images");

    res.status(200).json({
        success: true,
        stats: {
            totalDesigns,
            searchesToday: 348,      // Mocked
            pendingReviews: 27,      // Mocked
            aiModelHealth: 100       // Mocked
        }
    });
});

module.exports = {
    getDashboardStats
};
