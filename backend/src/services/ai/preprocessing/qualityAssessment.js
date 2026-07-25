"use strict";

/**
 * @fileoverview qualityAssessment.js
 *
 * Stage 1: Lightweight image quality analyser.
 *
 * Metrics computed entirely in JavaScript using raw pixel data from sharp.
 * No AI inference involved.
 *
 * Output:
 *   {
 *     quality: "good" | "moderate" | "poor",
 *     blurScore:  number,   // Laplacian variance — higher = sharper
 *     brightness: number,   // Mean luminance [0..255]
 *     contrast:   number,   // Std-dev of luminance [0..127]
 *     resolution: number,   // Total pixel count (width × height)
 *     width:      number,
 *     height:     number,
 *   }
 */

const sharp = require("sharp");
const logger = require("../../../utils/logger");

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Laplacian variance below this → blurry */
const BLUR_THRESHOLD_POOR     = 50;
const BLUR_THRESHOLD_MODERATE = 200;

/** Brightness [0..255] outside this range → problematic */
const BRIGHTNESS_TOO_DARK  = 40;
const BRIGHTNESS_TOO_BRIGHT = 220;

/** Contrast (std-dev) below this → low contrast */
const CONTRAST_THRESHOLD_POOR     = 15;
const CONTRAST_THRESHOLD_MODERATE = 30;

/** Minimum resolution (px²) thresholds */
const RESOLUTION_POOR     = 50_000;   // < 224×224 equivalent
const RESOLUTION_MODERATE = 200_000;  // < ~450×450

// ─── Laplacian Kernel ─────────────────────────────────────────────────────────
// 3×3 Discrete Laplacian-of-Gaussian approximation
// Measures second-order gradient — high variance = lots of edges = sharp image
const LAPLACIAN = [
    0,  1,  0,
    1, -4,  1,
    0,  1,  0,
];

/**
 * Computes variance of the Laplacian response over a grayscale image.
 * This is the standard Pech-Palencia & Viola (2000) blur metric.
 *
 * @param {Buffer} grayData - Raw single-channel uint8 pixel data
 * @param {number} width
 * @param {number} height
 * @returns {number} variance (higher = sharper)
 */
function laplacianVariance(grayData, width, height) {
    const responses = [];

    // Skip 1-pixel border to avoid boundary conditions
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let val = 0;
            let ki = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    val += LAPLACIAN[ki++] * grayData[(y + dy) * width + (x + dx)];
                }
            }
            responses.push(val);
        }
    }

    if (responses.length === 0) return 0;

    const mean = responses.reduce((a, b) => a + b, 0) / responses.length;
    const variance = responses.reduce((acc, v) => acc + (v - mean) ** 2, 0) / responses.length;
    return variance;
}

/**
 * Computes mean and standard deviation of pixel values.
 * @param {Buffer} data - Raw uint8 pixel buffer
 * @returns {{ mean: number, std: number }}
 */
function meanAndStd(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const mean = sum / data.length;
    let variance = 0;
    for (let i = 0; i < data.length; i++) variance += (data[i] - mean) ** 2;
    return { mean, std: Math.sqrt(variance / data.length) };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyses the quality of an image buffer.
 * Returns a structured quality report.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<import('./types').QualityReport>}
 */
async function assess(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error("qualityAssessment.assess(): expected a non-empty Buffer");
    }

    // Decode as grayscale for blur / brightness / contrast
    // Resize to 512px wide max to keep computation fast
    const { data: grayData, info } = await sharp(imageBuffer)
        .greyscale()
        .resize({ width: 512, withoutEnlargement: true })
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const meta = await sharp(imageBuffer).metadata();
    const originalResolution = (meta.width || width) * (meta.height || height);

    // ── Blur (Laplacian Variance) ──────────────────────────────────────────────
    const blurScore = laplacianVariance(grayData, width, height);

    // ── Brightness & Contrast ─────────────────────────────────────────────────
    const { mean: brightness, std: contrast } = meanAndStd(grayData);

    // ── Quality Classification ─────────────────────────────────────────────────
    let qualityLevel = "good";

    const reasons = [];

    if (blurScore < BLUR_THRESHOLD_POOR) {
        qualityLevel = "poor";
        reasons.push(`very blurry (laplacian=${blurScore.toFixed(1)})`);
    } else if (blurScore < BLUR_THRESHOLD_MODERATE) {
        if (qualityLevel === "good") qualityLevel = "moderate";
        reasons.push(`soft/slightly blurry (laplacian=${blurScore.toFixed(1)})`);
    }

    if (brightness < BRIGHTNESS_TOO_DARK) {
        qualityLevel = "poor";
        reasons.push(`underexposed (brightness=${brightness.toFixed(1)})`);
    } else if (brightness > BRIGHTNESS_TOO_BRIGHT) {
        if (qualityLevel === "good") qualityLevel = "moderate";
        reasons.push(`overexposed (brightness=${brightness.toFixed(1)})`);
    }

    if (contrast < CONTRAST_THRESHOLD_POOR) {
        qualityLevel = "poor";
        reasons.push(`very low contrast (std=${contrast.toFixed(1)})`);
    } else if (contrast < CONTRAST_THRESHOLD_MODERATE) {
        if (qualityLevel === "good") qualityLevel = "moderate";
        reasons.push(`low contrast (std=${contrast.toFixed(1)})`);
    }

    if (originalResolution < RESOLUTION_POOR) {
        qualityLevel = "poor";
        reasons.push(`very low resolution (${meta.width}×${meta.height})`);
    } else if (originalResolution < RESOLUTION_MODERATE) {
        if (qualityLevel === "good") qualityLevel = "moderate";
        reasons.push(`low resolution (${meta.width}×${meta.height})`);
    }

    const report = {
        quality: qualityLevel,
        blurScore: Math.round(blurScore * 10) / 10,
        brightness: Math.round(brightness * 10) / 10,
        contrast: Math.round(contrast * 10) / 10,
        resolution: originalResolution,
        width: meta.width || width,
        height: meta.height || height,
        reasons,
    };

    logger.info(
        `QualityAssessment: quality=${report.quality} blur=${report.blurScore} ` +
        `brightness=${report.brightness} contrast=${report.contrast} ` +
        `resolution=${report.width}x${report.height}`
    );

    return report;
}

module.exports = { assess };
