"use strict";

/**
 * @fileoverview featureManager.js
 * 
 * Manages the I/O and caching of geometric verification features (.bin files).
 * Abstracts disk access away from the VerificationService and implements
 * lazy-loading with an LRU cache to prevent memory bloat during concurrent searches.
 */

const fs = require("fs/promises");
const path = require("path");
const { LRUCache } = require("lru-cache");
const logger = require("../../../utils/logger");

class FeatureManager {
    constructor() {
        this.featuresDir = null;
        this.adapter = null;

        // Cache for deserialized features (e.g. Float32Arrays/Objects from the adapter)
        // Adjust max items based on empirical memory profiling (e.g., 1000 items ~ 50MB)
        this._cache = new LRUCache({
            max: 1000,
            ttl: 1000 * 60 * 60 // 1 hour
        });
    }

    /**
     * Bind the FeatureManager to the active verification adapter and configure storage.
     * @param {string} featuresDir - Absolute path to the verification/features/ index directory.
     * @param {import('./IVerificationAdapter')} adapter - The initialized adapter.
     */
    initialize(featuresDir, adapter) {
        if (!featuresDir) throw new Error("FeatureManager requires featuresDir");
        if (!adapter) throw new Error("FeatureManager requires an adapter");
        
        this.featuresDir = featuresDir;
        this.adapter = adapter;
    }

    /**
     * Lazy-loads a feature for a candidate image ID.
     * @param {string} imageId 
     * @returns {Promise<any | null>} The adapter-specific feature object, or null if missing.
     */
    async getFeature(imageId) {
        // 1. Check Memory Cache
        const cached = this._cache.get(imageId);
        if (cached) {
            return cached;
        }

        // 2. Cache Miss -> Disk Load
        const featurePath = path.join(this.featuresDir, `${imageId}.bin`);
        try {
            const binBuffer = await fs.readFile(featurePath);
            
            // 3. Deserialize using the adapter
            const features = this.adapter.deserializeFeatures(binBuffer);
            
            // 4. Update Cache
            this._cache.set(imageId, features);
            return features;
        } catch (err) {
            if (err.code === "ENOENT") {
                // Expected for designs that haven't been indexed for verification yet
                logger.warn(`FeatureManager: Missing feature file for design ID ${imageId}`);
                return null;
            }
            logger.error(`FeatureManager: Failed to read/deserialize feature for ${imageId}`, err);
            return null;
        }
    }

    /**
     * Saves a new feature to disk and updates the cache.
     * @param {string} imageId 
     * @param {any} features - Adapter-specific feature object.
     */
    async saveFeature(imageId, features) {
        try {
            const binBuffer = this.adapter.serializeFeatures(features);
            const featurePath = path.join(this.featuresDir, `${imageId}.bin`);
            
            await fs.writeFile(featurePath, binBuffer);
            this._cache.set(imageId, features);
        } catch (err) {
            logger.error(`FeatureManager: Failed to save feature for ${imageId}`, err);
            throw err;
        }
    }
}

module.exports = new FeatureManager();
