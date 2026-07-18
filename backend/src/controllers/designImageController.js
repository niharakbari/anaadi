const path = require("path");
const fs = require("fs").promises;
const imageImportService = require("../services/imageImportService");
const designImageModel = require("../models/designImageModel");
const searchService = require("../services/ai/searchService");
const logger = require("../utils/logger");

async function importImages(req, res, next) {
  try {
    const result = await imageImportService.importImages(req.files);
    const statusCode = result.failedImports > 0 ? 207 : 201;

    return res.status(statusCode).json(result);

  } catch (error) {
    next(error);
  }
}

async function getAllImages(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const search = req.query.search || "";

    const paginatedResult = await designImageModel.findAllPaginated({ page, limit, search });

    const formattedData = paginatedResult.rows.map((img) => ({
      id: img.id,
      filename: img.original_filename,
      storedFilename: img.stored_filename,
      thumbnail: `/uploads/design_library/${img.stored_filename}`,
      uploadDate: img.uploaded_at,
      status: "indexed",
      fileSize: img.file_size,
      dimensions: `${img.image_width}x${img.image_height}`,
    }));

    return res.json({
      success: true,
      pagination: {
        currentPage: paginatedResult.currentPage,
        totalPages: paginatedResult.totalPages,
        totalItems: paginatedResult.totalItems,
        limit: paginatedResult.limit,
      },
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteImage(req, res, next) {
  try {
    const { id } = req.params;
    const image = await designImageModel.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: "Design reference image not found." });
    }

    // 1. Remove embedding vector from HNSW index FIRST
    try {
      await searchService.removeImage(String(id));
    } catch (err) {
      logger.warn(`Could not remove vector for imageId=${id} from HNSW index: ${err.message}`);
    }

    // 2. Delete row from MySQL database
    await designImageModel.remove(id);

    // 3. Delete physical file from storage
    if (image.stored_filename) {
      const fullPath = path.resolve(process.cwd(), "uploads", "design_library", image.stored_filename);
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        logger.warn(`Could not delete physical image file at ${fullPath}: ${err.message}`);
      }
    }

    return res.json({ success: true, message: "Design reference deleted successfully.", id });
  } catch (error) {
    next(error);
  }
}

async function deleteAllImages(req, res, next) {
  try {
    const db = require("../config/database");
    const allImages = await designImageModel.findAll();

    // 1. Reset HNSW index completely
    try {
      await searchService.clearAll();
    } catch (err) {
      logger.warn(`Could not clear HNSW index during bulk delete: ${err.message}`);
    }

    // 2. Truncate MySQL design_images table
    await db.query("TRUNCATE TABLE design_images");

    // 3. Clear all physical image files in uploads/design_library
    const libraryDir = path.resolve(process.cwd(), "uploads", "design_library");
    try {
      const files = await fs.readdir(libraryDir);
      for (const file of files) {
        if (file !== ".gitkeep") {
          await fs.unlink(path.join(libraryDir, file)).catch(() => {});
        }
      }
    } catch (err) {
      logger.warn(`Could not clear physical directory during bulk delete: ${err.message}`);
    }

    return res.json({
      success: true,
      message: `Successfully deleted all ${allImages.length} design references and reset vector index.`,
      deletedCount: allImages.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  importImages,
  getAllImages,
  deleteImage,
  deleteAllImages,
};