"use strict";

/**
 * @fileoverview IndexService
 * Manages the full lifecycle of the HNSW approximate nearest-neighbour index.
 * 
 * HNSW parameter guide:
 *   M               – bidirectional links per node (16–64). Higher → better recall, more RAM.
 *   efConstruction  – candidate-list size during build (100–500). Higher → slower but better graph.
 *   efSearch        – candidate-list size at query time (≥ k).
 */

const fs   = require("fs/promises");
const path = require("path");

const { HierarchicalNSW } = require("hnswlib-node");

const logger   = require("../../utils/logger");
const AppError = require("../../utils/AppError");
/** Distance space. 'cosine' is correct for L2-normalised embeddings. */
const HNSW_SPACE = "cosine";

/** Max bidirectional links per node. Controls recall vs. memory trade-off. */
const HNSW_M = 16;

/** Candidate-list size during index construction. */
const HNSW_EF_CONSTRUCTION = 200;

/** Candidate-list size at query time. Must be ≥ any requested k. */
const HNSW_EF_SEARCH = 50;

/** Image extensions recognised when scanning the design library. */
const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
]);

const config = require("../../config/config");

/** Absolute path to the design library directory. */
const DESIGN_LIBRARY_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  config.upload.designLibraryDirectory
);
class IndexService {
  constructor() {
    
    this._index = null;

    
    this._isReady = false;

    /**
     * integer label → { imageId, viewNumber, totalViews }
     * @type {Map<number, object>}
     */
    this._labelToImageId = new Map();

    /**
     * imageId → Set of integer labels  (for O(1) duplicate / delete lookups)
     * @type {Map<string, Set<number>>}
     */
    this._imageIdToLabel = new Map();

    /**
     * Monotonically incrementing label counter.
     * Soft-deleted labels are never reused; call rebuild() to compact.
     * @type {number}
     */
    this._nextLabel = 0;
  }
  /** Boot-time initialisation. Idempotent. Loads persisted index or creates fresh. */
  async initialise(maxElements = 100_000) {
    if (this._isReady) return;

    try {
      const embeddingService = require("./embeddingService");
      this._aiContext = embeddingService.getContext();
      this._indexPath = this._aiContext.paths.index;
      this._metadataPath = this._aiContext.paths.metadata;
      this._embeddingDim = this._aiContext.dimension;

      const indexExists = await this._fileExists(this._indexPath);
      indexExists
        ? await this.loadIndex()
        : await this._createAndActivate(maxElements);

      logger.info(
        `IndexService initialized | space: ${HNSW_SPACE} | dim: ${this._embeddingDim}` +
        ` | vectors: ${this._index.getCurrentCount()}`
      );
    } catch (error) {
      throw this._wrapError("initialise", error, 500);
    }
  }

  /**
   * Creates a fresh in-memory HNSW index and resets all internal mapping state.
   * Does NOT persist — call saveIndex() explicitly after populating.
   *
   * @param {number} [maxElements=100_000]
   * @returns {Promise<void>}
   * @throws {AppError}
   */
  async createIndex(maxElements = 100_000) {
    try {
      this._index = new HierarchicalNSW(HNSW_SPACE, this._embeddingDim);
      // initIndex(maxElements, M, efConstruction, randomSeed)
      this._index.initIndex(maxElements, HNSW_M, HNSW_EF_CONSTRUCTION, 100);
      this._resetMappingState();
    } catch (error) {
      throw this._wrapError("createIndex", error, 500);
    }
  }

