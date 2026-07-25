const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, 'PROJECT_CONTEXT.md');
const destPath = path.resolve(__dirname, 'PROJECT_CONTEXT_25JULY.md');

// Copy PROJECT_CONTEXT.md to PROJECT_CONTEXT_25JULY.md if it doesn't exist
if (!fs.existsSync(destPath)) {
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
    } else {
        fs.writeFileSync(destPath, '');
    }
}

const appendText = `
---

# 16. Benchmark Progress (25 July 2026)

This section must document everything discovered after the first benchmark.

==================================================
1. Benchmark Identifier Bug (FIXED)
==================================================

The benchmark originally compared:

Database Primary Key (imageId)

against

Canonical Design Identifier embedded inside storedFilename.

Example:

Database ID:
947

Stored Filename:
design_1784956197652-5506130dcac828f3.JPG

Benchmark Expected:
1784956197652

The benchmark incorrectly reported Recall@1 = 0%.

The benchmark was corrected to compare the canonical design identifier extracted from storedFilename.

Engineering lesson: Ensure benchmark parsing matches the exact fields exported by the search pipeline. Comparing timestamps parsed via regex against database primary keys silently invalidates benchmark evaluations.

==================================================
2. Current Benchmark Results
==================================================

Semantic Only

Recall@1: 60%

Recall@5: 60%

MRR: 0.600

Average Rank: 4.60

Average Latency: ~9072 ms

Verified (Dense ViT Patch)

Recall@1: 20%

Recall@5: 40%

MRR: 0.269

Average Rank: 6.60

Average Latency: ~12974 ms

Document that verification currently DEGRADES retrieval performance.

==================================================
3. What Works Correctly
==================================================

SigLIP model loads correctly.
ONNX Runtime loads correctly.
Independent HNSW index loads correctly.
350 vectors loaded successfully.
Adaptive preprocessing executes correctly.
Dealer preprocessing only runs on search queries.
CAD indexing correctly skips preprocessing.
Benchmark identifier comparison is now correct.
Semantic retrieval successfully returns correct matches for several benchmark queries.

==================================================
4. Current Critical Problems
==================================================

Problem A

Dense ViT verification lowers Recall instead of improving it.

Expected:
Semantic candidates should be refined.

Actual:
Correct Rank-1 results are pushed down to Rank-5 or Rank-7.

Problem B

One benchmark query consistently returns:

Retrieved 100 vectors
Merged into 0
Returned Top 0

This is considered a critical bug.
The merge pipeline or candidate filtering must be audited.

Problem C

Verification latency increases total search time by approximately 3.9 seconds.
This exceeds the intended verification budget.

==================================================
5. Current Hypotheses
==================================================

Possible causes include:

- Incorrect feature serialization
- Patch ordering mismatch
- Feature extraction mismatch between query and indexed features
- Hybrid scoring weights unsuitable
- Verification scoring normalization bug
- Candidate merge logic bug
- FeatureManager returning incorrect features
- Spatial verification implementation error

These are hypotheses, not confirmed causes.

==================================================
6. Current Project Status
==================================================

Semantic retrieval:
Production quality.

Verification infrastructure:
Complete.

Verification AI:
Implemented but currently produces worse retrieval accuracy.

Benchmark infrastructure:
Working correctly.

Overall project:
NOT production ready until verification improves or is disabled.

==================================================
7. Next Engineering Tasks
==================================================

Highest priority:

- Investigate why Dense ViT Patch verification hurts Recall.
- Audit feature generation.
- Audit feature loading.
- Audit hybrid scoring.
- Audit verification ranking.
- Investigate "Merged into 0".
- Re-run benchmark after each fix.

Only enable verification once it demonstrates statistically significant improvement over the semantic baseline.
`;

fs.appendFileSync(destPath, appendText);
// Also append to the main PROJECT_CONTEXT.md
if (fs.existsSync(srcPath)) {
    fs.appendFileSync(srcPath, appendText);
}
