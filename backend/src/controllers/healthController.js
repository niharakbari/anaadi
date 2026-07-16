"use strict";

const { embeddingService, indexService } = require("../services/ai");

const health = (req, res) => {
    return res.status(200).json({
        status: "healthy",

        embeddingService: {
            ready: embeddingService.isReady,
            embeddingDimension: embeddingService.embeddingDim,
        },

        indexService: {
            ready: indexService.isReady,
            indexedImages: indexService.vectorCount,
        },
    });
};

module.exports = {
    health,
};