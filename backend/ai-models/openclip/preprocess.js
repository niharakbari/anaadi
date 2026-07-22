"use strict";

const sharp = require("sharp");
const AppError = require("../../src/utils/AppError");
const manifest = require("./manifest");

const IMAGENET_MEAN = [0.48145466, 0.4578275, 0.40821073];
const IMAGENET_STD  = [0.26862954, 0.26130258, 0.27577711];

async function preprocess(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new AppError("Invalid imageBuffer: expected a non-empty Buffer.", 400);
  }

  const { inputSize } = manifest.preprocessing;

  const rawPixels = await sharp(imageBuffer)
    .resize(inputSize, inputSize, { fit: "cover" })
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
