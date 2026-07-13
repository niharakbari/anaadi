const db = require("../config/database");

const designImageModel = require("../models/designImageModel");
const imageMetadataService = require("./imageMetadataService");
const fileStorageService = require("./fileStorageService");

const  AppError  = require("../utils/AppError");

async function importImages(files) {
  if (!files || files.length === 0) {
    throw new AppError("No images uploaded.", 400);
  }

  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const importedFiles = [];

    for (const file of files) {
      const imageData = await imageMetadataService.buildImageMetadata(file);

      const imageId = await designImageModel.create(imageData, connection);

      importedFiles.push({
        id: imageId,
        filename: file.filename,
      });
    }

    await connection.commit();

    return {
      success: true,
      totalImported: importedFiles.length,
      images: importedFiles,
    };
  } catch (error) {
  await connection.rollback();

  for (const file of files) {
    try {
      await fileStorageService.remove(file.filename);
    } catch (_) {
      // Ignore cleanup errors
    }
  }

  throw error;
} finally {
  connection.release();
}
}

module.exports = {
  importImages,
};