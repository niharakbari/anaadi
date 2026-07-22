const fs = require("fs/promises");
const path = require("path");

const sharp = require("sharp");

const config = require("../config/config");

/**
 *  Returns image width and height using Sharp.

 */

async function getImageDimensions(imagePath) {
  const metadata = await sharp(imagePath).metadata();

  return {
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Returns absolute path of an uploaded image.
 */
function getImagePath(fileName) {
  return path.resolve(__dirname, "..", "..", config.upload.designLibraryDirectory, fileName);
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
  getImageDimensions,
  exists,
  remove,
  read,
};