#!/usr/bin/env node
"use strict";

/**
 * testPreprocessing.js
 *
 * Standalone preprocessing validation script.
 *
 * Runs the full preprocessing pipeline on a sample of images from the
 * design library and saves every intermediate output to:
 *
 *   backend/debug/preprocessing/<image_name>/
 *     01_original.jpg
 *     02_enhanced.jpg
 *     03_segmented.png   (RGBA transparent background)
 *     04_cropped.png     (RGBA cropped)
 *     05_final.jpg       (white background, ready for embedding)
 *     report.json
 *
 * Usage:
 *   node scripts/testing/testPreprocessing.js [--count=5] [--seg]
 *
 *   --count=N   How many images to process (default: 5)
 *   --seg       Force segmentation even if PREPROCESSING_SEGMENTATION=false in .env
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const path = require("path");
const fs   = require("fs/promises");
const fsSync = require("fs");

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const countArg = args.find(a => a.startsWith("--count="));
const SAMPLE_COUNT = countArg ? parseInt(countArg.split("=")[1], 10) : 5;
const FORCE_SEG    = args.includes("--seg");

if (FORCE_SEG) {
    process.env.PREPROCESSING_SEGMENTATION = "true";
    console.log("⚡ Segmentation forced ON via --seg flag");
}

// ─── Modules ──────────────────────────────────────────────────────────────────
const sharp = require("sharp");
const config = require("../../src/config/config");
const qualityAssessment = require("../../src/services/ai/preprocessing/qualityAssessment");
const clahe             = require("../../src/services/ai/preprocessing/clahe");
const segmentation      = require("../../src/services/ai/preprocessing/segmentation");

const DESIGN_LIB = path.resolve(__dirname, "../../", config.upload.designLibraryDirectory);
const DEBUG_DIR  = path.resolve(__dirname, "../../debug/preprocessing");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n, len = 2) { return String(n).padStart(len, "0"); }

async function saveBuffer(dir, filename, buffer) {
    await fs.writeFile(path.join(dir, filename), buffer);
}

function formatMs(ms) { return `${ms}ms`; }

async function processImage(imageFile, index, total) {
    const imageName  = path.basename(imageFile, path.extname(imageFile));
    const outputDir  = path.join(DEBUG_DIR, imageName);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`\n[${pad(index + 1)}/${pad(total)}] ${path.basename(imageFile)}`);

    const rawBuffer  = await fs.readFile(imageFile);
    const totalStart = Date.now();
    const report     = { file: path.basename(imageFile), stages: {} };

    // ── 1. Save original ──────────────────────────────────────────────────────
    const origJpeg = await sharp(rawBuffer).jpeg({ quality: 92 }).toBuffer();
    await saveBuffer(outputDir, "01_original.jpg", origJpeg);
    const meta = await sharp(rawBuffer).metadata();
    report.stages.original = { width: meta.width, height: meta.height };
    console.log(`  01 original  | ${meta.width}×${meta.height}`);

    // ── 2. Quality Assessment ─────────────────────────────────────────────────
    const qaStart = Date.now();
    const qualityReport = await qualityAssessment.assess(rawBuffer);
    report.stages.qualityAssessment = { ...qualityReport, latencyMs: Date.now() - qaStart };
    console.log(
        `  02 quality   | ${qualityReport.quality.toUpperCase().padEnd(8)} ` +
        `blur=${qualityReport.blurScore} brightness=${qualityReport.brightness} ` +
        `contrast=${qualityReport.contrast} | ${formatMs(Date.now() - qaStart)}`
    );

    // ── 3. Enhancement ────────────────────────────────────────────────────────
    const enhStart = Date.now();
    const enhancedBuffer = await clahe.enhance(rawBuffer);
    await saveBuffer(outputDir, "02_enhanced.jpg", enhancedBuffer);
    report.stages.enhancement = { latencyMs: Date.now() - enhStart };
    console.log(`  03 enhanced  | CLAHE applied | ${formatMs(Date.now() - enhStart)}`);

    // ── 4. Segmentation (if enabled) ──────────────────────────────────────────
    if (config.preprocessing.segmentation.enabled && segmentation.isReady) {
        const segStart = Date.now();

        try {
            const { maskedRGBA, croppedRGBA, finalJPEG } =
                await segmentation.removeBackgroundDebug(enhancedBuffer);

            await saveBuffer(outputDir, "03_segmented.png", maskedRGBA);
            await saveBuffer(outputDir, "04_cropped.png",   croppedRGBA);
            await saveBuffer(outputDir, "05_final.jpg",     finalJPEG);

            const segMeta = await sharp(finalJPEG).metadata();
            report.stages.segmentation = {
                applied: true,
                outputWidth:  segMeta.width,
                outputHeight: segMeta.height,
                latencyMs: Date.now() - segStart,
            };
            console.log(
                `  04 segmented | foreground extracted | ` +
                `output=${segMeta.width}×${segMeta.height} | ${formatMs(Date.now() - segStart)}`
            );
        } catch (err) {
            report.stages.segmentation = { applied: false, error: err.message };
            console.log(`  04 segmented | SKIPPED — ${err.message}`);
        }
    } else {
        report.stages.segmentation = { applied: false, reason: "disabled or model not loaded" };
        console.log(`  04 segmented | SKIPPED (PREPROCESSING_SEGMENTATION=false)`);
        // Save enhanced as final
        await saveBuffer(outputDir, "05_final.jpg", enhancedBuffer);
    }

    report.totalLatencyMs = Date.now() - totalStart;
    console.log(`  Total latency: ${formatMs(report.totalLatencyMs)}`);

    // ── Save JSON report ──────────────────────────────────────────────────────
    await saveBuffer(
        outputDir,
        "report.json",
        Buffer.from(JSON.stringify(report, null, 2))
    );

    return report;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("  Anaadi Preprocessing Pipeline — Validation Test");
    console.log("═══════════════════════════════════════════════════");
    console.log(`  Design library: ${DESIGN_LIB}`);
    console.log(`  Output dir:     ${DEBUG_DIR}`);
    console.log(`  Sample count:   ${SAMPLE_COUNT}`);
    console.log(`  Segmentation:   ${config.preprocessing.segmentation.enabled}`);
    console.log("═══════════════════════════════════════════════════\n");

    // ── Ensure debug directory exists ─────────────────────────────────────────
    await fs.mkdir(DEBUG_DIR, { recursive: true });

    // ── Initialise segmentation if enabled ───────────────────────────────────
    if (config.preprocessing.segmentation.enabled) {
        console.log("Loading IS-Net segmentation model...");
        try {
            await segmentation.initialise();
            console.log("✓ IS-Net loaded\n");
        } catch (err) {
            console.error(`✗ Could not load IS-Net: ${err.message}`);
            console.error(`  Run: node scripts/testing/downloadSegmentationModel.js`);
            console.error(`  Then set PREPROCESSING_SEGMENTATION=true in .env\n`);
            // Continue without segmentation
            process.env.PREPROCESSING_SEGMENTATION = "false";
            // Reload config value
            config.preprocessing.segmentation.enabled = false;
        }
    }

    // ── Collect image files ───────────────────────────────────────────────────
    let allFiles;
    try {
        const entries = await fs.readdir(DESIGN_LIB);
        allFiles = entries
            .filter(f => /\.(jpe?g|png|webp|JPE?G|PNG|WEBP)$/i.test(f))
            .map(f => path.join(DESIGN_LIB, f));
    } catch (err) {
        console.error(`Cannot read design library: ${err.message}`);
        process.exit(1);
    }

    if (allFiles.length === 0) {
        console.error("No images found in design library.");
        process.exit(1);
    }

    // Sample deterministically (evenly spaced)
    const step = Math.max(1, Math.floor(allFiles.length / SAMPLE_COUNT));
    const sample = [];
    for (let i = 0; i < allFiles.length && sample.length < SAMPLE_COUNT; i += step) {
        sample.push(allFiles[i]);
    }

    console.log(`Processing ${sample.length} images from ${allFiles.length} total...\n`);

    // ── Process each image ────────────────────────────────────────────────────
    const reports = [];
    for (let i = 0; i < sample.length; i++) {
        const report = await processImage(sample[i], i, sample.length);
        reports.push(report);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const latencies = {
        qa: reports.map(r => r.stages.qualityAssessment?.latencyMs || 0).filter(l => l > 0),
        enh: reports.map(r => r.stages.enhancement?.latencyMs || 0).filter(l => l > 0),
        seg: reports.map(r => r.stages.segmentation?.latencyMs || 0).filter(l => l > 0),
        total: reports.map(r => r.totalLatencyMs)
    };

    function calcStats(arr) {
        if (!arr.length) return { avg: 0, min: 0, max: 0, p95: 0 };
        arr.sort((a, b) => a - b);
        const sum = arr.reduce((a, b) => a + b, 0);
        return {
            avg: Math.round(sum / arr.length),
            min: arr[0],
            max: arr[arr.length - 1],
            p95: arr[Math.floor(arr.length * 0.95)] || arr[arr.length - 1]
        };
    }

    const stats = {
        qa: calcStats(latencies.qa),
        enh: calcStats(latencies.enh),
        seg: calcStats(latencies.seg),
        total: calcStats(latencies.total)
    };

    console.log("\n═══════════════════════════════════════════════════");
    console.log("  Fine-Grained Performance Profiling");
    console.log("═══════════════════════════════════════════════════");
    console.log("Stage              | Avg (ms) | P95 (ms) | Max (ms)");
    console.log("---------------------------------------------------");
    console.log(`Quality Assessment | ${String(stats.qa.avg).padEnd(8)} | ${String(stats.qa.p95).padEnd(8)} | ${stats.qa.max}`);
    console.log(`CLAHE Enhancement  | ${String(stats.enh.avg).padEnd(8)} | ${String(stats.enh.p95).padEnd(8)} | ${stats.enh.max}`);
    console.log(`Segmentation & Crop| ${String(stats.seg.avg).padEnd(8)} | ${String(stats.seg.p95).padEnd(8)} | ${stats.seg.max}`);
    console.log("---------------------------------------------------");
    console.log(`Total Pipeline     | ${String(stats.total.avg).padEnd(8)} | ${String(stats.total.p95).padEnd(8)} | ${stats.total.max}`);
    
    console.log("\n  Output saved to  : " + DEBUG_DIR);
    console.log("═══════════════════════════════════════════════════\n");
    // ── Save overall summary ──────────────────────────────────────────────────
    await fs.writeFile(
        path.join(DEBUG_DIR, "summary.json"),
        JSON.stringify({ stats, images: reports }, null, 2)
    );

    console.log("✓ summary.json written\n");
}

main().catch(err => {
    console.error("\nFatal error:", err.message);
    process.exit(1);
});
