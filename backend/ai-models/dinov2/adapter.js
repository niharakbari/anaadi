"use strict";

const fs = require("fs/promises");
const ort = require("onnxruntime-node");
const AppError = require("../../src/utils/AppError");
const logger = require("../../src/utils/logger");
const manifest = require("./manifest");
const { preprocess } = require("./preprocess");
const BaseAIAdapter = require("../BaseAIAdapter");

class DINOv2Adapter extends BaseAIAdapter {
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
      logger.info(`DINOv2Adapter initialized successfully | model: ${manifest.paths.model} | dimension: ${manifest.dimension}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to initialize DINOv2Adapter: ${error.message}`, 500);
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

      // Output shape is [1, 257, 768]
      const rawData = outputTensor.data;
      const expectedElements = 257 * manifest.dimension;
      
      if (rawData.length !== expectedElements && rawData.length !== manifest.dimension) {
         throw new AppError(`embed(): unexpected output tensor size ${rawData.length}.`, 500);
      }

      // Extract embedding using GeM pooling (p=3) over patch tokens
      // or if it's already pooled (rawData.length === 768), just use it.
      let pooledVector = new Float32Array(manifest.dimension);
      
      if (rawData.length === manifest.dimension) {
        pooledVector.set(rawData);
      } else {
        const p = 3;
        const numPatches = 256;
        for (let c = 0; c < manifest.dimension; c++) {
          let sum = 0;
          for (let i = 1; i <= numPatches; i++) {
            let val = rawData[i * manifest.dimension + c];
            val = Math.max(0, val); // ReLU clamp for GeM
            sum += Math.pow(val, p);
          }
          pooledVector[c] = Math.pow(sum / numPatches, 1 / p);
        }
      }

      if (pooledVector.length !== 768) {
        throw new AppError(`Output dimension is exactly ${pooledVector.length}, expected 768.`, 500);
      }

      return this._l2Normalise(pooledVector);
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

module.exports = DINOv2Adapter;
