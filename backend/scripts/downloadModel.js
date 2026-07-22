const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

async function downloadModel() {
  const modelDir = path.resolve(__dirname, '../ai-models/openclip');
  const destPath = path.join(modelDir, 'visual.onnx');
  
  // Create directories if they don't exist
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  // 1. Check if model exists
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    // Rough check to ensure it's not a corrupted 1KB file (the HTML response)
    if (stats.size > 10 * 1024 * 1024) { 
      console.log('OpenCLIP model already present. Skipping download.');
      process.exit(0);
    } else {
      console.log('OpenCLIP model found but appears corrupted. Redownloading...');
      fs.unlinkSync(destPath);
    }
  }

  console.log('Downloading OpenCLIP model from Google Drive...');
  const fileId = '12IPgJHqI_2ti01Y7ikFZzg7NkO3Xhd8x';
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    let response = await fetch(url);
    const contentType = response.headers.get('content-type');
    
    // Google Drive large file virus scan warning returns an HTML page
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      // Extract the download confirmation form action and inputs
      const actionMatch = text.match(/action="([^"]+)"/);
      if (actionMatch) {
        let finalUrl = actionMatch[1];
        const params = new URLSearchParams();
        
        const inputRegex = /<input type="hidden" name="([^"]+)" value="([^"]*)">/g;
        let match;
        while ((match = inputRegex.exec(text)) !== null) {
          params.append(match[1], match[2]);
        }
        
        url = `${finalUrl}?${params.toString()}`;
        console.log(`Bypassing Google Drive virus scan prompt...`);
        
        const cookies = response.headers.get('set-cookie');
        const fetchOpts = {};
        if (cookies) {
          fetchOpts.headers = { Cookie: cookies };
        }
        
        response = await fetch(url, fetchOpts);
        const finalContentType = response.headers.get('content-type');
        if (finalContentType && finalContentType.includes('text/html')) {
           throw new Error("Google Drive returned an HTML page instead of the model. The file might be restricted or you have exceeded your download quota.");
        }
      } else {
         throw new Error("Could not parse Google Drive download form. The file might be restricted.");
      }
    }

    if (!response.ok) {
       throw new Error(`Unexpected HTTP status: ${response.status} ${response.statusText}`);
    }
    
    console.log("Download started...");
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let downloadedBytes = 0;
    
    const fileStream = fs.createWriteStream(destPath);
    const readable = Readable.fromWeb(response.body);
    
    readable.on('data', chunk => {
       downloadedBytes += chunk.length;
       if (totalBytes) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
          process.stdout.write(`\rDownloading... ${percent}%`);
       } else {
          process.stdout.write(`\rDownloaded ${(downloadedBytes/(1024*1024)).toFixed(2)} MB`);
       }
    });
    
    await pipeline(readable, fileStream);
    
    // Final size verification to ensure we didn't just download an HTML error page
    const finalStats = fs.statSync(destPath);
    if (finalStats.size < 10 * 1024 * 1024) {
       throw new Error(`Downloaded file is too small (${finalStats.size} bytes). It might be corrupted or an error page.`);
    }

    console.log("\nDownload complete. Verification successful.");
    process.exit(0);

  } catch (error) {
    console.error(`\nModel download failed: ${error.message}`);
    // Cleanup partial files on failure
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    process.exit(1);
  }
}

downloadModel();
