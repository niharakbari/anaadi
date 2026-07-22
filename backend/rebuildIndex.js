"use strict";

require("dotenv").config();
const embeddingService = require("./src/services/ai/embeddingService");
const indexService = require("./src/services/ai/indexService");

async function run() {
  try {
    await embeddingService.initialise();
    await indexService.initialise();
    console.log("Starting rebuild...");
    const stats = await indexService.rebuild();
    console.log("Rebuild completed successfully!", stats);
    process.exit(0);
  } catch (err) {
    console.error("Rebuild failed:", err);
    process.exit(1);
  }
}

run();
