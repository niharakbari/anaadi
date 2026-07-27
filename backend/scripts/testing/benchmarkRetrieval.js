#!/usr/bin/env node
"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs   = require("fs");
const path = require("path");

const BENCHMARK_JSON = path.join(__dirname, "benchmark.json");
const QUERY_DIR      = path.resolve(__dirname, "../../uploads/query_uploads");
const FAILURES_DIR   = path.resolve(__dirname, "../../debug/failures");
const DEBUG_DIR      = path.resolve(__dirname, "../../debug/verification");

const config             = require("../../src/config/config");
const { searchService, embeddingService, indexService } = require("../../src/services/ai");
const preprocessingPipeline = require("../../src/services/ai/preprocessing");
const db = require("../../src/config/database");

function calcMRR(ranks, total) {
    let sum = 0;
    for (const r of ranks) {
        if (r > 0) sum += 1 / r;
    }
    return total > 0 ? sum / total : 0;
}

async function runAblation(ablation, dataset) {
    // Separate dataset into Category A and Category B
    const catA = dataset.filter(d => d.category === "A");
    const catB = dataset.filter(d => d.category === "B");

    let correctTop1 = 0;
    let correctTop5 = 0;
    let sumLatency  = 0;
    const allRanks  = [];
    const failures  = [];

    console.log(`\n  --- Category A: Strict Quantitative Evaluation (${catA.length} queries) ---`);

    for (const item of catA) {
        const queryPath  = path.join(QUERY_DIR, item.query);
        const expectedFilename = item.storedExpected; // resolved from DB

        if (!fs.existsSync(queryPath)) {
            console.warn(`  [WARN] Query image missing: ${item.query}`);
            allRanks.push(-1);
            continue;
        }

        const imageBuffer = fs.readFileSync(queryPath);
        const t0 = Date.now();

        let results;
        try {
            results = await searchService.searchByImage(imageBuffer, { k: 10 });
        } catch (err) {
            console.error(`  [ERROR] Search failed for ${item.query}: ${err.message}`);
            allRanks.push(-1);
            continue;
        }

        const latency = Date.now() - t0;
        sumLatency += latency;

        let foundRank = -1;
        for (let i = 0; i < results.length; i++) {
            if (results[i].storedFilename === expectedFilename || results[i].originalFilename === item.expected) {
                foundRank = i + 1;
                break;
            }
        }

        allRanks.push(foundRank);
        if (foundRank === 1) correctTop1++;
        if (foundRank > 0 && foundRank <= 5) correctTop5++;

        const status = foundRank === 1 ? "✅" : foundRank > 0 ? `⚠️  @${foundRank}` : "❌";
        console.log(`    ${status}  ${item.query.padEnd(30)} expected: ${item.expected}  got: ${results[0]?.originalFilename ?? "none"}`);

        if (foundRank !== 1) {
            failures.push({
                query: item.query,
                expected: item.expected,
                storedExpected: expectedFilename,
                retrievedRank: foundRank,
                latencyMs: latency,
                top3: results.slice(0, 3).map(r => ({
                    id: r.imageId,
                    storedFilename: r.storedFilename,
                    originalFilename: r.originalFilename,
                    hybridScore: r.hybridScore
                }))
            });
        }
    }

    const count      = catA.length;
    const recall1    = count > 0 ? correctTop1 / count : 0;
    const recall5    = count > 0 ? correctTop5 / count : 0;
    const mrr        = count > 0 ? calcMRR(allRanks, count) : 0;
    const avgRank    = count > 0 ? allRanks.reduce((s, r) => s + (r > 0 ? r : 10), 0) / count : 0;
    const avgLatency = count > 0 ? sumLatency / count : 0;

    // Category B (Qualitative)
    console.log(`\n  --- Category B: Qualitative Evaluation (${catB.length} queries) ---`);
    for (const item of catB) {
        const queryPath  = path.join(QUERY_DIR, item.query);
        const expectedFilename = item.storedExpected;

        if (!fs.existsSync(queryPath)) {
            console.warn(`  [WARN] Query image missing: ${item.query}`);
            continue;
        }

        const imageBuffer = fs.readFileSync(queryPath);
        let results;
        try {
            results = await searchService.searchByImage(imageBuffer, { k: 10 });
        } catch (err) {
            console.error(`  [ERROR] Search failed for ${item.query}: ${err.message}`);
            continue;
        }

        let foundRank = -1;
        let score = null;
        for (let i = 0; i < results.length; i++) {
            if (results[i].storedFilename === expectedFilename || results[i].originalFilename === item.expected) {
                foundRank = i + 1;
                score = results[i].hybridScore ?? results[i].similarityScore;
                break;
            }
        }
        
        console.log(`    Query: ${item.query}`);
        console.log(`    Soft Ground Truth Expected: ${item.expected}`);
        if (foundRank > 0) {
            console.log(`    ✅ Found at Rank ${foundRank} (Score: ${score?.toFixed(4)})`);
        } else {
            console.log(`    ❌ Not found in Top 10`);
        }
        console.log(`    Top 5 Results:`);
        results.slice(0, 5).forEach((r, idx) => {
            const sc = r.hybridScore ?? r.similarityScore;
            console.log(`      ${idx + 1}. ${r.originalFilename} (Score: ${sc?.toFixed(4)})`);
        });
        console.log("");
    }

    // Write failures
    const ablationTag = ablation.name.replace(/[^a-z0-9]/gi, "_");
    for (const f of failures) {
        const fname = `${ablationTag}_${f.query}.json`;
        fs.writeFileSync(path.join(FAILURES_DIR, fname), JSON.stringify(f, null, 2));
    }

    return { recall1, recall5, mrr, avgRank, avgLatency, failures };
}

