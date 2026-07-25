"use strict";

/**
 * @fileoverview visualizer.js
 * 
 * Generates zero-dependency HTML/SVG visualizations of matched geometric keypoints
 * for engineering debugging and validation.
 */

const fs = require("fs/promises");
const path = require("path");
const logger = require("../../../utils/logger");
const config = require("../../../config/config");

class VerificationVisualizer {
    constructor() {
        this.debugDir = path.resolve(__dirname, "..", "..", "..", "..", "debug", "verification");
    }

    /**
     * Initializes the debug directory.
     */
    async initialize() {
        if (!config.verification.enabled) return;
        await fs.mkdir(this.debugDir, { recursive: true });
    }

    /**
     * Converts a raw image buffer to a base64 Data URI for embedding in HTML.
     */
    _bufferToDataURI(buffer, mimeType = "image/jpeg") {
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    /**
     * Generates an HTML/SVG visualization of the verification match.
     * 
     * @param {string} queryId - Identifier for the query (e.g. search ID)
     * @param {string} candidateId - Identifier for the matched candidate
     * @param {Buffer} queryBuffer - Raw bytes of query image
     * @param {Buffer} candidateBuffer - Raw bytes of candidate image
     * @param {Array<{queryPt: [number, number], candPt: [number, number], inlier: boolean}>} matches - The keypoint matches
     * @param {object} stats - Verification stats (score, inlier count, etc)
     */
    async generateDebugView(queryId, candidateId, queryBuffer, candidateBuffer, matches, stats) {
        try {
            const queryDataUri = this._bufferToDataURI(queryBuffer);
            const candidateDataUri = this._bufferToDataURI(candidateBuffer);
            
            // Assume fixed size for visualization bounds, or CSS scaled
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Verification Debug: ${queryId} vs ${candidateId}</title>
                <style>
                    body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
                    .stats { margin-bottom: 20px; padding: 15px; background: #333; border-radius: 8px; }
                    .container { display: flex; position: relative; gap: 20px; }
                    .image-wrapper { position: relative; width: 500px; height: 500px; border: 1px solid #555; }
                    .image-wrapper img { width: 100%; height: 100%; object-fit: contain; }
                    .svg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
                </style>
            </head>
            <body>
                <h2>Verification Debug</h2>
                <div class="stats">
                    <strong>Query:</strong> ${queryId} | <strong>Candidate:</strong> ${candidateId} <br/>
                    <strong>Score:</strong> ${stats.score.toFixed(4)} | <strong>Inliers:</strong> ${stats.inliers} / ${matches.length}
                </div>
                
                <div class="container" id="matchContainer">
                    <div class="image-wrapper">
                        <img src="${queryDataUri}" alt="Query" />
                        <svg class="svg-overlay" id="querySvg" viewBox="0 0 1024 1024"></svg>
                    </div>
                    <div class="image-wrapper">
                        <img src="${candidateDataUri}" alt="Candidate" />
                        <svg class="svg-overlay" id="candSvg" viewBox="0 0 1024 1024"></svg>
                    </div>
                </div>

                <script>
                    const matches = ${JSON.stringify(matches)};
                    
                    const qSvg = document.getElementById('querySvg');
                    const cSvg = document.getElementById('candSvg');
                    
                    // Note: In Phase 4, we will plot the actual SVG <circle> and <line> elements 
                    // dynamically here based on the original image dimensions vs bounding boxes.
                    
                    matches.forEach(m => {
                        const color = m.inlier ? '#00ff00' : '#ff0000';
                        
                        // Query Point
                        qSvg.innerHTML += \`<circle cx="\${m.queryPt[0]}" cy="\${m.queryPt[1]}" r="5" fill="\${color}" />\`;
                        
                        // Candidate Point
                        cSvg.innerHTML += \`<circle cx="\${m.candPt[0]}" cy="\${m.candPt[1]}" r="5" fill="\${color}" />\`;
                    });
                </script>
            </body>
            </html>
            `;

            const filename = `verify_${queryId}_${candidateId}_${Date.now()}.html`;
            const filePath = path.join(this.debugDir, filename);
            await fs.writeFile(filePath, html);
            logger.info(`VerificationVisualizer: Wrote debug view to ${filePath}`);

        } catch (err) {
            logger.error(`VerificationVisualizer: Failed to generate debug view for ${queryId}`, err);
        }
    }
}

module.exports = new VerificationVisualizer();
