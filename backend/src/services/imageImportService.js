const fs = require("fs/promises");

const designImageModel = require("../models/designImageModel");
const imageMetadataService = require("./imageMetadataService");
const fileStorageService = require("./fileStorageService");
const { searchService } = require("./ai");

const  AppError  = require("../utils/AppError");

const logger = require("../utils/logger");

async function importImages(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError("No images uploaded.", 400);
  }

  const importedFiles = [];
  const failedImports = [];

  for (const file of files) {
    let imageId = null;

    try {
      logger.info(`[ImportPipeline Step 1] Reading file buffer for ${file.originalname}...`);
      const imageBuffer = await fs.readFile(file.path);

      logger.info(`[ImportPipeline Step 2] Building image metadata for ${file.originalname}...`);
      const imageData = await imageMetadataService.buildImageMetadata(file);

      logger.info(`[ImportPipeline Step 3] Inserting row into MySQL database...`);
      imageId = await designImageModel.create(imageData);
      logger.info(`[ImportPipeline Step 3 Success] MySQL row inserted with imageId=${imageId}`);

      logger.info(`[ImportPipeline Step 4] Registering image vector in HNSW index for imageId=${imageId}...`);
      await searchService.registerImage(String(imageId), imageBuffer);
      logger.info(`[ImportPipeline Step 4 Success] Vector registered in HNSW for imageId=${imageId}`);

      importedFiles.push({
        id: imageId,
        filename: file.filename,
        originalFilename: file.originalname,
      });
    } catch (error) {
      logger.error(`[ImportPipeline FAILURE] Import failed for file ${file.originalname} (${file.filename}): ${error.stack || error.message}`);
      if (imageId !== null) {
        try {
          await designImageModel.remove(imageId);
        } catch (_) {
          // Ignore cleanup errors.
        }

        try {
          await searchService.removeImage(String(imageId));
        } catch (_) {
          // Ignore cleanup errors.
        }
      }

      try {
        await fileStorageService.remove(file.filename);
      } catch (_) {
        // Ignore cleanup errors.
      }

      failedImports.push({
        filename: file.filename,
        originalFilename: file.originalname,
        reason: error.message || "Failed to import image.",
      });
    }
  }

  return {
    success: failedImports.length === 0,
    totalUploaded: files.length,
    successfullyImported: importedFiles.length,
    failedImports: failedImports.length,
    failureReasons: failedImports,
    images: importedFiles,
  };
}

module.exports = {
  importImages,
};