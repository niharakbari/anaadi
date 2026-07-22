"use strict";

const { embeddingService, indexService } = require("./src/services/ai");

async function main() {
  console.log("Initializing EmbeddingService...");
  await embeddingService.initialise();
  
  console.log("Initializing IndexService...");
  await indexService.initialise();
  
  console.log("Starting full rebuild...");
  const stats = await indexService.rebuild(100000);
  console.log("Rebuild stats:", stats);
  console.log("New Vector Count:", indexService.vectorCount);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
