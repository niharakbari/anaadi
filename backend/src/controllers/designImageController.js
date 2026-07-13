const imageImportService = require("../services/imageImportService");

async function importImages(req, res, next) {
  try {
    const result = await imageImportService.importImages(req.files);

    return res.status(201).json(result);

  } catch (error) {
    next(error);
  }
}

module.exports = {
  importImages,
};