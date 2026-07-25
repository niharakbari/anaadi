"use strict";

const path = require("path");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const config = require("../../config/config");
const preprocessingPipeline = require("./preprocessing");

class EmbeddingService {
  constructor() {
    this._adapter = null;
    this._isReady = false;
  }

  /** Dynamically requires and mounts the active AI Driver. */
  async initialise() {
    if (this._isReady) return;

    const modelName = config.ai?.model;
    if (!modelName) {
      throw new AppError("AI_MODEL configuration is missing from .env. The system requires an explicit AI model to boot.", 500);
    }
    const adapterPath = path.resolve(__dirname, "..", "..", "..", "ai-models", modelName, "adapter.js");

    try {
      const AdapterClass = require(adapterPath);
      this._adapter = new AdapterClass();
      
      // Validate adapter contract
      if (typeof this._adapter.initialize !== 'function') throw new Error("Adapter missing initialize() method");
      if (typeof this._adapter.embed !== 'function') throw new Error("Adapter missing embed() method");
      if (typeof this._adapter.getContext !== 'function') throw new Error("Adapter missing getContext() method");

      await this._adapter.initialize();

      // Initialize preprocessing pipeline (loads segmentation ONNX if enabled)
      await preprocessingPipeline.initialise();

      this._isReady = true;
      
      const context = this._adapter.getContext();
      logger.info(`EmbeddingService initialized successfully with AI Driver: ${context.name} v${context.version}`);
    } catch (error) {
      throw new AppError(`Failed to initialize AI Driver (${modelName}): ${error.message}`, 500);
    }
  }

  /** Retrieves the AI Context from the active adapter. */
  getContext() {
    this._assertReady();
    return this._adapter.getContext();
  }

  /**
   * Delegates embedding generation to the active adapter.
   *
   * @param {Buffer} imageBuffer - Raw image buffer.
   * @param {object} [options={}]
   * @param {boolean} [options.skipPreprocessing=false]
   *   When true, the dealer-photo preprocessing pipeline (QA, CLAHE, IS-Net) is
   *   bypassed entirely. Use this for clean CAD catalogue images during indexing.
   *   Model-specific resize + normalisation still runs inside the adapter's embed().
   */
  async embed(imageBuffer, options = {}) {
    this._assertReady();

    if (options.skipPreprocessing) {
      // Catalogue path: raw buffer → adapter (resize + normalise only)
      return await this._adapter.embed(imageBuffer);
    }

    // Query path: dealer photo → preprocessing pipeline → adapter
    const { buffer: processedBuffer } = await preprocessingPipeline.process(imageBuffer);
    return await this._adapter.embed(processedBuffer);
  }

  /** Delegates batch embedding to the active adapter if supported. */
  async embedBatch(imageBuffers) {
    this._assertReady();
    if (typeof this._adapter.embedBatch === "function") {
      return await this._adapter.embedBatch(imageBuffers);
    }
    throw new AppError(`embedBatch() is not supported by the active AI Driver.`, 501);
  }

  _assertReady() {
    if (!this._isReady) {
      throw new AppError("EmbeddingService is not initialised. Call initialise() first.", 503);
    }
  }

  
  get isReady() {
    return this._isReady;
  }
}

const embeddingService = new EmbeddingService();
module.exports = embeddingService;
