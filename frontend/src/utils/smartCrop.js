/**
 * Auto-detects the bounds of the jewellery in an image by scanning for foreground pixels.
 * Returns the recommended crop box with a 15% margin.
 */
export async function getSmartCropBox(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // Downscale for faster processing if the image is huge
      const MAX_SIZE = 800;
      let scale = 1;
      
      let processWidth = img.naturalWidth;
      let processHeight = img.naturalHeight;
      
      if (processWidth > MAX_SIZE || processHeight > MAX_SIZE) {
        if (processWidth > processHeight) {
          scale = MAX_SIZE / processWidth;
        } else {
          scale = MAX_SIZE / processHeight;
        }
        processWidth = Math.floor(processWidth * scale);
        processHeight = Math.floor(processHeight * scale);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = processWidth;
      canvas.height = processHeight;
      
      // Fill white background in case image is transparent PNG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Sample the 4 corners to determine background color
      const corners = [
        0, // top-left
        (canvas.width - 1) * 4, // top-right
        (canvas.height - 1) * canvas.width * 4, // bottom-left
        ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4 // bottom-right
      ];
      
      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(i => {
        bgR += data[i];
        bgG += data[i+1];
        bgB += data[i+2];
      });
      bgR /= 4; bgG /= 4; bgB /= 4;

      const threshold = 25; // RGB distance threshold

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let found = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Fast approximation of color difference
          const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));

          if (diff > threshold) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!found) {
        return resolve(null); // Let the cropper use default if nothing found
      }

      // Convert back to original scale
      minX = minX / scale;
      maxX = maxX / scale;
      minY = minY / scale;
      maxY = maxY / scale;

      let objWidth = maxX - minX;
      let objHeight = maxY - minY;

      // Add 15% padding
      const paddingX = objWidth * 0.15;
      const paddingY = objHeight * 0.15;

      let cropX = minX - paddingX;
      let cropY = minY - paddingY;
      let cropWidth = objWidth + (paddingX * 2);
      let cropHeight = objHeight + (paddingY * 2);

      // Clamp to image bounds
      cropX = Math.max(0, cropX);
      cropY = Math.max(0, cropY);
      
      if (cropX + cropWidth > img.naturalWidth) {
        cropWidth = img.naturalWidth - cropX;
      }
      if (cropY + cropHeight > img.naturalHeight) {
        cropHeight = img.naturalHeight - cropY;
      }

      resolve({
        x: Math.round(cropX),
        y: Math.round(cropY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight)
      });
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
