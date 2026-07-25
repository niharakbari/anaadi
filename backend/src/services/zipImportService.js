const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const unzipper = require('unzipper');

const importJobService = require('./importJobService');
const imageImportService = require('./imageImportService');
const config = require('../config/config');
const logger = require('../utils/logger');

async function importZip(zipFile, jobId) {
  const uploadDir = path.dirname(zipFile.path); // usually 'uploads' or 'uploads/query_uploads'
  const tempDir = path.join(uploadDir, `temp_extraction_${jobId}`);
  
  importJobService.updateJobProgress(jobId, { status: 'running' });

  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    // Extract ZIP
    logger.info(`[ZipImportService] Extracting ZIP ${zipFile.originalname} to ${tempDir}`);
    await new Promise((resolve, reject) => {
      fsSync.createReadStream(zipFile.path)
        .pipe(unzipper.Extract({ path: tempDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    logger.info(`[ZipImportService] Scanning extracted directory...`);
    const supportedFiles = [];
    
    async function scanDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // ignore __MACOSX and hidden dirs
          if (entry.name !== '__MACOSX' && !entry.name.startsWith('.')) {
             await scanDir(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && !entry.name.startsWith('.')) {
            const uniqueFilename = `design_${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
            supportedFiles.push({
              sourcePath: fullPath,
              originalname: entry.name,
              filename: uniqueFilename,
              mimetype: ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'image/webp'
            });
          }
        }
      }
    }
    
    await scanDir(tempDir);
    
    const totalFiles = supportedFiles.length;
    importJobService.updateJobProgress(jobId, { totalFiles });

    logger.info(`[ZipImportService] Found ${totalFiles} supported images in ZIP.`);

    // Process files sequentially to bound memory usage
    for (const fileInfo of supportedFiles) {
      importJobService.updateJobProgress(jobId, { currentFilename: fileInfo.originalname });

      // Move file to design library directory
      const targetPath = path.join(config.upload.designLibraryDirectory, fileInfo.filename);
      try {
        await fs.rename(fileInfo.sourcePath, targetPath);
      } catch (err) {
        // Fallback to copy/unlink if rename fails across partitions
        await fs.copyFile(fileInfo.sourcePath, targetPath);
        await fs.unlink(fileInfo.sourcePath);
      }

      // Get file size
      const stats = await fs.stat(targetPath);

      // Create multer-like file object
      const fileObj = {
        path: targetPath,
        originalname: fileInfo.originalname,
        filename: fileInfo.filename,
        mimetype: fileInfo.mimetype,
        size: stats.size
      };

      // Call processSingleImage
      const result = await imageImportService.processSingleImage(fileObj);

      if (result.success) {
        importJobService.updateJobProgress(jobId, { 
          incProcessedFiles: 1, 
          incSuccessfulImports: 1 
        });
      } else {
        importJobService.updateJobProgress(jobId, { 
          incProcessedFiles: 1, 
          incFailedImports: 1,
          addFailure: { filename: result.originalFilename, reason: result.reason }
        });
      }
    }

  } catch (error) {
    logger.error(`[ZipImportService FAILURE] Failed processing ZIP ${zipFile.originalname}: ${error.message}`);
    importJobService.updateJobProgress(jobId, { 
      status: 'failed',
      error: error.message
    });
  } finally {
    // Cleanup temporary extraction folder and original ZIP file
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.unlink(zipFile.path);
    } catch (cleanupErr) {
      logger.warn(`[ZipImportService] Cleanup failed: ${cleanupErr.message}`);
    }
  }
}

module.exports = {
  importZip
};
