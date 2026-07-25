"use strict";

const { embeddingService, indexService } = require("../services/ai");

const health = (req, res) => {
    return res.status(200).json({
        status: "healthy",
        
        metadata: {
            activeModel: embeddingService.isReady ? embeddingService.getContext().id : "unknown",
            displayName: embeddingService.isReady ? embeddingService.getContext().name : "Unknown",
            variant: embeddingService.isReady ? embeddingService.getContext().variant : "Unknown",
            version: embeddingService.isReady ? embeddingService.getContext().version : "Unknown",
            embeddingDimension: embeddingService.isReady ? embeddingService.getContext().dimension : 0,
            inputResolution: embeddingService.isReady ? embeddingService.getContext().preprocessing?.inputSize : 0,
            distanceMetric: embeddingService.isReady ? embeddingService.getContext().search?.metric : "unknown",
            searchThreshold: embeddingService.isReady ? embeddingService.getContext().search?.threshold : 0,
            indexPath: embeddingService.isReady ? embeddingService.getContext().paths?.index : "unknown",
            metadataPath: embeddingService.isReady ? embeddingService.getContext().paths?.metadata : "unknown",
            loadedVectors: indexService.isReady ? indexService.vectorCount : 0,
            modelSize: "Unknown (Local ONNX)",
            runtime: "ONNX Runtime",
            executionProvider: "CPU"
        },

        embeddingService: {
            ready: embeddingService.isReady,
            embeddingDimension: embeddingService.isReady ? embeddingService.embeddingDim : 0,
        },

        indexService: {
            ready: indexService.isReady,
            indexedImages: indexService.isReady ? indexService.vectorCount : 0,
        },
    });
};

module.exports = {
    health,
};