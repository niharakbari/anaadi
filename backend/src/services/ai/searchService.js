"use strict";

/**
 * @fileoverview SearchService
 * Pure orchestrator for AI-powered visual search. Delegates embeddings to EmbeddingService and queries IndexService.
 */

const logger   = require("../../utils/logger");
const AppError = require("../../utils/AppError");

const embeddingService = require("./embeddingService");
const indexService     = require("./indexService");
const scoreFormatter   = require("./scoreFormatter");
const multiViewService = require("./multiViewService");

/** Default number of nearest neighbours returned per search. */
const DEFAULT_K = 10;

/** Hard cap on k — prevents runaway query costs. */
const MAX_K = 100;
class SearchService {
  /** Primary entry point for visual search. */
  async searchByImage(imageBuffer, options = {}) {
    this._validateImageBuffer(imageBuffer);
    this._assertServicesReady();

    const k         = this._resolveK(options.k);

    const aiContext = embeddingService.getContext();
    const threshold = options.distanceThreshold ?? aiContext.search.threshold;

    // 1. Pass uploaded image through multiViewService
    const extractedViews = await multiViewService.extractViews(imageBuffer);
    
    // 2. If NO multiple views detected, use original image exactly as today
    const buffersToSearch = extractedViews.length > 1 ? extractedViews : [imageBuffer];

    // Fetch extra to account for multi-view merging
    const fetchK = Math.max(k * 5, 50);
    
    // 3. Embed and search EVERY crop
    const allRawResults = [];
    for (const viewBuffer of buffersToSearch) {
      const embedding = await embeddingService.embed(viewBuffer);
      const rawResults = await indexService.searchKnn(embedding, fetchK);
      allRawResults.push(...rawResults);
    }
    
    // 4. Merge by design keeping best score (minimum distance)
    const mergedMap = new Map();
    for (const result of allRawResults) {
      if (result.distance > threshold) continue;
      
      const existing = mergedMap.get(result.imageId);
      if (!existing || result.distance < existing.distance) {
        mergedMap.set(result.imageId, result);
      }
    }
    
    // Sort merged results and slice to k
    const mergedResults = Array.from(mergedMap.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k);

    logger.info(`Search: Requested Top ${k}. Retrieved ${allRawResults.length} vectors. Merged into ${mergedMap.size} unique designs. Returned Top ${mergedResults.length}.`);

    return await this._buildResults(mergedResults, options);
  }

  /** Not implemented: raw embeddings are not persisted outside the HNSW graph. */
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

  /** Image must already exist in DB so HNSW metadata can reference its ID. */
  async registerImage(imageId, imageBuffer) {
    this._validateImageId(imageId);
    this._validateImageBuffer(imageBuffer);
    this._assertServicesReady();

    const cropBuffers = await multiViewService.extractViews(imageBuffer);

    const embeddings = [];
    for (const cropBuffer of cropBuffers) {
      embeddings.push(await embeddingService.embed(cropBuffer));
    }

    await indexService.addVectors(imageId, embeddings);

    logger.info(`SearchService.registerImage(): indexed imageId=${imageId} with ${embeddings.length} views`);
  }

  /** Removes image from HNSW index (soft delete). */
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

  /** Resets and clears all vectors from the HNSW search index. */
  async clearAll() {
    await indexService.clear();
    logger.info("SearchService.clearAll(): Cleared all vectors from HNSW index.");
  }
  
  /** Transforms raw kNN results into the public SearchResult shape. */
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
    return knnResults.map(({ imageId, distance }, index) => {
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
        // UI metrics - delegated to the formatter
        rank: index + 1,
        distance: distance,
        similarity: scoreFormatter.formatScore(distance, embeddingService.getContext()),
        displayScore: scoreFormatter.formatDisplayScore(distance, embeddingService.getContext()),
        
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
        result.distance = distance; // Retained for backward compatibility if explicitly requested
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

/**
 * 
 * Application-wide singleton.
 * Route handlers import and call methods on this object directly.
 *
 * @type {SearchService}
 */
const searchService = new SearchService();

module.exports = searchService;
