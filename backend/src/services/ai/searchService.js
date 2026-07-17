"use strict";

/**
 * @fileoverview SearchService
 *
 * Pure orchestrator for AI-powered jewellery image search.
 * This is the ONLY AI service that Express route handlers call directly.
 *
 * This class owns zero AI logic. It delegates:
 *   - Embedding generation  → EmbeddingService
 *   - Vector similarity     → IndexService
 *
 * Request flow:
 *
 *   HTTP Route
 *     ↓
 *   SearchService.searchByImage(imageBuffer, options)
 *     ├─ EmbeddingService.embed()     → Float32Array[512]
 *     ├─ IndexService.searchKnn()     → [{ imageId, distance }]
 *     └─ _buildResults()             → SearchResult[]
 *
 * @module services/ai/searchService
 */

const logger   = require("../../utils/logger");
const AppError = require("../../utils/AppError");

const embeddingService = require("./embeddingService");
const indexService     = require("./indexService");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default number of nearest neighbours returned per search. */
const DEFAULT_K = 10;

/** Hard cap on k — prevents runaway query costs. */
const MAX_K = 100;

/**
 * Default maximum cosine distance for a result to be included.
 * Cosine distance: 0 = identical, 2 = maximally dissimilar.
 *
 * TODO: Expose via env variable AI_SIMILARITY_THRESHOLD for runtime tuning.
 */
const DEFAULT_DISTANCE_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// SearchService
// ---------------------------------------------------------------------------

class SearchService {
  // -------------------------------------------------------------------------
  // Search entry points
  // -------------------------------------------------------------------------

  /**
   * Primary entry point for image-based similarity search.
   * Embeds the query image and queries the HNSW index.
   *
   * @param {Buffer} imageBuffer                       Raw query image (JPEG / PNG / WebP).
   * @param {object} [options={}]
   * @param {number} [options.k]                       Result count. Default: 10. Max: 100.
   * @param {number} [options.distanceThreshold]       Max cosine distance. Default: 0.5.
   * @param {boolean} [options.includeDistance=false]  Expose raw distance in results.
   * @returns {Promise<SearchResult[]>}
   * @throws {AppError} 400 – invalid imageBuffer.
   * @throws {AppError} 503 – a required service is not initialised.
   */
  async searchByImage(imageBuffer, options = {}) {
    this._validateImageBuffer(imageBuffer);
    this._assertServicesReady();

    const k         = this._resolveK(options.k);
    const threshold = options.distanceThreshold ?? DEFAULT_DISTANCE_THRESHOLD;

    const embedding  = await embeddingService.embed(imageBuffer);
    const knnResults = await indexService.searchKnn(embedding, k);
    const filtered   = knnResults.filter((r) => r.distance <= threshold);

    return await this._buildResults(filtered, options);
  }

  /**
   * "Find similar" search using the stored embedding of an existing image.
   *
   * NOT IMPLEMENTED — the current architecture does not persist raw embeddings
   * in a separately queryable storage layer. The HNSW index stores only the
   * search graph and label mapping, not the original embedding vectors. 
   * @param {string} imageId
   * @param {object} [options={}]
   * @returns {Promise<SearchResult[]>}
   * @throws {AppError} 501 always.
   */
  async searchByImageId(imageId, options = {}) {
    // TODO: Implement once embedding retrieval from persistent storage is available.
    throw new AppError(
      "searchByImageId() is not implemented in the current architecture. " +
      "Retrieving a stored embedding requires a persistent vector store " +
      "(e.g. MySQL BLOB, Redis, or pgvector) that has not yet been integrated.",
      501
    );
  }

  /**
   * Text-to-image search using OpenCLIP's shared embedding space.
   * Requires a dedicated text encoder ONNX model (not yet integrated).
   *
   * TODO: Implement once TextEmbeddingService is created:
   *   1. Tokenise textQuery with the OpenCLIP BPE tokeniser.
   *   2. Run the token tensor through the text encoder ONNX session.
   *   3. L2-normalise the output (same 512-dim space as image embeddings).
   *   4. Delegate to IndexService.searchKnn() and _buildResults().
   *
   * @param {string} textQuery   e.g. "gold mangalsutra with black beads"
   * @param {object} [options={}]
   * @returns {Promise<SearchResult[]>}
   * @throws {AppError} 501 always.
   */
  async searchByText(textQuery, options = {}) {
    // TODO: Implement once the OpenCLIP text encoder ONNX model is available.
    throw new AppError(
      "searchByText() is not yet implemented. " +
      "It requires a text encoder ONNX session (TextEmbeddingService).",
      501
    );
  }

  // -------------------------------------------------------------------------
  // Index management
  // -------------------------------------------------------------------------

  /**
   * Registers a newly uploaded image in the HNSW index.
   * Call this after the image row has been committed to the database
   * so that the imageId (DB primary key) is available.
   *
   * @param {string} imageId     DB-assigned identifier for the image.
   * @param {Buffer} imageBuffer Raw image buffer.
   * @returns {Promise<void>}
   * @throws {AppError} 400 – invalid inputs.
   * @throws {AppError} 503 – a required service is not initialised.
   */
  async registerImage(imageId, imageBuffer) {
    this._validateImageId(imageId);
    this._validateImageBuffer(imageBuffer);
    this._assertServicesReady();

    const embedding = await embeddingService.embed(imageBuffer);
    await indexService.addVector(imageId, embedding);

    logger.info(`SearchService.registerImage(): indexed imageId=${imageId}`);
  }

