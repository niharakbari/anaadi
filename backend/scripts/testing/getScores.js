require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const { searchService, embeddingService, indexService } = require("../../src/services/ai");
const preprocessingPipeline = require("../../src/services/ai/preprocessing");

async function main() {
    await embeddingService.initialise();
    await indexService.initialise();
    await preprocessingPipeline.initialise();
    
    const queryPath = path.resolve(__dirname, "../../uploads/query_uploads/q3_query.jpeg");
    const imageBuffer = fs.readFileSync(queryPath);
    
    const results = await searchService.searchByImage(imageBuffer, { k: 3 });
    console.log("Top 3 Semantic Only:");
    for (const r of results) {
        console.log(r);
    }
    process.exit(0);
}
main();
