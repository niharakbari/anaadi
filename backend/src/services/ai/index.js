"use strict";

/**
 * @fileoverview Barrel export for the AI services module.
 *
 * Provides a single import point for all AI service singletons so that
 * route handlers and controllers never need to know the internal folder layout.
 *
 * Usage:
 *   const { searchService } = require('./services/ai');
 *   // or destructure only what you need:
 *   const { embeddingService, indexService } = require('./services/ai');
 *
 * Boot-time initialisation (must be awaited in server.js before handling requests):
 *   await embeddingService.initialise();
 *   await indexService.initialise();
 *
 * @module services/ai
 */

const embeddingService = require("./embeddingService");
const indexService     = require("./indexService");
const searchService    = require("./searchService");

module.exports = {
  embeddingService,
  indexService,
  searchService,
};
