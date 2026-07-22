"use strict";

const sharp = require("sharp");
const AppError = require("../../src/utils/AppError");
const manifest = require("./manifest");

const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD  = [0.229, 0.224, 0.225];

async function preprocess(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new AppError("Invalid imageBuffer: expected a non-empty Buffer.", 400);
  }

  const { inputSize } = manifest.preprocessing;

  const rawPixels = await sharp(imageBuffer)
    .resize(inputSize, inputSize, { fit: "cover", kernel: sharp.kernel.cubic })
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer();

  const pixelsPerChannel = inputSize * inputSize;
  const tensor = new Float32Array(3 * pixelsPerChannel);

  for (let i = 0; i < pixelsPerChannel; i++) {
    for (let c = 0; c < 3; c++) {
      tensor[c * pixelsPerChannel + i] =
        (rawPixels[i * 3 + c] / 255 - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
    }
  }

  return tensor;
}

module.exports = {
  preprocess
};
