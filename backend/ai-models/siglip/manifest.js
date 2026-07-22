"use strict";

const path = require("path");

module.exports = {
  id: "siglip",
  name: "SigLIP",
  variant: "Base Patch16 256",
  version: "1.0.0",
  dimension: 768,
  
  search: {
    threshold: 0.35,
    metric: "cosine"
  },
  
  preprocessing: {
    inputSize: 256,
    normalization: "siglip",
    version: "1.0.0"
  },
  
  paths: {
    model: path.resolve(__dirname, "visual.onnx"),
    index: path.resolve(__dirname, "..", "..", "indexes", "siglip", "jewellery.hnsw"),
    metadata: path.resolve(__dirname, "..", "..", "indexes", "siglip", "metadata.json")
  }
};
