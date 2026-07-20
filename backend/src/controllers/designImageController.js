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
  const db = require("../config/database");
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Database Deletions in Dependency Order
    // search_history_results depends on search_history and design_images
    const [delResults] = await connection.query("DELETE FROM search_history_results");
    
    // saved_searches, saved_designs, flagged_designs depend on design_images and search_history
    const [delSavedSearches] = await connection.query("DELETE FROM saved_searches");
    const [delSavedDesigns] = await connection.query("DELETE FROM saved_designs");
    const [delFlagged] = await connection.query("DELETE FROM flagged_designs");

    // search_history depends on query images but is referenced by others
    const [delHistory] = await connection.query("DELETE FROM search_history");

    // design_images is the base table
    const [delImages] = await connection.query("DELETE FROM design_images");

    await connection.commit();

    // 2. Clear physical image files
    const deleteFilesInDir = async (dirPath) => {
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file !== ".gitkeep") {
            await fs.unlink(path.join(dirPath, file)).catch(() => {});
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
           logger.warn(`Could not clear directory ${dirPath}: ${err.message}`);
        }
      }
    };

    await deleteFilesInDir(path.resolve(process.cwd(), "uploads", "design_library"));
    await deleteFilesInDir(path.resolve(process.cwd(), "uploads", "query_uploads"));

    // 3. Clear AI vector index
    let indexVectorsRemoved = delImages.affectedRows;
    try {
      if (typeof searchService.clearAll === 'function') {
        await searchService.clearAll();
      }
    } catch (err) {
      logger.warn(`Could not clear HNSW index during bulk delete: ${err.message}`);
    }

    return res.json({
      success: true,
      deletedImages: delImages.affectedRows,
      deletedSearchHistory: delHistory.affectedRows,
      deletedSavedDesigns: delSavedSearches.affectedRows + delSavedDesigns.affectedRows,
      indexVectorsRemoved: indexVectorsRemoved
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  importImages,
  getAllImages,
  deleteImage,
  deleteAllImages,
};