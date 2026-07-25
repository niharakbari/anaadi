"use strict";

/**
 * @fileoverview IVerificationAdapter.js
 *
 * Interface defining the contract for all Geometric Verification models.
 * This guarantees that VerificationService remains decoupled from the
 * specific underlying model (e.g., LightGlue, XFeat, etc.).
 */

class IVerificationAdapter {
    /**
     * Boot-time initialisation. Loads ONNX models and warms up instances.
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error("initialize() must be implemented by the adapter");
    }

    /**
     * Extracts features from a raw image buffer (e.g., the query).
     * @param {Buffer} imageBuffer - Raw or preprocessed image buffer.
     * @returns {Promise<any>} - Adapter-specific feature tensor/object.
     */
    async extractFeatures(imageBuffer) {
        throw new Error("extractFeatures() must be implemented by the adapter");
    }

    /**
     * Deserializes features loaded from a `.bin` file into the adapter's native format.
     * @param {Buffer} binBuffer - Serialized feature data.
     * @returns {any} - Adapter-specific feature object.
     */
    deserializeFeatures(binBuffer) {
        throw new Error("deserializeFeatures() must be implemented by the adapter");
    }

    /**
     * Serializes a feature object to a binary buffer for storage on disk.
     * @param {any} features - Adapter-specific feature object.
     * @returns {Buffer} - Binary representation for storage.
     */
    serializeFeatures(features) {
        throw new Error("serializeFeatures() must be implemented by the adapter");
    }

    /**
     * Compares query features against candidate features to produce a verification score.
     * @param {any} queryFeatures - Features of the query image.
     * @param {any} candidateFeatures - Features of the candidate design.
     * @returns {Promise<{
     *   score: number,       // Normalized verification score (e.g. 0 to 1)
     *   inliers: number,     // Raw geometric inlier matches
     *   isValid: boolean     // Did it pass the minimum threshold?
     * }>}
     */
    async verify(queryFeatures, candidateFeatures) {
        throw new Error("verify() must be implemented by the adapter");
    }

    /**
     * Returns the context/metadata of the running adapter.
     * @returns {{ name: string, version: string, architecture: string }}
     */
    getContext() {
        throw new Error("getContext() must be implemented by the adapter");
    }
}

module.exports = IVerificationAdapter;
