"use strict";

const sharp = require("sharp");
const logger = require("../../utils/logger");

class MultiViewService {
  /** Detects and extracts individual jewellery views from a CAD sheet. */
  async extractViews(imageBuffer) {
    // 1. Read metadata
    const infoData = await sharp(imageBuffer).metadata();
    const origWidth = infoData.width;
    const origHeight = infoData.height;

    const MAX_DIM = 800;
    let scale = 1;
    if (origWidth > MAX_DIM || origHeight > MAX_DIM) {
      scale = Math.max(origWidth / MAX_DIM, origHeight / MAX_DIM);
    }

    const procWidth = Math.floor(origWidth / scale);
    const procHeight = Math.floor(origHeight / scale);

    const { data, info } = await sharp(imageBuffer)
      .resize(procWidth, procHeight, { fit: 'inside' })
      .flatten({ background: '#ffffff' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const visited = new Uint8Array(width * height);
    const JUMP = 5;
    const THRESHOLD = 220;

    const views = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        
        if (visited[i] === 0 && data[i] < THRESHOLD) {
          let minX = x;
          let maxX = x;
          let minY = y;
          let maxY = y;

          const queue = [i];
          visited[i] = 1;

          while (queue.length > 0) {
            const curr = queue.shift();
            const cx = curr % width;
            const cy = Math.floor(curr / width);

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const startY = Math.max(0, cy - JUMP);
            const endY = Math.min(height - 1, cy + JUMP);
            const startX = Math.max(0, cx - JUMP);
            const endX = Math.min(width - 1, cx + JUMP);

            for (let ny = startY; ny <= endY; ny++) {
              for (let nx = startX; nx <= endX; nx++) {
                const ni = ny * width + nx;
                if (visited[ni] === 0 && data[ni] < THRESHOLD) {
                  visited[ni] = 1;
                  queue.push(ni);
                }
              }
            }
          }

          const boxWidth = maxX - minX;
          const boxHeight = maxY - minY;
          const area = boxWidth * boxHeight;
          const totalArea = width * height;

          if (area > totalArea * 0.01 && area < totalArea * 0.8) {
            const aspect = boxWidth / boxHeight;
            if (aspect > 0.1 && aspect < 10) {
              views.push({ x: minX, y: minY, w: boxWidth, h: boxHeight });
            }
          }
        }
      }
    }

    const mergedViews = [];
    for (const v of views) {
      let merged = false;
      for (const m of mergedViews) {
        const ix = Math.max(v.x, m.x);
        const iy = Math.max(v.y, m.y);
        const iw = Math.min(v.x + v.w, m.x + m.w) - ix;
        const ih = Math.min(v.y + v.h, m.y + m.h) - iy;
        
        if (iw > 0 && ih > 0) {
          const newX = Math.min(v.x, m.x);
          const newY = Math.min(v.y, m.y);
          const newMaxX = Math.max(v.x + v.w, m.x + m.w);
          const newMaxY = Math.max(v.y + v.h, m.y + m.h);
          m.x = newX;
          m.y = newY;
          m.w = newMaxX - newX;
          m.h = newMaxY - newY;
          merged = true;
          break;
        }
      }
      if (!merged) {
        mergedViews.push(v);
      }
    }

    const buffers = [];
    for (const v of mergedViews) {
      const marginX = Math.floor(v.w * 0.05);
      const marginY = Math.floor(v.h * 0.05);

      let left = Math.max(0, v.x - marginX);
      let top = Math.max(0, v.y - marginY);
      let cropWidth = Math.min(width - left, v.w + (marginX * 2));
      let cropHeight = Math.min(height - top, v.h + (marginY * 2));

      const origLeft = Math.floor(left * scale);
      const origTop = Math.floor(top * scale);
      const origCropWidth = Math.floor(cropWidth * scale);
      const origCropHeight = Math.floor(cropHeight * scale);

      const cropBuffer = await sharp(imageBuffer)
        .extract({ left: origLeft, top: origTop, width: origCropWidth, height: origCropHeight })
        .jpeg({ quality: 95 })
        .toBuffer();
      
      buffers.push(cropBuffer);
    }
    
    // Fallback: If no distinct views were found (e.g. image is too clean/noisy), return the whole image as 1 view.
    if (buffers.length === 0) {
      buffers.push(imageBuffer);
    }

    return buffers;
  }
}

const multiViewService = new MultiViewService();
module.exports = multiViewService;