  /**
   * Loads the persisted HNSW binary and companion label map from disk.
   * Restores full internal state — the service is immediately queryable afterwards.
   * Returns gracefully when no files exist yet (first-run case).
   *
   * @returns {Promise<void>}
   * @throws {AppError}
   */
  async loadIndex() {
    if (!(await this._fileExists(this._indexPath)) || !(await this._fileExists(this._metadataPath))) {
      return;
    }

    try {
      const metaJson = await fs.readFile(this._metadataPath, "utf8");
      const payload = JSON.parse(metaJson);
      const storedContext = payload.context;

      if (!storedContext || 
          storedContext.id !== this._aiContext.id || 
          storedContext.version !== this._aiContext.version || 
          storedContext.dimension !== this._aiContext.dimension ||
          storedContext.preprocessing.version !== this._aiContext.preprocessing.version) {
          
          throw new AppError(
              `Index metadata mismatch! Active context (${this._aiContext.id} v${this._aiContext.version}) ` +
              `is incompatible with stored index. Please rebuild the index.`,
              500
          );
      }

      this._index = new HierarchicalNSW(HNSW_SPACE, this._embeddingDim);
      // readIndex(path, allowReplaceDeleted) — second arg is a boolean, not capacity.
      await this._index.readIndex(this._indexPath, false);

      await this._restoreLabelMaps(payload);
      this._activateIndex();

      logger.info(
        `IndexService.loadIndex(): loaded ${this._index.getCurrentCount()} vectors`
      );
    } catch (error) {
      throw this._wrapError("loadIndex", error, 500);
    }
  }

  /** Persists the live HNSW binary and label map to disk. */
  async saveIndex() {
    this._assertReady("saveIndex");

    try {
      await fs.mkdir(path.dirname(this._indexPath), { recursive: true });
      await this._index.writeIndex(this._indexPath);
      await this._writeLabelMap();

      logger.info(
        `IndexService.saveIndex(): persisted ${this._index.getCurrentCount()} vectors`
      );
    } catch (error) {
      throw this._wrapError("saveIndex", error, 500);
    }
  }

  /** Alias for saveIndex() */
  async persist() {
    return this.saveIndex();
  }

  /** Resets and clears the HNSW vector index completely. */
  async clear(maxElements = 100_000) {
    this._assertReady("clear");
    await this._createAndActivate(maxElements);
    await this.saveIndex();
    logger.info("IndexService.clear(): HNSW vector index completely cleared and persisted.");
  }
  /** Inserts multiple embeddings (views) for a single image into the live HNSW index. */
  async addVectors(imageId, embeddings) {
    this._assertReady("addVectors");
    this._validateImageId(imageId, "addVectors");
    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      throw new AppError("addVectors(): embeddings must be a non-empty array", 400);
    }
    this._rejectDuplicate(imageId, "addVectors");

    this._ensureCapacity(embeddings.length, "addVectors");

    let viewNumber = 1;
    for (const embedding of embeddings) {
      this._validateEmbedding(embedding, "addVectors");
      this._insertPoint(imageId, embedding, viewNumber, embeddings.length);
      viewNumber++;
    }

