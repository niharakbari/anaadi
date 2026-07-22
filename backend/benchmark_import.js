const fs = require("fs").promises;
const path = require("path");
const { performance } = require("perf_hooks");
const imageImportService = require("./src/services/imageImportService");

async function runBenchmark() {
  console.log("Starting benchmark...");
  // 1. Create a dummy zip or find one
  // Or just mock a reqFiles array with a few images
  const libraryPath = path.join(__dirname, "uploads", "design_library");
  
  try {
    const files = await fs.readdir(libraryPath);
    const images = files.filter(f => f.endsWith(".jpg") || f.endsWith(".png")).slice(0, 10);
    
    if (images.length === 0) {
      console.log("No images found in design_library to benchmark.");
      return;
    }

    const reqFiles = images.map(img => ({
      originalname: img,
      filename: img,
      path: path.join(libraryPath, img),
      mimetype: "image/jpeg",
      size: 1024
    }));

    console.log(`Benchmarking with ${reqFiles.length} images...`);
    
    const start = performance.now();
    let lastProgress = start;
    
    await imageImportService.importImages(reqFiles, (progress) => {
      const now = performance.now();
      console.log(`Progress: ${progress.processedCount}/${progress.totalFiles} (+${(now - lastProgress).toFixed(2)}ms)`);
      lastProgress = now;
    });
    
    const end = performance.now();
    console.log(`Total Time: ${((end - start) / 1000).toFixed(2)}s`);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

// We need to connect to DB and AI first!
const mysql = require("./src/config/database");
mysql.getConnection().then(connection => {
  connection.release();
  runBenchmark();
}).catch(console.error);

