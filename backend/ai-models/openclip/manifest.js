"use strict";

const path = require("path");

module.exports = {
  id: "openclip",
  name: "OpenCLIP",
  variant: "ViT-B-32",
  version: "1.0.0",
  dimension: 512,
  
  search: {
    threshold: 0.5,
    metric: "cosine"
  },
  
  preprocessing: {
    inputSize: 224,
    normalization: "imagenet",
    version: "1.0.0"
  },
  
  paths: {
    model: path.resolve(__dirname, "visual.onnx"),
    index: path.resolve(__dirname, "..", "..", "indexes", "openclip", "jewellery.hnsw"),
    metadata: path.resolve(__dirname, "..", "..", "indexes", "openclip", "metadata.json")
  }
};
