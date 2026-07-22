const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const unzipper = require("unzipper");
const pLimitReq = require("p-limit");
const pLimit = pLimitReq.default || pLimitReq;
const os = require("os");
const { pipeline } = require("stream/promises");

const designImageModel = require("../models/designImageModel");
const imageMetadataService = require("./imageMetadataService");
const fileStorageService = require("./fileStorageService");
const { searchService } = require("./ai");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const config = require("../config/config");

const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"];

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".bmp") return "image/bmp";
  if (ext === ".tif" || ext === ".tiff") return "image/tiff";
  return "application/octet-stream";
}

async function importImages(reqFiles, onProgress, abortSignal = null) {
  if (!Array.isArray(reqFiles) || reqFiles.length === 0) {
    throw new AppError("No files uploaded.", 400);
  }

  const state = {
    phase: 'initializing',
    discovered: 0,
    imported: 0,
    skipped: 0,
    unsupported: 0,
    failed: 0,
    duplicates: 0,
    startTime: Date.now()
  };

  const importedFiles = [];
  const failedImports = [];
  
  let lastProgressTime = 0;
  const reportProgress = (force = false) => {
    if (onProgress) {
      const now = Date.now();
      if (force || now - lastProgressTime > 200) {
        lastProgressTime = now;
        const elapsedTime = ((now - state.startTime) / 1000).toFixed(1) + 's';
        setImmediate(() => onProgress({ ...state, elapsedTime }));
      }
    }
  };

  const numCores = os.cpus().length || 4;
  const importLimit = pLimit(Math.max(2, numCores));
  const activeTasks = [];

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

  // Helper to import a physical file on disk
  const processFile = async (fileObj) => {
    if (abortSignal?.aborted) return;
    reportProgress();
    
    let imageId = null;
    try {
      if (fileObj.size > MAX_IMAGE_SIZE) {
        throw new Error(`Image exceeds 10MB limit.`);
      }

      logger.info(`[ImportPipeline] Processing ${fileObj.originalname}...`);
      const imageBuffer = await fsPromises.readFile(fileObj.path);

      const imageData = await imageMetadataService.buildImageMetadata(fileObj);
      imageId = await designImageModel.create(imageData);
      await searchService.registerImage(String(imageId), imageBuffer);

      importedFiles.push({
        id: imageId,
        filename: fileObj.filename,
        originalFilename: fileObj.originalname,
      });
      state.imported++;
    } catch (error) {
      logger.error(`[ImportPipeline] Failed for ${fileObj.originalname}: ${error.message}`);
      if (imageId !== null) {
        try { await designImageModel.remove(imageId); } catch (_) {}
        try { await searchService.removeImage(String(imageId)); } catch (_) {}
      }
      try { await fileStorageService.remove(fileObj.filename); } catch (_) {}
      
      // Basic duplicate detection based on error messages (if unique constraint fails)
      if (error.message.toLowerCase().includes('duplicate') || error.code === 'ER_DUP_ENTRY') {
        state.duplicates++;
      } else {
        state.failed++;
        failedImports.push({
          filename: fileObj.filename,
          originalFilename: fileObj.originalname,
          reason: error.message || "Failed to import image.",
        });
      }
    } finally {
      reportProgress();
    }
  };

  try {
    for (const file of reqFiles) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isZip = file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed" || file.mimetype === "application/x-zip" || ext === ".zip";
      
      if (isZip) {
        logger.info(`[ImportPipeline] Phase 1: Scanning ZIP Central Directory: ${file.originalname}`);
        state.phase = 'scanning';
        reportProgress(true);

        const directory = await unzipper.Open.file(file.path);
        
        // Filter out system files and unsupported extensions early
        const validEntries = directory.files.filter(entry => {
          if (entry.type !== 'File') return false;
          
          const basename = path.basename(entry.path);
          if (basename.startsWith('.') || basename === 'Thumbs.db') {
            state.skipped++;
            return false;
          }

          const entryExt = path.extname(basename).toLowerCase();
          if (!ALLOWED_EXTS.includes(entryExt)) {
            state.unsupported++;
            return false;
          }
          return true;
        });

        // The final fixed denominator!
        state.discovered += validEntries.length;
        state.phase = 'importing';
        reportProgress(true);

        logger.info(`[ImportPipeline] Phase 2: Targeted Extraction of ${validEntries.length} images`);
        for (const entry of validEntries) {
          if (abortSignal?.aborted) break;

          const basename = path.basename(entry.path);
          const entryExt = path.extname(basename).toLowerCase();
          
          // Stream valid image directly to disk
          const uniqueName = "design_" + Date.now() + "-" + crypto.randomBytes(8).toString("hex") + entryExt;
          const targetPath = path.join(config.upload.designLibraryDirectory, uniqueName);
          
          const writeStream = fs.createWriteStream(targetPath);
          await pipeline(entry.stream(), writeStream);
          
          const fileObj = {
            originalname: basename,
            filename: uniqueName,
            path: targetPath,
            mimetype: getMimeType(basename),
            size: entry.uncompressedSize
          };
          
          const task = importLimit(() => processFile(fileObj));
          activeTasks.push(task);
          
          // Backpressure: Prevent extracting to disk faster than we can index
          while (importLimit.pendingCount > 10) {
            await new Promise(r => setTimeout(r, 50));
          }
        }
        
        // Clean up the uploaded zip file immediately after targeted extraction
        try { await fsPromises.unlink(file.path); } catch (_) {}
      } else {
        // Direct file upload
        state.phase = 'importing';
        state.discovered++;
        reportProgress();
        const task = importLimit(() => processFile(file));
        activeTasks.push(task);
      }
    }
    
    // Wait for all queued imports to complete
    await Promise.all(activeTasks);
    
  } catch (err) {
    logger.error(`[ImportPipeline] Fatal Error: ${err.message}`);
    throw new AppError("Import pipeline failed. Some files may have been processed.", 500);
  }

  // Final progress update
  reportProgress(true);

  return {
    success: failedImports.length === 0,
    totalDiscovered: state.discovered,
    successfullyImported: state.imported,
    skippedFiles: state.skipped,
    unsupportedFiles: state.unsupported,
    duplicateFiles: state.duplicates,
    failedImports: state.failed,
    failureReasons: failedImports,
    elapsedTime: ((Date.now() - state.startTime) / 1000).toFixed(1) + 's'
  };
}

module.exports = {
  importImages,
};
