"use strict";

/**
 * @fileoverview verificationService.js
 *
 * Independent pipeline stage for geometric verification.
 * Receives semantic candidates, uses the active verification adapter to extract
 * and match features, and returns re-ranked hybrid results.
 */

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { LRUCache } = require("lru-cache");
const pLimit = require("p-limit");

const config = require("../../../config/config");
const logger = require("../../../utils/logger");
const featureManager = require("./featureManager");

class VerificationService {
    constructor() {
        this._isReady = false;
        /** @type {import('./IVerificationAdapter') | null} */
        this._adapter = null;

        // In-memory cache for repeated exact queries
        // Max 50 queries cached to prevent memory bloat
        this._cache = new LRUCache({
            max: 50,
            ttl: 1000 * 60 * 15 // 15 minute TTL
        });
    }

    /**
     * Initializes the verification pipeline and loads the configured adapter.
     */
    async initialise() {
        if (!config.verification.enabled) {
            logger.info("VerificationService: Disabled by configuration");
            return;
        }

        const modelName = config.verification.model;
        let AdapterClass;

        try {
            AdapterClass = require(`../../../../ai-models/verification/${modelName}/adapter.js`);
        } catch (err) {
            logger.error(`VerificationService: Failed to load adapter '${modelName}'`, err);
            throw new Error(`Verification adapter '${modelName}' not found.`);
        }

        this._adapter = new AdapterClass();
        await this._adapter.initialize();
        
        // Ensure features directory exists
        await fs.mkdir(config.verification.featuresDir, { recursive: true });
        
        featureManager.initialize(config.verification.featuresDir, this._adapter);
        
        const visualizer = require("./visualizer");
        await visualizer.initialize();

        this._isReady = true;
        logger.info(`VerificationService initialized | Driver: ${this._adapter.getContext().name}`);
    }

    /**
     * Helper to compute a cache key for the query + candidates.
     */
    _computeCacheKey(queryBuffer, semanticCandidates) {
        const hash = crypto.createHash("sha256");
        hash.update(queryBuffer);
        // Include candidate IDs so if semantic search changes, cache misses
        const candidateIds = semanticCandidates.map(c => c.id).join(",");
        hash.update(candidateIds);
        return hash.digest("hex");
    }

    /**
     * Re-ranks semantic candidates using geometric verification.
     * Fault-tolerant: If verification crashes, it logs and returns the original semantic ranking.
     * 
     * @param {Buffer} queryBuffer - Preprocessed query image buffer.
     * @param {Array} semanticCandidates - Top K candidates from SearchService (must contain .id and .score)
     * @returns {Promise<Array>} - Re-ranked candidates with hybrid scores.
     */
    async verifyCandidates(queryBuffer, semanticCandidates) {
        if (!this._isReady || !config.verification.enabled || semanticCandidates.length === 0) {
            return semanticCandidates; // Pass-through
        }

        const cacheKey = this._computeCacheKey(queryBuffer, semanticCandidates);
        const cachedResults = this._cache.get(cacheKey);
        if (cachedResults) {
            logger.info("VerificationService: Cache hit. Returning verified results instantly.");
            return cachedResults;
        }

        // Slice candidates to configured verification count (e.g. Top 10)
        const candidatesToVerify = semanticCandidates.slice(0, config.verification.candidateCount);
        const unverifiedCandidates = semanticCandidates.slice(config.verification.candidateCount);

        try {
            // 1. Extract features from query
            const queryFeatures = await this._adapter.extractFeatures(queryBuffer);

            // 2. Load candidate features and verify
            // 2. Load candidate features and verify in parallel using C++ thread pool natively
            // Limit concurrency to 4 to prevent CPU thrashing
            const limit = pLimit(4);
            
            const verificationPromises = candidatesToVerify.map(candidate => limit(async () => {
                const candidateFeatures = await featureManager.getFeature(candidate.imageId);

                if (candidateFeatures) {
                    const vResult = await this._adapter.verify(queryFeatures, candidateFeatures);
                    
                    // 3. Compute Hybrid Score
                    const hybridScore = (candidate.similarity * config.verification.embeddingWeight) + 
                                      (vResult.score * config.verification.geometryWeight);

                    return {
                        ...candidate,
                        semanticScore: candidate.similarity,
                        verificationScore: vResult.score,
                        inliers: vResult.inliers,
                        hybridScore: hybridScore
                    };
                } else {
                    // Fallback to pure semantic score if missing
                    return {
                        ...candidate,
                        semanticScore: candidate.similarity,
                        verificationScore: 0,
                        inliers: 0,
                        hybridScore: candidate.similarity * config.verification.embeddingWeight
                    };
                }
            }));

            const verifiedList = await Promise.all(verificationPromises);

            // 4. Sort by hybrid score descending
            verifiedList.sort((a, b) => b.hybridScore - a.hybridScore);

            // Combine verified list with the unverified tail
            const finalResults = [...verifiedList, ...unverifiedCandidates];

            // 5. Cache and return
            this._cache.set(cacheKey, finalResults);
            return finalResults;

        } catch (err) {
            // FAULT TOLERANCE: Never fail the search because of a verification error.
            logger.error("VerificationService: Critical error during verification. Falling back to ANN ranking.", err.message);
            return semanticCandidates;
        }
    }
    
    /**
     * Extracts and saves verification features for a newly indexed catalogue image.
     * Called once per design during IndexService.rebuild().
     *
     * @param {string} imageId
     * @param {Buffer} imageBuffer - The primary (best) crop of the CAD image.
     * @throws {Error} If called before initialise() — fail loudly, never silently skip.
     */
    async indexFeatures(imageId, imageBuffer) {
        if (!config.verification.enabled) {
            // Verification explicitly disabled — clean skip, not a bug.
            return;
        }

        if (!this._isReady) {
            // This is a programming error: rebuild() must initialise VerificationService first.
            throw new Error(
                `VerificationService.indexFeatures(${imageId}): service is not initialized. ` +
                `Call verificationService.initialise() before running rebuild().`
            );
        }

        try {
            const features = await this._adapter.extractFeatures(imageBuffer);
            await featureManager.saveFeature(imageId, features);
            logger.info(`VerificationService: Indexed features for design ID ${imageId}`);
        } catch (err) {
            // Surface the error — caller (indexService) decides whether to skip or abort.
            throw new Error(`VerificationService.indexFeatures(${imageId}): ${err.message}`);
        }
    }
}

module.exports = new VerificationService();
