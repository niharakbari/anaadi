"use strict";

const path = require("path");
require("dotenv").config();

module.exports = {
    port: process.env.PORT,
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    ai: {
        model: process.env.AI_MODEL,
        modelsDirectory: process.env.AI_MODELS_DIRECTORY || "ai-models"
    },

    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },

    upload: {
        designLibraryDirectory: process.env.DESIGN_LIBRARY_DIRECTORY,
        queryUploadDirectory: process.env.QUERY_UPLOAD_DIRECTORY,
        maxFiles: Number(process.env.MAX_FILES_PER_UPLOAD),
    },

    jwt : { 
        token: process.env.JWT_SECRET,
        expireTime: process.env.JWT_EXPIRES_IN
    },

    admin : {
        email : process.env.ADMIN_EMAIL,
        password : process.env.ADMIN_PASSWORD
    },

    preprocessing: {
        // Master switch — set PREPROCESSING_ENABLED=false to bypass entire pipeline
        enabled: process.env.PREPROCESSING_ENABLED !== "false",

        qualityAssessment: {
            enabled: process.env.PREPROCESSING_QUALITY !== "false",
        },

        enhancement: {
            enabled: process.env.PREPROCESSING_ENHANCEMENT !== "false",
            // CLAHE tile size (must be a divisor of image dimensions)
            claheTileWidth: 64,
            claheTileHeight: 64,
            // CLAHE slope limit: 1 = no enhancement, 3 = moderate, 5 = aggressive
            claheMaxSlope: 3,
        },

        segmentation: {
            enabled: process.env.PREPROCESSING_SEGMENTATION !== "false",
            // Path to the IS-Net ONNX model file
            modelPath: process.env.SEGMENTATION_MODEL_PATH || path.resolve(
                process.cwd(), process.env.AI_MODELS_DIRECTORY || "ai-models", "segmentation", "isnet-general-use.onnx"
            ),
            // Input resolution expected by IS-Net: 1024 × 1024
            inputSize: 1024,
            // Pixel values below this (0–255) after sigmoid are treated as background
            maskThreshold: 128,
            // Padding (px) added around the jewellery bounding box after crop
            cropPadding: 20,
        },
    },

    verification: {
        enabled: process.env.VERIFICATION_ENABLED === "true",
        debugVisualizer: process.env.DEBUG_VISUALIZER === "true",
        model: process.env.VERIFICATION_MODEL || "vit-patch",
        candidateCount: Number(process.env.VERIFICATION_CANDIDATE_COUNT) || 10,
        embeddingWeight: Number(process.env.VERIFICATION_EMBEDDING_WEIGHT) || 0.7,
        geometryWeight: Number(process.env.VERIFICATION_GEOMETRY_WEIGHT) || 0.3,
        minScore: Number(process.env.VERIFICATION_MIN_SCORE) || 5,
        // Path to store geometric features
        featuresDir: path.resolve(process.cwd(), process.env.INDEX_DIRECTORY || "indexes", "verification", "features")
    },

    search: {
        defaultTopK: Number(process.env.SEARCH_DEFAULT_TOP_K) || 10
    }
};