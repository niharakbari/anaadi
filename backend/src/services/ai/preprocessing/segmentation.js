"use strict";

/**
 * @fileoverview segmentation.js
 *
 * Stage 3: Background Removal using IS-Net (ONNX).
 *
 * ─── Model Decision ───────────────────────────────────────────────────────────
 *
 * Three candidates were evaluated:
 *
 * │ Model       │ Quality  │ CPU Speed  │ ONNX  │ License  │ Notes              │
 * │─────────────│──────────│────────────│───────│──────────│────────────────────│
 * │ U²-Net      │ ★★★☆☆    │ ~80ms      │ ✓     │ Apache2  │ 320×320, older arch │
 * │ IS-Net      │ ★★★★☆    │ ~200–350ms │ ✓     │ Apache2  │ 1024×1024, current  │
 * │ BiRefNet    │ ★★★★★    │ ~600–900ms │ ✓     │ MIT      │ 1024×1024, heaviest │
 *
 * Choice: IS-Net (isnet-general-use)
 *
 * Reasons:
 *   1. Best quality/latency trade-off for CPU inference.
 *      BiRefNet produces slightly sharper edges on fine chains and prong
 *      clusters, but at 600–900ms CPU it blows the 2-second query budget.
 *      U²-Net runs fastest but its 320×320 input resolution loses too much
 *      fine-grained detail on prong styles and pavé settings.
 *   2. IS-Net runs at 1024×1024 internal resolution in ~200–350ms on a
 *      modern CPU (M-series Mac, Xeon E5), fitting comfortably within budget.
 *   3. Official Apache 2.0 ONNX weights shipped by the rembg project.
 *      Commercially safe, well-tested.
 *   4. IS-Net was specifically designed as the current-generation successor
 *      to U²-Net, trained on DIS5K which includes challenging fine-grained
 *      objects with thin structures — directly relevant to jewellery chains
 *      and prong clusters.
 *
 * ONNX source:
 *   https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
 *   (~170 MB, downloaded on first use by scripts/testing/downloadSegmentationModel.js)
 *
 * I/O spec (from rembg Python source):
 *   Input:  name=session.inputNames[0]  shape=[1, 3, 1024, 1024]  dtype=float32
 *           normalised: (pixel/255 − 0.5) / 0.5
 *   Output: name=session.outputNames[0] shape=[1, 1, 1024, 1024]  dtype=float32
 *           raw logits → sigmoid → threshold at 0.5 → binary foreground mask
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs  = require("fs/promises");
const ort = require("onnxruntime-node");
const sharp = require("sharp");

const logger   = require("../../../utils/logger");
const AppError = require("../../../utils/AppError");
const config   = require("../../../config/config");

const { applyMaskToImage, autoCropToForeground, flattenToWhiteBackground } = require("./imageUtils");

// ─── IS-Net Constants ─────────────────────────────────────────────────────────
const ISNET_MEAN = [0.5, 0.5, 0.5];
const ISNET_STD  = [0.5, 0.5, 0.5];

/** @type {ort.InferenceSession | null} */
let _session = null;
let _isReady = false;

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Loads the IS-Net ONNX model into memory.
 * Idempotent — calling multiple times is safe.
 * @returns {Promise<void>}
 */
async function initialise() {
    if (_isReady) return;

    const modelPath = config.preprocessing.segmentation.modelPath;

    try {
        await fs.access(modelPath);
    } catch {
        throw new AppError(
            `Segmentation model not found at: ${modelPath}\n` +
            `Run: node scripts/testing/downloadSegmentationModel.js`,
            500
        );
    }

    _session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
    });

    _isReady = true;
    logger.info(`SegmentationService (IS-Net) initialized | model: ${modelPath}`);
}

// ─── Preprocessing ────────────────────────────────────────────────────────────

/**
 * Converts an image buffer to a normalised Float32Array tensor in CHW layout
 * suitable for IS-Net input [1, 3, 1024, 1024].
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<Float32Array>}
 */
async function preprocessForISNet(imageBuffer) {
    const inputSize = config.preprocessing.segmentation.inputSize; // 1024

    const { data: rawPixels, info } = await sharp(imageBuffer)
        .resize(inputSize, inputSize, { fit: "fill", kernel: "lanczos3" })
        .removeAlpha()
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixelsPerChannel = inputSize * inputSize;
    const tensor = new Float32Array(3 * pixelsPerChannel);

    for (let i = 0; i < pixelsPerChannel; i++) {
        for (let c = 0; c < 3; c++) {
            tensor[c * pixelsPerChannel + i] =
                (rawPixels[i * 3 + c] / 255 - ISNET_MEAN[c]) / ISNET_STD[c];
        }
    }

    return tensor;
}