    // Persist after every insert so no vectors are lost on an unexpected crash.
    await this.saveIndex();
  }

  async addVectorBatch(items) {
    this._assertReady("addVectorBatch");

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(
        "addVectorBatch(): items must be a non-empty array.",
        400
      );
    }

    // Calculate total embeddings
    const totalEmbeddings = items.reduce((sum, item) => sum + (Array.isArray(item.embeddings) ? item.embeddings.length : 1), 0);
    this._ensureCapacity(totalEmbeddings, "addVectorBatch");

    for (const item of items) {
      const imageId = item.imageId;
      const embeddings = Array.isArray(item.embeddings) ? item.embeddings : [item.embedding];
      
      this._validateImageId(imageId, "addVectorBatch");

      if (this._imageIdToLabel.has(imageId)) {
        logger.warn(`IndexService.addVectorBatch(): skipping duplicate "${imageId}"`);
        continue;
      }

      let viewNumber = 1;
      for (const embedding of embeddings) {
        this._validateEmbedding(embedding, "addVectorBatch");
        this._insertPoint(imageId, embedding, viewNumber, embeddings.length);
        viewNumber++;
      }
    }

    await this.saveIndex();
  }

  /**
   * Soft-deletes a vector via hnswlib-node's markDelete().
   * The point is excluded from all future kNN results immediately, without
   * requiring an index rebuild. The integer label slot is NOT reclaimed —
   * call rebuild() after many deletions to compact the index.
   *
   * @param {string} imageId
   * @returns {Promise<boolean>} true if deleted, false if not found.
   * @throws {AppError} 503 if not ready.
   */
  async removeVector(imageId) {
    this._assertReady("removeVector");

    const labels = this._imageIdToLabel.get(imageId);
    if (!labels || labels.size === 0) return false;

    // Soft deletion:
    // The vectors remain physically inside the HNSW graph.
    // markDelete() only excludes them from future searches.
    for (const label of labels) {
      this._index.markDelete(label);
      this._labelToImageId.delete(label);
    }
    
    this._imageIdToLabel.delete(imageId);

    // Persist so the updated label map (which no longer lists this imageId)
    // is durable across restarts. Without this the deletion reverses on reboot.
    await this.saveIndex();

    return true;
  }
  /**
   * Performs a k-nearest-neighbour search and returns results sorted by
   * ascending cosine distance (most similar first).
   *
   * @param {Float32Array} queryEmbedding  L2-normalised, dim=512.
   * @param {number}       [k=10]
   * @returns {Promise<Array<{ imageId: string, distance: number }>>}
   * @throws {AppError} 503 not ready | 400 invalid embedding.
   */
  async searchKnn(queryEmbedding, k = 10) {
    this._assertReady("searchKnn");
    this._validateEmbedding(queryEmbedding, "searchKnn");
    this._validateK(k);

    const liveCount = this._index.getCurrentCount();
    if (liveCount === 0) return [];

    // Clamp k to the number of indexed vectors — hnswlib throws if k > count.
    const effectiveK = Math.min(k, liveCount);
    const { neighbors, distances } = this._index.searchKnn(
      Array.from(queryEmbedding),
      effectiveK
    );

    return neighbors
      .map((label, i) => {
        const meta = this._labelToImageId.get(label);
        const imageId = typeof meta === 'string' ? meta : meta?.imageId;
        return {
          imageId: imageId,
          distance: distances[i],
        };
      })
      .filter(({ imageId }) => imageId !== undefined);
  }
  /**
   * Rebuilds the entire HNSW index from scratch by scanning the design library,
   * generating embeddings via EmbeddingService, and persisting the result.
   *
   * Flow:
   *   design_library/  →  embed()  →  fresh index  →  saveIndex()
   *
   * @param {number} [maxElements=100_000]
   * @returns {Promise<{ processed: number, skipped: number, failed: number }>}
   * @throws {AppError}
   */
  async rebuild(maxElements = 100_000) {
    const embeddingService = this._requireEmbeddingService();
    const imageFiles       = await this._scanDesignLibrary();

    await this.createIndex(Math.max(maxElements, imageFiles.length + 1));

    const stats = await this._embedAllImages(imageFiles, embeddingService);

    this._activateIndex();
    await this.saveIndex();

    logger.info(
      `IndexService.rebuild(): done — ` +
      `processed=${stats.processed} skipped=${stats.skipped} failed=${stats.failed}`
    );

    return stats;
  }
  
  get isReady() {
    return this._isReady;
  }

  
  get vectorCount() {
    return this._index ? this._index.getCurrentCount() : 0;
  }
  /**
   * Activates the index for querying: sets the runtime efSearch beam width
   * and flips _isReady to true.
   */
  _activateIndex() {
    this._index.setEf(HNSW_EF_SEARCH);
    this._isReady = true;
  }

  /**
   * Resets the bidirectional label maps and the label counter.
   * Called whenever a fresh index is created.
   */
  _resetMappingState() {
    this._labelToImageId = new Map();
    this._imageIdToLabel = new Map();
    this._nextLabel      = 0;
  }

  /**
   * Convenience wrapper: creates a fresh index and immediately activates it.
   * Used by initialise() on first boot.
   *
   * @param {number} maxElements
   */
  async _createAndActivate(maxElements) {
    await this.createIndex(maxElements);
    this._activateIndex();
    logger.info("IndexService: no persisted index found — created fresh HNSW index.");
  }
  async _restoreLabelMaps(payload) {
    this._labelToImageId = new Map(
      Object.entries(payload.labelToImageId).map(([k, v]) => [Number(k), v])
    );
    
    this._imageIdToLabel = new Map();
    for (const [labelStr, meta] of this._labelToImageId.entries()) {
      const label = Number(labelStr);
      const id = typeof meta === 'string' ? meta : meta.imageId;
      if (!this._imageIdToLabel.has(id)) {
        this._imageIdToLabel.set(id, new Set());
      }
      this._imageIdToLabel.get(id).add(label);
    }
    this._nextLabel = payload.nextLabel ?? this._labelToImageId.size;
  }

  /**
   * Serialises the current _labelToImageId map to the companion JSON file.
   */
  async _writeLabelMap() {
    const payload = {
      context: this._aiContext,
      labelToImageId: Object.fromEntries(this._labelToImageId),
      nextLabel:      this._nextLabel,
    };
    await fs.writeFile(this._metadataPath, JSON.stringify(payload, null, 2), "utf8");
  }
  /**
   * Low-level point insertion: calls hnswlib addPoint and updates both maps.
   * Callers are responsible for validation and capacity checks before calling this.
   *
   * @param {string}       imageId
   * @param {Float32Array} embedding
   */
  _insertPoint(imageId, embedding, viewNumber = 1, totalViews = 1) {
    const label = this._nextLabel++;
    this._index.addPoint(Array.from(embedding), label);
    this._labelToImageId.set(label, { imageId, viewNumber, totalViews });
    
    if (!this._imageIdToLabel.has(imageId)) {
      this._imageIdToLabel.set(imageId, new Set());
    }
    this._imageIdToLabel.get(imageId).add(label);
  }

  /**
   * Ensures the index can absorb `count` more vectors.
   * Doubles capacity automatically when the index is at or near its limit.
   *
   * @param {number} count     Number of vectors about to be inserted.
   * @param {string} callerName  For log messages.
   */
  _ensureCapacity(count, callerName) {
    const current = this._index.getCurrentCount();
    const max     = this._index.getMaxElements();

    if (current + count > max) {
      const newMax = Math.max(max * 2, current + count);
      logger.warn(
        `IndexService.${callerName}(): at capacity (${max}), resizing to ${newMax}.`
      );
      this._index.resizeIndex(newMax);
    }
  }
  /**
   * Lazy-requires EmbeddingService to avoid a circular dependency at module load.
   * Throws 503 when EmbeddingService has not been initialised yet.
   *
   * @returns {object} embeddingService singleton
   * @throws {AppError} 503
   */
  _requireEmbeddingService() {
    const embeddingService = require("./embeddingService");
    if (!embeddingService.isReady) {
      throw new AppError(
        "rebuild(): EmbeddingService must be initialised before rebuilding the index.",
        503
      );
    }
    return embeddingService;
  }

  /**
   * Scans the design library directory and returns a list of supported image
   * filenames. Throws if the directory is not found.
   *
   * @returns {Promise<string[]>} Filenames (not full paths).
   * @throws {AppError} 500
   */
  async _scanDesignLibrary() {
    if (!(await this._fileExists(DESIGN_LIBRARY_PATH))) {
      throw new AppError(
        `rebuild(): design library not found at ${DESIGN_LIBRARY_PATH}`,
        500
      );
    }

    let entries;
    try {
      entries = await fs.readdir(DESIGN_LIBRARY_PATH, { withFileTypes: true });
    } catch (error) {
      throw new AppError(
        `rebuild(): failed to read design library — ${error.message}`,
        500
      );
    }

    const imageFiles = entries
      .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(
        path.extname(e.name).toLowerCase()
      ))
      .map((e) => e.name);

    if (imageFiles.length === 0) {
      logger.warn("IndexService.rebuild(): no image files found in design library.");
    } else {
      logger.info(
        `IndexService.rebuild(): found ${imageFiles.length} images in ${DESIGN_LIBRARY_PATH}`
      );
    }

    return imageFiles;
  }

  /** Iterates over image filenames, embeds each one, and inserts into index. */
  async _embedAllImages(filenames, embeddingService) {
    let processed = 0;
    let skipped   = 0;
    let failed    = 0;

    const multiViewService = require("./multiViewService");

    for (const filename of filenames) {
      try {
        const imageId     = path.basename(filename, path.extname(filename));
        const fullPath    = path.join(DESIGN_LIBRARY_PATH, filename);
        const imageBuffer = await fs.readFile(fullPath);

        logger.info(`Import: Processing ${imageId}...`);
        const cropBuffers = await multiViewService.extractViews(imageBuffer);
        logger.info(`Detected ${cropBuffers.length} jewellery views.`);
        
        let viewCount = 1;
        for (const cropBuf of cropBuffers) {
           const embedding = await embeddingService.embed(cropBuf);
           this._ensureCapacity(1, "rebuild._embedAllImages");
           this._insertPoint(imageId, embedding, viewCount, cropBuffers.length);
           viewCount++;
        }
        logger.info(`Generated ${cropBuffers.length} embeddings.`);

        processed++;
      } catch (error) {
        logger.error(`IndexService.rebuild(): failed "${filename}" — ${error.message}`);
        failed++;
      }
    }

    return { processed, skipped, failed };
  }
  /** Throws 503 if the index has not been initialised. */
  _assertReady(callerName) {
    if (!this._isReady) {
      throw new AppError(
        `IndexService.${callerName}(): service is not initialised. ` +
        "Call initialise() first.",
        503
      );
    }
  }

  /** Throws 409 if the imageId is already registered in the index. */
  _rejectDuplicate(imageId, callerName) {
    if (this._imageIdToLabel.has(imageId)) {
      throw new AppError(
        `${callerName}(): imageId "${imageId}" already exists. ` +
        "Call removeVector() first to update an existing vector.",
        409
      );
    }
  }

  /** Throws 400 if imageId is not a non-empty string. */
  _validateImageId(imageId, callerName) {
    if (typeof imageId !== "string" || imageId.trim() === "") {
      throw new AppError(
        `${callerName}(): imageId must be a non-empty string.`,
        400
      );
    }
  }

  /** Throws 400 if embedding is not a valid Float32Array. */
  _validateEmbedding(embedding, callerName) {
    if (!(embedding instanceof Float32Array)) {
      throw new AppError(
        `${callerName}(): embedding must be a Float32Array.`,
        400
      );
    }
    if (embedding.length !== this._embeddingDim) {
      throw new AppError(
        `${callerName}(): embedding dimension mismatch — ` +
        `got ${embedding.length}, expected ${this._embeddingDim}.`,
        400
      );
    }
  }

  /** Throws 400 when k is not a positive integer. */
  _validateK(k) {
    if (!Number.isInteger(k) || k < 1) {
      throw new AppError(
        `searchKnn(): k must be a positive integer, got ${k}.`,
        400
      );
    }
  }
  /** Returns true when filePath is accessible on disk. */
  async _fileExists(filePath) {
    return fs.access(filePath).then(() => true).catch(() => false);
  }

  /** Re-throws AppErrors untouched; wraps all other errors as AppError(statusCode). */
  _wrapError(callerName, error, statusCode) {
    if (error instanceof AppError) return error;
    return new AppError(
      `IndexService.${callerName}(): ${error.message}`,
      statusCode
    );
  }
}
/** Application-wide singleton instance. */
const indexService = new IndexService();

module.exports = indexService;