async function main() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Production Benchmark: Semantic Only vs Verification");
    console.log("═══════════════════════════════════════════════════════════\n");

    if (!fs.existsSync(BENCHMARK_JSON)) {
        console.error(`Benchmark file not found: ${BENCHMARK_JSON}`);
        process.exit(1);
    }

    const dataset = JSON.parse(fs.readFileSync(BENCHMARK_JSON, "utf8"));
    console.log(`Loaded ${dataset.length} queries from benchmark.json\n`);

    let hasMissing = false;
    for (const item of dataset) {
        const queryPath = path.join(QUERY_DIR, item.query);
        if (!fs.existsSync(queryPath)) {
            console.error(`[FATAL] Query image missing on disk: ${item.query}`);
            hasMissing = true;
        }
    }
    if (hasMissing) {
        console.error("\nBenchmark dataset validation failed. Aborting.");
        process.exit(1);
    }

    // Resolve stored filenames from original filenames
    for (const item of dataset) {
        const [rows] = await db.execute("SELECT stored_filename FROM design_images WHERE original_filename = ?", [item.expected]);
        if (rows.length > 0) {
            item.storedExpected = rows[0].stored_filename;
        } else {
            console.warn(`[WARN] Could not resolve expected CAD for ${item.expected} in database.`);
            item.storedExpected = item.expected;
        }
    }

    for (const dir of [FAILURES_DIR, DEBUG_DIR]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize services
    process.stdout.write("Initializing EmbeddingService... ");
    await embeddingService.initialise();
    process.stdout.write("done\n");

    process.stdout.write("Initializing IndexService... ");
    await indexService.initialise();
    process.stdout.write(`done (${indexService.vectorCount} vectors)\n`);

    config.preprocessing.enabled = true;
    config.preprocessing.segmentation.enabled = true;
    process.stdout.write("Initializing PreprocessingPipeline... ");
    await preprocessingPipeline.initialise();
    process.stdout.write("done\n\n");

    const allResults = [];

    // ABLATION 1
    console.log("▶ ABLATION 1: Semantic Only (Verification DISABLED)");
    config.verification.enabled = false;
    const baselineMetrics = await runAblation({ name: "Baseline (Semantic Only)" }, dataset);
    allResults.push({ name: "Semantic Only", ...baselineMetrics });

    // ABLATION 2
    console.log("\n▶ ABLATION 2: Semantic + Dense ViT Verification (ENABLED)");
    config.verification.enabled = true;

    try {
        const verificationService = require("../../src/services/ai/verification/verificationService");
        if (!verificationService._isReady) {
            process.stdout.write("  Initializing VerificationService... ");
            await verificationService.initialise();
            process.stdout.write("done\n");
        }
    } catch (err) {
        console.error(`  [ERROR] VerificationService failed to initialize: ${err.message}`);
        config.verification.enabled = false;
    }

    const verifiedMetrics = await runAblation({ name: "Verified (Dense ViT Patch)" }, dataset);
    allResults.push({ name: "Verified (Dense ViT Patch)", ...verifiedMetrics });

    // Summary
    console.log("\n\n═══════════════════════════════════════════════════════════");
    console.log("  BENCHMARK RESULTS (Category A Only)");
    console.log("═══════════════════════════════════════════════════════════\n");

    const pad = (s, n) => String(s).padEnd(n);
    const rpad = (s, n) => String(s).padStart(n);

    console.log(
        pad("Ablation", 30) +
        rpad("R@1", 8) +
        rpad("R@5", 8) +
        rpad("MRR", 8) +
        rpad("AvgRank", 10) +
        rpad("Latency", 12)
    );
    console.log("─".repeat(76));

    for (const r of allResults) {
        console.log(
            pad(r.name, 30) +
            rpad((r.recall1 * 100).toFixed(1) + "%", 8) +
            rpad((r.recall5 * 100).toFixed(1) + "%", 8) +
            rpad(r.mrr.toFixed(3), 8) +
            rpad(r.avgRank.toFixed(2), 10) +
            rpad(Math.round(r.avgLatency) + "ms", 12)
        );
    }

    console.log("─".repeat(76));

    if (allResults.length === 2) {
        const [base, verified] = allResults;
        const deltaR1   = ((verified.recall1 - base.recall1) * 100).toFixed(1);
        const deltaR5   = ((verified.recall5 - base.recall5) * 100).toFixed(1);
        const deltaMRR  = (verified.mrr - base.mrr).toFixed(3);
        const deltaLat  = Math.round(verified.avgLatency - base.avgLatency);

        console.log(
            pad("Delta (Verified - Baseline)", 30) +
            rpad((deltaR1 > 0 ? "+" : "") + deltaR1 + "%", 8) +
            rpad((deltaR5 > 0 ? "+" : "") + deltaR5 + "%", 8) +
            rpad((deltaMRR > 0 ? "+" : "") + deltaMRR, 8) +
            rpad("", 10) +
            rpad((deltaLat > 0 ? "+" : "") + deltaLat + "ms", 12)
        );
    }
    
    console.log("\nNote: Qualitative evaluation (Category B) results are logged in their respective ablation sections above.");
    console.log(`Failure reports written to: ${FAILURES_DIR}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    process.exit(0);
}

main().catch(err => {
    console.error("\n[FATAL]", err.message);
    console.error(err.stack);
    process.exit(1);
});
