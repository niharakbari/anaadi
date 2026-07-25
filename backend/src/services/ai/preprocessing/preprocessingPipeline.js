"use strict";

/**
 * @fileoverview preprocessingPipeline.js
 *
 * Orchestrates all preprocessing stages for a single query image.
 *
 * Pipeline execution order:
 *   1. Quality Assessment  (always runs if enabled, never modifies image)
 *   2. Enhancement        (CLAHE + highlight suppression, always applied if enabled)
 *   3. Segmentation       (IS-Net background removal + auto-crop, if enabled)
 *
 * Each stage is independently enable/disable-able via config.preprocessing.
 * The pipeline is transparent to the embedding model — it receives only the
 * final processed Buffer; the internal stages are hidden.
 *
 * Usage:
 *   const pipeline = require('./preprocessingPipeline');
 *   await pipeline.initialise(); // once at boot
 *   const { buffer, report } = await pipeline.process(rawImageBuffer);
 *   // pass buffer to embeddingService.embed()
 */

const logger    = require("../../../utils/logger");
const AppError  = require("../../../utils/AppError");
const config    = require("../../../config/config");

const qualityAssessment = require("./qualityAssessment");
const clahe             = require("./clahe");
const segmentation      = require("./segmentation");

let _isInitialised = false;

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Boot-time initialisation.
 * Loads any heavy ONNX sessions (segmentation model) if enabled.
 * Must be awaited before the first call to process().
 * @returns {Promise<void>}
 */
async function initialise() {
    if (_isInitialised) return;

    const cfg = config.preprocessing;

    if (!cfg.enabled) {
        logger.info("PreprocessingPipeline: disabled via config. Bypassing all stages.");
        _isInitialised = true;
        return;
    }

    if (cfg.segmentation.enabled) {
        await segmentation.initialise();
    }

    _isInitialised = true;
    logger.info(
        `PreprocessingPipeline: initialized | ` +
        `qualityAssessment=${cfg.qualityAssessment.enabled} ` +
        `enhancement=${cfg.enhancement.enabled} ` +
        `segmentation=${cfg.segmentation.enabled}`
    );
}

// ─── Core Pipeline ─────────────────────────────────────────────────────────────

/**
 * Analyzes the edges of the image to detect a clean/solid background.
 * Very fast heuristic: checks standard deviation of border pixels.
 */
async function isCleanBackground(imageBuffer, width, height) {
    try {
        const { data, info } = await require("sharp")(imageBuffer)
            .resize(128, 128, { fit: "inside" })
            .greyscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const w = info.width;
        const h = info.height;
        const borderPixels = [];

        for (let x = 0; x < w; x++) {
            borderPixels.push(data[0 * w + x]);          // top
            borderPixels.push(data[(h - 1) * w + x]);    // bottom
        }
        for (let y = 1; y < h - 1; y++) {
            borderPixels.push(data[y * w + 0]);          // left
            borderPixels.push(data[y * w + (w - 1)]);    // right
        }

        const mean = borderPixels.reduce((a, b) => a + b, 0) / borderPixels.length;
        const variance = borderPixels.reduce((acc, v) => acc + (v - mean) ** 2, 0) / borderPixels.length;
        const std = Math.sqrt(variance);

        // A clean background (white/gray/black) will have very low standard deviation on the edges
        return std < 10 && mean > 200; // also mostly white-ish
    } catch (err) {
        return false;
    }
}

/**
 * Processes a raw image buffer through enabled preprocessing stages.
 */
async function process(imageBuffer) {
    if (!_isInitialised) {
        throw new AppError("PreprocessingPipeline is not initialised. Call initialise() first.", 503);
    }

    const startTime = Date.now();
    const cfg = config.preprocessing;

    const report = {
        pipelineEnabled:      cfg.enabled,
        qualityReport:        null,
        stagesExecuted:       [],
        hadForeground:        null,
        totalLatencyMs:       0,
    };

    if (!cfg.enabled) {
        report.totalLatencyMs = Date.now() - startTime;
        return { buffer: imageBuffer, report };
    }

    let buffer = imageBuffer;
    
    // ── Context for Decision Engine ──
    const context = {
        isCleanBackground: false,
        quality: "unknown",
        skipSegmentation: false,
        skipEnhancement: false,
    };

    // ── Stage 1: Quality Assessment ──
    if (cfg.qualityAssessment.enabled) {
        try {
            report.qualityReport = await qualityAssessment.assess(buffer);
            context.quality = report.qualityReport.quality;
            context.isCleanBackground = await isCleanBackground(buffer);
            report.stagesExecuted.push("QA");
            
            if (context.quality === "good" && context.isCleanBackground) {
                context.skipSegmentation = true;
                context.skipEnhancement = true;
                logger.info("Adaptive Decision Engine: Good quality + clean background detected. Skipping Enhancement & Segmentation.");
            }
        } catch (err) {
            logger.warn(`QualityAssessment failed (non-fatal): ${err.message}`);
        }
    }

    // ── Stage 2: Enhancement ──
    if (cfg.enhancement.enabled && !context.skipEnhancement) {
        try {
            buffer = await clahe.enhance(buffer);
            report.stagesExecuted.push("Enhancement");
        } catch (err) {
            logger.warn(`Enhancement failed (non-fatal): ${err.message}`);
        }
    }

    // ── Stage 3: Segmentation ──
    if (cfg.segmentation.enabled && !context.skipSegmentation) {
        try {
            const result = await segmentation.removeBackground(buffer);
            buffer = result.buffer;
            report.stagesExecuted.push("Segmentation");
            report.hadForeground = result.hadForeground;
        } catch (err) {
            logger.warn(`Segmentation failed (non-fatal): ${err.message}`);
        }
    }

    report.totalLatencyMs = Date.now() - startTime;

    logger.info(
        `PreprocessingPipeline: complete | ` +
        `quality=${context.quality} ` +
        `stages=[${report.stagesExecuted.join(",")}] ` +
        `latency=${report.totalLatencyMs}ms`
    );

    return { buffer, report };
}

module.exports = {
    initialise,
    process,
    get isInitialised() { return _isInitialised; },
};
