"use strict";

/**
 * @fileoverview IndexService
 *
 * Manages the full lifecycle of the HNSW approximate nearest-neighbour index
 * built on top of hnswlib-node.
 *
 * Public responsibilities:
 *   - Boot-time initialisation  (initialise)
 *   - Index creation / load / save  (createIndex, loadIndex, saveIndex)
 *   - Runtime vector management  (addVector, addVectorBatch, removeVector)
 *   - Similarity search  (searchKnn)
 *   - Full index rebuild from the design library  (rebuild)
 *
 * HNSW parameter guide:
 *   M               – bidirectional links per node (16–64). Higher → better recall, more RAM.
 *   efConstruction  – candidate-list size during build (100–500). Higher → slower but better graph.
 *   efSearch        – candidate-list size at query time (≥ k).
 *
 * @module services/ai/indexService
 */

const fs   = require("fs/promises");
const path = require("path");

const { HierarchicalNSW } = require("hnswlib-node");

const logger   = require("../../utils/logger");
const AppError = require("../../utils/AppError");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Output dimension of the ViT-B-32 visual encoder. Must match EmbeddingService. */
const EMBEDDING_DIM = 512;

/** Distance space. 'cosine' is correct for L2-normalised embeddings. */
const HNSW_SPACE = "cosine";

/** Max bidirectional links per node. Controls recall vs. memory trade-off. */
const HNSW_M = 16;

/** Candidate-list size during index construction. */
const HNSW_EF_CONSTRUCTION = 200;

/** Candidate-list size at query time. Must be ≥ any requested k. */
const HNSW_EF_SEARCH = 50;

/** Absolute path to the persisted HNSW binary. */
const INDEX_PATH = path.resolve(process.cwd(), "indexes", "jewellery.hnsw");

/**
 * Companion JSON file.
 * Stores the label ↔ imageId bidirectional map so it survives restarts.
 */
const LABELS_PATH = path.resolve(
  process.cwd(),
  "indexes",
  "jewellery.labels.json"
);

/** Image extensions recognised when scanning the design library. */
const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
]);

/** Absolute path to the design library directory. */
const DESIGN_LIBRARY_PATH = path.resolve(
  process.cwd(),
  "uploads",
  "design_library"
);

// ---------------------------------------------------------------------------
// IndexService
// ---------------------------------------------------------------------------

class IndexService {
  constructor() {
    /** @type {HierarchicalNSW | null} */
    this._index = null;

    /** @type {boolean} */
    this._isReady = false;

    /**
     * integer label → imageId  (for kNN result resolution)
     * @type {Map<number, string>}
     */
    this._labelToImageId = new Map();

    /**
     * imageId → integer label  (for O(1) duplicate / delete lookups)
     * @type {Map<string, number>}
     */
    this._imageIdToLabel = new Map();

    /**
     * Monotonically incrementing label counter.
     * Soft-deleted labels are never reused; call rebuild() to compact.
     * @type {number}
     */
    this._nextLabel = 0;
  }

  // -------------------------------------------------------------------------
  // Lifecycle — public
  // -------------------------------------------------------------------------

