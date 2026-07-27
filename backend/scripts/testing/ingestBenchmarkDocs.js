require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const path = require("path");
const fs = require("fs");
const { processSingleImage } = require("../../src/services/imageImportService");
const { embeddingService, indexService } = require("../../src/services/ai");
const preprocessingPipeline = require("../../src/services/ai/preprocessing");
const verificationService = require("../../src/services/ai/verification/verificationService");

async function ingest() {
  await embeddingService.initialise();
  await preprocessingPipeline.initialise();
  await indexService.initialise();
  await verificationService.initialise();

  const files = [
    { originalname: "q3_expected.jpeg", filename: "q3_expected.jpeg" },
    { originalname: "q4_expected.JPG", filename: "q4_expected.JPG" }
  ];

  for (const f of files) {
    const fPath = path.resolve(__dirname, "../../uploads/design_library", f.filename);
    const fileObj = {
      path: fPath,
      originalname: f.originalname,
      filename: f.filename,
      mimetype: f.filename.endsWith(".png") ? "image/png" : "image/jpeg",
      size: fs.statSync(fPath).size
    };
    console.log("Ingesting", fileObj.originalname);
    const result = await processSingleImage(fileObj);
    console.log("Result:", result);
  }
  process.exit(0);
}
ingest();
