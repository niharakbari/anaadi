const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const imageImportService = require("./src/services/imageImportService");

// Dummy files to import
const testFiles = [];
for (let i = 0; i < 20; i++) {
  // We need actual images or we can just mock the files
  // Let's see if there is a sample image we can copy
}
console.log("Benchmark script created");
