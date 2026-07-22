"use strict";

/**
 * Score Formatter
 * 
 * TODO: Confidence calibration will be performed AFTER benchmark evaluation.
 * The calibration will be based on real benchmark statistics (e.g. min-max scaling
 * using the model's search threshold), NOT arbitrary formulas.
 * 
 * This module is responsible ONLY for converting raw search metrics into UI-friendly scores.
 * It is model-aware and must support OpenCLIP, DINOv2, SigLIP, Jewellery-specific models,
 * or any future AI model without modifying SearchService.
 */

class ScoreFormatter {
  /**
   * Converts a raw cosine distance into a raw similarity.
   * 
   * @param {number} distance - The raw cosine distance from the HNSW index.
   * @param {object} aiContext - The active AI model manifest.
   * @returns {number} The raw cosine similarity.
   */
  formatScore(distance, aiContext) {
    return 1 - distance;
  }

  /**
   * Converts a raw distance into a UI-friendly percentage (0-100).
   * 
   * TODO: This currently uses the legacy OpenCLIP formula temporarily
   * to restore UI functionality. It must be replaced with proper model-aware 
   * calibration (Min-Max scaling using threshold) after benchmarks.
   */
  formatDisplayScore(distance, aiContext) {
    // Temporary fallback to restore frontend appearance
    const rawSim = 1 - distance;
    return Math.max(0, Math.min(100, Math.round(rawSim * 100)));
  }
}

module.exports = new ScoreFormatter();
