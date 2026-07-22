"use strict";

const AppError = require("../src/utils/AppError");

/**
 * BaseAIAdapter
 * 
 * Abstract base class for all AI Embedding Models.
 * Defines the contract that every model adapter must implement.
 */
class BaseAIAdapter {
  constructor() {
    if (new.target === BaseAIAdapter) {
      throw new Error("BaseAIAdapter is an abstract class and cannot be instantiated directly.");
    }
  }

  /**
   * Initializes the AI model (e.g., loads ONNX session).
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new AppError("initialize() must be implemented by the adapter.", 501);
  }

  /**
   * Generates embeddings for a single image.
   * @param {Buffer} imageBuffer 
   * @returns {Promise<Float32Array>}
   */
  async embed(imageBuffer) {
    throw new AppError("embed() must be implemented by the adapter.", 501);
  }

  /**
   * Optional: Generates embeddings for a batch of images.
   * @param {Buffer[]} imageBuffers 
   * @returns {Promise<Float32Array[]>}
   */
  async embedBatch(imageBuffers) {
    throw new AppError("embedBatch() is not supported by this adapter.", 501);
  }

  /**
   * Returns the AI Context for this model.
   * @returns {Object}
   */
  getContext() {
    throw new AppError("getContext() must be implemented by the adapter.", 501);
  }

  /**
   * Optional: Gracefully shuts down the model session.
   * @returns {Promise<void>}
   */
  async shutdown() {
    // Default no-op
  }
}

module.exports = BaseAIAdapter;
