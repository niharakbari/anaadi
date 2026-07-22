"use strict";

const path = require("path");

module.exports = {
  id: "dinov2",
  name: "DINOv2",
  variant: "ViT-B-14",
  version: "1.0.0",
  dimension: 768,
  
  search: {
    threshold: 0.3,
    metric: "cosine"
  },
  
  preprocessing: {
    inputSize: 224,
    normalization: "imagenet",
    interpolation: "bicubic",
    version: "1.0.0"
  },
  
  paths: {
    model: path.resolve(__dirname, "visual.onnx"),
    index: path.resolve(__dirname, "..", "..", "indexes", "dinov2", "jewellery.hnsw"),
    metadata: path.resolve(__dirname, "..", "..", "indexes", "dinov2", "metadata.json")
  }
};