  /**
   * Removes an image from the HNSW index.
   * Call this when the image is deleted from the database.
   *
   * @param {string} imageId
   * @returns {Promise<boolean>} true if the image was found and removed, false if not found.
   * @throws {AppError} 503 – IndexService is not initialised.
   */
  async removeImage(imageId) {
    this._validateImageId(imageId);

    const removed = await indexService.removeVector(imageId);

    if (removed) {
      logger.info(`SearchService.removeImage(): removed imageId=${imageId}`);
    } else {
      logger.warn(`SearchService.removeImage(): imageId=${imageId} was not found in the index.`);
    }

    return removed;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Transforms raw kNN results into the public SearchResult shape.
   * Computes similarity score and optionally exposes the raw distance.
   *
   * TODO: MySQL — once the DB layer is wired, join the designImages table
   * here to attach filename, thumbnailUrl, category, etc. to each result.
   *
   * @param {Array<{ imageId: string, distance: number }>} knnResults
   * @param {object} options
   * @param {boolean} [options.includeDistance=false]
   * @returns {SearchResult[]}
   */
  async _buildResults(knnResults, options) {
    if (knnResults.length === 0) return [];

    const designImageModel = require("../../models/designImageModel");

    // Gather all valid imageIds
    const imageIds = knnResults.map((r) => r.imageId).filter(Boolean);

    let dbRows = [];
    try {
      // Execute ONE batch query to retrieve all metadata
      dbRows = await designImageModel.findByIds(imageIds.map(Number));
    } catch (error) {
      logger.error(`Failed to retrieve metadata for search results: ${error.message}`);
    }

    // Build an in-memory lookup map by id
    const metadataMap = new Map();
    for (const row of dbRows) {
      metadataMap.set(String(row.id), row);
    }

    // Map and merge metadata into results
    return knnResults.map(({ imageId, distance }) => {
      const dbMetadata = metadataMap.get(String(imageId)) || {};

      // Derive title from original_filename (e.g. "ring_design.png" -> "ring_design")
      let title = "Unknown Design";
      if (dbMetadata.original_filename) {
        title = dbMetadata.original_filename.replace(/\.[^/.]+$/, ""); // strip extension
      }

      // Convert stored_filename into an image URL path
      const imagePath = dbMetadata.stored_filename
        ? `/uploads/design_library/${dbMetadata.stored_filename}`
        : null;

      const result = {
        imageId,
        similarityScore: parseFloat(((1 - distance) * 100).toFixed(2)),
        // Expose database columns
        originalFilename: dbMetadata.original_filename || null,
        storedFilename: dbMetadata.stored_filename || null,
        filePath: dbMetadata.file_path || null,
        fileSize: dbMetadata.file_size || null,
        mimeType: dbMetadata.mime_type || null,
        imageWidth: dbMetadata.image_width || null,
        imageHeight: dbMetadata.image_height || null,
        uploadedAt: dbMetadata.uploaded_at || null,
        updatedAt: dbMetadata.updated_at || null,
        // Frontend-specific derived fields
        title,
        sku: dbMetadata.id ? `SKU-${String(dbMetadata.id).padStart(4, "0")}` : `SKU-${imageId}`,
        image: imagePath,
        category: "Jewellery Design",
        status: "active"
      };

      if (options.includeDistance === true) {
        result.distance = distance;
      }

      return result;
    });
  }

  /**
   * Resolves the effective k: applies the caller's preference then clamps
   * to [1, MAX_K]. Delegates integer validation to IndexService.searchKnn()
   * via its own guard — we only clamp here.
   *
   * @param {number|undefined} requestedK
   * @returns {number}
   */
  _resolveK(requestedK) {
    const k = requestedK ?? DEFAULT_K;
    return Math.min(Math.max(1, Math.trunc(k)), MAX_K);
  }

  /**
   * Throws 503 when either required AI service has not been initialised.
   * Both must be ready before any embed() or searchKnn() call is safe.
   *
   * @throws {AppError} 503
   */
  _assertServicesReady() {
    if (!embeddingService.isReady) {
      throw new AppError(
        "EmbeddingService is not initialised. " +
        "Await embeddingService.initialise() at server boot.",
        503
      );
    }
    if (!indexService.isReady) {
      throw new AppError(
        "IndexService is not initialised. " +
        "Await indexService.initialise() at server boot.",
        503
      );
    }
  }

  /**
   * Throws 400 when imageBuffer is not a non-empty Buffer.
   *
   * @param {Buffer} imageBuffer
   * @throws {AppError} 400
   */
  _validateImageBuffer(imageBuffer) {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new AppError(
        "imageBuffer must be a non-empty Buffer.",
        400
      );
    }
  }

  /**
   * Throws 400 when imageId is not a non-empty string.
   *
   * @param {string} imageId
   * @throws {AppError} 400
   */
  _validateImageId(imageId) {
    if (typeof imageId !== "string" || imageId.trim() === "") {
      throw new AppError(
        "imageId must be a non-empty string.",
        400
      );
    }
  }
}

// ---------------------------------------------------------------------------
// JSDoc type definitions
// ---------------------------------------------------------------------------

/**
 * @typedef  {object} SearchResult
 * @property {string} imageId          Application-level image identifier.
 * @property {number} similarityScore  Similarity percentage (0–100). Higher = more similar.
 * @property {number} [distance]       Raw cosine distance (only when includeDistance=true).
 *
 * TODO: Extend with MySQL-joined fields once the DB layer is wired:
 * @property {string} [filename]
 * @property {string} [thumbnailUrl]
 * @property {string} [category]
 */

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------
/**
 * 
 * Application-wide singleton.
 * Route handlers import and call methods on this object directly.
 *
 * @type {SearchService}
 */
const searchService = new SearchService();

module.exports = searchService;