// ─── Sigmoid ──────────────────────────────────────────────────────────────────

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Removes the background from an image using IS-Net.
 *
 * Returns a JPEG buffer of the jewellery piece, tightly cropped,
 * composited onto a clean white background (ready for embedding).
 *
 * @param {Buffer} imageBuffer - Input image
 * @returns {Promise<{ buffer: Buffer, hadForeground: boolean }>}
 */
async function removeBackground(imageBuffer) {
    if (!_isReady) {
        throw new AppError("SegmentationService is not initialized. Call initialise() first.", 503);
    }

    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new AppError("segmentation.removeBackground(): expected a non-empty Buffer", 400);
    }

    const startTime = Date.now();

    // ── Get original dimensions ────────────────────────────────────────────────
    const meta = await sharp(imageBuffer).metadata();
    const originalWidth  = meta.width;
    const originalHeight = meta.height;
    const inputSize = config.preprocessing.segmentation.inputSize;

    // ── Prepare input tensor ───────────────────────────────────────────────────
    const tensorData = await preprocessForISNet(imageBuffer);

    const inputTensor = new ort.Tensor("float32", tensorData, [1, 3, inputSize, inputSize]);
    const inputName   = _session.inputNames[0];

    // ── Run ONNX inference ─────────────────────────────────────────────────────
    const results = await _session.run({ [inputName]: inputTensor });

    const outputName   = _session.outputNames[0];
    const outputTensor = results[outputName];

    if (!outputTensor) {
        throw new AppError(`Segmentation: no output tensor for key "${outputName}"`, 500);
    }

    const logits = outputTensor.data; // Float32Array, [1, 1, 1024, 1024]

    // ── Apply sigmoid to get [0..1] foreground probabilities ───────────────────
    const maskSize = inputSize * inputSize;
    const maskData = new Float32Array(maskSize);

    let foregroundPixels = 0;
    for (let i = 0; i < maskSize; i++) {
        maskData[i] = sigmoid(logits[i]);
        if (maskData[i] > 0.5) foregroundPixels++;
    }

    const foregroundRatio = foregroundPixels / maskSize;
    const hadForeground   = foregroundRatio > 0.01; // at least 1% foreground

    if (!hadForeground) {
        logger.warn(
            `Segmentation: no foreground detected (ratio=${foregroundRatio.toFixed(3)}). ` +
            `Returning original image.`
        );
        return { buffer: imageBuffer, hadForeground: false };
    }

    // ── Apply mask to original image ───────────────────────────────────────────
    const maskedRGBA = await applyMaskToImage(
        imageBuffer, maskData, inputSize, inputSize, originalWidth, originalHeight
    );

    // ── Auto-crop to foreground bounding box ──────────────────────────────────
    const padding = config.preprocessing.segmentation.cropPadding;
    const croppedRGBA = await autoCropToForeground(maskedRGBA, padding);

    // ── Flatten onto white background for embedding model ────────────────────
    const finalBuffer = await flattenToWhiteBackground(croppedRGBA);

    const elapsed = Date.now() - startTime;
    logger.info(
        `Segmentation (IS-Net): complete | foreground=${(foregroundRatio * 100).toFixed(1)}% ` +
        `latency=${elapsed}ms`
    );

    return { buffer: finalBuffer, hadForeground: true };
}

/**
 * Exposes the raw RGBA masked buffer (with transparent background).
 * Used by the debug/test pipeline for visual inspection.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ maskedRGBA: Buffer, croppedRGBA: Buffer, finalJPEG: Buffer }>}
 */
async function removeBackgroundDebug(imageBuffer) {
    if (!_isReady) {
        throw new AppError("SegmentationService is not initialized.", 503);
    }

    const meta = await sharp(imageBuffer).metadata();
    const originalWidth  = meta.width;
    const originalHeight = meta.height;
    const inputSize = config.preprocessing.segmentation.inputSize;

    const tensorData = await preprocessForISNet(imageBuffer);
    const inputTensor = new ort.Tensor("float32", tensorData, [1, 3, inputSize, inputSize]);
    const results = await _session.run({ [_session.inputNames[0]]: inputTensor });

    const logits = results[_session.outputNames[0]].data;
    const maskSize = inputSize * inputSize;
    const maskData = new Float32Array(maskSize);
    for (let i = 0; i < maskSize; i++) maskData[i] = sigmoid(logits[i]);

    const maskedRGBA  = await applyMaskToImage(imageBuffer, maskData, inputSize, inputSize, originalWidth, originalHeight);
    const croppedRGBA = await autoCropToForeground(maskedRGBA, config.preprocessing.segmentation.cropPadding);
    const finalJPEG   = await flattenToWhiteBackground(croppedRGBA);

    return { maskedRGBA, croppedRGBA, finalJPEG };
}

module.exports = {
    initialise,
    removeBackground,
    removeBackgroundDebug,
    get isReady() { return _isReady; },
};
