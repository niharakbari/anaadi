const fs = require("fs/promises");
const path = require("path");

const config = require("../config");

/**
 * Returns absolute path of an uploaded image.
 */
function getImagePath(fileName) {
  return path.join(process.cwd(), config.upload.directory, fileName);
}

/**
 * Returns true if image exists.
 */
async function exists(fileName) {
  try {
    await fs.access(getImagePath(fileName));
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete image from storage.
 */
async function remove(fileName) {
  await fs.unlink(getImagePath(fileName));
}

/**
 * Read image as Buffer.
 */
async function read(fileName) {
  return await fs.readFile(getImagePath(fileName));
}

module.exports = {
  getImagePath,
  exists,
  remove,
  read,
};