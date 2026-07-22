"use strict";

const fs = require("fs/promises");
const ort = require("onnxruntime-node");
const AppError = require("../../src/utils/AppError");
const logger = require("../../src/utils/logger");
const manifest = require("./manifest");
const { preprocess } = require("./preprocess");
const BaseAIAdapter = require("../BaseAIAdapter");

class OpenCLIPAdapter extends BaseAIAdapter {
  constructor() {
    super();
    this._session = null;
    this._isReady = false;
  }

  getContext() {
    return manifest;
  }

  async initialize() {
    if (this._isReady) return;

    try {
      try {
        await fs.access(manifest.paths.model);
      } catch {
        throw new AppError(`Model not found: ${manifest.paths.model}`, 500);
      }

      this._session = await ort.InferenceSession.create(manifest.paths.model, {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
        intraOpNumThreads: 1,
        interOpNumThreads: 1,
      });

      this._isReady = true;
      logger.info(`OpenCLIPAdapter initialized successfully | model: ${manifest.paths.model} | dimension: ${manifest.dimension}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to initialize OpenCLIPAdapter: ${error.message}`, 500);
    }
  }

  async embed(imageBuffer) {
    if (!this._isReady) {
      throw new AppError("Adapter is not initialized.", 503);
    }

    try {
      const tensorData = await preprocess(imageBuffer);
      const inputSize = manifest.preprocessing.inputSize;

      const inputTensor = new ort.Tensor("float32", tensorData, [
        1,
        3,
        inputSize,
        inputSize,
      ]);

      const inputName = this._session.inputNames[0];
      const results = await this._session.run({ [inputName]: inputTensor });

      const outputName = this._session.outputNames[0];
      const outputTensor = results[outputName];
      
      if (!outputTensor) {
        throw new AppError(`embed(): ONNX session returned no output for key "${outputName}".`, 500);
      }

      if (!(outputTensor.data instanceof Float32Array)) {
        throw new AppError("Model output is not Float32Array.", 500);
      }

      const rawVector = new Float32Array(outputTensor.data);

      if (rawVector.length !== manifest.dimension) {
        throw new AppError(`embed(): unexpected output dimension ${rawVector.length} (expected ${manifest.dimension}).`, 500);
      }

      return this._l2Normalise(rawVector);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`embed() inference failed: ${error.message}`, 500);
    }
  }

  async embedBatch(imageBuffers) {
    throw new AppError("embedBatch is currently unsupported in this adapter version.", 501);
  }

  _l2Normalise(vector) {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

module.exports = OpenCLIPAdapter;
