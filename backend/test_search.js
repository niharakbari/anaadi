"use strict";

const path = require("path");
const fs = require("fs");
const { searchService, embeddingService, indexService } = require("./src/services/ai");

async function main() {
  await embeddingService.initialise();
  await indexService.initialise();

  const queryImage = process.argv[2] || "../REF (extract.me)/Media (1).jpeg";
  const imageBuffer = fs.readFileSync(path.resolve(__dirname, queryImage));
  
  console.log(`Running search for ${queryImage}...`);
  const results = await searchService.searchByImage(imageBuffer, { k: 5 });

  console.log("\n--- Top 5 Merged Search Results ---");
  results.forEach((r, i) => {
    console.log(`Rank ${i + 1}`);
    console.log(`Design: ${r.imageId}`);
    console.log(`Similarity: ${r.similarityScore}`);
    console.log(`Filename: ${r.originalFilename}\n`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
