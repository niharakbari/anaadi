#!/usr/bin/env node
"use strict";

/**
 * benchmarkRetrieval.js
 *
 * Automates an ablation study over the preprocessing pipeline.
 * Evaluates different combinations of preprocessing stages against a
 * ground-truth benchmark dataset and reports objective metrics:
 * Recall@1, Recall@5, Average Rank, Average Latency.
 *
 * Generates automated failure reports for missed queries.
 *
 * Usage:
 *   node scripts/testing/benchmarkRetrieval.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");

const BENCHMARK_JSON = path.join(__dirname, "benchmark.json");
const QUERY_DIR      = path.resolve(__dirname, "../../uploads/query_uploads");
const FAILURES_DIR   = path.resolve(__dirname, "../../debug/failures");

const config = require("../../src/config/config");
const { searchService, embeddingService, indexService } = require("../../src/services/ai");
const preprocessingPipeline = require("../../src/services/ai/preprocessing");

// ─── Ablation Permutations ────────────────────────────────────────────────────
const ABLATIONS = [
    { name: "A. None",                 qa: false, enh: false, seg: false },
    { name: "B. QA Only",              qa: true,  enh: false, seg: false },
    { name: "C. CLAHE Only",           qa: false, enh: true,  seg: false },
    { name: "D. Segmentation Only",    qa: false, enh: false, seg: true  },
    { name: "E. QA + CLAHE",           qa: true,  enh: true,  seg: false },
    { name: "F. CLAHE + Segmentation", qa: false, enh: true,  seg: true  },
    { name: "G. Full Pipeline",        qa: true,  enh: true,  seg: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDesignId(filename) {
    // Extracts "design_1784720347616" from "design_1784720347616-913522549819d953.JPG"
    const match = filename.match(/^(design_\d+)/);
    return match ? match[1] : filename;
}

// ─── Main Execution ───────────────────────────────────────────────────────────

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("  Ablation Study: Preprocessing Pipeline");
    console.log("═══════════════════════════════════════════════════");

    if (!fs.existsSync(BENCHMARK_JSON)) {
        console.error(`Benchmark file not found: ${BENCHMARK_JSON}`);
        process.exit(1);
    }

    const dataset = JSON.parse(fs.readFileSync(BENCHMARK_JSON, "utf-8"));
    console.log(`Loaded benchmark dataset: ${dataset.length} queries.\n`);

    // Ensure failures directory exists
    if (!fs.existsSync(FAILURES_DIR)) {
        fs.mkdirSync(FAILURES_DIR, { recursive: true });
    }

    // Initialize backend services
    console.log("Initializing AI services...");
    await embeddingService.initialise();
    await indexService.initialise();
    
    // We must manually load the segmentation model because embeddingService 
    // initialized the pipeline with the .env setting (which might be false).
    const segmentation = require("../../src/services/ai/preprocessing/segmentation");
    await segmentation.initialise();
    
    // Preprocessing is re-initialised per ablation, but we ensure segmentation weights are loaded once
    config.preprocessing.enabled = true;
    config.preprocessing.segmentation.enabled = true;
    await preprocessingPipeline.initialise();
    console.log("Services initialized.\n");

    const resultsSummary = [];

    // ── Run each ablation permutation ─────────────────────────────────────────
    for (const ablation of ABLATIONS) {
        console.log(`\n▶ Running Ablation: ${ablation.name}`);
        
        // Configure pipeline
        config.preprocessing.enabled = (ablation.qa || ablation.enh || ablation.seg);
        config.preprocessing.qualityAssessment.enabled = ablation.qa;
        config.preprocessing.enhancement.enabled       = ablation.enh;
        config.preprocessing.segmentation.enabled      = ablation.seg;

        let correctTop1 = 0;
        let correctTop5 = 0;
        let sumRank = 0;
        let sumLatency = 0;

        for (const item of dataset) {
            const queryPath = path.join(QUERY_DIR, item.query);
            const expectedId = extractDesignId(item.expected);

            if (!fs.existsSync(queryPath)) {
                console.warn(`  [WARN] Query image missing: ${item.query}`);
                continue;
            }

            const imageBuffer = fs.readFileSync(queryPath);
            const t0 = Date.now();
            
            // Search
            const results = await searchService.searchByImage(imageBuffer, { k: 5 });
            const latency = Date.now() - t0;
            sumLatency += latency;

            // Evaluate rank
            let foundRank = -1;
            for (let i = 0; i < results.length; i++) {
                if (results[i].imageId.startsWith(expectedId) || extractDesignId(results[i].originalFilename) === expectedId) {
                    foundRank = i + 1;
                    break;
                }
            }

            if (foundRank === 1) correctTop1++;
            if (foundRank > 0 && foundRank <= 5) correctTop5++;
            sumRank += (foundRank > 0 ? foundRank : 10); // Penalty for missing

            // Generate Failure Report if not Top 1
            if (foundRank !== 1) {
                const reportName = `${ablation.name.replace(/[^a-z0-9]/gi, '_')}_${item.query}.json`;
                const failureReport = {
                    ablation: ablation.name,
                    query: item.query,
                    expected: expectedId,
                    retrievedRank: foundRank,
                    searchLatencyMs: latency,
                    results: results.map(r => ({
                        rank: r.rank || 0,
                        id: r.imageId,
                        similarity: r.similarityScore,
                        filename: r.originalFilename
                    }))
                };
                fs.writeFileSync(path.join(FAILURES_DIR, reportName), JSON.stringify(failureReport, null, 2));
            }
        }

        const count = dataset.length;
        const recall1 = ((correctTop1 / count) * 100).toFixed(1);
        const recall5 = ((correctTop5 / count) * 100).toFixed(1);
        const avgRank = (sumRank / count).toFixed(2);
        const avgLatency = Math.round(sumLatency / count);

        resultsSummary.push({
            name: ablation.name,
            recall1: `${recall1}%`,
            recall5: `${recall5}%`,
            avgRank,
            avgLatency: `${avgLatency}ms`
        });

        console.log(`  Recall@1: ${recall1}% | Recall@5: ${recall5}% | Avg Rank: ${avgRank} | Latency: ${avgLatency}ms`);
    }

    // ── Print Final Summary Table ─────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  Ablation Study Results");
    console.log("═══════════════════════════════════════════════════");
    console.table(resultsSummary);
    console.log(`\nFailure reports written to: ${FAILURES_DIR}`);
    console.log("Review failures to determine root causes (segmentation error, lighting, domain gap).\n");
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
