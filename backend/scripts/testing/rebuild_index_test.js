"use strict";

/**
 * rebuild_index_test.js
 *
 * Performs a full catalogue rebuild:
 *   1. Initializes EmbeddingService (loads ONNX model)
 *   2. Initializes VerificationService (loads ViT patch ONNX session)
 *   3. Initializes IndexService (creates fresh HNSW graph)
 *   4. Calls indexService.rebuild() which:
 *      a. Reads all designs from DB
 *      b. Extracts multi-view crops
 *      c. Generates embeddings (skipPreprocessing=true — no dealer pipeline)
 *      d. Inserts into HNSW
 *      e. Saves ViT patch features to disk via VerificationService.indexFeatures()
 *   5. Reports stats and validates integrity.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const config             = require("../../src/config/config");
const { embeddingService, indexService } = require("../../src/services/ai");

async function main() {
  const startTime = Date.now();
  
  console.log("════════════════════════════════════════════════");
  console.log("  Catalogue Index Rebuild");
  console.log("════════════════════════════════════════════════\n");

  // ── 1. Embedding Service ─────────────────────────────────────────────────
  process.stdout.write("Initializing EmbeddingService... ");
  await embeddingService.initialise();
  process.stdout.write("done\n");

  // ── 2. Verification Service ──────────────────────────────────────────────
  // Must be initialized BEFORE rebuild() so indexFeatures() can write .bin files.
  if (config.verification.enabled) {
    const verificationService = require("../../src/services/ai/verification/verificationService");
    process.stdout.write("Initializing VerificationService... ");
    await verificationService.initialise();
    process.stdout.write(`done (model: ${config.verification.model})\n`);
  } else {
    console.log("VerificationService: DISABLED (VERIFICATION_ENABLED != true). Skipping feature generation.");
  }

  // ── 3. Index Service ─────────────────────────────────────────────────────
  process.stdout.write("Initializing IndexService... ");
  await indexService.initialise();
  process.stdout.write(`done\n`);

  // ── 4. Rebuild ───────────────────────────────────────────────────────────
  console.log("\nStarting full rebuild...");
  const rebuildStart = Date.now();
  const stats = await indexService.rebuild(100_000);
  const rebuildMs = Date.now() - rebuildStart;

  // ── 5. Report ────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════");
  console.log("  Rebuild Complete");
  console.log("════════════════════════════════════════════════");
  console.log(`  Designs processed : ${stats.processed}`);
  console.log(`  Designs failed    : ${stats.failed}`);
  console.log(`  HNSW vectors      : ${indexService.vectorCount}`);
  console.log(`  Rebuild time      : ${rebuildMs}ms (${(rebuildMs / 1000).toFixed(1)}s)`);
  console.log(`  Total time        : ${Date.now() - startTime}ms\n`);

  // ── 6. Integrity Check ───────────────────────────────────────────────────
  if (config.verification.enabled) {
    const fs     = require("fs");
    const path   = require("path");
    const featDir = config.verification.featuresDir;
    const binFiles = fs.existsSync(featDir)
      ? fs.readdirSync(featDir).filter(f => f.endsWith(".bin"))
      : [];

    // Extract unique design IDs from HNSW metadata
    const metaPath  = path.resolve(__dirname, "../../indexes", config.ai.model, "metadata.json");
    const hnswMeta  = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const uniqueIds = [...new Set(
      Object.values(hnswMeta.labelToImageId).map(v => typeof v === "string" ? v : v.imageId)
    )];

    const featIds       = binFiles.map(f => f.replace(".bin", ""));
    const missingFeats  = uniqueIds.filter(id => !featIds.includes(id));
    const orphanFeats   = featIds.filter(id => !uniqueIds.includes(id));

    console.log("════════════════════════════════════════════════");
    console.log("  Integrity Check");
    console.log("════════════════════════════════════════════════");
    console.log(`  Unique design IDs (HNSW) : ${uniqueIds.length}`);
    console.log(`  Verification .bin files  : ${binFiles.length}`);
    console.log(`  Missing features         : ${missingFeats.length}`);
    console.log(`  Orphan features          : ${orphanFeats.length}`);

    if (missingFeats.length > 0) {
      console.error("\n❌ MISSING FEATURES:", missingFeats);
      process.exit(1);
    }
    if (orphanFeats.length > 0) {
      console.warn("\n⚠️  ORPHAN FEATURES:", orphanFeats);
    }
    if (stats.failed > 0) {
      console.error(`\n❌ ${stats.failed} designs failed to index.`);
      process.exit(1);
    }

    console.log("\n✅ All integrity checks passed.");
    console.log("✅ System is benchmark-ready.\n");
  }
}

main().catch(err => {
  console.error("\n[FATAL]", err.message);
  console.error(err.stack);
  process.exit(1);
});
