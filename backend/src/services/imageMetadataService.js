const fileStorageService = require("./fileStorageService");

async function buildImageMetadata(file) {
  const dimensions = await fileStorageService.getImageDimensions(file.path);

  return {
    original_filename: file.originalname,
    stored_filename: file.filename,
    file_path: file.path,
    file_size: file.size,
    mime_type: file.mimetype,
    image_width: dimensions.width,
    image_height: dimensions.height,
  };
}

module.exports = {
  buildImageMetadata,
};