"use strict";

/**
 * @fileoverview EmbeddingService
 *
 * Responsible for loading the OpenCLIP ViT-B-32 ONNX model and producing
 * L2-normalised 512-dimensional float32 image embeddings via ONNX Runtime.
 *
 * Pipeline overview:
 *   Raw image buffer
 *     → Sharp preprocessing  (resize → centre-crop → RGB → float32 tensor)
 *     → ONNX Runtime inference  (visual encoder session)
 *     → L2 normalisation
 *     → Float32Array[512]
 *
 * Dependencies (to be installed):
 *   onnxruntime-node  ^1.18.x
 *   sharp             ^0.35.x  (already present)
 *
 * @module services/ai/embeddingService
 */

const path = require("path");

const logger = require("../../utils/logger");
const AppError = require("../../utils/AppError");


const sharp = require("sharp");
const ort = require("onnxruntime-node");
const fs = require("fs/promises");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Expected input spatial resolution for ViT-B-32.
 * The model was trained with 224 × 224 centre-cropped images.
 */
const MODEL_INPUT_SIZE = 224;

/**
 * Output dimensionality of the ViT-B-32 visual encoder.
 */
const EMBEDDING_DIM = 512;

/**
 * ImageNet-style normalisation constants used by OpenCLIP pre-processing.
 * Mean and std are applied channel-wise in RGB order.
 */
const IMAGENET_MEAN = [0.48145466, 0.4578275, 0.40821073];
const IMAGENET_STD  = [0.26862954, 0.26130258, 0.27577711];

/**
 * Absolute path to the ONNX visual-encoder model file.
 * The file is expected at:  <project_root>/ai-models/openclip/visual.onnx
 */
const MODEL_PATH = path.resolve(
  process.cwd(),
  "ai-models",
  "openclip",
  "visual.onnx"
);

// ---------------------------------------------------------------------------
// EmbeddingService class
// ---------------------------------------------------------------------------

