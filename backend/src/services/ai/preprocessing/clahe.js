"use strict";

/**
 * @fileoverview clahe.js
 *
 * Stage 2: Contrast Enhancement.
 *
 * Applies CLAHE (Contrast Limited Adaptive Histogram Equalisation) via sharp's
 * native implementation, plus a configurable highlight-suppression pass using
 * a linear level compression on the top end of the brightness range.
 *
 * Goals:
 *   - Lift shadow detail in dark jewellery photos
 *   - Recover local contrast lost by WhatsApp / JPEG compression
 *   - Suppress blown-out specular highlights on metallic surfaces
 *   - Preserve geometry — no aggressive sharpening
 *
 * Sharp 0.32+ exposes `clahe({ width, height, maxSlope })` natively.
 * No external WASM or separate library required.
 */

const sharp = require("sharp");
const logger = require("../../../utils/logger");
const config = require("../../../config/config");

/**
 * Applies CLAHE-based contrast enhancement to an image buffer.
 *
 * @param {Buffer} imageBuffer - Input image (any format sharp supports)
 * @returns {Promise<Buffer>} - Enhanced JPEG buffer
 */
async function enhance(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error("clahe.enhance(): expected a non-empty Buffer");
    }

    const cfg = config.preprocessing.enhancement;

    const tileW  = cfg.claheTileWidth  ?? 64;
    const tileH  = cfg.claheTileHeight ?? 64;
    const slope  = cfg.claheMaxSlope   ?? 3;

    /*
     * Pipeline:
     *  1. resize               — limit max dimension to 1024px to prevent massive latency
     *  2. removeAlpha          — ensures we work in RGB; avoids alpha artefacts
     *  3. toColorspace("srgb") — normalise colour space
     *  4. clahe()              — local contrast enhancement per tile
     *  5. linear(multiplier, offset)  — mild highlight suppression
     *  6. jpeg()               — output as high-quality JPEG for downstream stages
     */
    const result = await sharp(imageBuffer)
        .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
        .removeAlpha()
        .toColorspace("srgb")
        .clahe({ width: tileW, height: tileH, maxSlope: slope })
        .linear(0.92, 0)   // highlight suppression
        .jpeg({ quality: 95, mozjpeg: false })
        .toBuffer();

    logger.info(
        `CLAHE enhancement applied | tileSize=${tileW}x${tileH} maxSlope=${slope}`
    );

    return result;
}

module.exports = { enhance };