  /**
   * Entry point called once at server boot.
   * Loads a persisted index if one exists; otherwise creates a fresh one.
   * Idempotent — subsequent calls are no-ops.
   *
   * @param {number} [maxElements=100_000]
   * @returns {Promise<void>}
   * @throws {AppError}
   */
  async initialise(maxElements = 100_000) {
    if (this._isReady) return;

    try {
      const indexExists = await this._fileExists(INDEX_PATH);
      indexExists
        ? await this.loadIndex()
        : await this._createAndActivate(maxElements);

      logger.info(
        `IndexService initialized | space: ${HNSW_SPACE} | dim: ${EMBEDDING_DIM}` +
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
      this._index = new HierarchicalNSW(HNSW_SPACE, EMBEDDING_DIM);
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
    if (!(await this._fileExists(INDEX_PATH))) return;

    try {
      this._index = new HierarchicalNSW(HNSW_SPACE, EMBEDDING_DIM);
      // readIndex(path, allowReplaceDeleted) — second arg is a boolean, not capacity.
      await this._index.readIndex(INDEX_PATH, false);

      await this._restoreLabelMaps();
      this._activateIndex();

      logger.info(
        `IndexService.loadIndex(): loaded ${this._index.getCurrentCount()} vectors`
      );
    } catch (error) {
      throw this._wrapError("loadIndex", error, 500);
    }
  }

  /**
   * Persists the live HNSW binary and label map to disk atomically.
   * Safe to call after every addVector() or on a scheduled interval.
   *
   * @returns {Promise<void>}
   * @throws {AppError} 503 if not ready, 500 on I/O failure.
   */
  async saveIndex() {
    this._assertReady("saveIndex");

    try {
      await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
      await this._index.writeIndex(INDEX_PATH);
      await this._writeLabelMap();

      logger.info(
        `IndexService.saveIndex(): persisted ${this._index.getCurrentCount()} vectors`
      );
    } catch (error) {
      throw this._wrapError("saveIndex", error, 500);
    }
  }

  /**
   * Alias for saveIndex() — preserved for API compatibility.
   * @returns {Promise<void>}
   */
  async persist() {
    return this.saveIndex();
  }

  // -------------------------------------------------------------------------
  // Vector management — public
  // -------------------------------------------------------------------------

  /**
   * Inserts a single L2-normalised embedding into the live HNSW index.
   *
   * @param {string}       imageId
   * @param {Float32Array} embedding
   * @returns {Promise<void>}
   * @throws {AppError} 503 not ready | 409 duplicate | 400 invalid args
   */
  async addVector(imageId, embedding) {
    this._assertReady("addVector");
    this._validateImageId(imageId, "addVector");
    this._validateEmbedding(embedding, "addVector");
    this._rejectDuplicate(imageId, "addVector");

    this._ensureCapacity(1, "addVector");
    this._insertPoint(imageId, embedding);

    // Persist after every single insert so no vectors are lost on an unexpected crash.
    await this.saveIndex();
  }

  /**
   * Inserts multiple embeddings in a single pass.
   * Duplicate imageIds within the batch are skipped with a warning rather than
   * aborting the entire batch.
   *
   * @param {Array<{ imageId: string, embedding: Float32Array }>} items
   * @returns {Promise<void>}
   * @throws {AppError} 503 not ready | 400 invalid args
   */
  async addVectorBatch(items) {
    this._assertReady("addVectorBatch");

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(
        "addVectorBatch(): items must be a non-empty array.",
        400
      );
    }

    this._ensureCapacity(items.length, "addVectorBatch");

    for (const { imageId, embedding } of items) {
      this._validateImageId(imageId, "addVectorBatch");
      this._validateEmbedding(embedding, "addVectorBatch");

      if (this._imageIdToLabel.has(imageId)) {
        logger.warn(`IndexService.addVectorBatch(): skipping duplicate "${imageId}"`);
        continue;
      }

      this._insertPoint(imageId, embedding);
    }

    // One persist call for the entire batch — cheaper than per-item saves.
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

    const label = this._imageIdToLabel.get(imageId);
    if (label === undefined) return false;

    // markDelete() is a soft delete — the point is excluded from future kNN
    // results immediately but the slot is not reclaimed until rebuild().
    this._index.markDelete(label);
    this._imageIdToLabel.delete(imageId);
    this._labelToImageId.delete(label);

    // Persist so the updated label map (which no longer lists this imageId)
    // is durable across restarts. Without this the deletion reverses on reboot.
    await this.saveIndex();

    return true;
  }

  // -------------------------------------------------------------------------
  // Query — public
  // -------------------------------------------------------------------------

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
      .map((label, i) => ({
        imageId:  this._labelToImageId.get(label),
        distance: distances[i],
      }))
      .filter(({ imageId }) => imageId !== undefined);
  }

  // -------------------------------------------------------------------------
  // Rebuild — public
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** @returns {boolean} */
  get isReady() {
    return this._isReady;
  }

  /** @returns {number} Count of active (non-deleted) vectors. */
  get vectorCount() {
    return this._index ? this._index.getCurrentCount() : 0;
  }

  // -------------------------------------------------------------------------
  // Private — index state helpers
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Private — persistence helpers
  // -------------------------------------------------------------------------

  /**
   * Reads the companion JSON file and restores both bidirectional label maps.
   * Emits a warning if the labels file is missing (binary-only recovery).
   */
  async _restoreLabelMaps() {
    if (!(await this._fileExists(LABELS_PATH))) {
      logger.warn(
        "IndexService.loadIndex(): labels file missing — imageId lookups " +
        "unavailable until rebuild() is run."
      );
      this._resetMappingState();
      this._nextLabel = this._index.getCurrentCount();
      return;
    }

    const raw = await fs.readFile(LABELS_PATH, "utf8");
    const { labelToImageId, nextLabel } = JSON.parse(raw);
    const entries = Object.entries(labelToImageId);

    this._labelToImageId = new Map(entries.map(([k, v]) => [Number(k), v]));
    this._imageIdToLabel = new Map(entries.map(([k, v]) => [v, Number(k)]));
    this._nextLabel      = nextLabel ?? this._labelToImageId.size;
  }

  /**
   * Serialises the current _labelToImageId map to the companion JSON file.
   */
  async _writeLabelMap() {
    const payload = {
      labelToImageId: Object.fromEntries(this._labelToImageId),
      nextLabel:      this._nextLabel,
    };
    await fs.writeFile(LABELS_PATH, JSON.stringify(payload, null, 2), "utf8");
  }

  // -------------------------------------------------------------------------
  // Private — vector insertion helpers
  // -------------------------------------------------------------------------