class EmbeddingService {
  constructor() {
    /**
     * @type {import('onnxruntime-node').InferenceSession | null}
     * The ONNX Runtime inference session for the visual encoder.
     * Remains null until {@link EmbeddingService#initialise} is called.
     */
    this._session = null;

    /**
     * @type {boolean}
     * Guards against concurrent or repeated initialisation calls.
     */
    this._isReady = false;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Loads the ONNX model into an ONNX Runtime InferenceSession.
   * Must be awaited once at application start-up before any embed() calls.
   *
   * @returns {Promise<void>}
   * @throws  {AppError} If the model file is missing or fails to load.
   *
   */
  async initialise() {
    // Guard: skip if the session is already loaded.
    if (this._isReady) {
      return;
    }

    try {
          // Verify the model file exists before attempting a (potentially slow) load.
      try {
        await fs.access(MODEL_PATH);
      } catch {
        throw new AppError(
          `OpenCLIP model not found: ${MODEL_PATH}`,
          500
        );
      }

      // Create the ONNX Runtime inference session.
      this._session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
      });

      this._isReady = true;

      logger.info(
        `EmbeddingService initialized successfully | model: ${MODEL_PATH} | embeddingDim: ${EMBEDDING_DIM}`
      );
    } catch (error) {
      // Re-throw AppErrors produced above unchanged (e.g. model not found).
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap any ONNX Runtime or unexpected failure into a structured error.
      throw new AppError(
        `Failed to initialize EmbeddingService: ${error.message}`,
        500
      );
    }
  }

  /**
   * Generates a single L2-normalised embedding vector for the given image.
   *
   * @param   {Buffer} imageBuffer - Raw binary buffer of the source image
   *                                 (any Sharp-supported format: JPEG, PNG, WebP …).
   * @returns {Promise<Float32Array>} A Float32Array of length {@link EMBEDDING_DIM}.
   * @throws  {AppError} 400 – if imageBuffer is not a valid Buffer.
   * @throws  {AppError} 503 – if the service has not been initialised.
   * @throws  {AppError} 500 – if ONNX inference fails.
   *

  async embed(imageBuffer) {
    // 1. Guard: service must be initialised.
    if (!this._isReady) {
      throw new AppError(
        "EmbeddingService is not initialised. Call initialise() first.",
        503
      );
    }

    // 2. Guard: validate input buffer (delegate to _preprocess for full check,
    //    but catch the obvious case early for a cleaner error message).
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new AppError(
        "embed(): imageBuffer must be a non-empty Buffer.",
        400
      );
    }

    try {


      // 3. Preprocess → CHW Float32Array of shape [3, 224, 224].
      const tensorData = await this._preprocess(imageBuffer);

      // 4. Wrap in an ONNX Tensor with the batch dimension prepended: [1, 3, 224, 224].
      const inputTensor = new ort.Tensor("float32", tensorData, [
        1,
        3,
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE,
      ]);

      // Discover the model's input name dynamically to avoid hardcoding.
      const inputName = this._session.inputNames[0];

      // 5. Run inference.
      const results = await this._session.run({ [inputName]: inputTensor });

      // 6. Detect the output tensor automatically — use the first output key.
      const outputName = this._session.outputNames[0];
      const outputTensor = results[outputName];
      
      if (!outputTensor) {
        throw new AppError(
          `embed(): ONNX session returned no output for key "${outputName}".`,
          500
        );
      };

      if (!(outputTensor.data instanceof Float32Array)) {
          throw new AppError(
             "Model output is not Float32Array.",
            500
          );
      };
      

      // Extract the raw Float32Array from the output tensor.
      const rawVector = new Float32Array(outputTensor.data);

      // 6b. Verify output dimensionality matches the expected embedding size.
      if (rawVector.length !== EMBEDDING_DIM) {
        throw new AppError(
          `embed(): unexpected output dimension ${rawVector.length} (expected ${EMBEDDING_DIM}).`,
          500
        );
      }

      // 7. L2-normalise in-place.
      // 8. Return the unit-length embedding vector.
      return this._l2Normalise(rawVector);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`embed() inference failed: ${error.message}`, 500);
    }
  }

  /**
   * Generates embeddings for a batch of images in a single ONNX session run.
   * Batching reduces per-image overhead on CPU and is essential for GPU throughput.
   *
   * @param   {Buffer[]} imageBuffers - Array of raw image Buffers.
   * @returns {Promise<Float32Array[]>} Array of embedding vectors, one per image,
   *                                    each of length {@link EMBEDDING_DIM}.
   * @throws  {AppError} 400 – if imageBuffers is not a non-empty array.
   * @throws  {AppError} 503 – if the service has not been initialised.
   *

   */
  async embedBatch(imageBuffers) {
    // 1. Guard: service must be initialised.
    if (!this._isReady) {
      throw new AppError(
        "EmbeddingService is not initialised. Call initialise() first.",
        503
      );
    }

    // 1b. Guard: input must be a non-empty array of Buffers.
    if (!Array.isArray(imageBuffers) || imageBuffers.length === 0) {
      throw new AppError(
        "embedBatch(): imageBuffers must be a non-empty array.",
        400
      );
    }

    try {
      const N = imageBuffers.length;
      const chw = 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; // floats per image

      // 2. Preprocess all images in parallel → N CHW Float32Arrays.
      const preprocessed = await Promise.all(
        imageBuffers.map((buf) => this._preprocess(buf))
      );

      // 3. Concatenate into a single batched Float32Array of shape [N, 3, 224, 224].
      const batchData = new Float32Array(N * chw);
      for (let i = 0; i < N; i++) {
        batchData.set(preprocessed[i], i * chw);
      }

      const batchTensor = new ort.Tensor("float32", batchData, [
        N,
        3,
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE,
      ]);

      // Discover the model's input name dynamically.
      const inputName = this._session.inputNames[0];

      // 4. Single ONNX inference call for the entire batch.
      const results = await this._session.run({ [inputName]: batchTensor });

      // Detect output key automatically.
      const outputName = this._session.outputNames[0];
      const outputTensor = results[outputName];

      if (!outputTensor) {
          throw new AppError(
              `embedBatch(): ONNX session returned no output for key "${outputName}".`,
              500
          );
      }

      if (!(outputTensor.data instanceof Float32Array)) {
          throw new AppError(
              "Model output is not Float32Array.",
              500
          );
      }

const allData = new Float32Array(outputTensor.data);

      // 5. Split flat output [N × EMBEDDING_DIM] back into N individual vectors.
      // 6. L2-normalise each vector and collect into the result array.
      const embeddings = [];
      for (let i = 0; i < N; i++) {
        const slice = allData.slice(i * EMBEDDING_DIM, (i + 1) * EMBEDDING_DIM);

        // Verify each slice dimension as a production-safety check.
        if (slice.length !== EMBEDDING_DIM) {
          throw new AppError(
            `embedBatch(): unexpected output dimension ${slice.length} for item ${i} (expected ${EMBEDDING_DIM}).`,
            500
          );
        }

        embeddings.push(this._l2Normalise(slice));
      }

      return embeddings;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`embedBatch() inference failed: ${error.message}`, 500);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Pre-processes a raw image buffer into a normalised float32 tensor suitable
   * for the ViT-B-32 visual encoder.
   *
   * @param   {Buffer} imageBuffer
   * @returns {Promise<Float32Array>} Flat float32 array of shape [1, 3, 224, 224]
   *                                  (CHW layout, RGB channel order).
   *
      */
  async _preprocess(imageBuffer) {
    // 1. Validate input — must be a non-empty Buffer.
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new AppError(
        "Invalid imageBuffer: expected a non-empty Buffer.",
        400
      );
    }

    

    // 2-7. Resize → strip alpha → RGB raw pixels as a Buffer.
    const rawPixels = await sharp(imageBuffer)
      .resize(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, { fit: "cover" })
      .removeAlpha()
      .toColorspace("srgb")
      .raw()
      .toBuffer();

    // 8. Allocate the output tensor: 3 channels × H × W (CHW layout).
    const pixelsPerChannel = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
    const tensor = new Float32Array(3 * pixelsPerChannel);

    // 9-10. HWC → CHW conversion with ImageNet normalisation.
    //   rawPixels layout: [R₀,G₀,B₀, R₁,G₁,B₁, … , Rₙ,Gₙ,Bₙ]  (HWC, uint8)
    //   tensor   layout: [R₀…Rₙ, G₀…Gₙ, B₀…Bₙ]                  (CHW, float32)
    for (let i = 0; i < pixelsPerChannel; i++) {
      for (let c = 0; c < 3; c++) {
        tensor[c * pixelsPerChannel + i] =
          (rawPixels[i * 3 + c] / 255 - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
      }
    }

    // 11. Return the normalised CHW Float32Array.
    return tensor;
  }

  /**
   * Applies L2 normalisation in-place so that the cosine similarity between
   * two normalised vectors equals their dot product.
   *
   * @param   {Float32Array} vector - Raw output embedding from the ONNX model.
   * @returns {Float32Array}        The same array, normalised to unit length.
   *
   */
  _l2Normalise(vector) {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    // Divide each component by the norm; skip division for zero-length vectors
    // to avoid NaN propagation (already-zero vector stays zero).
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** @returns {boolean} True after a successful {@link EmbeddingService#initialise} call. */
  get isReady() {
    return this._isReady;
  }

  /** @returns {number} Dimensionality of the output embedding vectors. */
  get embeddingDim() {
    return EMBEDDING_DIM;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Application-wide singleton.
 * Import and await embeddingService.initialise() once during server boot.
 *
 * @type {EmbeddingService}
 */
const embeddingService = new EmbeddingService();

module.exports = embeddingService;
