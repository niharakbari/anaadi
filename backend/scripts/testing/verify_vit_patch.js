const fs = require("fs");
const path = require("path");

async function main() {
    console.log("==========================================");
    console.log("  REAL ONNX VERIFICATION MODEL AUDIT");
    console.log("==========================================\n");

    const adapterPath = path.resolve(__dirname, "../../ai-models/verification/vit-patch/adapter.js");
    const VitPatchAdapterClass = require(adapterPath);
    const VitPatchAdapter = new VitPatchAdapterClass();
    
    console.log("[1] Initializing VitPatchAdapter...");
    const tStart = Date.now();
    await VitPatchAdapter.initialize();
    console.log(`    Initialized in ${Date.now() - tStart} ms\n`);

    const img1Path = path.resolve(__dirname, "../../uploads/query_uploads/224c75eb-09f2-4a7f-94d9-2452e307e973.jpg");
    const img2Path = path.resolve(__dirname, "../../uploads/query_uploads/3cfbbfb0-740e-45b4-9a9e-fe3bad120986.jpg");
    
    const buf1 = fs.readFileSync(img1Path);
    const buf2 = fs.readFileSync(img2Path);

    console.log("[2] Extracting Features for Image 1...");
    let t0 = Date.now();
    const feat1 = await VitPatchAdapter.extractFeatures(buf1);
    let lat1 = Date.now() - t0;
    console.log(`    Input Buffer: ${buf1.length} bytes`);
    console.log(`    Inference Latency: ${lat1} ms`);
    console.log(`    Output Type: ${feat1.constructor.name}`);
    console.log(`    Output Dimensions: ${feat1.length} floats (${feat1.length * 4} bytes)`);
    console.log(`    Patch Grid: 16x16 (256 patches) | Dim: ${feat1.length / 256}`);
    let sum1 = 0; for(let i=0; i<feat1.length; i++) sum1 += Math.abs(feat1[i]);
    console.log(`    Output Mean Abs Val: ${(sum1/feat1.length).toFixed(4)}\n`);

    console.log("[3] Extracting Features for Image 2...");
    t0 = Date.now();
    const feat2 = await VitPatchAdapter.extractFeatures(buf2);
    let lat2 = Date.now() - t0;
    console.log(`    Inference Latency: ${lat2} ms\n`);

    console.log("[4] Extracting Features for Image 1 (Identical Run)...");
    t0 = Date.now();
    const feat1_copy = await VitPatchAdapter.extractFeatures(buf1);
    let lat3 = Date.now() - t0;
    console.log(`    Inference Latency: ${lat3} ms\n`);

    console.log("[5] Semantic Robustness Math Test...");
    // Let's compute average cosine similarity across all patches between the exact same image
    function averageCosineSim(fA, fB) {
        let sumSim = 0;
        let count = 256;
        let dim = 768;
        for (let p = 0; p < count; p++) {
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < dim; i++) {
                let a = fA[p*dim + i];
                let b = fB[p*dim + i];
                dot += a * b;
                normA += a * a;
                normB += b * b;
            }
            sumSim += dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
        }
        return sumSim / count;
    }

    const simIdentical = averageCosineSim(feat1, feat1_copy);
    const simDifferent = averageCosineSim(feat1, feat2);

    console.log(`    Cosine Similarity (Image 1 vs Image 1): ${simIdentical.toFixed(4)}`);
    console.log(`    Cosine Similarity (Image 1 vs Image 2): ${simDifferent.toFixed(4)}`);
    
    if (simIdentical > 0.99 && simDifferent < 0.99) {
        console.log("\n✅ SUCCESS: The real ONNX model is producing semantically valid spatial features!");
    } else {
        console.log("\n❌ ERROR: Feature outputs are invalid or random.");
    }
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});