  /**
   * Low-level point insertion: calls hnswlib addPoint and updates both maps.
   * Callers are responsible for validation and capacity checks before calling this.
   *
   * @param {string}       imageId
   * @param {Float32Array} embedding
   */
  _insertPoint(imageId, embedding) {
    const label = this._nextLabel++;
    this._index.addPoint(Array.from(embedding), label);
    this._labelToImageId.set(label, imageId);
    this._imageIdToLabel.set(imageId, label);
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

  // -------------------------------------------------------------------------
  // Private — rebuild helpers
  // -------------------------------------------------------------------------

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

  /**
   * Iterates over image filenames, embeds each one, and inserts it into the
   * current (fresh) index. Corrupted / unsupported files are skipped; unexpected
   * errors are counted as failures but do NOT abort the loop.
   *
   * @param {string[]} filenames
   * @param {object}   embeddingService
   * @returns {Promise<{ processed: number, skipped: number, failed: number }>}
   */
  async _embedAllImages(filenames, embeddingService) {
    let processed = 0;
    let skipped   = 0;
    let failed    = 0;

    for (const filename of filenames) {
      try {
        const imageId     = path.basename(filename, path.extname(filename));
        const imageBuffer = await fs.readFile(path.join(DESIGN_LIBRARY_PATH, filename));
        const embedding   = await embeddingService.embed(imageBuffer);

        this._insertPoint(imageId, embedding);
        processed++;
      } catch (error) {
        // 400 = unreadable / unsupported image — skip silently.
        if (error instanceof AppError && error.statusCode === 400) {
          logger.warn(`IndexService.rebuild(): skipped "${filename}" — ${error.message}`);
          skipped++;
        } else {
          logger.error(`IndexService.rebuild(): failed "${filename}" — ${error.message}`);
          failed++;
        }
      }
    }

    return { processed, skipped, failed };
  }

  // -------------------------------------------------------------------------
  // Private — guard / validation helpers
  // -------------------------------------------------------------------------

  /**
   * Throws 503 if the index has not been initialised.
   * @param {string} callerName
   */
  _assertReady(callerName) {
    if (!this._isReady) {
      throw new AppError(
        `IndexService.${callerName}(): service is not initialised. ` +
        "Call initialise() first.",
        503
      );
    }
  }

  /**
   * Throws 409 if the imageId is already registered in the index.
   * @param {string} imageId
   * @param {string} callerName
   */
  _rejectDuplicate(imageId, callerName) {
    if (this._imageIdToLabel.has(imageId)) {
      throw new AppError(
        `${callerName}(): imageId "${imageId}" already exists. ` +
        "Call removeVector() first to update an existing vector.",
        409
      );
    }
  }

  /**
   * Throws 400 if imageId is not a non-empty string.
   * @param {string} imageId
   * @param {string} callerName
   */
  _validateImageId(imageId, callerName) {
    if (typeof imageId !== "string" || imageId.trim() === "") {
      throw new AppError(
        `${callerName}(): imageId must be a non-empty string.`,
        400
      );
    }
  }

  /**
   * Throws 400 if embedding is not a Float32Array of exactly EMBEDDING_DIM elements.
   * @param {Float32Array} embedding
   * @param {string}       callerName
   */
  _validateEmbedding(embedding, callerName) {
    if (!(embedding instanceof Float32Array)) {
      throw new AppError(
        `${callerName}(): embedding must be a Float32Array.`,
        400
      );
    }
    if (embedding.length !== EMBEDDING_DIM) {
      throw new AppError(
        `${callerName}(): embedding dimension mismatch — ` +
        `got ${embedding.length}, expected ${EMBEDDING_DIM}.`,
        400
      );
    }
  }

  /**
   * Throws 400 when k is not a positive integer.
   * hnswlib-node produces undefined behaviour for k ≤ 0 or non-integer k.
   *
   * @param {number} k
   */
  _validateK(k) {
    if (!Number.isInteger(k) || k < 1) {
      throw new AppError(
        `searchKnn(): k must be a positive integer, got ${k}.`,
        400
      );
    }
  }

  // -------------------------------------------------------------------------
  // Private — utility helpers
  // -------------------------------------------------------------------------

  /**
   * Returns true when filePath is accessible on disk, false otherwise.
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async _fileExists(filePath) {
    return fs.access(filePath).then(() => true).catch(() => false);
  }

  /**
   * Re-throws AppErrors untouched; wraps all other errors as AppError(statusCode).
   *
   * @param {string} callerName
   * @param {Error}  error
   * @param {number} statusCode
   * @returns {AppError}
   */
  _wrapError(callerName, error, statusCode) {
    if (error instanceof AppError) return error;
    return new AppError(
      `IndexService.${callerName}(): ${error.message}`,
      statusCode
    );
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Application-wide singleton.
 * Await indexService.initialise() once at server boot.
 *
 * @type {IndexService}
 */
const indexService = new IndexService();

module.exports = indexService;
