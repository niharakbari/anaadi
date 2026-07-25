const fs = require("fs/promises");

const designImageModel = require("../models/designImageModel");
const imageMetadataService = require("./imageMetadataService");
const fileStorageService = require("./fileStorageService");
const { searchService } = require("./ai");
const importJobService = require("./importJobService");

const  AppError  = require("../utils/AppError");

const logger = require("../utils/logger");

/**
 * Process a single image file.
 * Used by both imageImportService and zipImportService.
 */
async function processSingleImage(file) {
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

    return {
      success: true,
      id: imageId,
      filename: file.filename,
      originalFilename: file.originalname,
    };
  } catch (error) {
    logger.error(`[ImportPipeline FAILURE] Import failed for file ${file.originalname} (${file.filename}): ${error.stack || error.message}`);
    if (imageId !== null) {
      try { await designImageModel.remove(imageId); } catch (_) {}
      try { await searchService.removeImage(String(imageId)); } catch (_) {}
    }
    try { await fileStorageService.remove(file.filename); } catch (_) {}

    return {
      success: false,
      filename: file.filename,
      originalFilename: file.originalname,
      reason: error.message || "Failed to import image.",
    };
  }
}

async function importImages(files, jobId = null) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new AppError("No images uploaded.", 400);
  }

  const importedFiles = [];
  const failedImports = [];

  if (jobId) {
    importJobService.updateJobProgress(jobId, { status: 'running' });
  }

  for (const file of files) {
    if (jobId) {
      importJobService.updateJobProgress(jobId, { currentFilename: file.originalname });
    }

    const result = await processSingleImage(file);

    if (result.success) {
      importedFiles.push(result);
      if (jobId) {
        importJobService.updateJobProgress(jobId, { 
          incProcessedFiles: 1, 
          incSuccessfulImports: 1 
        });
      }
    } else {
      failedImports.push(result);
      if (jobId) {
        importJobService.updateJobProgress(jobId, { 
          incProcessedFiles: 1, 
          incFailedImports: 1,
          addFailure: { filename: result.originalFilename, reason: result.reason }
        });
      }
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
  processSingleImage
};