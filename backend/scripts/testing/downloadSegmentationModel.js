#!/usr/bin/env node
"use strict";

/**
 * downloadSegmentationModel.js
 *
 * Downloads the IS-Net General Use ONNX model (~170 MB) from the official
 * rembg GitHub releases and saves it to backend/ai-models/segmentation/.
 *
 * Run once before enabling PREPROCESSING_SEGMENTATION=true in .env:
 *
 *   node scripts/testing/downloadSegmentationModel.js
 */

const https  = require("https");
const http   = require("http");
const fs     = require("fs");
const path   = require("path");

const MODEL_URL  = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx";
const OUTPUT_DIR = path.resolve(__dirname, "..", "..", "ai-models", "segmentation");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "isnet-general-use.onnx");

function downloadFile(url, dest, redirectCount = 0) {
    if (redirectCount > 10) {
        throw new Error("Too many redirects");
    }

    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;

        const req = protocol.get(url, (res) => {
            // Follow redirects (GitHub releases use them)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log(`  → Redirecting to: ${res.headers.location.slice(0, 80)}...`);
                return downloadFile(res.headers.location, dest, redirectCount + 1)
                    .then(resolve)
                    .catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} downloading model`));
            }

            const totalSize = parseInt(res.headers["content-length"] || "0", 10);
            let downloaded = 0;
            let lastPct = 0;

            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);

            res.on("data", (chunk) => {
                downloaded += chunk.length;
                if (totalSize > 0) {
                    const pct = Math.floor((downloaded / totalSize) * 100);
                    if (pct >= lastPct + 10) {
                        lastPct = pct;
                        const mb = (downloaded / 1024 / 1024).toFixed(1);
                        const total = (totalSize / 1024 / 1024).toFixed(1);
                        process.stdout.write(`\r  Downloading... ${mb} MB / ${total} MB (${pct}%)`);
                    }
                }
            });

            fileStream.on("finish", () => {
                console.log("\n  ✓ Download complete.");
                resolve();
            });

            fileStream.on("error", reject);
        });

        req.on("error", reject);
    });
}

async function main() {
    console.log("IS-Net Segmentation Model Downloader");
    console.log("======================================\n");

    // Check if already downloaded
    if (fs.existsSync(OUTPUT_PATH)) {
        const stat = fs.statSync(OUTPUT_PATH);
        const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
        console.log(`✓ Model already exists: ${OUTPUT_PATH} (${sizeMB} MB)`);
        console.log("  Delete the file and re-run to re-download.");
        return;
    }

    // Create output directory
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log(`Downloading IS-Net General Use ONNX model`);
    console.log(`  Source: ${MODEL_URL}`);
    console.log(`  Target: ${OUTPUT_PATH}\n`);

    try {
        await downloadFile(MODEL_URL, OUTPUT_PATH);

        const stat = fs.statSync(OUTPUT_PATH);
        const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

        console.log(`\n✓ Model saved: ${OUTPUT_PATH} (${sizeMB} MB)`);
        console.log("\nNext steps:");
        console.log("  1. Set PREPROCESSING_SEGMENTATION=true in backend/.env");
        console.log("  2. Restart the backend");
        console.log("  3. Run: node scripts/testing/testPreprocessing.js\n");
    } catch (err) {
        // Clean up partial download
        if (fs.existsSync(OUTPUT_PATH)) fs.unlinkSync(OUTPUT_PATH);
        console.error(`\n✗ Download failed: ${err.message}`);
        process.exit(1);
    }
}

main();
