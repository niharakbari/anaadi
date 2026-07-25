"use strict";

/**
 * @fileoverview imageUtils.js
 *
 * Shared image utilities for the preprocessing pipeline.
 * All functions operate on Buffer objects using sharp.
 */

const sharp = require("sharp");
const AppError = require("../../../utils/AppError");

/**
 * Reads image metadata without decoding pixel data.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ width: number, height: number, channels: number, format: string }>}
 */
async function getMetadata(imageBuffer) {
    const meta = await sharp(imageBuffer).metadata();
    return {
        width: meta.width,
        height: meta.height,
        channels: meta.channels,
        format: meta.format,
    };
}

/**
 * Decodes an image into raw RGBA pixel data.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ data: Buffer, width: number, height: number }>}
 */
async function toRawRGBA(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
        .removeAlpha()
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
}

/**
 * Decodes an image into raw GRAYSCALE pixel data.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ data: Buffer, width: number, height: number }>}
 */
async function toRawGrayscale(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
}

/**
 * Converts raw RGB pixel data (Float32, CHW layout) back to a PNG Buffer.
 * This is the inverse of the ONNX preprocessing step in segmentation.
 * @param {Buffer} imageBuffer - original image for reference size
 * @param {Float32Array} maskData - single-channel float mask, HW layout [0..1]
 * @param {number} maskWidth
 * @param {number} maskHeight
 * @param {number} originalWidth
 * @param {number} originalHeight
 * @returns {Promise<Buffer>} - RGBA PNG with mask applied as alpha
 */
async function applyMaskToImage(imageBuffer, maskData, maskWidth, maskHeight, originalWidth, originalHeight) {
    // Resize the float mask to the original image dimensions
    const maskPixels = maskData.length; // maskWidth × maskHeight

    // Build a raw Uint8 single-channel buffer for the mask
    const maskUint8 = new Uint8Array(maskPixels);
    for (let i = 0; i < maskPixels; i++) {
        maskUint8[i] = Math.min(255, Math.max(0, Math.round(maskData[i] * 255)));
    }

    // Resize mask to original image dimensions using sharp
    const resizedMask = await sharp(Buffer.from(maskUint8.buffer), {
        raw: { width: maskWidth, height: maskHeight, channels: 1 },
    })
        .resize(originalWidth, originalHeight, { kernel: "lanczos3" })
        .raw()
        .toBuffer();

    // Decode original image as raw RGB
    const { data: rgbData } = await sharp(imageBuffer)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Compose RGBA = RGB from original + A from mask
    const rgbaData = new Uint8Array(originalWidth * originalHeight * 4);
    for (let i = 0; i < originalWidth * originalHeight; i++) {
        rgbaData[i * 4 + 0] = rgbData[i * 3 + 0]; // R
        rgbaData[i * 4 + 1] = rgbData[i * 3 + 1]; // G
        rgbaData[i * 4 + 2] = rgbData[i * 3 + 2]; // B
        rgbaData[i * 4 + 3] = resizedMask[i];       // A from mask
    }

    return sharp(Buffer.from(rgbaData.buffer), {
        raw: { width: originalWidth, height: originalHeight, channels: 4 },
    })
        .png()
        .toBuffer();
}

/**
 * Crops an RGBA image to the bounding box of its non-transparent pixels.
 * Adds configurable padding around the detected bounding box.
 * @param {Buffer} rgbaBuffer - PNG/RGBA image buffer
 * @param {number} padding - pixel padding on each side (default 20)
 * @returns {Promise<Buffer>} - cropped PNG
 */
async function autoCropToForeground(rgbaBuffer, padding = 20) {
    const { data, info } = await sharp(rgbaBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height } = info;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasForeground = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 10) { // threshold to avoid noise
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasForeground = true;
            }
        }
    }

    if (!hasForeground) {
        // No foreground found — return original
        return rgbaBuffer;
    }

    // Apply padding, clamped to image bounds
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    if (cropWidth < 10 || cropHeight < 10) {
        return rgbaBuffer; // too small — something went wrong
    }

    return sharp(rgbaBuffer)
        .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
        .png()
        .toBuffer();
}

/**
 * Composites a transparent-background PNG onto a white background,
 * producing a standard RGB JPEG for the embedding model.
 * @param {Buffer} rgbaBuffer
 * @returns {Promise<Buffer>}
 */
async function flattenToWhiteBackground(rgbaBuffer) {
    const meta = await sharp(rgbaBuffer).metadata();
    const { width, height } = meta;

    // White background layer
    const whiteBackground = await sharp({
        create: {
            width,
            height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    })
        .png()
        .toBuffer();

    return sharp(whiteBackground)
        .composite([{ input: rgbaBuffer, blend: "over" }])
        .jpeg({ quality: 95 })
        .toBuffer();
}

module.exports = {
    getMetadata,
    toRawRGBA,
    toRawGrayscale,
    applyMaskToImage,
    autoCropToForeground,
    flattenToWhiteBackground,
};
